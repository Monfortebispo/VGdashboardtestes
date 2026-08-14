// VG · Dashboard Operações — API partilhada + autenticação server-side.
//
// Segurança v3:
// - passwords nunca são devolvidas ao browser e são guardadas com scrypt + salt;
// - sessões são tokens HMAC assinados pelo servidor;
// - todos os dados partilhados exigem sessão válida;
// - escritas são autorizadas por perfil no servidor;
// - utilizadores antigos em texto simples são migrados automaticamente no primeiro acesso;
// - contas ainda com a password inicial são obrigadas a alterá-la.

const { getStore, connectLambda } = require("@netlify/blobs");
const crypto = require("crypto");

const STORE_NAME = "vg-dashboard-operacoes";
const MAX_BODY_BYTES = 5.5 * 1024 * 1024;
const MAX_AUDIT_ROWS = 300;
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const USER_CACHE_MS = 30 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 8;

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};

function response(statusCode, body) { return { statusCode, headers: HEADERS, body: JSON.stringify(body) }; }
function ok(body) { return response(200, body); }
function badRequest(msg) { return response(400, { error: msg }); }
function unauthorized(msg = "Sessão inválida ou expirada.") { return response(401, { error: msg }); }
function forbidden(msg = "Sem permissões para esta operação.") { return response(403, { error: msg }); }
function tooMany(msg) { return response(429, { error: msg }); }
function tooLarge(msg) { return response(413, { error: msg }); }
function serverError(err) {
  console.error("Erro na função dashboard-sessao:", err);
  return response(500, { error: "Erro interno ao aceder aos dados partilhados." });
}

