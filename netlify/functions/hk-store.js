// VG · Inventário de Roupas HK — armazenamento partilhado via Netlify Blobs
// GET  /.netlify/functions/hk-store?key=...   -> { data }
// POST /.netlify/functions/hk-store  { key, data } -> { ok:true }
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const store = getStore({ name: 'vg-hk-inventario', consistency: 'strong' });
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: cors });

  try {
    if (req.method === 'GET') {
      const key = new URL(req.url).searchParams.get('key') || 'default';
      const data = await store.get(key, { type: 'json' });
      return new Response(JSON.stringify({ data: data || null }), { headers: cors });
    }
    if (req.method === 'POST') {
      const body = await req.json();
      if (!body || !body.key) return new Response(JSON.stringify({ error: 'key em falta' }), { status: 400, headers: cors });
      await store.setJSON(body.key, body.data);
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }
    return new Response(JSON.stringify({ error: 'método não suportado' }), { status: 405, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
};
