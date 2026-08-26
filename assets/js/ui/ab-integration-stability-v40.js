(function(){
  'use strict';
  if(window.__VG_AB_INTEGRATION_STABILITY_V40__)return;
  window.__VG_AB_INTEGRATION_STABILITY_V40__=true;

  let rootObserver=null;
  let observedRoot=null;
  let docObserver=null;
  let retryTimer=null;

  const labels={
    resumo:'Resumo',evolucao:'Evolução Mensal',subfam:'Sub-Famílias',artigos:'Detalhe Artigos',hotel:'Análise Hotel',
    invart:'Inventário Artigos',recbeb:'Receitas',stock:'Stock & Internos',comentarios:'Comentários',
    encomenda:'Sugestão de Encomenda',excessos:'Excessos de Stock',previsao:'Previsão',acomp:'Previsto vs. Real',roomnights:'Roomnights'
  };

  function mount(){return document.getElementById('ab35NativeMount');}
  function moduleRef(){return window.VG&&window.VG.comprasNative35;}
  function root(){try{return moduleRef()?.getRoot?.()||window.AB35Root||null;}catch(e){return null;}}
  function inAB(){return location.hash.replace(/^#/,'')==='ab'||!!mount();}

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
      .vg-ab-dispatch-bridge{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}
      @media(max-width:900px){.ab35-scopebar{grid-template-columns:1fr!important}.vg-ab-embedded-nav{align-items:stretch;flex-direction:column}.vg-ab-embedded-nav select{width:100%}}
    `;r.appendChild(style);
  }

  function dispatchNativeView(r,v){
    const btn=r.querySelector('.ab35-nav .nav-btn[data-view="'+v+'"]');
    if(!btn||typeof window.setView!=='function')return false;
    let bridge=r.getElementById&&r.getElementById('vgAbDispatchBridge');
    if(!bridge){
      bridge=document.createElement('button');
      bridge.id='vgAbDispatchBridge';
      bridge.type='button';
      bridge.className='vg-ab-dispatch-bridge';
      r.appendChild(bridge);
    }
    bridge.onclick=function(event){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      // O dispatcher do módulo decide qual setView usar através de window.event.target.
      // Este handler corre num elemento REAL do ShadowRoot; por isso o dispatcher escolhe
      // obrigatoriamente o setView nativo A&B e nunca o setView geral da dashboard.
      window.setView(v,btn);
    };
    bridge.dispatchEvent(new MouseEvent('click',{bubbles:false,cancelable:true,composed:false,view:window}));
    return true;
  }

  function ensureEmbeddedNav(r){
    const oldNav=r.querySelector('.ab35-nav'),scope=r.querySelector('.ab35-scopebar');if(!oldNav||!scope)return;
    let wrap=r.getElementById&&r.getElementById('vgAbEmbeddedNav'),sel=r.getElementById&&r.getElementById('vgAbEmbeddedSelect');
    if(!wrap){
      wrap=document.createElement('div');wrap.id='vgAbEmbeddedNav';wrap.className='vg-ab-embedded-nav';
      const lab=document.createElement('label');lab.textContent='Análise';sel=document.createElement('select');sel.id='vgAbEmbeddedSelect';
      Object.keys(labels).forEach(function(v){const btn=oldNav.querySelector('.nav-btn[data-view="'+v+'"]');if(!btn)return;const opt=document.createElement('option');opt.value=v;opt.textContent=labels[v];sel.appendChild(opt);});
      sel.addEventListener('change',function(event){
        event.preventDefault();event.stopPropagation();
        const wanted=sel.value;
        if(!dispatchNativeView(r,wanted)){sel.value='resumo';return;}
        setTimeout(function(){const active=oldNav.querySelector('.nav-btn.on[data-view]');if(active&&labels[active.dataset.view])sel.value=active.dataset.view;},20);
      });
      wrap.append(lab,sel);scope.insertAdjacentElement('afterend',wrap);
    }
    const active=oldNav.querySelector('.nav-btn.on[data-view]');if(sel&&active&&labels[active.dataset.view])sel.value=active.dataset.view;
  }

  function integrate(){
    if(!inAB())return false;const r=root();if(!r||!r.querySelector)return false;
    try{
      ensureStyle(r);ensureEmbeddedNav(r);
      ['navCarregar','navSetup','adminCap'].forEach(function(id){const el=r.getElementById&&r.getElementById(id);if(el)el.remove();});
      const m=mount();if(m)m.dataset.vgAbIntegrated='1';
      watchRoot(r);return true;
    }catch(err){console.warn('[VG A&B stability] integração',err);return false;}
  }

  function watchRoot(r){
    if(observedRoot===r&&rootObserver)return;
    if(rootObserver)rootObserver.disconnect();observedRoot=r;
    rootObserver=new MutationObserver(function(mutations){
      if(!mutations.some(function(m){return m.type==='childList';}))return;
      clearTimeout(retryTimer);retryTimer=setTimeout(integrate,60);
    });
    try{rootObserver.observe(r,{childList:true,subtree:true});}catch(e){}
  }
  function retryBurst(){[0,80,250,700,1500,3500].forEach(function(ms){setTimeout(function(){if(!integrate()&&window.VG?.modernPreview?.repairAB&&ms>=700){try{void window.VG.modernPreview.repairAB().then(integrate);}catch(e){}}},ms);});}
  function installDocObserver(){if(docObserver)return;docObserver=new MutationObserver(function(mutations){for(const m of mutations){if(m.type==='childList'&&(document.getElementById('ab35NativeMount')||inAB())){retryBurst();break;}}});docObserver.observe(document.documentElement,{childList:true,subtree:true});}
  document.addEventListener('click',function(e){const nav=e.target&&e.target.closest&&e.target.closest('#nav-ab');if(nav)retryBurst();},false);
  window.addEventListener('hashchange',function(){if(inAB())retryBurst();});window.addEventListener('vg-modern-preview-ready',retryBurst);installDocObserver();retryBurst();
})();