function bodySizeOf(event) {
  const raw = event.body || "";
  return event.isBase64Encoded ? Math.ceil((raw.length * 3) / 4) : Buffer.byteLength(raw, "utf8");
}
function parseBody(event) {
  try { return JSON.parse(event.body || "{}"); } catch (e) { return null; }
}
function blobKeyFor(resource, key) {
  if (key === undefined || key === null || key === "") return resource;
  return resource + "-" + encodeURIComponent(String(key));
}
function isDirection(user) { return !!user && (user.role === "direcao" || user.role === "admin"); }
function norm(s) { return String(s || "").trim().toUpperCase(); }
function safeUserName(s) { return String(s || "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, ""); }

// Contas base. Só existem hashes/salts no código; a password inicial não existe em texto simples no frontend nem aqui.
const SEED_USERS = {"mpatricio":{"user":"mpatricio","name":"Manuel Patricio","role":"diretor","hotel":"COLLECTION SINTRA","active":true,"passwordSalt":"rue71A9TbKfAVJM8yklg2g==","passwordHash":"cfK90l2uusBrPqUUsr7rag5Ct8PWU36MuRs1Wtz53hN62E9vd3aPy7ZU0Fy0bZgp6vU5x4VMVv1P4rf0Dac/iA==","mustChangePassword":true},"bpinto":{"user":"bpinto","name":"Belmiro Pinto","role":"direcao","hotel":"*","active":true,"passwordSalt":"cbrVaKSQ6fHyjp+af+41gw==","passwordHash":"5JBQE0l1n91eIFda9KdAFHoLpuQW9sEZpKZtw13EDA73N5LqW6DAk+nTHnDLklegGUR34/XAiMk/68QdycR6Bw==","mustChangePassword":true},"pmonforte":{"user":"pmonforte","name":"Pedro Monforte","role":"direcao","hotel":"*","active":true,"passwordSalt":"bYTuPcibtI6achrn1HNOKw==","passwordHash":"2L9b1kXSCy8t6nTPNL78gR4zQYSYShokui18QpyOBkshcXZ6QI4LGjDVNp4yysPOfEZDbIlK7oXRFLKp6O7mcw==","mustChangePassword":true},"calves":{"user":"calves","name":"Carlos Alves","role":"direcao","hotel":"*","active":true,"passwordSalt":"tD4e4KAZXOjnLEGbN9+oWw==","passwordHash":"QNyXBnJS8n5UvpjCTWjR1WB8Uq4hMl+UEiaoWEfisjp9PDkbi2hX1WRQtr+LJ3ToM2PwOhsDVJiZh89NnMPFKA==","mustChangePassword":true},"vparente":{"user":"vparente","name":"Vasco Parente","role":"direcao","hotel":"*","active":true,"passwordSalt":"02yKWqaBpX3rJ+WAkNlJgg==","passwordHash":"NLvQSoC2TYeYPwQwnLq945wdfCpAild1+1h//hCEYB8OaHfrjlkdVnDYeDNOZRHpg89XlyhtnAhKlkWvxULsVg==","mustChangePassword":true},"rribeiro":{"user":"rribeiro","name":"Rosario Ribeiro","role":"direcao","hotel":"*","active":true,"passwordSalt":"EA0GRwkqlC6kI7fgfvRcyA==","passwordHash":"+5ur6lIKmHgrDibqiaThT1qdklqKG1Qdd4PlUY4W7ga8sKamdov2ZvaTGjuGeDJVZYgVpeCql/K+u5cg2MswJg==","mustChangePassword":true},"nribeiro":{"user":"nribeiro","name":"Nelson Ribeiro","role":"direcao","hotel":"*","active":true,"passwordSalt":"lJHFEKP4Cw7B+SspJktF6g==","passwordHash":"9uyyzlkBh/LNcMNN3j90qqLNvcKv1esiNBAxrSeyPTb6PS+dP+GbZLZTVf2lyNOM+HGvmPhzFYec3ZvUIdjzgA==","mustChangePassword":true},"jmeireles":{"user":"jmeireles","name":"João Meireles","role":"direcao","hotel":"*","active":true,"passwordSalt":"BkCEpw0Y/3YZxwEqHAlTDQ==","passwordHash":"K+IaKRluihV5bx2Q6tB3XVHEypg9LfJNu+Bng4LTaLSWZF2/g7HeRT5JvsysCW+f0qFFT0udc+MA77Cff5iRww==","mustChangePassword":true},"sribeiro":{"user":"sribeiro","name":"Sofia Ribeiro","role":"diretor","hotel":"AMPALIUS","active":true,"passwordSalt":"HB/uGXMhuG5p70AXawMhkA==","passwordHash":"faXXpGuBmuHbD6o5ZtujCQ42m4OBkFraMxoD2Tw7D0NPdHoh1+bqR6xaOqKmuiZb00G2hxhz+CGxWaApvRQxKQ==","mustChangePassword":true},"arodrigues":{"user":"arodrigues","name":"Alexandre Rodrigues","role":"diretor","hotel":"MARINA","active":true,"passwordSalt":"w9s4/7WjwhFTwJFdH8CrDw==","passwordHash":"vD4bqAYG7B+hWIE5c5G5uJIgS8GhFlVtYq8FrVEI6rj+zHKqITsS2ssjfjyWCgkRdEXmxVCnz+w4rWKgPQV0iw==","mustChangePassword":true},"efigueiredo":{"user":"efigueiredo","name":"Élia Figueiredo","role":"diretor","hotel":"TAVIRA","active":true,"passwordSalt":"kLSICjfCMgxedvnC7NdT3A==","passwordHash":"VBCxcsxO7All8PbKq5gukoKZrbUZT8SLhmFIEFl4eIqjQzWI73Q+dEOTXKkSnm2xPxbu0k88v2G8X2nF9pOxbA==","mustChangePassword":true},"lmarreiros":{"user":"lmarreiros","name":"Luis Marreiros","role":"diretor","hotel":"ALBACORA","active":true,"passwordSalt":"FBdYS0vX+DxDOam+YUnTiQ==","passwordHash":"+d4tiYr2U80AfV5GgGkqunnsm1uBYu4He/vA8pUJvgatNLX3DisZQF0v8b23sMPfdhqsPkrlq37FgfmjRJn2Yw==","mustChangePassword":true},"jpferreira":{"user":"jpferreira","name":"José Pedro Ferreira","role":"diretor","hotel":"CERRO ALAGOA","active":true,"passwordSalt":"+0oKp58xnTf9s7NbXt/OHQ==","passwordHash":"3piKlzJNPHAwnzMWcKtX+/0Tg3erDHo8l9VM8dGapfoBPKM8eEbZYiI0hY716mAJSI6WFtd838sNeWLzcA7x0g==","mustChangePassword":true},"vcosta":{"user":"vcosta","name":"Valter Costa","role":"diretor","hotel":"ATLANTICO","active":true,"passwordSalt":"7wQM+jycNbiGPtgJOGXKyw==","passwordHash":"OuyIxJWs56ZYuLh+pPRsqWdswUfkRLlnhJrX7NcFwkMsj7/SzrZIt7bzSLWqwrhdCn0vleCZXQjuj/RAdbO8Fg==","mustChangePassword":true},"lsantos_praia":{"user":"lsantos_praia","name":"Luísa Santos","role":"diretor","hotel":"COLLECTION PRAIA","active":true,"passwordSalt":"u06vrfzYG54qly+h/pd6Mg==","passwordHash":"rksMD+Zi2kZjnmBecGrs3ItbLG9ulFDmX9b98NLNAJhnW34nccC4c+iEtGt8DkzX02fBvOQAkGbO2okUuwlpOQ==","mustChangePassword":true},"bsa":{"user":"bsa","name":"Bruno Sá","role":"diretor","hotel":"NAUTICO","active":true,"passwordSalt":"gnb0o5hXJd9ZW1mvgeHBww==","passwordHash":"SGzSCkcrDKIh0KoO8O1whMrW2Im8wFs8i9/lZiSWF5bexT1zxcVdexZ4ZgtMJ0pm3+jX60YyaFgP+4EJoTJxfA==","mustChangePassword":true},"eteixeira":{"user":"eteixeira","name":"Eugénia Teixeira","role":"diretor","hotel":"PORTO","active":true,"passwordSalt":"EP8KDZMP+8zO6Jk5sgPYNg==","passwordHash":"fpgtJnLDLHY3g/yGdvG89at4kqbWJX22VOAxHeP0K9KzUklgZvh+61HO6g3g4PjXQDqwkq4EHQw5qobUQxl4Nw==","mustChangePassword":true},"mferreira":{"user":"mferreira","name":"Marco Ferreira","role":"diretor","hotel":"ERICEIRA","active":true,"passwordSalt":"FpVhSZ0E56OnCMJ3uBY+Xw==","passwordHash":"H0ed548tsTSs4gMd7Rj+QIkuQuorZnmuqqIybgJWskUJBS5FskghnFArAm/8Sn1ZKbj/ROxH0jXogF21dQOkVA==","mustChangePassword":true},"rcerqueira":{"user":"rcerqueira","name":"Rute Cerqueira","role":"diretor","hotel":"CASCAIS","active":true,"passwordSalt":"YSo1bdXYa9pWW4E68CKx2Q==","passwordHash":"KQeQe/GYn9ysEwQt0oNnLrL4gA5vQAAjW3vHXv/D8Zdd1sKC5o/TIHliWcQzkU/Jmlcp5WBeu59V3IpfmCxCJw==","mustChangePassword":true},"jdamiao":{"user":"jdamiao","name":"João Damião","role":"diretor","hotel":"ESTORIL","active":true,"passwordSalt":"OAeZv8olJ+eG0YOF6Cqw7A==","passwordHash":"WFc9CYWNtpI0ZLiw3LpkKwXZllsiSRBINLJ3wLvgeY5IMEFbdJV+grE9SJkcCl0L/P+KzfUKVItgXv6ExCgeeA==","mustChangePassword":true},"rsa":{"user":"rsa","name":"Ricardo Sá","role":"diretor","hotel":"OPERA","active":true,"passwordSalt":"U3I+XsdT1bikrC4t2XN0Uw==","passwordHash":"1txhYA6AZpaSVF8MFwZaqTCGgtV3IYuiLfpeWclnU8roLbEgFRht6x13vun+OoqMTE2gZ4bzlub4iLP+obQ8RQ==","mustChangePassword":true},"nclemente_av":{"user":"nclemente_av","name":"Nuno Clemente","role":"diretor","hotel":"ALENTEJO VINEYARDS","active":true,"passwordSalt":"QBnTa7OWKKmBz76SijqqgQ==","passwordHash":"mSqJsFZ3AqUVdII/UH8MrjHXlg/uKS8R9QTutVeqmvQO3J9ieojtRy+9rna4wOcwApDyPrlOIGYHK3V1pcUVUQ==","mustChangePassword":true},"csousa":{"user":"csousa","name":"Carla de Sousa","role":"diretor","hotel":"SANTA CRUZ","active":true,"passwordSalt":"tTYBJpaIGvRj8LNoZuGOvw==","passwordHash":"kk1v8XafRu+4wo0agqzpE1Fpd4JjCuOYT1ZGTUSgHeKwq8uVszSEs3SzK1ykBkmp2aBzTQNre301rOJRMMAwVw==","mustChangePassword":true},"emontenegro":{"user":"emontenegro","name":"Eduardo Montenegro","role":"diretor","hotel":"LAGOS","active":true,"passwordSalt":"p5pRURIDHjaQ9WpT7TTU3A==","passwordHash":"BYJ9GNzGvilIoama4TiHA9AF/0J97SVoqlSNOVCDK7yXMo1vSAdRZLi7UWdoBEAQK07dpuSz+pStX/6mZ4UVYg==","mustChangePassword":true},"tpires":{"user":"tpires","name":"Tomás Pires","role":"diretor","hotel":"EVORA","active":true,"passwordSalt":"jiByVYOYEnOCbO8YL+OQYA==","passwordHash":"RT3TQEYpzV7+7f84f3tBCAd6GGIDLHbddAIMM5kES5BApxW42c/WF9s24vh+7WtyLTxPwbx3LGC1cgEM70Ek4A==","mustChangePassword":true},"spalhota":{"user":"spalhota","name":"Sara Palhota","role":"diretor","hotel":"COIMBRA","active":true,"passwordSalt":"n+5AhPtFO6KCanyd4IM7SA==","passwordHash":"4n/2IRkgdhYxABf1g2e7v01Z0CdqEi1aMfPZLnlBbKaTPWY+Dhg20BsFY3mN5U4Umh8YR7Dg5154Whn+Zf74Ew==","mustChangePassword":true},"pvalle":{"user":"pvalle","name":"Pedro Valle","role":"diretor","hotel":"COLLECTION SINTRA","active":true,"passwordSalt":"Oq1EBS0UEGcrD3MDce04Bg==","passwordHash":"frsjgPRP1v3yIOeZM2cCjmd1hNoYXFL2S52EpEDNZ8qBQu8Xg8UGh3VTVLdapnv1LImaOWJt/B8BiiqyUF4w6Q==","mustChangePassword":true},"acastro":{"user":"acastro","name":"Alexandre Castro","role":"diretor","hotel":"COLLECTION PALACIO DOS ARCOS","active":true,"passwordSalt":"DKhsmwU1GNtjvy/1bA9nGw==","passwordHash":"Qah8XN3atGfEGaN4G8RnVd4jR465cWx3pOpuq1I4bHTrQKBUmFlNdUGA0tz6jNlnQw6dp5KlQrBpVOIJvF7wzw==","mustChangePassword":true},"pmatos_douro":{"user":"pmatos_douro","name":"Paulo Matos","role":"diretor","hotel":"COLLECTION DOURO","active":true,"passwordSalt":"U6uWuErpdG5gNCkY4GYOsg==","passwordHash":"DBORPPfg1gZQZADug8F433fzUtzcVQrCo5T40xSNORzJrx8efrvY+5BYMIGEoOasoaaEHuLgKAqHBWexpnL25Q==","mustChangePassword":true},"jmartins":{"user":"jmartins","name":"José Martins","role":"diretor","hotel":"COLLECTION BRAGA","active":true,"passwordSalt":"GTRwS2ywgRwTAIjJtJnCWA==","passwordHash":"ivVCFrsqN/Mb5tdabPgpAkoDSuyzqA8FiuCrfPCHCb496v/jEjVORILA36bLLwB5PpHTlJV0wse/hGL2thWPLQ==","mustChangePassword":true},"slourenco":{"user":"slourenco","name":"Sandra Lourenço","role":"diretor","hotel":"COLLECTION SERRA DA ESTRELA","active":true,"passwordSalt":"JeTJXWOu/EGsFhdH+uCyGQ==","passwordHash":"ydoIgwwEDyf4WAcRykCAgUfKCMv6Y47BVgbixcgv/Ji568exMlGBHkEewTgTOWxUfTA/2FiFei6gwgtq3RJBLA==","mustChangePassword":true},"apereirinha":{"user":"apereirinha","name":"André Pereirinha","role":"diretor","hotel":"PORTO RIBEIRA","active":true,"passwordSalt":"SxwvXDq07ZUp8dbWFayARQ==","passwordHash":"cWJjTb1qMJ+Q/JgcpMnUOfI+N1olUesfKOK/IYyVkYcQFbdcgFoQrCqH5ZAbqP7U7tLdjEk0a/EqAP+RbP04SA==","mustChangePassword":true},"npinto_elvas":{"user":"npinto_elvas","name":"Nelson Pinto","role":"diretor","hotel":"COLLECTION ELVAS","active":true,"passwordSalt":"G2ZJpIGo2Tizh48ELe5euw==","passwordHash":"BxDPBYWdBjZwIspB8fK+rfBc0fKYZjpsLVAoKHefkakQGPySigceLO+41HGu6hg27aDdBtLelLrWwjTzxJNvaA==","mustChangePassword":true},"pmatos_dv":{"user":"pmatos_dv","name":"Paulo Matos","role":"diretor","hotel":"DOURO VINEYARDS","active":true,"passwordSalt":"N1tKB+BTqVV+zY7sBtRNCA==","passwordHash":"x0VRTFC61MjTQ6byGft7UVjZTk5EpBSec9A1IUOrDKUZTd0d+7qXAx7c6929wjlp9Xj61ZNpJ8TbD7EHZ2iGkQ==","mustChangePassword":true},"rparada":{"user":"rparada","name":"Rui Parada","role":"diretor","hotel":"COLLECTION ALTER REAL","active":true,"passwordSalt":"qmPkNGBZjLd5ltngNfgI1w==","passwordHash":"lv4T0+WZzNy9NdAR9q+4JmhcxRTZQSU3rtv5lYUBn00CXqlneKcEd5p9frUO5ou28Y8D/2YZ/ojEWiKHTU6tHg==","mustChangePassword":true},"rmartins":{"user":"rmartins","name":"Rita Martins","role":"diretor","hotel":"COLLECTION TOMAR","active":true,"passwordSalt":"NsGM/hn2EoqiUXJIg8Pl8Q==","passwordHash":"+6NLH2UtJlHEL/0COzA09YwwYzbTuzvIcWE2YLLEVEuDeUsAn76Ky33Ek/Cx560JERmpp44b0PcH+PH1ENqDZg==","mustChangePassword":true},"npinto_casas":{"user":"npinto_casas","name":"Nelson Pinto","role":"diretor","hotel":"CASAS DE ELVAS","active":true,"passwordSalt":"UqLmZU0TzjaxGPloWbivFQ==","passwordHash":"Vzkzn2k/Lhe58E9bdolWVD38XXgEevPZOoJOEICrJ6rr6RAcQ+jZk+hkgAIT4mniIi0VYCVjidrg6HkszuVGxg==","mustChangePassword":true},"gnunes":{"user":"gnunes","name":"Gonçalo Nunes","role":"diretor","hotel":"COLLECTION S. MIGUEL","active":true,"passwordSalt":"tpV6KMXFTjv9N2gd/SCf6A==","passwordHash":"v3ScnHtW56E6vQyw9Br/PJGiwTiFqm+DXRV0IttSJZZsS1pdwnzH9rakX/cazlqSZbP27/y1GITE5bwRuoybmA==","mustChangePassword":true},"rteixeira_lima":{"user":"rteixeira_lima","name":"Ricardo Teixeira","role":"diretor","hotel":"COLLECTION PONTE DE LIMA VINEYARDS","active":true,"passwordSalt":"QX9x/En1Y1nwzvvnx7C1yQ==","passwordHash":"/dof+5d5hPV3REh7ARexaKo9JCd/sEZrfab0jYWSbNw8siJzvNlwNrx+a3aicty6+dqNTXdg7kF5aMm5W34WcQ==","mustChangePassword":true},"nclemente_nep":{"user":"nclemente_nep","name":"Nuno Clemente","role":"diretor","hotel":"NEP KIDS","active":true,"passwordSalt":"CBxi2Ptlciw2HjxKjBAmcg==","passwordHash":"O/gRmosI92blXT2xg8rw616B1aSldt5mStf974JAnBVM7as6NV1msGuQvsNR1pswipdkbFCdG+yTLn9NNrFiaQ==","mustChangePassword":true},"nclemente_mv":{"user":"nclemente_mv","name":"Nuno Clemente","role":"diretor","hotel":"COLLECTION MONTE DO VILAR","active":true,"passwordSalt":"4Zep1hEPd2mfCWv6r8MT5g==","passwordHash":"0/cRqnjxS2UVx4ch0WBGf3CZQGRUNlGrus0WAotY6j9AxUZ77U6CRakoCjdIdSMhEwMy1p5+kuOfHOtBB81G5A==","mustChangePassword":true},"noliveira":{"user":"noliveira","name":"Natalia Oliveira","role":"diretor","hotel":"ISLA CANELA","active":true,"passwordSalt":"5LQxksiNDg8kDHCqdQFGkg==","passwordHash":"zmD47SVt+8BPPJVna04YYh8ohBNyg8NhV+wnElAXYaIcTikyX3bN9CXI5K9RUMa8rh/uWF7p/KN/XkL0vBM45w==","mustChangePassword":true},"lsantos_foz":{"user":"lsantos_foz","name":"Leonor Santos","role":"diretor","hotel":"COLLECTION FIGUEIRA DA FOZ","active":true,"passwordSalt":"G0O7m+NqUtiXZJrvYO/n7A==","passwordHash":"gZLFSjX0qNvprt3L+F3n6tcsvWr78151leX/5fCezSXkXpzMP6kjP1Igp5FJYhwhVAe+8dcEYLFySjk3DDNVOQ==","mustChangePassword":true}};

let USERS_CACHE = null;
let USERS_CACHE_AT = 0;
let AUTH_SECRET_CACHE = null;

function hashPassword(password, saltB64) {
  const salt = Buffer.from(saltB64, "base64");
  return crypto.scryptSync(String(password), salt, 64).toString("base64");
}
function newPasswordFields(password) {
  const salt = crypto.randomBytes(16).toString("base64");
  return { passwordSalt: salt, passwordHash: hashPassword(password, salt) };
}
function verifyPassword(password, rec) {
  if (!rec || !rec.passwordSalt || !rec.passwordHash) return false;
  try {
    const actual = Buffer.from(hashPassword(password, rec.passwordSalt), "base64");
    const expected = Buffer.from(rec.passwordHash, "base64");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (e) { return false; }
}
function passwordPolicy(password) {
  const p = String(password || "");
  if (p.length < 8) return "A nova palavra-passe deve ter pelo menos 8 caracteres.";
  if (!/[A-Za-zÀ-ÿ]/.test(p) || !/\d/.test(p)) return "A nova palavra-passe deve incluir pelo menos uma letra e um número.";
  return "";
}
function sanitizeUser(rec) {
  if (!rec) return null;
  return {
    user: rec.user,
    name: rec.name,
    role: rec.role,
    hotel: rec.hotel,
    active: rec.active !== false,
    mustChangePassword: rec.mustChangePassword === true
  };
}
function sanitizeUsers(users) {
  const out = {};
  Object.keys(users || {}).forEach(k => { out[k] = sanitizeUser(users[k]); });
  return out;
}

async function loadUsers(store, force = false) {
  const now = Date.now();
  if (!force && USERS_CACHE && (now - USERS_CACHE_AT) < USER_CACHE_MS) return USERS_CACHE;

  let stored = (await store.get("users", { type: "json" })) || {};
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) stored = {};

  // As contas base garantem recuperação mesmo num Blob antigo vazio/parcial.
  const merged = {};
  Object.keys(SEED_USERS).forEach(k => { merged[k] = Object.assign({}, SEED_USERS[k]); });
  Object.keys(stored).forEach(k => { merged[k] = Object.assign({}, merged[k] || {}, stored[k] || {}); });

  let changed = false;
  for (const [key, raw] of Object.entries(merged)) {
    const rec = raw || {};
    rec.user = safeUserName(rec.user || key);
    rec.name = String(rec.name || rec.user);
    rec.role = ["direcao", "admin", "diretor", "assistente"].includes(rec.role) ? rec.role : "diretor";
    rec.hotel = (rec.role === "direcao" || rec.role === "admin") ? "*" : String(rec.hotel || "*");
    rec.active = rec.active !== false;
    rec.authVersion = Number.isInteger(rec.authVersion) && rec.authVersion > 0 ? rec.authVersion : 1;

    // Migração automática do formato antigo {pass:"..."} para scrypt.
    if (Object.prototype.hasOwnProperty.call(rec, "pass")) {
      const legacyPass = String(rec.pass || "");
      if (legacyPass) Object.assign(rec, newPasswordFields(legacyPass));
      // Password inicial histórica: obriga troca no próximo login.
      rec.mustChangePassword = legacyPass === String.fromCharCode(49,50,51,52,53,54) ? true : rec.mustChangePassword === true;
      delete rec.pass;
      changed = true;
    }
    if (!rec.passwordSalt || !rec.passwordHash) {
      const seed = SEED_USERS[key];
      if (seed && seed.passwordSalt && seed.passwordHash) {
        rec.passwordSalt = seed.passwordSalt;
        rec.passwordHash = seed.passwordHash;
        rec.mustChangePassword = true;
      } else {
        rec.active = false; // conta sem credencial válida: nunca fica utilizável por acidente
      }
      changed = true;
    }
    if (rec.mustChangePassword !== true) rec.mustChangePassword = false;
    merged[key] = rec;
  }

  // Conta principal nunca pode ficar sem acesso por alteração acidental.
  if (merged.pmonforte) {
    if (merged.pmonforte.active === false || merged.pmonforte.role !== "direcao" || merged.pmonforte.hotel !== "*") changed = true;
    merged.pmonforte.active = true;
    merged.pmonforte.role = "direcao";
    merged.pmonforte.hotel = "*";
  }

  if (changed || Object.keys(stored).length !== Object.keys(merged).length) {
    await store.setJSON("users", merged);
  }
  USERS_CACHE = merged;
  USERS_CACHE_AT = now;
  return merged;
}
async function saveUsers(store, users) {
  await store.setJSON("users", users);
  USERS_CACHE = users;
  USERS_CACHE_AT = Date.now();
}

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromB64url(input) {
  let s = String(input).replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}
async function authSecret(store) {
  if (AUTH_SECRET_CACHE) return AUTH_SECRET_CACHE;
  let rec = await store.get("_auth-secret-v1", { type: "json" });
  if (!rec || !rec.value) {
    rec = { value: crypto.randomBytes(48).toString("base64"), createdAt: new Date().toISOString() };
    await store.setJSON("_auth-secret-v1", rec);
    // Releitura reduz o risco de duas inicializações concorrentes gerarem segredos diferentes.
    rec = (await store.get("_auth-secret-v1", { type: "json" })) || rec;
  }
  AUTH_SECRET_CACHE = Buffer.from(rec.value, "base64");
  return AUTH_SECRET_CACHE;
}
async function issueToken(store, rec) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: rec.user, av: rec.authVersion || 1, iat: now, exp: now + SESSION_TTL_SECONDS };
  const body = b64url(JSON.stringify(payload));
  const secret = await authSecret(store);
  const sig = crypto.createHmac("sha256", secret).update(body).digest();
  return body + "." + b64url(sig);
}
async function verifyToken(store, token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 2) return null;
    const secret = await authSecret(store);
    const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
    const actual = fromB64url(parts[1]);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(fromB64url(parts[0]).toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || !payload.exp || payload.exp <= now) return null;
    return payload;
  } catch (e) { return null; }
}
function bearer(event) {
  const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}
