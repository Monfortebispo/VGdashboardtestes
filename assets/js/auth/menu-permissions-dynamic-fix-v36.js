(function(){
'use strict';
if(window.__VG_DYNAMIC_MENU_PERMISSIONS_V41__) return;
window.__VG_DYNAMIC_MENU_PERMISSIONS_V41__=true;

function normRole(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
}
function isDirectionRole(v){
  const role=normRole(v);
  return role==='direcao'||role==='admin'||role==='direcao de operacoes'||role==='diretor de operacoes'||role==='director de operacoes';
}
function isDirectionUser(){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  if(isDirectionRole(u.role)) return true;
  try{const hs=window.vgAuthHotels?.();return Array.isArray(hs)&&hs.includes('*');}catch(e){return false;}
}
function moduleAllowed(id){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  if(isDirectionUser()) return true;
  if(typeof window.vgAuthCanAccessModule==='function') return window.vgAuthCanAccessModule(id)===true;
  return Array.isArray(u.modules)&&u.modules.includes(id);
}
function syncDynamicMenus(){
  document.querySelectorAll('.sb-nav-btn[id^="nav-"]').forEach(function(el){
    const ok=moduleAllowed(el.id.slice(4));
    if(ok){
      el.style.display='';
      delete el.dataset.vgAccessHidden;
    }else{
      el.style.display='none';
      el.dataset.vgAccessHidden='1';
    }
  });
  document.querySelectorAll('.sb-nav-group').forEach(function(group){
    group.style.display=[...group.querySelectorAll('.sb-nav-btn')].some(function(btn){return btn.style.display!=='none';})?'':'none';
  });
}

function setCityStatus(text,bad){
  const e=document.querySelector('#cityLedgerRoot #clStatus');
  if(e){e.textContent=text||'';e.classList.toggle('bad',!!bad);}
}
async function forceCityRefresh(){
  const cl=window.VG?.cityLedger;
  if(!cl) return;
  try{
    await cl.ensureLoaded(true);
    await cl.render();
  }catch(e){console.warn('City Ledger refresh falhou',e);}
  ensureCityLedgerActions();
}
async function runDirectImport(file){
  const cl=window.VG?.cityLedger;
  if(!cl||typeof cl.importFile!=='function'){
    setCityStatus('O módulo City Ledger ainda não terminou de carregar.',true);
    return;
  }
  try{
    setCityStatus('A importar '+file.name+'…');
    await cl.importFile(file);
    setCityStatus('Importação concluída. A atualizar o City Ledger…');
    await new Promise(function(r){setTimeout(r,700);});
    await forceCityRefresh();
    const snap=cl.state?.snapshot;
    const rows=cl.state?.rows||[];
    setCityStatus('City Ledger atualizado · '+rows.length.toLocaleString('pt-PT')+' documentos'+(snap?.snapshotDate?' · snapshot '+snap.snapshotDate:'')+'.');
  }catch(err){
    setCityStatus('Erro na importação: '+(err?.message||String(err)),true);
    window.showToast?.('Erro ao importar City Ledger: '+(err?.message||String(err)),true);
  }
}
function openDirectPicker(){
  if(!isDirectionUser()) return;
  const input=document.createElement('input');
  input.type='file';
  input.accept='.xlsm,.xlsx,.xls';
  input.style.display='none';
  document.body.appendChild(input);
  input.addEventListener('change',async function(){
    const f=input.files?.[0];
    input.remove();
    if(f) await runDirectImport(f);
  },{once:true});
  input.click();
}
function ensureCityLedgerActions(){
  if(!isDirectionUser()) return;
  const root=document.getElementById('cityLedgerRoot');
  const actions=root?.querySelector('.cl-head-actions');
  if(!actions) return;
  actions.style.display='flex';
  actions.style.flexWrap='wrap';
  actions.style.justifyContent='flex-end';
  actions.style.maxWidth='520px';

  let imp=actions.querySelector('[data-vg-direct-city-import]');
  if(!imp){
    imp=document.createElement('button');
    imp.type='button';
    imp.className='cl-primary';
    imp.dataset.vgDirectCityImport='1';
    imp.textContent='Importar Excel';
    imp.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openDirectPicker();});
  }
  const geo=actions.querySelector('em');
  if(geo&&imp.parentNode!==actions) actions.insertBefore(imp,geo.nextSibling);
  else if(geo&&imp.previousElementSibling!==geo) actions.insertBefore(imp,geo.nextSibling);
  else if(!imp.parentNode) actions.prepend(imp);

  const oldImport=actions.querySelector('[data-cl-import]');
  if(oldImport&&oldImport!==imp) oldImport.style.display='none';
}
function install(){
  const original=window.vgAuthApplyMenuPermissions;
  if(typeof original==='function'&&!original.__vgDynamicMenuWrappedV41){
    const wrapped=function(){const out=original.apply(this,arguments);syncDynamicMenus();ensureCityLedgerActions();return out;};
    wrapped.__vgDynamicMenuWrappedV41=true;
    window.vgAuthApplyMenuPermissions=wrapped;
  }
  syncDynamicMenus();
  ensureCityLedgerActions();
  setInterval(function(){
    if(document.getElementById('cityLedgerRoot')) ensureCityLedgerActions();
  },500);
}
window.vgSyncDynamicMenus=syncDynamicMenus;
window.vgEnsureCityLedgerActions=ensureCityLedgerActions;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0);},{once:true});
else setTimeout(install,0);
})();
