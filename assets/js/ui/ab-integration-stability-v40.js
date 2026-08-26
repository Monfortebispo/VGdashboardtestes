(function(){
  'use strict';
  if(window.__VG_AB_INTEGRATION_STABILITY_V41__)return;
  window.__VG_AB_INTEGRATION_STABILITY_V41__=true;

  let observedRoot=null;
  let observer=null;
  let retryTimer=null;

  function mount(){return document.getElementById('ab35NativeMount');}
  function moduleRef(){return window.VG&&window.VG.comprasNative35;}
  function root(){try{return moduleRef()?.getRoot?.()||window.AB35Root||null;}catch(e){return null;}}
  function inAB(){return location.hash.replace(/^#/,'')==='ab'||!!mount();}

  function installStyle(r){
    let old=r.getElementById&&r.getElementById('vgAbEmbeddedStyleStable');
    if(old)old.remove();
    let oldNav=r.getElementById&&r.getElementById('vgAbEmbeddedNav');
    if(oldNav)oldNav.remove();
    let bridge=r.getElementById&&r.getElementById('vgAbDispatchBridge');
    if(bridge)bridge.remove();
    if(r.getElementById&&r.getElementById('vgAbNativeWrappedStyle'))return;

    const style=document.createElement('style');
    style.id='vgAbNativeWrappedStyle';
    style.textContent=`
      :host{display:block!important;max-width:100%!important;overflow:hidden!important}
      .ab35-shell{min-height:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:transparent!important;max-width:100%!important}
      .ab35-top{display:none!important}
      .ab35-scopebar{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto!important;gap:10px!important;padding:12px 16px!important;background:transparent!important}
      .ab35-filterbuttons{display:flex!important;gap:6px!important;flex-wrap:wrap!important}
      .ab35-filterbuttons .reg-btn{display:inline-flex!important;width:auto!important;margin:0!important;padding:6px 10px!important;white-space:nowrap!important}
      .ab35-nav{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:5px!important;overflow:visible!important;white-space:normal!important;width:100%!important;max-width:100%!important;padding:8px 12px!important;box-sizing:border-box!important}
      .ab35-nav .nav-btn{flex:0 0 auto!important;width:auto!important;max-width:100%!important;white-space:nowrap!important;padding:6px 9px!important;font-size:10px!important;margin:0!important}
      .ab35-nav .ab35-nav-section{flex:0 0 100%!important;font-size:8px!important;line-height:1.2!important;margin:3px 0 0!important;opacity:.62!important}
      #navCarregar,#navSetup,#adminCap{display:none!important}
      #main{padding:14px 16px!important;min-height:0!important;width:100%!important;max-width:100%!important;overflow:visible!important;box-sizing:border-box!important}
      .view,.panel,.cards,.grid2,.tbl-wrap{max-width:100%!important;box-sizing:border-box!important}
      .view{overflow:hidden!important}
      @media(max-width:900px){.ab35-scopebar{grid-template-columns:1fr!important}.ab35-nav .nav-btn{font-size:9px!important;padding:5px 7px!important}}
    `;
    r.appendChild(style);
  }

  function isolateNativeButtons(r){
    r.querySelectorAll('.ab35-nav .nav-btn[data-view]').forEach(function(btn){
      if(btn.dataset.vgNativeIsolated==='1')return;
      btn.dataset.vgNativeIsolated='1';
      // O onclick original do botão continua a executar. Apenas impedimos que o clique
      // atravesse o ShadowRoot e seja interpretado como navegação da dashboard principal.
      btn.addEventListener('click',function(event){event.stopPropagation();},true);
    });
  }

  function integrate(){
    if(!inAB())return false;
    const r=root();
    if(!r||!r.querySelector)return false;
    try{
      installStyle(r);
      isolateNativeButtons(r);
      const m=mount();if(m)m.dataset.vgAbIntegrated='native-wrapped-v41';
      watch(r);
      return true;
    }catch(err){console.warn('[VG A&B integration v41]',err);return false;}
  }

  function watch(r){
    if(observedRoot===r&&observer)return;
    if(observer)observer.disconnect();
    observedRoot=r;
    observer=new MutationObserver(function(mutations){
      if(!mutations.some(m=>m.type==='childList'))return;
      clearTimeout(retryTimer);
      retryTimer=setTimeout(integrate,80);
    });
    try{observer.observe(r,{childList:true,subtree:true});}catch(e){}
  }

  function burst(){[0,100,300,700,1400,3000].forEach(ms=>setTimeout(function(){
    if(!integrate()&&window.VG?.modernPreview?.repairAB&&ms>=700){
      try{void window.VG.modernPreview.repairAB().then(integrate);}catch(e){}
    }
  },ms));}

  document.addEventListener('click',function(e){if(e.target?.closest?.('#nav-ab'))burst();},false);
  window.addEventListener('hashchange',function(){if(inAB())burst();});
  window.addEventListener('vg-modern-preview-ready',burst);
  burst();
})();
