// VG Operations — Reputação: importação JSON no Carregar Documentos V51
(function(){
'use strict';
if(window.__VG_REPUTATION_UPLOAD_CENTER_V51__)return;
window.__VG_REPUTATION_UPLOAD_CENTER_V51__=true;

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function ensureStyle(){
  if(document.getElementById('repJsonUploadCenterStyle'))return;
  const st=document.createElement('style');st.id='repJsonUploadCenterStyle';st.textContent=`
.rep-json-upload-v51{display:inline-flex;align-items:center;margin-left:8px}.rep-json-upload-v51 button{border:1px solid #d2a92f;background:transparent;color:#e3bf4d;border-radius:7px;padding:9px 12px;font-weight:700;cursor:pointer}.rep-json-upload-v51 button:hover{background:rgba(214,181,74,.1)}.rep-json-upload-v51 button:disabled{opacity:.55;cursor:wait}.rep-json-status-v51{display:block;margin-top:7px;color:#90a9c1;font-size:10px}`;
  document.head.appendChild(st);
}
function isReport(row){return !!row&&typeof row==='object'&&!Array.isArray(row)&&!!String(row.hotel||row.hotelName||row.property||row.unit||'').trim();}
function reportHotel(row){return String(row.hotel||row.hotelName||row.property||row.unit||'').trim();}
function groupReports(rows){
  const out={};
  (rows||[]).filter(isReport).forEach(row=>{const hotel=reportHotel(row);const key=hotel.toLowerCase().replace(/[^a-z0-9\u00c0-\u017e\s]/gi,'').replace(/\s+/g,' ').trim();if(!out[key])out[key]=[];out[key].push(Object.assign({},row,{hotel}));});
  return out;
}
function looksLikeRepStore(store){
  if(!store||typeof store!=='object'||Array.isArray(store))return false;
  const rows=Object.values(store).flatMap(v=>Array.isArray(v)?v:[v]).filter(Boolean);
  return rows.length>0&&rows.some(r=>r&&typeof r==='object'&&(r.hotel||r.gri!=null||r.week||r.period));
}
function extractStore(json){
  if(!json||typeof json!=='object'||Array.isArray(json))throw Error('JSON inválido.');
  const reportArrays=[json.reports,json.reputation?.reports,json.data?.reports,json.payload?.reports].filter(Array.isArray);
  for(const reports of reportArrays){const grouped=groupReports(reports);if(looksLikeRepStore(grouped))return grouped;}
  const candidates=[json.REP_STORE,json.reputationStore,json.reputation?.REP_STORE,json.reputationStore?.REP_STORE,json.payload?.REP_STORE,json.data?.REP_STORE,json.reputation];
  for(const candidate of candidates){
    if(candidate&&typeof candidate==='object'&&!Array.isArray(candidate)){
      if(Array.isArray(candidate.reports)){const grouped=groupReports(candidate.reports);if(looksLikeRepStore(grouped))return grouped;}
      if(looksLikeRepStore(candidate))return candidate;
    }
  }
  if(looksLikeRepStore(json))return json;
  throw Error('O ficheiro não contém dados de Reputação reconhecíveis.');
}
function countRecords(store){return Object.values(store).reduce((sum,v)=>sum+(Array.isArray(v)?v.length:(v?1:0)),0);}
function replaceStore(target,incoming){
  const staged={};Object.entries(incoming).forEach(([k,v])=>{staged[k]=Array.isArray(v)?v:[v];});
  if(!looksLikeRepStore(staged))throw Error('O JSON não contém registos válidos de Reputação. Os dados atuais foram mantidos.');
  Object.keys(target).forEach(k=>delete target[k]);Object.assign(target,staged);
}
function recoverReportsShape(){
  const target=window.VG?.reputationStore;if(!target||!Array.isArray(target.reports))return false;
  const recovered=groupReports(target.reports);if(!looksLikeRepStore(recovered))return false;
  replaceStore(target,recovered);try{window.rtNormalizeStore?.();}catch(e){}window.dispatchEvent(new CustomEvent('vg-reputation-data-changed'));return true;
}
async function importJson(file,status,btn){
  status.textContent='A importar Reputação…';btn.disabled=true;
  const before=typeof window.vgDataCenterCapture==='function'?window.vgDataCenterCapture('reputation'):null;
  try{
    const incoming=extractStore(JSON.parse(await file.text()));
    const target=window.VG?.reputationStore;
    if(!target||typeof target!=='object')throw Error('Módulo de Reputação ainda não disponível.');
    replaceStore(target,incoming);
    try{window.rtNormalizeStore?.();}catch(e){console.warn('Normalização de reputação:',e);}
    window.dispatchEvent(new CustomEvent('vg-reputation-data-changed'));
    try{window.rtRender?.();}catch(e){}
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
  const box=document.createElement('span');box.className='rep-json-upload-v51';box.id='repJsonUploadCenter';box.innerHTML='<button type="button" id="repJsonUploadBtn">Carregar JSON</button><input id="repJsonUploadInput" type="file" accept=".json,application/json" hidden>';
  const input=box.querySelector('#repJsonUploadInput'),btn=box.querySelector('#repJsonUploadBtn');const status=document.createElement('small');status.className='rep-json-status-v51';status.id='repJsonUploadStatus';
  btn.addEventListener('click',()=>input.click());input.addEventListener('change',()=>{const f=input.files?.[0];input.value='';if(f)importJson(f,status,btn);});pdfBtn.insertAdjacentElement('afterend',box);(pdfBtn.parentElement||box.parentElement)?.appendChild(status);return true;
}
function init(){ensureStyle();recoverReportsShape();inject();let tries=0;const timer=setInterval(()=>{tries++;recoverReportsShape();if(inject()||tries>60)clearInterval(timer);},250);const obs=new MutationObserver(()=>inject());obs.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
