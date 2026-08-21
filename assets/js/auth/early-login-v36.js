(function(){
  'use strict';
  if(window.__VG_EARLY_LOGIN_V36__)return;
  window.__VG_EARLY_LOGIN_V36__=true;

  function fire(){
    if(typeof window.vgAuthLogin==='function')return window.vgAuthLogin();
    return false;
  }

  function loadScript(src,key){
    if(document.querySelector('script[data-vg-module="'+key+'"]'))return;
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.dataset.vgModule=key;
    document.head.appendChild(s);
  }

  function loadCentralIntegration(){
    loadScript('assets/js/auth/menu-permissions-dynamic-fix-v36.js','dynamic-menu-permissions');
    loadScript('assets/js/auth/operations-modules-catalog-v36.js','operations-modules-catalog');
  }

  document.addEventListener('click',function(e){
    const b=e.target&&e.target.closest&&e.target.closest('#vgLoginBtn');
    if(!b)return;
    if(typeof window.vgAuthLogin!=='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    fire();
  },true);

  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter')return;
    const t=e.target;
    if(!t||t.id!=='vgLoginPass')return;
    if(typeof window.vgAuthLogin!=='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    fire();
  },true);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(loadCentralIntegration,0);},{once:true});
  }else{
    setTimeout(loadCentralIntegration,0);
  }
})();