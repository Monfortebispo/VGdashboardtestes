(function(){
  'use strict';
  if(window.__VG_REPUTATION_MODERN_PREVIEW_V46__)return;
  window.__VG_REPUTATION_MODERN_PREVIEW_V46__=true;

  async function go(){
    const nav=window.VG?.modernPreview?.navigation;
    if(!nav?.go)return false;
    try{await nav.go('reputacao');return true;}catch(err){console.error('[VG reputation modern]',err);return false;}
  }

  document.addEventListener('click',function(event){
    const target=event.target;
    const nav=target&&target.closest&&target.closest('#nav-reputacao,[data-view="reputacao"]');
    if(!nav)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void go();
  },true);

  window.addEventListener('vg-modern-preview-ready',function(){
    const btn=document.getElementById('nav-reputacao');
    if(btn)btn.title='Reputação — módulo moderno em validação';
  });
})();
