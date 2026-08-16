// VG · Custos A&B — função partilhada (Netlify Blobs)
// Padrão idêntico ao VG Dashboard: dados em pedaços pequenos + índice,
// utilizadores e auditoria partilhados. Cada pedaço fica muito abaixo dos ~6MB.
import { getStore } from "@netlify/blobs";

const STORE_NAME = "vg-custos-ab";
const ok  = (body) => ({ statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const err = (code, msg) => ({ statusCode: code, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: msg }) });

export default async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  let payload;
  try { payload = await req.json(); } catch { return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 }); }
  const { action, key, data } = payload || {};
  if (!action) return new Response(JSON.stringify({ error: "action em falta" }), { status: 400 });
  const store = getStore(STORE_NAME);
  try {
    if (action === "get") {
      const v = await store.get(key, { type: "json" });
      return new Response(JSON.stringify({ ok: true, data: v ?? null }), { status: 200 });
    }
    if (action === "set") {
      await store.setJSON(key, data);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (action === "del") {
      await store.delete(key);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (action === "list") {
      const { blobs } = await store.list({ prefix: key || "" });
      return new Response(JSON.stringify({ ok: true, data: blobs.map(b => b.key) }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "action desconhecida" }), { status: 400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message || e) }), { status: 500 });
  }
};

export const config = { path: "/api/shared" };
