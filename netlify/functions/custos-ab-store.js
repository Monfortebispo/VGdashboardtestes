// VG · Custos A&B — armazenamento partilhado autenticado.
// V35: o módulo é nativo da VG Operations e reutiliza a sessão HMAC da Dashboard.
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const STORE_NAME = "vg-custos-ab";
const AUTH_STORE_NAME = "vg-dashboard-operacoes";

function b64urlDecode(input){
  let s=String(input||'').replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  return Buffer.from(s,'base64');
}
async function authenticatedUser(req){
  try{
    const h=req.headers.get('authorization')||'';
    const m=String(h).match(/^Bearer\s+(.+)$/i); if(!m)return null;
    const parts=m[1].trim().split('.'); if(parts.length!==2)return null;
    const authStore=getStore({name:AUTH_STORE_NAME,consistency:'strong'});
    const secretRec=await authStore.get('_auth-secret-v1',{type:'json'});
    if(!secretRec?.value)return null;
    const expected=crypto.createHmac('sha256',Buffer.from(secretRec.value,'base64')).update(parts[0]).digest();
    const actual=b64urlDecode(parts[1]);
    if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return null;
    const payload=JSON.parse(b64urlDecode(parts[0]).toString('utf8'));
    if(!payload?.sub||!payload?.exp||payload.exp<=Math.floor(Date.now()/1000))return null;
    const users=(await authStore.get('users',{type:'json'}))||{};
    const u=users[payload.sub];
    if(!u||u.active===false||Number(u.authVersion||1)!==Number(payload.av||1))return null;
    return {user:payload.sub,role:u.role,hotel:u.hotel,name:u.name};
  }catch(e){return null;}
}

export default async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  const user=await authenticatedUser(req);
  if(!user) return new Response(JSON.stringify({error:'Sessão inválida ou expirada.'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
  let payload;
  try { payload = await req.json(); } catch { return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 }); }
  const { action, key, data } = payload || {};
  if (!action) return new Response(JSON.stringify({ error: "action em falta" }), { status: 400 });
  if (!key && action !== 'list') return new Response(JSON.stringify({ error: "key em falta" }), { status: 400 });
  const store = getStore({name:STORE_NAME,consistency:'strong'});
  try {
    if (action === "get") {
      const v = await store.get(key, { type: "json" });
      return new Response(JSON.stringify({ ok: true, data: v ?? null }), { status: 200, headers:{'content-type':'application/json','cache-control':'no-store'} });
    }
    if (action === "set") {
      await store.setJSON(key, data);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers:{'content-type':'application/json','cache-control':'no-store'} });
    }
    if (action === "del") {
      await store.delete(key);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers:{'content-type':'application/json','cache-control':'no-store'} });
    }
    if (action === "list") {
      const { blobs } = await store.list({ prefix: key || "" });
      return new Response(JSON.stringify({ ok: true, data: blobs.map(b => b.key) }), { status: 200, headers:{'content-type':'application/json','cache-control':'no-store'} });
    }
    return new Response(JSON.stringify({ error: "action desconhecida" }), { status: 400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message || e) }), { status: 500 });
  }
};

export const config = { path: "/api/shared" };
