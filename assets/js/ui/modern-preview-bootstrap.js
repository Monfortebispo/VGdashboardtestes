(function(){
  'use strict';
  if(window.__VG_MODERN_PREVIEW_BOOTSTRAP__)return;
  window.__VG_MODERN_PREVIEW_BOOTSTRAP__=true;

  const MODERN_VIEWS=new Set(['resumo','ocupacao','revenuehub']);
  const params=new URLSearchParams(location.search);
  const modernMode=params.get('modern')==='1';
  let abRepairPromise=null;

  function api(){return window.VG&&window.VG.modernPreview;}
  function viewFromNav(el){
    const node=el&&el.closest&&el.closest('[id^="nav-"]');
    return node?String(node.id).replace(/^nav-/,''):'';
  }
  function setMode(next){
    const url=new URL(location.href);
    if(next)url.searchParams.set('modern','1');
    else url.searchParams.delete('modern');
    location.href=url.toString();
  }
  function showBadge(){
    if(document.getElementById('vgModernPreviewBadge'))return;
    const badge=document.createElement('button');
    badge.id='vgModernPreviewBadge';
    badge.type='button';
    badge.textContent=modernMode?'TESTE · moderno ativo':'TESTE · compatibilidade';
    badge.title=modernMode?'Clique para voltar ao comportamento legado completo':'Clique para testar apenas os módulos já migrados';
    badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;background:#111827;color:#fff;border:1px solid #64748b;border-radius:999px;padding:7px 11px;font:600 11px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:.92;cursor:pointer';
    badge.addEventListener('click',function(){setMode(!modernMode);});
    document.body.appendChild(badge);
  }
  async function go(view){
    const modern=api();
    if(!modern||!modern.navigation)return false;
    try{await modern.navigation.go(view);return true;}
    catch(err){console.error('[VG modern preview] navigation failed',err);return false;}
  }

  function abMount(){return document.getElementById('ab35NativeMount');}
  function abModule(){return window.VG&&window.VG.comprasNative35;}
  function abRoot(){try{return abModule()?.getRoot?.()||window.AB35Root||null;}catch(e){return null;}}
  function abIsMounted(){
    const mount=abMount();
    return !!(mount&&mount.querySelector('.vg-compras-native-v35'));
  }
  function abShowError(err,stage){
    const mount=abMount();
    const msg=(err&&err.message)||String(err||'erro desconhecido');
    console.error('[VG preview] Compras & A&B '+stage,err);
    if(!mount)return;
    mount.innerHTML='<section class="od-card od-empty" style="text-align:left"><h3>Falha ao iniciar Custos &amp; Compras</h3><p><b>Etapa:</b> '+stage+'</p><p style="white-space:pre-wrap">'+msg.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+'</p></section>';
  }

  function abIntegrate(){
    const root=abRoot();
    if(!root||!root.querySelector)return false;
    if(root.getElementById('vgAbEmbeddedStyle'))return true;

    const style=document.createElement('style');
    style.id='vgAbEmbeddedStyle';
    style.textContent=`
      :host{display:block!important;max-width:100%!important;overflow:hidden!important}
      .ab35-shell{min-height:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:transparent!important}
      .ab35-top{display:none!important}
      .ab35-scopebar{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto!important;gap:10px!important;padding:12px 16px!important;background:transparent!important}
      .ab35-filterbuttons{display:flex!important;gap:6px!important;flex-wrap:wrap!important}
      .ab35-filterbuttons .reg-btn{display:inline-flex!important;width:auto!important;margin:0!important;padding:6px 10px!important;white-space:nowrap!important}
      .ab35-nav{display:none!important}
      #main{padding:14px 16px!important;min-height:0!important;width:100%!important;max-width:100%!important;overflow:visible!important}
      .view{max-width:100%!important;overflow:hidden!important}
      .panel,.cards,.grid2{max-width:100%!important}
      .tbl-wrap{max-width:100%!important}
      .vg-ab-embedded-nav{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);background:rgba(8,26,43,.55)}
      .vg-ab-embedded-nav label{font-size:9px;letter-spacing:.9px;text-transform:uppercase;color:#7991a7;white-space:nowrap}
      .vg-ab-embedded-nav select{width:min(460px,100%);background:#0b1d30;border:1px solid rgba(201,162,75,.35);border-radius:8px;color:#eef2f8;padding:8px 10px;font-size:12px;outline:none}
      @media(max-width:900px){.ab35-scopebar{grid-template-columns:1fr!important}.vg-ab-embedded-nav{align-items:stretch;flex-direction:column}.vg-ab-embedded-nav select{width:100%}}
    `;
    root.appendChild(style);

    const oldNav=root.querySelector('.ab35-nav');
    const scope=root.querySelector('.ab35-scopebar');
    if(oldNav&&scope&&!root.getElementById('vgAbEmbeddedNav')){
      const labels={
        resumo:'Resumo',evolucao:'Evolução Mensal',subfam:'Sub-Famílias',artigos:'Detalhe Artigos',hotel:'Análise Hotel',
        invart:'Inventário Artigos',recbeb:'Receitas',stock:'Stock & Internos',comentarios:'Comentários',
        encomenda:'Sugestão de Encomenda',excessos:'Excessos de Stock',previsao:'Previsão',acomp:'Previsto vs. Real',roomnights:'Roomnights'
      };
      const allowed=Object.keys(labels);
      const wrap=document.createElement('div');
      wrap.id='vgAbEmbeddedNav';
      wrap.className='vg-ab-embedded-nav';
      const lab=document.createElement('label');lab.textContent='Análise';
      const sel=document.createElement('select');sel.id='vgAbEmbeddedSelect';
      allowed.forEach(function(v){
        const btn=oldNav.querySelector('.nav-btn[data-view="'+v+'"]');
        if(!btn)return;
        const opt=document.createElement('option');opt.value=v;opt.textContent=labels[v];sel.appendChild(opt);
      });
      const active=oldNav.querySelector('.nav-btn.on[data-view]');if(active&&allowed.includes(active.dataset.view))sel.value=active.dataset.view;
      sel.addEventListener('change',function(event){
        event.stopPropagation();
        const btn=oldNav.querySelector('.nav-btn[data-view="'+sel.value+'"]');
        if(btn&&typeof window.setView==='function')window.setView(sel.value,btn);
      });
      wrap.append(lab,sel);
      scope.insertAdjacentElement('afterend',wrap);
    }

    ['navCarregar','navSetup','adminCap'].forEach(function(id){const el=root.getElementById(id);if(el)el.remove();});
    return true;
  }

  async function abMountDirect(){
    const mount=abMount();
    const mod=abModule();
    if(!mount||!mod||typeof mod.mount!=='function')return false;
    try{
      await mod.mount(mount);
      abIntegrate();
      return abIsMounted()||!!abModule();
    }catch(err){
      abShowError(err,'mount()');
      return false;
    }
  }

  function abEvalWithPreMountRoot(source){
    const hadOwnRoot=Object.prototype.hasOwnProperty.call(window,'AB35Root');
    const previousRoot=window.AB35Root;
    if(!previousRoot){
      window.AB35Root={getElementById:function(){return null;},querySelector:function(){return null;},querySelectorAll:function(){return [];}};
    }
    try{(0,eval)(source+'\n//# sourceURL=compras-ab-native-v35-preview-repair.js');}
    finally{
      if(previousRoot)window.AB35Root=previousRoot;
      else if(hadOwnRoot)window.AB35Root=previousRoot;
      else delete window.AB35Root;
    }
  }

  async function abRepair(){
    if(abRepairPromise)return abRepairPromise;
    abRepairPromise=(async function(){
      await new Promise(function(resolve){setTimeout(resolve,700);});
      if(abIsMounted()){abIntegrate();return true;}
      if(await abMountDirect())return true;
      try{
        const response=await fetch('/assets/js/modules/compras-ab-native-v35.js?preview-repair='+Date.now(),{cache:'no-store'});
        if(!response.ok)throw new Error('HTTP '+response.status+' ao obter compras-ab-native-v35.js');
        const source=await response.text();
        try{abEvalWithPreMountRoot(source);}catch(err){abShowError(err,'avaliação do módulo');return false;}
        if(!abModule()){abShowError(new Error('O módulo não ficou registado.'),'registo do módulo');return false;}
        return await abMountDirect();
      }catch(err){abShowError(err,'carregamento do módulo');return false;}
    })().finally(function(){abRepairPromise=null;});
    return abRepairPromise;
  }
  function scheduleABRepair(){
    [150,500,1200].forEach(function(ms){setTimeout(function(){if(abIsMounted())abIntegrate();else void abRepair();},ms);});
  }

  function install(){
    if(!api())return false;
    showBadge();
    if(modernMode){
      document.addEventListener('click',function(event){
        const view=viewFromNav(event.target);
        if(!view||!MODERN_VIEWS.has(view))return;
        event.preventDefault();event.stopImmediatePropagation();void go(view);
      },true);
    }
    document.addEventListener('click',function(event){if(viewFromNav(event.target)==='ab')scheduleABRepair();},false);
    window.addEventListener('hashchange',function(){if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();});
    if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();
    window.VG.modernPreview.enabled=modernMode;
    window.VG.modernPreview.compatibilityMode=!modernMode;
    window.VG.modernPreview.migratedViews=Array.from(MODERN_VIEWS);
    window.VG.modernPreview.repairAB=abRepair;
    console.info('[VG modern preview]',modernMode?'modern selective mode':'compatibility mode',window.VG.modernPreview.architecture);
    return true;
  }

  if(!install()){
    window.addEventListener('vg-modern-preview-ready',install,{once:true});
    let tries=0;
    const timer=setInterval(function(){tries++;if(install()||tries>80)clearInterval(timer);},100);
  }
})();