async function authenticatedUser(store, event) {
  const payload = await verifyToken(store, bearer(event));
  if (!payload) return null;
  const users = await loadUsers(store);
  const rec = users[payload.sub];
  if (!rec || rec.active === false || Number(rec.authVersion || 1) !== Number(payload.av || 1)) return null;
  return rec;
}

function clientIp(event) {
  const h = event.headers || {};
  return String(h["x-nf-client-connection-ip"] || h["x-forwarded-for"] || h["client-ip"] || "unknown").split(",")[0].trim();
}
function loginRateKey(user, event) {
  const raw = safeUserName(user) + "|" + clientIp(event);
  return "_login-rate-" + crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}
async function checkLoginRate(store, user, event) {
  const key = loginRateKey(user, event);
  const now = Date.now();
  let rec = (await store.get(key, { type: "json" })) || { count: 0, start: now };
  if (!rec.start || now - rec.start > LOGIN_WINDOW_MS) rec = { count: 0, start: now };
  return { key, rec, blocked: Number(rec.count || 0) >= LOGIN_MAX_FAILURES };
}
async function noteLoginFailure(store, rate) {
  const rec = rate.rec || { count: 0, start: Date.now() };
  rec.count = Number(rec.count || 0) + 1;
  await store.setJSON(rate.key, rec);
}
async function clearLoginFailures(store, rate) {
  await store.setJSON(rate.key, { count: 0, start: Date.now() });
}

