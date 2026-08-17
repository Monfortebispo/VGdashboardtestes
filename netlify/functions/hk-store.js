// VG · Inventário de Roupas HK — armazenamento partilhado autenticado.
// V35.3: sessão única + autorização server-side por perfil/hotel.
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const AUTH_STORE_NAME='vg-dashboard-operacoes';
const STORE_NAME='vg-hk-inventario';
const STORE_KEY='vg_hk_inventario_v1';
const PRESENCE_KEY='vg_hk_presence_v1';
function b64urlDecode(input){let s=String(input||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Buffer.from(s,'base64');}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/^(HOTEL\s+)?VILA\s+GALE\s+/,'').replace(/^VG(C)?\s+/,'').replace(/^COLLECTION\s+/,'').replace(/\s+/g,' ').trim();}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function isDirection(u){return !!u&&['direcao','admin'].includes(String(u.role||'').toLowerCase());}
function isPurchases(u){return String(u?.role||'').toLowerCase()==='compras';}
async function authenticatedUser(req){
  try{
    const h=req.headers.get('authorization')||'',m=String(h).match(/^Bearer\s+(.+)$/i);if(!m)return null;
    const parts=m[1].trim().split('.');if(parts.length!==2)return null;
    const authStore=getStore({name:AUTH_STORE_NAME,consistency:'strong'}),secretRec=await authStore.get('_auth-secret-v1',{type:'json'});if(!secretRec?.value)return null;
    const expected=crypto.createHmac('sha256',Buffer.from(secretRec.value,'base64')).update(parts[0]).digest(),actual=b64urlDecode(parts[1]);if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return null;
    const payload=JSON.parse(b64urlDecode(parts[0]).toString('utf8'));if(!payload?.sub||!payload?.exp||payload.exp<=Math.floor(Date.now()/1000))return null;
    const users=(await authStore.get('users',{type:'json'}))||{},u=users[payload.sub];if(!u||u.active===false||Number(u.authVersion||1)!==Number(payload.av||1))return null;
    return {user:payload.sub,role:u.role,hotel:u.hotel,name:u.name};
  }catch(e){return null;}
}
function hotelIdsFor(data,hotel){
  const wanted=norm(hotel);if(!wanted||wanted==='*')return [];
  return (Array.isArray(data?.hoteis)?data.hoteis:[]).filter(h=>norm(h?.nome)===wanted||norm(h?.nome).replace(/^COLLECTION\s+/,'')===wanted.replace(/^COLLECTION\s+/,'')).map(h=>String(h.id));
}
function scopeDb(data,user){
  if(!data||isDirection(user)||isPurchases(user))return data;
  const ids=new Set(hotelIdsFor(data,user.hotel)),out=clone(data);
  out.hoteis=(out.hoteis||[]).filter(h=>ids.has(String(h.id)));
  const inv={};for(const [cid,store] of Object.entries(out.invent||{})){inv[cid]={};for(const [hid,val] of Object.entries(store||{}))if(ids.has(String(hid)))inv[cid][hid]=val;}out.invent=inv;
  // Utilizadores e auditoria global não são expostos a perfis de hotel.
  out.users=[];out.log=[];
  out.meta=Object.assign({},out.meta||{},{serverScope:{hotel:user.hotel,at:new Date().toISOString()}});
  return out;
}
function mergeOwnHotel(authoritative,submitted,user){
  const base=clone(authoritative||{}),src=submitted||{},ids=new Set(hotelIdsFor(base,user.hotel));
  if(!ids.size)throw new Error('Hotel da sessão não existe no inventário.');
  base.invent=base.invent&&typeof base.invent==='object'?base.invent:{};
  for(const camp of (base.campanhas||[])){
    const cid=String(camp.id),srcStore=src.invent?.[cid]||{},dstStore=base.invent[cid]||(base.invent[cid]={});
    for(const hid of ids){if(!srcStore[hid])continue;const before=dstStore[hid]||{},next=clone(srcStore[hid]);
      // Aprovação/reabertura de inventário é exclusivamente da Direção.
      for(const k of ['aprovado','aprovadoPor','aprovadoEm','jaFoiAprovado','reabertoPor','reabertoEm'])if(Object.prototype.hasOwnProperty.call(before,k))next[k]=before[k];else delete next[k];
      dstStore[hid]=next;
    }
  }
  base.meta=Object.assign({},base.meta||{});if(src.meta?.rev)base.meta.rev=clone(src.meta.rev);
  const incoming=(Array.isArray(src.log)?src.log:[]).filter(e=>norm(e?.user)===norm(user.name)||norm(e?.user)===norm(user.user)).slice(-30);
  if(incoming.length){const seen=new Set((base.log||[]).map(e=>String(e?.id||'')+'|'+String(e?.ts||'')));base.log=Array.isArray(base.log)?base.log:[];for(const e of incoming){const k=String(e?.id||'')+'|'+String(e?.ts||'');if(!seen.has(k)){seen.add(k);base.log.push(clone(e));}}base.log=base.log.slice(-3000);}
  return base;
}
function json(data,status=200,cors={}){return new Response(JSON.stringify(data),{status,headers:cors});}

export default async (req) => {
  const store=getStore({name:STORE_NAME,consistency:'strong'}),cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Content-Type':'application/json','Cache-Control':'no-store'};
  if(req.method==='OPTIONS')return new Response('',{status:204,headers:cors});
  const user=await authenticatedUser(req);if(!user)return json({error:'Sessão inválida ou expirada.'},401,cors);
  try{
    if(req.method==='GET'){
      const key=new URL(req.url).searchParams.get('key')||'default',data=await store.get(key,{type:'json'});
      if(key===STORE_KEY)return json({data:scopeDb(data||null,user)},200,cors);
      if(key===PRESENCE_KEY)return json({data:data||null},200,cors);
      if(!isDirection(user))return json({error:'Sem permissões para esta chave.'},403,cors);
      return json({data:data||null},200,cors);
    }
    if(req.method==='POST'){
      const body=await req.json();if(!body||!body.key)return json({error:'key em falta'},400,cors);const key=String(body.key);
      if(key===PRESENCE_KEY){await store.setJSON(key,body.data&&typeof body.data==='object'?body.data:{});return json({ok:true},200,cors);}
      if(key!==STORE_KEY){if(!isDirection(user))return json({error:'Sem permissões para esta chave.'},403,cors);await store.setJSON(key,body.data);return json({ok:true},200,cors);}
      if(isDirection(user)){await store.setJSON(key,body.data);return json({ok:true},200,cors);}
      if(isPurchases(user))return json({ok:true,readOnly:true},200,cors);
      const current=await store.get(STORE_KEY,{type:'json'});if(!current)return json({error:'Base de inventário ainda não inicializada pela Direção.'},409,cors);
      const merged=mergeOwnHotel(current,body.data,user);await store.setJSON(STORE_KEY,merged);return json({ok:true,scoped:true},200,cors);
    }
    return json({error:'método não suportado'},405,cors);
  }catch(e){return json({error:String(e?.message||e)},500,cors);}
};
