// Função partilhada do VG · Dashboard Operações.
//
// Desenho genérico: qualquer coleção de dados grande (meses de P&L, hotéis de
// reputação, snapshots de ocupação/Instagram/receitas, fichas de hotel, etc.)
// é guardada em pedaços pequenos — um pedido por "resource"+"key". Um "índice"
// publicado no fim lista que pedaços existem. Isto evita o limite de ~6MB por
// pedido do Netlify, mesmo que o total acumulado (2+ anos) seja muito maior.
//
// Recursos especiais (semântica própria):
//   index  -> { meses, hoteis, occIds, igIds, rdIds, piuKeys, hxKeys, ... }  GET/POST
//   users  -> dicionário de utilizadores                                     GET/POST
//   audit  -> registo de auditoria (array; POST acrescenta 1 entrada)         GET/POST
//
// Qualquer outro "resource" (mes, hotel, occ, ig, rd, piu, hotelxlsx, notas, cd,
// meta, settings, hotelsheet, ...) é tratado de forma genérica: guarda/lê um único blob JSON por
// resource+key (ou só por resource, se não houver key).

const { getStore, connectLambda } = require("@netlify/blobs");

const STORE_NAME = "vg-dashboard-operacoes";
const MAX_BODY_BYTES = 5.5 * 1024 * 1024; // margem de segurança abaixo do limite real (~6MB)
const MAX_AUDIT_ROWS = 300;

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

function ok(body) { return { statusCode: 200, headers: HEADERS, body: JSON.stringify(body) }; }
function badRequest(msg) { return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: msg }) }; }
function tooLarge(msg) { return { statusCode: 413, headers: HEADERS, body: JSON.stringify({ error: msg }) }; }
function serverError(err) {
  console.error("Erro na função dashboard-sessao:", err);
  return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: "Erro interno ao aceder aos dados partilhados." }) };
}

function bodySizeOf(event) {
  const raw = event.body || "";
  return event.isBase64Encoded ? Math.ceil((raw.length * 3) / 4) : Buffer.byteLength(raw, "utf8");
}

// Chave de blob segura para qualquer resource+key (nomes de hotel podem ter espaços/acentos).
function blobKeyFor(resource, key) {
  if (key === undefined || key === null || key === "") return resource;
  return resource + "-" + encodeURIComponent(String(key));
}

exports.handler = async (event) => {
  connectLambda(event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }

  const store = getStore(STORE_NAME);
  const params = event.queryStringParameters || {};
  const resource = params.resource || "";
  const key = params.key || "";

  if (!resource) return badRequest("Falta o parâmetro resource.");

  try {
    // -------------------- GET --------------------
    if (event.httpMethod === "GET") {
      if (resource === "index") {
        const idx = (await store.get("index", { type: "json" })) || {
          meses: [], hoteis: [], occIds: [], igIds: [], rdIds: [], piuKeys: [], hxKeys: [], updatedAt: null
        };
        return ok({ data: idx });
      }
      if (resource === "users") {
        const data = await store.get("users", { type: "json" });
        return ok({ data: data || {} });
      }
      if (resource === "audit") {
        const data = await store.get("audit", { type: "json" });
        return ok({ data: data || [] });
      }
      // Genérico: qualquer outro resource é um blob simples por resource+key.
      const data = await store.get(blobKeyFor(resource, key), { type: "json" });
      return ok({ key: key || null, data: data === undefined ? null : data });
    }

    // -------------------- POST --------------------
    if (event.httpMethod === "POST") {
      const size = bodySizeOf(event);
      if (size > MAX_BODY_BYTES) {
        return tooLarge(
          `Pedaço "${resource}${key ? " " + key : ""}" tem ${(size / (1024 * 1024)).toFixed(1)}MB — ` +
          `acima do limite (~6MB). Reduz o conteúdo desse mês/hotel/snapshot.`
        );
      }

      let payload;
      try {
        payload = JSON.parse(event.body || "{}");
      } catch (e) {
        return badRequest("JSON inválido.");
      }

      if (resource === "index") {
        if (!payload || typeof payload !== "object") return badRequest("Índice inválido.");
        await store.setJSON("index", Object.assign({}, payload, { updatedAt: new Date().toISOString() }));
        return ok({ ok: true });
      }

      if (resource === "users") {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          return badRequest("Formato de utilizadores inválido.");
        }
        await store.setJSON("users", payload);
        return ok({ ok: true });
      }

      if (resource === "audit") {
        // Recebe UMA entrada nova; a função acrescenta-a ao registo guardado no servidor.
        if (!payload || typeof payload !== "object") return badRequest("Entrada de auditoria inválida.");
        let rows = (await store.get("audit", { type: "json" })) || [];
        if (!Array.isArray(rows)) rows = [];
        rows.unshift(payload);
        rows = rows.slice(0, MAX_AUDIT_ROWS);
        await store.setJSON("audit", rows);
        return ok({ ok: true, total: rows.length });
      }

      // Genérico: guarda o payload tal como veio, como um blob simples por resource+key.
      await store.setJSON(blobKeyFor(resource, key), payload);
      return ok({ ok: true });
    }

    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: "Método não permitido." }) };
  } catch (err) {
    return serverError(err);
  }
};