function canWriteResource(user, resource, key) {
  if (isDirection(user)) return true;
  if (resource === "vg_presence" || resource === "audit") return true;
  if (resource === "hotelsheet") return norm(key) === norm(user.hotel);
  return false;
}

exports.handler = async (event) => {
  connectLambda(event);
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: HEADERS, body: "" };

  const store = getStore(STORE_NAME);
  const params = event.queryStringParameters || {};
  const resource = params.resource || "";
  const key = params.key || "";
  if (!resource) return badRequest("Falta o parâmetro resource.");

  try {
    // -------------------- LOGIN (único endpoint público) --------------------
    if (event.httpMethod === "POST" && resource === "auth-login") {
      const payload = parseBody(event);
      if (!payload) return badRequest("JSON inválido.");
      const username = safeUserName(payload.user);
      const password = String(payload.password || "");
      if (!username || !password) return unauthorized("Utilizador ou palavra-passe inválidos.");

      const rate = await checkLoginRate(store, username, event);
      if (rate.blocked) return tooMany("Demasiadas tentativas. Aguarde alguns minutos e tente novamente.");

      const users = await loadUsers(store, true); // também executa a migração de passwords antigas
      const rec = users[username];
      if (!rec || rec.active === false || !verifyPassword(password, rec)) {
        await noteLoginFailure(store, rate);
        return unauthorized("Utilizador ou palavra-passe inválidos.");
      }
      await clearLoginFailures(store, rate);
      const token = await issueToken(store, rec);
      return ok({ token, user: sanitizeUser(rec), expiresIn: SESSION_TTL_SECONDS });
    }

    // Daqui para baixo tudo exige sessão válida.
    const authUser = await authenticatedUser(store, event);
    if (!authUser) return unauthorized();
    // Blobs internos nunca são endereçáveis pela API genérica, mesmo por utilizadores autenticados.
    if (resource.startsWith("_")) return forbidden();

    // -------------------- PASSWORD DO PRÓPRIO --------------------
    if (event.httpMethod === "POST" && resource === "auth-change-password") {
      const payload = parseBody(event);
      if (!payload) return badRequest("JSON inválido.");
      const oldPassword = String(payload.oldPassword || "");
      const newPassword = String(payload.newPassword || "");
      if (!verifyPassword(oldPassword, authUser)) return unauthorized("A palavra-passe atual está incorreta.");
      const policyError = passwordPolicy(newPassword);
      if (policyError) return badRequest(policyError);
      if (verifyPassword(newPassword, authUser)) return badRequest("A nova palavra-passe tem de ser diferente da atual.");

      const users = await loadUsers(store, true);
      const rec = users[authUser.user];
      Object.assign(rec, newPasswordFields(newPassword));
      rec.mustChangePassword = false;
      rec.passwordUpdatedAt = new Date().toISOString();
      rec.authVersion = Number(rec.authVersion || 1) + 1;
      await saveUsers(store, users);
      const token = await issueToken(store, rec);
      return ok({ ok: true, token, user: sanitizeUser(rec), expiresIn: SESSION_TTL_SECONDS });
    }

    // -------------------- GESTÃO DE UTILIZADORES --------------------
    if (resource === "users" && event.httpMethod === "GET") {
      if (!isDirection(authUser)) return forbidden();
      const users = await loadUsers(store, true);
      return ok({ data: sanitizeUsers(users) });
    }
    if (resource === "user-save" && event.httpMethod === "POST") {
      if (!isDirection(authUser)) return forbidden();
      const payload = parseBody(event);
      if (!payload) return badRequest("JSON inválido.");
      const username = safeUserName(payload.user);
      const name = String(payload.name || "").trim();
      let role = String(payload.role || "diretor");
      let hotel = String(payload.hotel || "*");
      const newPassword = String(payload.password || "");
      if (!username || !name) return badRequest("Utilizador e nome são obrigatórios.");
      if (!["direcao", "diretor", "assistente"].includes(role)) return badRequest("Perfil inválido.");
      if (role === "direcao") hotel = "*";

      const users = await loadUsers(store, true);
      const existing = users[username];
      if (!existing && !newPassword) return badRequest("Defina uma palavra-passe inicial para o novo utilizador.");
      if (username === authUser.user && newPassword) return badRequest("Para alterar a sua própria palavra-passe use o botão Password.");
      if (newPassword) {
        const policyError = passwordPolicy(newPassword);
        if (policyError) return badRequest(policyError);
      }

      const rec = existing ? Object.assign({}, existing) : { user: username, active: true, authVersion: 1 };
      const nextActive = payload.active === undefined ? (existing ? existing.active !== false : true) : payload.active !== false;
      const securityChanged = !!existing && (
        existing.role !== role || String(existing.hotel || "*") !== hotel || existing.active !== nextActive || !!newPassword
      );
      rec.user = username;
      rec.name = name;
      rec.role = role;
      rec.hotel = hotel;
      rec.active = nextActive;
      if (newPassword) {
        Object.assign(rec, newPasswordFields(newPassword));
        rec.mustChangePassword = true;
        rec.passwordUpdatedAt = new Date().toISOString();
      }
      if (securityChanged) rec.authVersion = Number(rec.authVersion || 1) + 1;

      if (username === "pmonforte") { rec.active = true; rec.role = "direcao"; rec.hotel = "*"; }
      users[username] = rec;
      await saveUsers(store, users);
      return ok({ ok: true, user: sanitizeUser(rec) });
    }
    if (resource === "user-toggle" && event.httpMethod === "POST") {
      if (!isDirection(authUser)) return forbidden();
      const payload = parseBody(event);
      if (!payload) return badRequest("JSON inválido.");
      const username = safeUserName(payload.user);
      if (username === "pmonforte") return forbidden("O administrador principal não pode ser inativado.");
      const users = await loadUsers(store, true);
      const rec = users[username];
      if (!rec) return badRequest("Utilizador inexistente.");
      rec.active = rec.active === false ? true : false;
      rec.authVersion = Number(rec.authVersion || 1) + 1;
      await saveUsers(store, users);
      return ok({ ok: true, user: sanitizeUser(rec) });
    }
    // O antigo POST direto de dicionários de utilizadores deixa de existir.
    if (resource === "users" && event.httpMethod === "POST") return forbidden("Use a gestão de utilizadores autenticada.");

    // -------------------- AUDITORIA --------------------
    if (resource === "audit" && event.httpMethod === "GET") {
      if (!isDirection(authUser)) return forbidden();
      const data = await store.get("audit", { type: "json" });
      return ok({ data: Array.isArray(data) ? data : [] });
    }
    if (resource === "audit" && event.httpMethod === "POST") {
      const payload = parseBody(event);
      if (!payload || typeof payload !== "object") return badRequest("Entrada de auditoria inválida.");
      let rows = (await store.get("audit", { type: "json" })) || [];
      if (!Array.isArray(rows)) rows = [];
      const entry = Object.assign({}, payload, {
        user: authUser.user,
        name: authUser.name,
        serverTs: new Date().toISOString()
      });
      rows.unshift(entry);
      rows = rows.slice(0, MAX_AUDIT_ROWS);
      await store.setJSON("audit", rows);
      return ok({ ok: true, total: rows.length });
    }

    // -------------------- GET DADOS PARTILHADOS --------------------
    if (event.httpMethod === "GET") {
      if (resource === "index") {
        const idx = (await store.get("index", { type: "json" })) || {
          meses: [], hoteis: [], occIds: [], igIds: [], rdIds: [], piuKeys: [], hxKeys: [], updatedAt: null
        };
        return ok({ data: idx });
      }
      const data = await store.get(blobKeyFor(resource, key), { type: "json" });
      return ok({ key: key || null, data: data === undefined ? null : data });
    }

    // -------------------- POST DADOS PARTILHADOS --------------------
    if (event.httpMethod === "POST") {
      if (!canWriteResource(authUser, resource, key)) return forbidden();
      const size = bodySizeOf(event);
      if (size > MAX_BODY_BYTES) {
        return tooLarge(`Pedaço "${resource}${key ? " " + key : ""}" tem ${(size / (1024 * 1024)).toFixed(1)}MB — acima do limite (~6MB).`);
      }
      const payload = parseBody(event);
      if (payload === null) return badRequest("JSON inválido.");

      if (resource === "index") {
        if (!payload || typeof payload !== "object") return badRequest("Índice inválido.");
        await store.setJSON("index", Object.assign({}, payload, { updatedAt: new Date().toISOString() }));
        return ok({ ok: true });
      }
      await store.setJSON(blobKeyFor(resource, key), payload);
      return ok({ ok: true });
    }

    return response(405, { error: "Método não permitido." });
  } catch (err) {
    return serverError(err);
  }
};
