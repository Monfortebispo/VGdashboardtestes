(function(){
  'use strict';
  if(window.__VG_AB_INTEGRATION_STABILITY_V43__)return;
  window.__VG_AB_INTEGRATION_STABILITY_V43__=true;

  const labels={
    resumo:'Resumo',evolucao:'Evolução Mensal',subfam:'Sub-Famílias',artigos:'Detalhe Artigos',hotel:'Análise Hotel',
    invart:'Inventário Artigos',recbeb:'Receitas',stock:'Stock & Internos',comentarios:'Comentários',
    encomenda:'Sugestão de Encomenda',excessos:'Excessos de Stock',previsao:'Previsão',acomp:'Previsto vs. Real',roomnights:'Roomnights'
  };
  let observer=null,timer=null,lastRoot=null;

  function hub(){return document.getElementById('abHubRoot');}
  function mount(){return document.getElementById('ab35NativeMount');}
  function moduleRef(){return window.VG&&window.VG.comprasNative35;}
  function root(){try{return moduleRef()?.getRoot?.()||window.AB35Root||null;}catch(e){return null;}}
  function isExact(){return !!(hub()&&hub().dataset.tab==='exact'&&mount());}

  function ensureShadowStyle(r){
    if(!r||!r.querySelector)return;
    let style=r.getElementById&&r.getElementById('vgAbEmbeddedStyleV43');
    if(!style){style=document.createElement('style');style.id='vgAbEmbeddedStyleV43';r.appendChild(style);}
    style.textContent=`
      :host{display:block!important;max-width:100%!important;overflow:hidden!important}
      .ab35-shell{min-height:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:transparent!important;max-width:100%!important}
      .ab35-top{display:none!important}
      .ab35-scopebar{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto!important;gap:10px!important;padding:12px 16px!important;background:transparent!important;max-width:100%!important}
      .ab35-filterbuttons{display:flex!important;gap:6px!important;flex-wrap:wrap!important;min-width:0!important}
      .ab35-filterbuttons .reg-btn{display:inline-flex!important;width:auto!important;margin:0!important;padding:6px 10px!important;white-space:nowrap!important}
      .ab35-nav{display:none!important}
      #main{padding:14px 16px!important;min-height:0!important;width:100%!important;max-width:100%!important;overflow:hidden!important;box-sizing:border-box!important}
      .view,.panel,.cards,.grid2,.tbl-wrap{max-width:100%!important;min-width:0!important}.view{overflow:hidden!important}
      @media(max-width:900px){.ab35-scopebar{grid-template-columns:1fr!important}}
    `;
    const oldNav=r.querySelector('.ab35-nav');
    if(oldNav&&!oldNav.dataset.vgAbStopBubble){
      oldNav.dataset.vgAbStopBubble='1';
      oldNav.addEventListener('click',function(e){
        if(e.target&&e.target.closest&&e.target.closest('.nav-btn[data-view]'))e.stopPropagation();
      },false);
    }
  }

  function currentView(r){
    const b=r?.querySelector?.('.ab35-nav .nav-btn.on[data-view]');
    return b?.dataset?.view||'resumo';
  }

  function navigate(v){
    const r=root();
    const btn=r?.querySelector?.('.ab35-nav .nav-btn[data-view="'+v+'"]');
    if(!btn)return false;
    btn.click();
    setTimeout(()=>syncSelector(r),0);
    return true;
  }

  function syncSelector(r){
    const sel=document.getElementById('vgAbAnalysisSelect');
    if(!sel)return;
    const v=currentView(r||root());
    if([...sel.options].some(o=>o.value===v))sel.value=v;
  }

  function ensureToolbar(r){
    const m=mount();if(!m)return;
    let bar=document.getElementById('vgAbAnalysisBar');
    if(!bar){
      bar=document.createElement('div');bar.id='vgAbAnalysisBar';bar.className='od-toolbar';
      bar.style.cssText='margin:0 0 10px 0;display:flex;align-items:end;gap:10px;flex-wrap:wrap';
      const label=document.createElement('label');label.textContent='Análise';
      const sel=document.createElement('select');sel.id='vgAbAnalysisSelect';sel.style.minWidth='280px';
      Object.entries(labels).forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;sel.appendChild(o);});
      sel.addEventListener('change',function(){
        const wanted=this.value;
        if(!navigate(wanted)){
          this.value=currentView(root());
          console.warn('[VG A&B] vista nativa ainda indisponível:',wanted);
        }
      });
      label.appendChild(sel);bar.appendChild(label);m.parentNode.insertBefore(bar,m);
    }
    syncSelector(r);
  }

  function integrate(){
    if(!isExact()){
      document.getElementById('vgAbAnalysisBar')?.remove();
      return false;
    }
    const r=root();
    if(!r||!r.querySelector)return false;
    lastRoot=r;ensureShadowStyle(r);ensureToolbar(r);syncSelector(r);return true;
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(integrate,60);}
  function installObserver(){
    if(observer)return;
    observer=new MutationObserver(function(){
      if(isExact()||document.getElementById('vgAbAnalysisBar'))schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  document.addEventListener('click',function(e){
    const t=e.target;
    if(t&&t.closest&&t.closest('[data-abtab="exact"],#nav-ab'))setTimeout(schedule,0);
  },false);
  window.addEventListener('hashchange',schedule);
  window.addEventListener('vg-modern-preview-ready',schedule);
  installObserver();
  [0,100,300,800,1600,3200,6000].forEach(ms=>setTimeout(integrate,ms));
})();
