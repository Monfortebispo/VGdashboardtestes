(function(){
  'use strict';
  if(window.__VG_MODERN_PREVIEW_BOOTSTRAP__)return;
  window.__VG_MODERN_PREVIEW_BOOTSTRAP__=true;

  function api(){return window.VG&&window.VG.modernPreview;}
  function viewFromNav(el){
    const node=el&&el.closest&&el.closest('[id^="nav-"]');
    return node?String(node.id).replace(/^nav-/,''):'';
  }
  function showBadge(){
    if(document.getElementById('vgModernPreviewBadge'))return;
    const badge=document.createElement('div');
    badge.id='vgModernPreviewBadge';
    badge.textContent='TESTE · arquitetura moderna';
    badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;background:#111827;color:#fff;border:1px solid #64748b;border-radius:999px;padding:7px 11px;font:600 11px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:.92';
    document.body.appendChild(badge);
  }
  async function go(view){
    const modern=api();
    if(!modern||!modern.navigation)return false;
    try{await modern.navigation.go(view);return true;}
    catch(err){console.error('[VG modern preview] navigation failed',err);return false;}
  }
  function install(){
    if(!api())return false;
    showBadge();
    document.addEventListener('click',function(event){
      const view=viewFromNav(event.target);
      if(!view)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void go(view);
    },true);
    window.VG.modernPreview.enabled=true;
    console.info('[VG modern preview] enabled',window.VG.modernPreview.architecture);
    return true;
  }

  if(!install()){
    window.addEventListener('vg-modern-preview-ready',install,{once:true});
    let tries=0;
    const timer=setInterval(function(){
      tries++;
      if(install()||tries>80)clearInterval(timer);
    },100);
  }
})();
