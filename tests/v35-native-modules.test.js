const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),domains=read('assets/js/modules/operations-domains-v33.js'),ab=read('assets/js/modules/compras-ab-native-v35.js'),hk=read('assets/js/modules/housekeeping-native-v35.js');
assert(html.includes('compras-ab-native-v35.js')&&html.includes('housekeeping-native-v35.js'),'index deve carregar os dois módulos nativos antes do domínio integrado');
assert(html.indexOf('compras-ab-native-v35.js')<html.indexOf('operations-domains-v33.js')&&html.indexOf('housekeeping-native-v35.js')<html.indexOf('operations-domains-v33.js'),'módulos nativos devem registar antes do orquestrador');
assert(domains.includes('VG.comprasNative35.mount')&&domains.includes('VG.housekeepingNative35.mount'),'orquestrador deve montar módulos nativos');
for(const text of [html,domains,ab,hk])assert(!/integrated\/(?:custos-ab|housekeeping)\/index\.html/.test(text),'não pode existir referência às apps standalone antigas');
assert(!/<iframe[^>]+(?:custos|housekeeping)/i.test(domains),'não pode existir iframe A&B/HK');
assert(ab.includes("architecture:'native-shadow-module'")&&hk.includes("architecture:'native-shadow-module'"),'módulos devem declarar arquitetura nativa isolada');
assert(ab.includes('AB35Root')&&hk.includes('HK35Root'),'Shadow DOM deve isolar IDs/CSS sem documento secundário');
assert(ab.includes('ab35ProfileAllows')&&ab.includes('ab35MarketAllows')&&hk.includes('hk35MarketAllowsHotelObj')&&hk.includes('hotelVisivel=function'),'perfis e geografia devem ser aplicados nativamente');
assert(ab.includes('Fichas Técnicas')===false || domains.includes('Fichas Técnicas'),'hub A&B deve manter módulos complementares da plataforma');
for(const t of ['Fichas Técnicas','Consumo Teórico','Buffets &amp; Ementas','Inteligência'])assert(domains.includes(t),`hub A&B complementar em falta: ${t}`);

assert(ab.includes("await ensureXLSX35()")&&hk.includes("await ensureXLSX35()"),'imports/exports Excel dos módulos nativos devem carregar SheetJS de forma lazy pela Dashboard');
assert(ab.includes("headers.Authorization='Bearer '+authToken")&&hk.includes("h.Authorization='Bearer '+t"),'clientes nativos devem reutilizar o token autenticado da Dashboard nos backends operacionais');
const abStore=read('netlify/functions/custos-ab-store.js'),hkStore=read('netlify/functions/hk-store.js');
for(const backend of [abStore,hkStore]){
  assert(backend.includes('authenticatedUser')&&backend.includes('_auth-secret-v1')&&backend.includes('authVersion'),'backends A&B/HK devem validar a sessão HMAC e revogação da Dashboard');
  assert(backend.includes('Sessão inválida ou expirada.'),'backend operacional deve rejeitar pedidos sem sessão válida');
}
assert(!hk.includes('navigator.sendBeacon(FN_URL'),'Housekeeping não deve contornar o header de autenticação no flush de saída');
const ficha=read('assets/js/modules/ficha-hotel.js');assert.strictEqual(crypto.createHash('sha256').update(ficha).digest('hex'),'2779d6f5cbfcedb672f037494ee54847a16aec2247f5a0594346e3e6c4963dc7','Ficha do Hotel deve permanecer intacta');
console.log('✓ V35: arquitetura nativa, sem iframe, com sessão/geografia e paridade funcional validada');
