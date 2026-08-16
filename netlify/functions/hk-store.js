// VG · Inventário de Roupas HK — armazenamento partilhado autenticado.
// V35: reutiliza a sessão HMAC da VG Operations; não existe segundo login.
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const AUTH_STORE_NAME='vg-dashboard-operacoes';
function b64urlDecode(input){
  let s=String(input||'').replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return Buffer.from(s,'base64');
}
async function authenticatedUser(req){
  try{
    const h=req.headers.get('authorization')||''; const m=String(h).match(/^Bearer\s+(.+)$/i); if(!m)return null;
    const parts=m[1].trim().split('.'); if(parts.length!==2)return null;
    const authStore=getStore({name:AUTH_STORE_NAME,consistency:'strong'});
    const secretRec=await authStore.get('_auth-secret-v1',{type:'json'}); if(!secretRec?.value)return null;
    const expected=crypto.createHmac('sha256',Buffer.from(secretRec.value,'base64')).update(parts[0]).digest();
    const actual=b64urlDecode(parts[1]); if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return null;
    const payload=JSON.parse(b64urlDecode(parts[0]).toString('utf8'));
    if(!payload?.sub||!payload?.exp||payload.exp<=Math.floor(Date.now()/1000))return null;
    const users=(await authStore.get('users',{type:'json'}))||{}; const u=users[payload.sub];
    if(!u||u.active===false||Number(u.authVersion||1)!==Number(payload.av||1))return null;
    return {user:payload.sub,role:u.role,hotel:u.hotel,name:u.name};
  }catch(e){return null;}
}

export default async (req) => {
  const store = getStore({ name: 'vg-hk-inventario', consistency: 'strong' });
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    'Cache-Control':'no-store'
  };
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: cors });
  const user=await authenticatedUser(req);
  if(!user)return new Response(JSON.stringify({error:'Sessão inválida ou expirada.'}),{status:401,headers:cors});
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
