(function(){
  'use strict';
  if(window.__VG_EARLY_LOGIN_V36__)return;
  window.__VG_EARLY_LOGIN_V36__=true;
  function fire(){
    if(typeof window.vgAuthLogin==='function')return window.vgAuthLogin();
    return false;
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
})();
