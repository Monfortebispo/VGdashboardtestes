const { getStore, connectLambda } = require('@netlify/blobs');
const crypto = require('crypto');

const STORE_NAME='vg-dashboard-operacoes';
const RECORD_PREFIX='ops-lostfound-record/';
const FILE_PREFIX='ops-lostfound-file/';
const COUNTER_PREFIX='ops-lostfound-counter/';
const SESSION_TTL_SECONDS=12*60*60;
const MAX_JSON_BYTES=4.8*1024*1024;
const MAX_FILE_BYTES=3.2*1024*1024;
const STATES=new Set(['Encontrado','Cliente contactado','A processar envio','Enviado','Recebido pelo cliente']);
const SHIPPING=new Set(['','Correio','Transportadora','Estafeta','Entrega em mão','Outro']);
const HEADERS={
  'Content-Type':'application/json; charset=utf-8',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'
};
function response(code,body){return{statusCode:code,headers:HEADERS,body:JSON.stringify(body)}}
function ok(body){return response(200,body)}
function bad(msg){return response(400,{error:msg})}
function unauth(msg='Sessão inválida ou expirada.'){return response(401,{error:msg})}
function forbid(msg='Sem permissões para esta operação.'){return response(403,{error:msg})}
function notFound(msg='Registo não encontrado.'){return response(404,{error:msg})}
function tooLarge(msg){return response(413,{error:msg})}
function clean(v,max=500){return String(v==null?'':v).trim().slice(0,max)}
function bodySize(event){return Buffer.byteLength(event.body||'','utf8')}
function safeId(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,180)}
function normHotel(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/^(HOTEL\s+)?VILA\s+GALE\s+/,'').replace(/^VG(C)?\s+/,'').replace(/^COLLECTION\s+/,'').replace(/\s+/g,' ').trim()}
function normalizeRole(r){r=String(r||'diretor').toLowerCase();if(r==='admin')return'direcao';if(r==='director')return'diretor';return r}
function isDirection(u){return !!u&&normalizeRole(u.role)==='direcao'}
function userHotels(u){if(!u)return[];if(isDirection(u))return['*'];const a=Array.isArray(u.hotels)?u.hotels:(u.hotel&&u.hotel!=='*'?[u.hotel]:[]);return [...new Set(a.map(x=>String(x||'').trim()).filter(Boolean))]}
function canHotel(u,h){if(isDirection(u))return true;const n=normHotel(h);return !!n&&userHotels(u).some(x=>normHotel(x)===n)}
function canModule(u){if(isDirection(u))return true;return Array.isArray(u.modules)&&u.modules.includes('lostfound')}
function b64url(input){return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
function fromB64url(input){let s=String(input).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Buffer.from(s,'base64')}
async function authSecret(store){const rec=await store.get('_auth-secret-v1',{type:'json'});return rec&&rec.value?Buffer.from(rec.value,'base64'):null}
async function verifyToken(store,token){
  try{
    const parts=String(token||'').split('.');if(parts.length!==2)return null;
    const secret=await authSecret(store);if(!secret)return null;
    const expected=crypto.createHmac('sha256',secret).update(parts[0]).digest();
    const actual=fromB64url(parts[1]);if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return null;
    const payload=JSON.parse(fromB64url(parts[0]).toString('utf8'));
    if(!payload.sub||!payload.exp||payload.exp<=Math.floor(Date.now()/1000))return null;
    const users=(await store.get('users',{type:'json'}))||{};
    const rec=users[payload.sub];if(!rec||rec.active===false||Number(rec.authVersion||1)!==Number(payload.av||1))return null;
    return rec;
  }catch(e){return null}
}
function bearer(event){const h=(event.headers&&(event.headers.authorization||event.headers.Authorization))||'';const m=String(h).match(/^Bearer\s+(.+)$/i);return m?m[1].trim():''}
function recordKey(id){return RECORD_PREFIX+safeId(id)}
function fileKey(id,fileId){return FILE_PREFIX+safeId(id)+'/'+safeId(fileId)}
function auditEntry(user,action,detail){return{at:new Date().toISOString(),user:user.user,name:user.name||user.user,profile:normalizeRole(user.role),action,detail:clean(detail,800)}}
function publicRecord(r){
  if(!r)return r;
  return Object.assign({},r,{files:(r.files||[]).map(f=>({id:f.id,name:f.name,type:f.type,size:f.size,kind:f.kind,createdAt:f.createdAt}))});
}
async function listRecords(store,user){
  const listing=await store.list({prefix:RECORD_PREFIX});
  const out=[];
  for(const b of (listing.blobs||[])){
    const r=await store.get(b.key,{type:'json'});
    if(r&&canHotel(user,r.hotel))out.push(publicRecord(r));
  }
  return out.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
function hotelPrefix(h){const n=normHotel(h);const words=n.split(' ').filter(Boolean);const map={'ESTORIL':'EST','CASCAIS':'CAS','AMPALIUS':'AMP','ALBACORA':'ALB','ALENTEJO VINEYARDS':'ALV','COIMBRA':'COI','FORTALEZA':'FOR','SALVADOR':'SAL','RIO DE JANEIRO':'RIO','OPERA':'OPE','ERICEIRA':'ERI'};return map[n]||(words.map(w=>w[0]).join('').slice(0,3)||'HOT')}
async function nextCode(store,hotel){
  const key=COUNTER_PREFIX+safeId(normHotel(hotel));
  const rec=(await store.get(key,{type:'json'}))||{value:0};
  const value=Math.max(0,Number(rec.value)||0)+1;
  await store.setJSON(key,{value,updatedAt:new Date().toISOString()});
  return `${hotelPrefix(hotel)}-${String(value).padStart(6,'0')}`;
}
async function getRecord(store,id,user){const r=await store.get(recordKey(id),{type:'json'});if(!r)return null;if(!canHotel(user,r.hotel))return false;return r}
async function saveRecord(store,r){r.updatedAt=new Date().toISOString();await store.setJSON(recordKey(r.id),r);return r}

exports.handler=async(event)=>{
  connectLambda(event);
  if(event.httpMethod==='OPTIONS')return{statusCode:204,headers:HEADERS,body:''};
  const store=getStore(STORE_NAME);
  try{
    const user=await verifyToken(store,bearer(event));
    if(!user)return unauth();
    if(!canModule(user))return forbid('O seu perfil não tem acesso a Perdidos & Achados.');
    const p=event.queryStringParameters||{};
    const action=clean(p.action||'list',40);

    if(event.httpMethod==='GET'&&action==='list'){
      const rows=await listRecords(store,user);
      return ok({data:rows,total:rows.length,updatedAt:new Date().toISOString()});
    }
    if(event.httpMethod==='GET'&&action==='file'){
      const id=clean(p.id,120),fileId=clean(p.file,120);
      const r=await getRecord(store,id,user);if(r===false)return forbid();if(!r)return notFound();
      const meta=(r.files||[]).find(f=>f.id===fileId);if(!meta)return notFound('Ficheiro não encontrado.');
      const data=await store.get(fileKey(id,fileId),{type:'json'});if(!data||!data.base64)return notFound('Ficheiro não encontrado.');
      return ok({data:{name:meta.name,type:meta.type,base64:data.base64}});
    }
    if(event.httpMethod!=='POST')return response(405,{error:'Método não permitido.'});
    if(bodySize(event)>MAX_JSON_BYTES)return tooLarge('Pedido demasiado grande.');
    let payload={};try{payload=JSON.parse(event.body||'{}')}catch(e){return bad('JSON inválido.')}

    if(action==='create'){
      const hotel=clean(payload.hotel,120),location=clean(payload.location,300),foundBy=clean(payload.foundBy,200);
      const items=Array.isArray(payload.items)?payload.items.map(x=>({description:clean(x.description,300),qty:Math.max(1,Math.min(999,Number(x.qty)||1))})).filter(x=>x.description).slice(0,50):[];
      if(!hotel||!location||!foundBy||!items.length)return bad('Preencha hotel, local, quem encontrou e pelo menos um objeto.');
      if(!canHotel(user,hotel))return forbid('Este hotel está fora do âmbito do utilizador.');
      const now=new Date().toISOString(),code=await nextCode(store,hotel),id=code;
      const r={id,code,hotel,reservation:clean(payload.reservation,120),room:clean(payload.room,60),location,foundBy,notes:clean(payload.notes,4000),items,createdAt:now,updatedAt:now,year:new Date().getFullYear(),status:'Encontrado',customerName:'',customerContact:'',contactedBy:'',shippingMethod:'',customerCost:'',hotelCost:'',deliveredBy:'',archived:false,files:[],createdBy:{user:user.user,name:user.name||user.user,profile:normalizeRole(user.role)},history:[auditEntry(user,'Criou registo',`Objeto encontrado por ${foundBy}`)]};
      await saveRecord(store,r);
      return ok({ok:true,data:publicRecord(r)});
    }
    const id=clean(payload.id||p.id,120);if(!id)return bad('Identificador obrigatório.');
    const r=await getRecord(store,id,user);if(r===false)return forbid();if(!r)return notFound();

    if(action==='update'){
      const old=r.status,next=clean(payload.status||r.status,80);if(!STATES.has(next))return bad('Estado inválido.');
      const method=clean(payload.shippingMethod,80);if(!SHIPPING.has(method))return bad('Método de envio inválido.');
      r.customerName=clean(payload.customerName,200);r.customerContact=clean(payload.customerContact,300);r.contactedBy=clean(payload.contactedBy,200);r.shippingMethod=method;r.customerCost=clean(payload.customerCost,80);r.hotelCost=clean(payload.hotelCost,80);r.deliveredBy=clean(payload.deliveredBy,200);r.status=next;
      r.history=(r.history||[]).concat([auditEntry(user,old===next?'Atualizou registo':`Estado: ${old} → ${next}`,'')]);
      await saveRecord(store,r);return ok({ok:true,data:publicRecord(r)});
    }
    if(action==='archive'){
      if(r.status!=='Recebido pelo cliente')return bad('Só pode arquivar após receção pelo cliente.');
      if(!r.archived){r.archived=true;r.archivedAt=new Date().toISOString();r.history=(r.history||[]).concat([auditEntry(user,'Arquivou registo','')]);await saveRecord(store,r)}
      return ok({ok:true,data:publicRecord(r)});
    }
    if(action==='upload'){
      const name=clean(payload.name,220),type=clean(payload.type||'application/octet-stream',120),kind=payload.kind==='photo'?'photo':'pdf',base64=String(payload.base64||'').replace(/^data:[^;]+;base64,/,''),buf=Buffer.from(base64,'base64');
      if(!name||!base64||!buf.length)return bad('Ficheiro inválido.');
      if(buf.length>MAX_FILE_BYTES)return tooLarge('Cada ficheiro pode ter no máximo 3,2 MB.');
      if(kind==='photo'&&!type.startsWith('image/'))return bad('A fotografia tem de ser uma imagem.');
      if(kind==='pdf'&&type!=='application/pdf')return bad('O documento tem de ser PDF.');
      if(kind==='photo'&&(r.files||[]).some(f=>f.kind==='photo'))return bad('Só é permitida uma fotografia geral por registo.');
      const fileId='f_'+Date.now().toString(36)+'_'+crypto.randomBytes(4).toString('hex');
      await store.setJSON(fileKey(id,fileId),{base64,type,name});
      r.files=(r.files||[]).concat([{id:fileId,name,type,size:buf.length,kind,createdAt:new Date().toISOString()}]);
      r.history=(r.history||[]).concat([auditEntry(user,kind==='photo'?'Adicionou fotografia':'Adicionou PDF',name)]);
      await saveRecord(store,r);return ok({ok:true,data:publicRecord(r)});
    }
    return bad('Ação desconhecida.');
  }catch(err){console.error('lost-found:',err);return response(500,{error:'Erro interno em Perdidos & Achados.'})}
};
