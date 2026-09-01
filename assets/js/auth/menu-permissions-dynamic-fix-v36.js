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

function installCurrentUserNormalizer(){
  const original=window.vgAuthCurrent;
  if(typeof original!=='function'||original.__vgDirectionNormalized) return;
  const wrapped=function(){
    const u=original.apply(this,arguments);
    if(!u||!isDirectionRole(u.role)||String(u.role||'').toLowerCase()==='direcao') return u;
    return Object.assign({},u,{role:'direcao'});
  };
  wrapped.__vgDirectionNormalized=true;
  wrapped.__vgOriginal=original;
  window.vgAuthCurrent=wrapped;
}

function moduleAllowed(id){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  if(isDirectionRole(u.role)) return true;
  if(typeof window.vgAuthCanAccessModule==='function') return window.vgAuthCanAccessModule(id)===true;
  return Array.isArray(u.modules)&&u.modules.includes(id);
}

function syncCityLedgerDirectionActions(){
  const root=document.getElementById('cityLedgerRoot');
  if(!root) return;
  const u=window.vgAuthCurrent?.();
  if(!u||!isDirectionRole(u.role)) return;
  root.querySelectorAll('[data-cl-import],[data-cl-templates]').forEach(function(el){
    el.hidden=false;
    el.disabled=false;
    el.removeAttribute('aria-hidden');
    el.style.removeProperty('display');
    el.style.removeProperty('visibility');
    el.style.removeProperty('opacity');
  });
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
  syncCityLedgerDirectionActions();
}

function installCityLedgerObserver(){
  if(window.__VG_CITYLEDGER_DIRECTION_OBSERVER__) return;
  window.__VG_CITYLEDGER_DIRECTION_OBSERVER__=true;
  const observer=new MutationObserver(function(mutations){
    if(!mutations.some(function(m){
      return m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length);
    })) return;
    syncCityLedgerDirectionActions();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

function install(){
  installCurrentUserNormalizer();
  const original=window.vgAuthApplyMenuPermissions;
  if(typeof original==='function'&&!original.__vgDynamicMenuWrapped){
    const wrapped=function(){
      const out=original.apply(this,arguments);
      installCurrentUserNormalizer();
      syncDynamicMenus();
      return out;
    };
    wrapped.__vgDynamicMenuWrapped=true;
    window.vgAuthApplyMenuPermissions=wrapped;
  }
  installCityLedgerObserver();
  syncDynamicMenus();
}

window.vgSyncDynamicMenus=syncDynamicMenus;
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0);},{once:true});
}else{
  setTimeout(install,0);
}
})();
