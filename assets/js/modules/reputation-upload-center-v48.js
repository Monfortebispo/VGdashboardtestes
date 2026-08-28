// VG Operations — Reputação: importação JSON no Carregar Documentos V49
(function(){
'use strict';
if(window.__VG_REPUTATION_UPLOAD_CENTER_V49__)return;
window.__VG_REPUTATION_UPLOAD_CENTER_V49__=true;

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function reputationCard(){
  const heading=[...document.querySelectorAll('h1,h2,h3,h4,strong,b')].find(el=>{
    const t=norm(el.textContent);return t.includes('REPUTACAO')&&t.includes('REVIEWPRO');
  });
  if(!heading)return null;
  let n=heading;
  for(let i=0;i<8&&n;i++,n=n.parentElement){
    const t=norm(n.textContent);
    if(t.includes('REPUTACAO')&&t.includes('REVIEWPRO')&&n.querySelector('button'))return n;
  }
  return null;
}
function ensureStyle(){
  if(document.getElementById('repJsonUploadCenterStyle'))return;
  const st=document.createElement('style');st.id='repJsonUploadCenterStyle';st.textContent=`
.rep-json-upload-v49{display:inline-flex;align-items:center;gap:7px;margin-left:7px}.rep-json-upload-v49 button{border:1px solid #d2a92f;background:transparent;color:#e3bf4d;border-radius:7px;padding:9px 12px;font-weight:700;cursor:pointer}.rep-json-upload-v49 button:hover{background:rgba(214,181,74,.1)}.rep-json-upload-v49 button:disabled{opacity:.55;cursor:wait}.rep-json-status-v49{display:block;width:100%;margin-top:7px;color:#90a9c1;font-size:10px}`;
  document.head.appendChild(st);
}
function extractStore(json){
  if(!json||typeof json!=='object'||Array.isArray(json))throw Error('JSON inválido.');
  const candidates=[json.REP_STORE,json.reputationStore,json.reputation,json.payload?.REP_STORE,json.data?.REP_STORE];
  const store=candidates.find(v=>v&&typeof v==='object'&&!Array.isArray(v))||(Object.values(json).some(v=>Array.isArray(v))?json:null);
  if(!store||typeof store!=='object'||Array.isArray(store))throw Error('O ficheiro não contém dados de Reputação reconhecíveis.');
  const entries=Object.entries(store).filter(([,v])=>Array.isArray(v)||(v&&typeof v==='object'));
  if(!entries.length)throw Error('O ficheiro de Reputação está vazio.');
  return Object.fromEntries(entries);
}
function countRecords(store){return Object.values(store).reduce((sum,v)=>sum+(Array.isArray(v)?v.length:(v?1:0)),0);}
async function importJson(file,status,btn){
  status.textContent='A importar Reputação…';btn.disabled=true;
  const before=typeof window.vgDataCenterCapture==='function'?window.vgDataCenterCapture('reputation'):null;
  try{
    const incoming=extractStore(JSON.parse(await file.text()));
    const target=window.VG?.reputationStore;
    if(!target||typeof target!=='object')throw Error('Módulo de Reputação ainda não disponível.');
    Object.keys(target).forEach(k=>delete target[k]);
    Object.entries(incoming).forEach(([k,v])=>{target[k]=Array.isArray(v)?v:[v];});
    try{window.rtNormalizeStore?.();}catch(e){console.warn('Normalização de reputação:',e);}
    window.dispatchEvent(new CustomEvent('vg-reputation-data-changed'));
    try{window.rtRender?.();}catch(e){}
    const hotels=Object.keys(target).length,records=countRecords(target);
    status.textContent=`Importação concluída · ${hotels} hotéis · ${records} períodos.`;
    window.showToast?.(`Reputação importada — ${hotels} hotéis, ${records} períodos`);
    if(typeof window.vgDataCenterRecord==='function')window.vgDataCenterRecord({source:'reputation',fileName:file.name,fileSize:file.size||0,scope:`${hotels} hotéis`,before,metrics:{hotels,records},summary:'Importação JSON de reputação'});
  }catch(e){
    const msg=e?.message||String(e);status.textContent=msg;window.showToast?.(msg,true);
    if(typeof window.vgDataCenterRecordFailure==='function')window.vgDataCenterRecordFailure({source:'reputation',fileName:file.name,fileSize:file.size||0,summary:'Falha na importação JSON de reputação',warnings:[msg]});
  }finally{btn.disabled=false;}
}
function inject(){
  if(document.getElementById('repJsonUploadCenter'))return true;
  const card=reputationCard();if(!card)return false;
  const pdfBtn=[...card.querySelectorAll('button')].find(b=>norm(b.textContent).includes('CARREGAR PDF'))||card.querySelector('button');
  if(!pdfBtn)return false;
  ensureStyle();
  const box=document.createElement('span');box.className='rep-json-upload-v49';box.id='repJsonUploadCenter';
  box.innerHTML='<button type="button" id="repJsonUploadBtn">Carregar JSON</button><input id="repJsonUploadInput" type="file" accept=".json,application/json" hidden>';
  const status=document.createElement('small');status.className='rep-json-status-v49';status.id='repJsonUploadStatus';
  const input=box.querySelector('#repJsonUploadInput'),btn=box.querySelector('#repJsonUploadBtn');
  btn.addEventListener('click',()=>input.click());
  input.addEventListener('change',()=>{const f=input.files?.[0];input.value='';if(f)importJson(f,status,btn);});
  pdfBtn.insertAdjacentElement('afterend',box);
  const actionArea=pdfBtn.parentElement||card;actionArea.appendChild(status);
  return true;
}
function init(){ensureStyle();inject();const obs=new MutationObserver(()=>inject());obs.observe(document.body,{childList:true,subtree:true});document.addEventListener('click',()=>setTimeout(inject,80),true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
