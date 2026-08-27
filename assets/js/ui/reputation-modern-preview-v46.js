(function(){
  'use strict';
  if(window.__VG_REPUTATION_MODERN_PREVIEW_V46__)return;
  window.__VG_REPUTATION_MODERN_PREVIEW_V46__=true;

  // Mantemos este ficheiro apenas como marcador de compatibilidade do build.
  // A Reputação não é intercetada enquanto a implementação moderna não tiver
  // paridade funcional total com a vista completa existente.
  window.addEventListener('vg-modern-preview-ready',function(){
    const btn=document.getElementById('nav-reputacao');
    if(btn)btn.title='Reputação — vista completa ativa';
  });
})();
