// VG Operations — Reputação: importação JSON no Carregar Documentos V52
(function(){
'use strict';
if(window.__VG_REPUTATION_UPLOAD_CENTER_V52__)return;
window.__VG_REPUTATION_UPLOAD_CENTER_V52__=true;

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function ensureStyle(){
  if(document.getElementById('repJsonUploadCenterStyle'))return;
  const st=document.createElement('style');st.id='repJsonUploadCenterStyle';st.textContent=`
.rep-json-upload-v52{display:inline-flex;align-items:center;margin-left:8px}.rep-json-upload-v52 button{border:1px solid #d2a92f;background:transparent;color:#e3bf4d;border-radius:7px;padding:9px 12px;font-weight:700;cursor:pointer}.rep-json-upload-v52 button:hover{background:rgba(214,181,74,.1)}.rep-json-upload-v52 button:disabled{opacity:.55;cursor:wait}.rep-json-status-v52{display:block;margin-top:7px;color:#90a9c1;font-size:10px}`;
  document.head.appendChild(st);
}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}
function pick(o,names){for(const n of names){if(o&&o[n]!=null&&o[n]!=='')return o[n];}return null;}
function asNum(v){if(typeof v==='number'&&Number.isFinite(v))return v;if(typeof v==='string'){const n=Number(v.replace(',','.').replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:null;}return null;}
function hotelOf(o,fallback=''){return String(pick(o,['hotel','hotelName','property','propertyName','unit','unitName','name'])||fallback||'').trim();}
function metricScore(o){return asNum(pick(o,['gri','GRI','griScore','score','overallScore','index']));}
function hasMetric(o){return !!o&&(metricScore(o)!=null||asNum(pick(o,['reviews','reviewCount','totalReviews']))!=null||asNum(pick(o,['mgmtResp','managementResponse','responseRate']))!=null);}
function keyOf(h){return String(h).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim();}
function normalizeRecord(row,hotelFallback=''){
  const r=obj(row);if(!r)return null;
  const hotel=hotelOf(r,hotelFallback);if(!hotel)return null;
  const out=Object.assign({},r,{hotel});
  const gri=metricScore(r);if(gri!=null)out.gri=gri;
  const reviews=asNum(pick(r,['reviews','reviewCount','totalReviews']));if(reviews!=null)out.reviews=reviews;
  const reviewsDelta=asNum(pick(r,['reviewsDelta','reviewDelta','reviewsChange']));if(reviewsDelta!=null)out.reviewsDelta=reviewsDelta;
  const griDelta=asNum(pick(r,['griDelta','delta','griChange']));if(griDelta!=null)out.griDelta=griDelta;
  const griGoal=asNum(pick(r,['griGoal','goal','target','meta']));if(griGoal!=null)out.griGoal=griGoal;
  const mgmtResp=asNum(pick(r,['mgmtResp','managementResponse','responseRate']));if(mgmtResp!=null)out.mgmtResp=mgmtResp;
  if(!out.period)out.period=pick(r,['period','dateRange','range','weekLabel','week'])||out.period;
  if(!out.week)out.week=pick(r,['week','weekLabel','period','dateRange'])||out.week;
  if(!out.depts)out.depts=pick(r,['depts','departments'])||out.depts;
  if(!out.srcList)out.srcList=pick(r,['srcList','sources','platforms'])||out.srcList;
  if(!out.negCats)out.negCats=pick(r,['negCats','negativeCategories'])||out.negCats;
  if(!out.posCats)out.posCats=pick(r,['posCats','positiveCategories'])||out.posCats;
  return out;
}
function flattenReports(value,hotelFallback='',out=[]){
  if(Array.isArray(value)){value.forEach(v=>flattenReports(v,hotelFallback,out));return out;}
  const o=obj(value);if(!o)return out;
  const hotel=hotelOf(o,hotelFallback);
  if(hasMetric(o)){const rec=normalizeRecord(o,hotel);if(rec)out.push(rec);}
  const nestedKeys=['reports','entries','records','weeks','periods','data','items','results','summaries'];
  nestedKeys.forEach(k=>{if(o[k]!=null&&o[k]!==value)flattenReports(o[k],hotel,out);});
  return out;
}
function groupRows(rows){
  const out={};rows.forEach(row=>{const hotel=hotelOf(row);if(!hotel)return;const key=keyOf(hotel);if(!key)return;if(!out[key])out[key]=[];out[key].push(row);});return out;
}
function validStore(store){
  if(!store||typeof store!=='object'||Array.isArray(store))return false;
  const rows=Object.values(store).flatMap(v=>Array.isArray(v)?v:[v]).filter(Boolean);
  return rows.length>0&&rows.some(r=>obj(r)&&hasMetric(r));
}
function normalizeStoreCandidate(candidate){
  if(!candidate)return null;
  if(Array.isArray(candidate)){
    const rows=flattenReports(candidate);return rows.length?groupRows(rows):null;
  }
  const c=obj(candidate);if(!c)return null;
  const direct=[];
  Object.entries(c).forEach(([k,v])=>{
    const arr=Array.isArray(v)?v:[v];arr.forEach(item=>{
      const r=obj(item);if(!r)return;
      if(hasMetric(r)){const n=normalizeRecord(r,hotelOf(r,k));if(n)direct.push(n);}
      else flattenReports(r,hotelOf(r,k),direct);
    });
  });
  return direct.length?groupRows(direct):null;
}
function extractStore(json){
  if(!json||typeof json!=='object')throw Error('JSON inválido.');
  const candidates=[json.REP_STORE,json.reputationStore,json.reputation?.REP_STORE,json.payload?.REP_STORE,json.data?.REP_STORE,json.reputation,json.reports,json.data,json.payload,json];
  for(const c of candidates){const normalized=normalizeStoreCandidate(c);if(validStore(normalized))return normalized;}
  throw Error('O JSON não contém métricas de Reputação reconhecíveis. Os dados atuais foram mantidos.');
}
function countRecords(store){return Object.values(store).reduce((sum,v)=>sum+(Array.isArray(v)?v.length:(v?1:0)),0);}
function mergeStore(target,incoming){
  const staged={};Object.entries(incoming).forEach(([k,v])=>{staged[k]=Array.isArray(v)?v:[v];});
  if(!validStore(staged))throw Error('O JSON não contém registos válidos de Reputação. Os dados atuais foram mantidos.');
  Object.entries(staged).forEach(([k,rows])=>{
    if(!Array.isArray(target[k]))target[k]=[];
    rows.forEach(row=>{
      const period=String(row.period||row.week||'');
      const i=target[k].findIndex(x=>String(x?.period||x?.week||'')===period&&period);
      if(i>=0)target[k][i]=row;else target[k].push(row);
    });
  });
}
async function importJson(file,status,btn){
  status.textContent='A importar Reputação…';btn.disabled=true;
  const before=typeof window.vgDataCenterCapture==='function'?window.vgDataCenterCapture('reputation'):null;
  try{
    const incoming=extractStore(JSON.parse(await file.text()));
    const target=window.VG?.reputationStore;
    if(!target||typeof target!=='object')throw Error('Módulo de Reputação ainda não disponível.');
    mergeStore(target,incoming);
    try{window.rtNormalizeStore?.();}catch(e){console.warn('Normalização de reputação:',e);}
    window.dispatchEvent(new CustomEvent('vg-reputation-data-changed'));
    const hotels=Object.keys(target).length,records=countRecords(target);
    status.textContent=`Importação concluída · ${hotels} hotéis · ${records} períodos.`;
    window.showToast?.(`Reputação importada — ${hotels} hotéis, ${records} períodos`);
    if(typeof window.vgDataCenterRecord==='function')window.vgDataCenterRecord({source:'reputation',fileName:file.name,fileSize:file.size||0,scope:`${hotels} hotéis`,before,metrics:{hotels,records},summary:'Importação JSON de reputação'});
  }catch(e){const msg=e?.message||String(e);status.textContent=msg;window.showToast?.(msg,true);}
  finally{btn.disabled=false;}
}
function findPdfButton(){return [...document.querySelectorAll('button')].find(b=>{const t=norm(b.textContent);return t.includes('CARREGAR')&&t.includes('PDF')&&t.includes('REPUTA');})||null;}
function inject(){
  if(document.getElementById('repJsonUploadCenter'))return true;
  const pdfBtn=findPdfButton();if(!pdfBtn)return false;ensureStyle();
  const box=document.createElement('span');box.className='rep-json-upload-v52';box.id='repJsonUploadCenter';box.innerHTML='<button type="button" id="repJsonUploadBtn">Carregar JSON</button><input id="repJsonUploadInput" type="file" accept=".json,application/json" hidden>';
  const input=box.querySelector('#repJsonUploadInput'),btn=box.querySelector('#repJsonUploadBtn');const status=document.createElement('small');status.className='rep-json-status-v52';status.id='repJsonUploadStatus';
  btn.addEventListener('click',()=>input.click());input.addEventListener('change',()=>{const f=input.files?.[0];input.value='';if(f)importJson(f,status,btn);});pdfBtn.insertAdjacentElement('afterend',box);(pdfBtn.parentElement||box.parentElement)?.appendChild(status);return true;
}
function init(){ensureStyle();inject();let tries=0;const timer=setInterval(()=>{tries++;if(inject()||tries>60)clearInterval(timer);},250);const obs=new MutationObserver(()=>inject());obs.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
