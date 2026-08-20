(function(){
'use strict';
if(window.__VG_DYNAMIC_MENU_PERMISSIONS_V36__) return;
window.__VG_DYNAMIC_MENU_PERMISSIONS_V36__=true;

function moduleAllowed(id){
  const u=window.vgAuthCurrent?.();
  if(!u) return false;
  const role=String(u.role||'').toLowerCase();
  if(role==='direcao'||role==='admin') return true;
  if(typeof window.vgAuthCanAccessModule==='function') return window.vgAuthCanAccessModule(id)===true;
  return Array.isArray(u.modules)&&u.modules.includes(id);
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
}

function install(){
  const original=window.vgAuthApplyMenuPermissions;
  if(typeof original==='function'&&!original.__vgDynamicMenuWrapped){
    const wrapped=function(){
      const out=original.apply(this,arguments);
      syncDynamicMenus();
      return out;
    };
    wrapped.__vgDynamicMenuWrapped=true;
    window.vgAuthApplyMenuPermissions=wrapped;
  }
  syncDynamicMenus();
}

window.vgSyncDynamicMenus=syncDynamicMenus;
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0);},{once:true});
}else{
  setTimeout(install,0);
}
})();
