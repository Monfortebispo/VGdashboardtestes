(function(){
'use strict';
if(window.__VG_DYNAMIC_MENU_PERMISSIONS_V36__) return;
window.__VG_DYNAMIC_MENU_PERMISSIONS_V36__=true;

function normRole(v){
  return String(v||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
}

function isDirectionRole(v){
  const role=normRole(v);
  return role==='direcao'||role==='admin'||role==='direcao de operacoes'||role==='diretor de operacoes'||role==='director de operacoes';
}

function isDirectionUser(){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  if(isDirectionRole(u.role)) return true;
  try{
    const hs=window.vgAuthHotels?.();
    return Array.isArray(hs)&&hs.includes('*');
  }catch(e){
    return false;
  }
}

function installCurrentUserNormalizer(){
  const original=window.vgAuthCurrent;
  if(typeof original!=='function'||original.__vgDirectionNormalized) return;
  const wrapped=function(){
    const u=original.apply(this,arguments);
    if(!u||!isDirectionRole(u.role)) return u;
    if(String(u.role||'').toLowerCase()==='direcao') return u;
    return Object.assign({},u,{role:'direcao'});
  };
  wrapped.__vgDirectionNormalized=true;
  wrapped.__vgOriginal=original;
  window.vgAuthCurrent=wrapped;
}

function moduleAllowed(id){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  if(isDirectionUser()) return true;
  if(typeof window.vgAuthCanAccessModule==='function') return window.vgAuthCanAccessModule(id)===true;
  return Array.isArray(u.modules)&&u.modules.includes(id);
}

function ensureCityLedgerActions(){
  if(!isDirectionUser()) return;
  const root=document.getElementById('cityLedgerRoot');
  if(!root) return;
  const actions=root.querySelector('.cl-head-actions');
  if(!actions) return;
  if(!actions.querySelector('[data-cl-templates]')){
    const b=document.createElement('button');
    b.type='button';
    b.className='cl-secondary';
    b.dataset.clTemplates='';
    b.textContent='Templates de email';
    actions.appendChild(b);
  }
  if(!actions.querySelector('[data-cl-import]')){
    const b=document.createElement('button');
    b.type='button';
    b.className='cl-primary';
    b.dataset.clImport='';
    b.textContent='Importar Excel';
    actions.appendChild(b);
  }
}

function syncDynamicMenus(){
  document.querySelectorAll('.sb-nav-btn[id^="nav-"]').forEach(function(el){
    const id=el.id.slice(4);
    const ok=moduleAllowed(id);
    if(ok){
      delete el.dataset.vgAccessHidden;
      el.style.display='';
    }else{
      el.dataset.vgAccessHidden='1';
      el.style.display='none';
    }
  });
  document.querySelectorAll('.sb-nav-group').forEach(function(group){
    const visible=[...group.querySelectorAll('.sb-nav-btn')].some(function(btn){return btn.style.display!=='none';});
    group.style.display=visible?'':'none';
  });
  ensureCityLedgerActions();
}

function installCityLedgerDelegation(){
  if(window.__VG_CITYLEDGER_DELEGATION_V40__) return;
  window.__VG_CITYLEDGER_DELEGATION_V40__=true;
  document.addEventListener('click',function(e){
    const importBtn=e.target.closest?.('#cityLedgerRoot [data-cl-import]');
    if(importBtn&&isDirectionUser()){
      const input=document.querySelector('#cityLedgerRoot #clFileInput');
      if(input){
        e.preventDefault();
        e.stopImmediatePropagation();
        input.click();
      }
      return;
    }
    const templateBtn=e.target.closest?.('#cityLedgerRoot [data-cl-templates]');
    if(templateBtn&&isDirectionUser()&&typeof window.VG?.cityLedger?.openTemplateEditor==='function'){
      e.preventDefault();
      e.stopImmediatePropagation();
      window.VG.cityLedger.openTemplateEditor();
    }
  },true);
}

function installCityLedgerActionWatcher(){
  if(window.__VG_CITYLEDGER_ACTION_WATCHER_V40__) return;
  window.__VG_CITYLEDGER_ACTION_WATCHER_V40__=true;
  let scheduled=false;
  const schedule=function(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      ensureCityLedgerActions();
    });
  };
  const observer=new MutationObserver(function(mutations){
    if(mutations.some(function(m){
      return m.type==='childList'&&[...m.addedNodes].some(function(n){
        return n.nodeType===1&&(n.id==='cityLedgerRoot'||n.querySelector?.('#cityLedgerRoot')||n.classList?.contains('cl-head-actions')||n.querySelector?.('.cl-head-actions'));
      });
    })) schedule();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  schedule();
}

async function refreshCityLedgerSnapshot(snapshotId,attempt){
  const cl=window.VG?.cityLedger;
  if(!cl||!snapshotId) return;
  attempt=attempt||0;
  try{
    await cl.loadSnapshots(true);
    const snap=cl.state.snapshots.find(function(x){return x.id===snapshotId;});
    if(!snap){
      if(attempt<4) setTimeout(function(){refreshCityLedgerSnapshot(snapshotId,attempt+1);},[500,1000,1800,3000,4500][attempt]||4500);
      return;
    }
    cl.state.snapshot=snap;
    cl.state.rows=[];
    cl.state.loadedSnapshot='';
    await cl.loadRows(true,snapshotId);
    await cl.loadDiligences(true);
    await cl.render();
    ensureCityLedgerActions();
  }catch(e){
    if(attempt<4) setTimeout(function(){refreshCityLedgerSnapshot(snapshotId,attempt+1);},[500,1000,1800,3000,4500][attempt]||4500);
  }
}

function installCityLedgerRefreshBridge(){
  if(window.__VG_CITYLEDGER_REFRESH_BRIDGE_V40__) return;
  window.__VG_CITYLEDGER_REFRESH_BRIDGE_V40__=true;
  const bind=function(){
    if(!window.VG?.events?.on) return false;
    window.VG.events.on('cityledger:changed',function(payload){
      const id=payload?.snapshotId;
      if(id) setTimeout(function(){refreshCityLedgerSnapshot(id,0);},250);
    });
    return true;
  };
  if(!bind()){
    let tries=0;
    const t=setInterval(function(){
      tries++;
      if(bind()||tries>20) clearInterval(t);
    },250);
  }
}

function install(){
  installCurrentUserNormalizer();
  const original=window.vgAuthApplyMenuPermissions;
  if(typeof original==='function'&&!original.__vgDynamicMenuWrapped){
    const wrapped=function(){
      installCurrentUserNormalizer();
      const out=original.apply(this,arguments);
      syncDynamicMenus();
      return out;
    };
    wrapped.__vgDynamicMenuWrapped=true;
    window.vgAuthApplyMenuPermissions=wrapped;
  }
  installCityLedgerDelegation();
  installCityLedgerActionWatcher();
  installCityLedgerRefreshBridge();
  syncDynamicMenus();
}

window.vgSyncDynamicMenus=syncDynamicMenus;
window.vgEnsureCityLedgerActions=ensureCityLedgerActions;
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0);},{once:true});
}else{
  setTimeout(install,0);
}
})();
