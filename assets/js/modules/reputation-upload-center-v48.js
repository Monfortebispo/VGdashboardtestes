// VG Operations — Reputação: importação JSON no Carregar Documentos V48
(function(){
'use strict';
if(window.__VG_REPUTATION_UPLOAD_CENTER_V48__)return;
window.__VG_REPUTATION_UPLOAD_CENTER_V48__=true;

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function findText(text){return [...document.querySelectorAll('h1,h2,h3,h4,strong,b,span,div')].find(el=>norm(el.textContent)===norm(text))||null;}
function findCardByText(text){
  const el=findText(text);if(!el)return null;let n=el;
  for(let i=0;i<7&&n;i++,n=n.parentElement){
    const t=norm(n.textContent);
    if(t.includes(norm(text))&&n.getBoundingClientRect().width>220&&n.getBoundingClientRect().width<760)return n;
  }
  return null;
}
function ensureStyle(){
  if(document.getElementById('repJsonUploadCenterStyle'))return;
  const st=document.createElement('style');st.id='repJsonUploadCenterStyle';st.textContent=`
.rep-json-upload-v48{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}
.rep-json-upload-v48 .rep-json-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rep-json-upload-v48 button{border:1px solid #d2a92f;background:#d6b54a;color:#061425;border-radius:7px;padding:9px 12px;font-weight:700;cursor:pointer}
.rep-json-upload-v48 button:disabled{opacity:.55;cursor:wait}
.rep-json-upload-v48 .rep-json-help{margin:0 0 8px!important;padding:0!important;border:0!important;font-size:11px!important;line-height:1.45!important;color:#90a9c1!important}
.rep-json-upload-v48 small{display:block;margin-top:8px;color:#90a9c1;min-height:16px;font-size:10px}`;
  document.head.appendChild(st);
}
function extractStore(json){
  if(!json||typeof json!=='object'||Array.isArray(json))throw Error('JSON inválido.');
  const candidates=[json.REP_STORE,json.reputationStore,json.reputation,json.payload?.REP_STORE,json.data?.REP_STORE];
  const store=candidates.find(v=>v&&typeof v==='object'&&!Array.isArray(v)) || (Object.values(json).some(v=>Array.isArray(v))?json:null);
  if(!store||typeof store!=='object'||Array.isArray(store))throw Error('O ficheiro não contém dados de Reputação reconhecíveis.');
  const entries=Object.entries(store).filter(([,v])=>Array.isArray(v)||v&&typeof v==='object');
  if(!entries.length)throw Error('O ficheiro de Reputação está vazio.');
  return Object.fromEntries(entries);
}
function countRecords(store){return Object.values(store).reduce((sum,v)=>sum+(Array.isArray(v)?v.length:(v?1:0)),0);}
async function importJson(file,status,btn){
  status.textContent='A importar Reputação…';btn.disabled=true;
  const before=typeof window.vgDataCenterCapture==='function'?window.vgDataCenterCapture('reputation'):null;
  try{
    const json=JSON.parse(await file.text());
    const incoming=extractStore(json);
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
    if(typeof window.vgDataCenterRecord==='function')window.vgDataCenterRecord({
      source:'reputation',fileName:file.name,fileSize:file.size||0,scope:`${hotels} hotéis`,before,
      metrics:{hotels,records},summary:'Importação JSON de reputação'
    });
  }catch(e){
    const msg=e?.message||String(e);status.textContent=msg;window.showToast?.(msg,true);
    if(typeof window.vgDataCenterRecordFailure==='function')window.vgDataCenterRecordFailure({source:'reputation',fileName:file.name,fileSize:file.size||0,summary:'Falha na importação JSON de reputação',warnings:[msg]});
  }finally{btn.disabled=false;}
}
function buildJsonControl(){
  const box=document.createElement('div');box.className='rep-json-upload-v48';box.id='repJsonUploadCenter';
  box.innerHTML=`<p class="rep-json-help">Importar dados de Reputação em JSON. Aceita o JSON completo da dashboard com <code>REP_STORE</code> ou um ficheiro contendo apenas o objeto de Reputação.</p><div class="rep-json-row"><button type="button" id="repJsonUploadBtn">Carregar JSON de Reputação</button><input id="repJsonUploadInput" type="file" accept=".json,application/json" hidden></div><small id="repJsonUploadStatus"></small>`;
  const input=box.querySelector('#repJsonUploadInput'),btn=box.querySelector('#repJsonUploadBtn'),status=box.querySelector('#repJsonUploadStatus');
  btn.addEventListener('click',()=>input.click());
  input.addEventListener('change',()=>{const f=input.files?.[0];input.value='';if(f)importJson(f,status,btn);});
  return box;
}
function inject(){
  if(document.getElementById('repJsonUploadCenter'))return true;
  const card=findCardByText('Reputação — ReviewPro')||findCardByText('Reputação')||findCardByText('ReviewPro');
  if(!card)return false;ensureStyle();card.appendChild(buildJsonControl());return true;
}
function init(){ensureStyle();inject();const obs=new MutationObserver(()=>inject());obs.observe(document.body,{childList:true,subtree:true});document.addEventListener('click',()=>setTimeout(inject,60),true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
