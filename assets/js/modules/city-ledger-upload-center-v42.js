// VG Operations — City Ledger: carregamento no Centro de Documentos V42
(function(){
'use strict';
if(window.__VG_CITY_LEDGER_UPLOAD_CENTER_V42__)return;
window.__VG_CITY_LEDGER_UPLOAD_CENTER_V42__=true;

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function findText(text){return [...document.querySelectorAll('h1,h2,h3,h4,strong,b,span,div')].find(el=>norm(el.textContent)===norm(text))||null;}
function findCardByText(text){
  const el=findText(text);if(!el)return null;let n=el;
  for(let i=0;i<7&&n;i++,n=n.parentElement){const t=norm(n.textContent);if(t.includes(norm(text))&&n.querySelector('button')&&n.getBoundingClientRect().width>220&&n.getBoundingClientRect().width<700)return n;}
  return null;
}
function ensureStyle(){if(document.getElementById('clUploadCenterStyle'))return;const st=document.createElement('style');st.id='clUploadCenterStyle';st.textContent=`
.cl-upload-card-v42{border:1px solid #24415f;border-radius:14px;background:#10243d;padding:18px;min-height:240px;box-sizing:border-box;color:#e9f3ff}.cl-upload-card-v42 h3{margin:0 0 4px;font-size:16px}.cl-upload-card-v42 .eyebrow{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7796b8}.cl-upload-card-v42 p{font-size:12px;line-height:1.55;color:#b8cce0;border-left:2px solid #d6ad35;padding-left:12px;margin:24px 0 10px}.cl-upload-card-v42 .fmt{font:11px monospace;color:#718ead;margin:0 0 22px}.cl-upload-card-v42 button{border:1px solid #d2a92f;background:#d6b54a;color:#061425;border-radius:7px;padding:10px 13px;font-weight:700;cursor:pointer}.cl-upload-card-v42 small{display:block;margin-top:12px;color:#90a9c1;min-height:18px}`;document.head.appendChild(st);}
function buildCard(){
  const card=document.createElement('div');card.className='cl-upload-card-v42';card.id='clCityLedgerUploadCard';card.innerHTML=`<h3>🏦 City Ledger — Cobranças</h3><div class="eyebrow">AGING · ENTIDADES · FATURAS · DILIGÊNCIAS</div><p>Ficheiro Excel do City Ledger. A importação atualiza o snapshot partilhado, os saldos por hotel, as bandas de aging e o panorama de entidades devedoras.</p><div class="fmt">Formato: .xlsx · .xlsm · .xls</div><button type="button" id="clUploadCenterBtn">Carregar City Ledger</button><input id="clUploadCenterInput" type="file" accept=".xlsx,.xlsm,.xls" hidden><small id="clUploadCenterStatus"></small>`;
  const input=card.querySelector('#clUploadCenterInput'),btn=card.querySelector('#clUploadCenterBtn'),status=card.querySelector('#clUploadCenterStatus');
  btn.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{const f=input.files?.[0];input.value='';if(!f)return;status.textContent='A importar City Ledger…';btn.disabled=true;try{const mod=window.VG?.cityLedger;if(!mod?.importFile)throw Error('Módulo City Ledger ainda não disponível.');await mod.importFile(f);status.textContent='Importação concluída.';window.showToast?.('City Ledger importado com sucesso.');}catch(e){status.textContent=e.message||String(e);window.showToast?.(status.textContent,true);}finally{btn.disabled=false;}});
  return card;
}
function injectCard(){
  if(document.getElementById('clCityLedgerUploadCard'))return true;
  const sample=findCardByText('Extrato de Compras')||findCardByText('P&L — Dados Operacionais')||findCardByText('Reputação — ReviewPro');if(!sample)return false;
  const grid=sample.parentElement;if(!grid)return false;ensureStyle();grid.appendChild(buildCard());return true;
}
function hideImportButton(){document.querySelectorAll('#cityLedgerRoot [data-cl-import]').forEach(b=>b.style.display='none');}
function tick(){hideImportButton();injectCard();}
function init(){ensureStyle();setInterval(tick,700);document.addEventListener('click',()=>setTimeout(tick,80),true);tick();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
