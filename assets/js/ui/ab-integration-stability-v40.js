(function(){
  'use strict';
  if(window.__VG_AB_INTEGRATION_STABILITY_V40__)return;
  window.__VG_AB_INTEGRATION_STABILITY_V40__=true;

  let rootObserver=null;
  let observedRoot=null;
  let docObserver=null;
  let retryTimer=null;
  let nativeSetView=null;
  let nativeRenderView=null;

  const labels={
    resumo:'Resumo',evolucao:'Evolução Mensal',subfam:'Sub-Famílias',artigos:'Detalhe Artigos',hotel:'Análise Hotel',
    invart:'Inventário Artigos',recbeb:'Receitas',stock:'Stock & Internos',comentarios:'Comentários',
    encomenda:'Sugestão de Encomenda',excessos:'Excessos de Stock',previsao:'Previsão',acomp:'Previsto vs. Real',roomnights:'Roomnights'
  };

  function mount(){return document.getElementById('ab35NativeMount');}
  function moduleRef(){return window.VG&&window.VG.comprasNative35;}
  function root(){try{return moduleRef()?.getRoot?.()||window.AB35Root||null;}catch(e){return null;}}
  function inAB(){return location.hash.replace(/^#/,'')==='ab'||!!mount();}
  function looksNative(fn){try{return typeof fn==='function'&&(/AB35Root|renderView\(v\)|view-/.test(String(fn)));}catch(e){return false;}}
  function captureNativeDispatchers(){
    if(looksNative(window.setView))nativeSetView=window.setView;
    if(looksNative(window.renderView))nativeRenderView=window.renderView;
  }

  function ensureStyle(r){
    if(r.getElementById&&r.getElementById('vgAbEmbeddedStyleStable'))return;
    const style=document.createElement('style');style.id='vgAbEmbeddedStyleStable';style.textContent=`
      :host{display:block!important;max-width:100%!important;overflow:hidden!important}
      .ab35-shell{min-height:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:transparent!important}
      .ab35-top{display:none!important}
      .ab35-scopebar{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto!important;gap:10px!important;padding:12px 16px!important;background:transparent!important}
      .ab35-filterbuttons{display:flex!important;gap:6px!important;flex-wrap:wrap!important}
      .ab35-filterbuttons .reg-btn{display:inline-flex!important;width:auto!important;margin:0!important;padding:6px 10px!important;white-space:nowrap!important}
      .ab35-nav{display:none!important}
      #main{padding:14px 16px!important;min-height:0!important;width:100%!important;max-width:100%!important;overflow:visible!important}
      .view,.panel,.cards,.grid2,.tbl-wrap{max-width:100%!important}.view{overflow:hidden!important}
      .vg-ab-embedded-nav{display:flex!important;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);background:rgba(8,26,43,.55)}
      .vg-ab-embedded-nav label{font-size:9px;letter-spacing:.9px;text-transform:uppercase;color:#7991a7;white-space:nowrap}
      .vg-ab-embedded-nav select{width:min(460px,100%);background:#0b1d30;border:1px solid rgba(201,162,75,.35);border-radius:8px;color:#eef2f8;padding:8px 10px;font-size:12px;outline:none}
      @media(max-width:900px){.ab35-scopebar{grid-template-columns:1fr!important}.vg-ab-embedded-nav{align-items:stretch;flex-direction:column}.vg-ab-embedded-nav select{width:100%}}
    `;r.appendChild(style);
  }

  function activateView(r,v,btn){
    captureNativeDispatchers();
    if(nativeSetView){
      try{nativeSetView(v,btn||null);return true;}catch(err){console.warn('[VG A&B stability] native setView',err);}
    }
    try{
      r.querySelectorAll('.view').forEach(function(x){x.classList.remove('on');});
      const el=r.getElementById&&r.getElementById('view-'+v);if(el)el.classList.add('on');
      r.querySelectorAll('.nav-btn').forEach(function(b){b.classList.toggle('on',b===btn||b.dataset.view===v);});
      captureNativeDispatchers();
      if(nativeRenderView)nativeRenderView(v);
      return !!el;
    }catch(err){console.warn('[VG A&B stability] activate view',err);return false;}
  }

  function ensureEmbeddedNav(r){
    const oldNav=r.querySelector('.ab35-nav'),scope=r.querySelector('.ab35-scopebar');if(!oldNav||!scope)return;
    let wrap=r.getElementById&&r.getElementById('vgAbEmbeddedNav'),sel=r.getElementById&&r.getElementById('vgAbEmbeddedSelect');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='vgAbEmbeddedNav';wrap.className='vg-ab-embedded-nav';
      const lab=document.createElement('label');lab.textContent='Análise';sel=document.createElement('select');sel.id='vgAbEmbeddedSelect';
      Object.keys(labels).forEach(function(v){const btn=oldNav.querySelector('.nav-btn[data-view="'+v+'"]');if(!btn)return;const opt=document.createElement('option');opt.value=v;opt.textContent=labels[v];sel.appendChild(opt);});
      sel.addEventListener('change',function(event){event.preventDefault();event.stopPropagation();const btn=oldNav.querySelector('.nav-btn[data-view="'+sel.value+'"]');activateView(r,sel.value,btn);});
      wrap.append(lab,sel);scope.insertAdjacentElement('afterend',wrap);
    }
    const active=oldNav.querySelector('.nav-btn.on[data-view]');if(sel&&active&&labels[active.dataset.view])sel.value=active.dataset.view;
  }

  function installRootGuard(r){
    if(r.__vgAbGuardInstalled)return;r.__vgAbGuardInstalled=true;
    r.addEventListener('click',function(event){
      const btn=event.target&&event.target.closest&&event.target.closest('.ab35-nav .nav-btn[data-view]');
      if(!btn||!labels[btn.dataset.view])return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      activateView(r,btn.dataset.view,btn);
    },true);
  }

  function integrate(){
    if(!inAB())return false;const r=root();if(!r||!r.querySelector)return false;
    try{captureNativeDispatchers();ensureStyle(r);installRootGuard(r);ensureEmbeddedNav(r);['navCarregar','navSetup','adminCap'].forEach(function(id){const el=r.getElementById&&r.getElementById(id);if(el)el.remove();});const m=mount();if(m)m.dataset.vgAbIntegrated='1';watchRoot(r);return true;}catch(err){console.warn('[VG A&B stability] integração',err);return false;}
  }

  function watchRoot(r){if(observedRoot===r&&rootObserver)return;if(rootObserver)rootObserver.disconnect();observedRoot=r;rootObserver=new MutationObserver(function(){clearTimeout(retryTimer);retryTimer=setTimeout(integrate,20);});try{rootObserver.observe(r,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}catch(e){}}
  function retryBurst(){[0,30,80,160,320,650,1200,2200,4000,7000].forEach(function(ms){setTimeout(function(){if(!integrate()&&window.VG?.modernPreview?.repairAB&&ms>=320){try{void window.VG.modernPreview.repairAB().then(function(){captureNativeDispatchers();integrate();});}catch(e){}}},ms);});}
  function installDocObserver(){if(docObserver)return;docObserver=new MutationObserver(function(mutations){for(const m of mutations){if(m.type==='childList'&&(document.getElementById('ab35NativeMount')||inAB())){retryBurst();break;}}});docObserver.observe(document.documentElement,{childList:true,subtree:true});}
  document.addEventListener('click',function(e){const nav=e.target&&e.target.closest&&e.target.closest('#nav-ab');if(nav)retryBurst();},false);
  window.addEventListener('hashchange',function(){if(inAB())retryBurst();});window.addEventListener('vg-modern-preview-ready',retryBurst);installDocObserver();retryBurst();
})();
