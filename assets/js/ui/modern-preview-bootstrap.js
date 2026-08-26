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
  function abEmbeddedRoot(){
    const mod=window.VG&&window.VG.comprasNative35;
    try{return mod&&typeof mod.getRoot==='function'?mod.getRoot():null;}catch(e){return null;}
  }
  function abActivateEmbeddedView(view,control){
    const root=abEmbeddedRoot();
    if(!root)return;
    root.querySelectorAll('.view').forEach(function(el){el.classList.remove('on');});
    const target=root.getElementById('view-'+view);
    if(target)target.classList.add('on');
    try{
      if(typeof window.setView==='function')window.setView(view,control||null);
      else if(typeof window.renderView==='function')window.renderView(view);
    }catch(err){console.error('[VG preview] A&B view '+view,err);}
  }
  function abNormalizeEmbeddedUI(){
    const root=abEmbeddedRoot();
    if(!root)return false;
    const app=root.getElementById('app');
    if(!app)return false;
    const top=root.querySelector('.ab35-top');
    if(top)top.style.display='none';
    const carregar=root.getElementById('view-carregar');
    const setup=root.getElementById('view-setup');
    if(carregar)carregar.remove();
    if(setup)setup.remove();
    let style=root.getElementById('vgAbEmbeddedStyle');
    if(!style){
      style=document.createElement('style');
      style.id='vgAbEmbeddedStyle';
      style.textContent=':host{display:block;width:100%;max-width:100%;overflow:hidden}#app.ab35-shell{display:block!important;height:auto!important;min-width:0!important;width:100%!important;overflow:hidden!important}.ab35-top{display:none!important}.ab35-scopebar{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto!important;gap:14px!important;padding:10px 14px!important}.ab35-nav{display:block!important;padding:10px 14px!important;overflow:visible!important;white-space:normal!important;border-bottom:1px solid var(--line)!important}#main{overflow:visible!important;padding:14px!important;min-width:0!important}.view,.panel,.cards,.tbl-wrap,.chart-box{max-width:100%!important;min-width:0!important}.tbl-wrap{overflow:auto!important}#vgAbEmbeddedNav{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#vgAbEmbeddedNav label{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-3)}#vgAbEmbeddedNav select{min-width:240px;max-width:100%;background:var(--navy-0);border:1px solid var(--line-2);border-radius:8px;color:var(--text-1);padding:8px 10px;font-size:12px}#vgAbEmbeddedNav .vg-ab-source{margin-left:auto;font-size:10px;color:var(--text-3)}@media(max-width:900px){.ab35-scopebar{grid-template-columns:1fr!important}#vgAbEmbeddedNav .vg-ab-source{width:100%;margin-left:0}}';
      root.appendChild(style);
    }
    const nav=root.querySelector('.ab35-nav');
    if(nav&&!root.getElementById('vgAbEmbeddedNav')){
      const options=[['resumo','Resumo'],['evolucao','Evolução mensal'],['subfam','Sub-famílias'],['artigos','Detalhe de artigos'],['hotel','Análise por hotel'],['invart','Inventário de artigos'],['recbeb','Receitas'],['stock','Stock & internos'],['comentarios','Comentários'],['encomenda','Sugestão de encomenda'],['excessos','Excessos de stock'],['previsao','Previsão'],['acomp','Previsto vs. real'],['roomnights','Roomnights']];
      nav.innerHTML='<div id="vgAbEmbeddedNav"><label for="vgAbViewSelect">Análise</label><select id="vgAbViewSelect">'+options.map(function(x){return '<option value="'+x[0]+'">'+x[1]+'</option>';}).join('')+'</select><span class="vg-ab-source">Documentos: usar a área geral “Carregar doc”.</span></div>';
      const select=root.getElementById('vgAbViewSelect');
      if(select){
        select.addEventListener('change',function(){abActivateEmbeddedView(this.value,this);});
        const active=root.querySelector('.view.on');
        if(active&&active.id)select.value=active.id.replace(/^view-/,'');
      }
    }
    return true;
  }
  async function abMountDirect(){
    const mount=abMount();
    const mod=window.VG&&window.VG.comprasNative35;
    if(!mount||!mod||typeof mod.mount!=='function')return false;
    try{
      await mod.mount(mount);
      const ok=abIsMounted()||!!window.VG?.comprasNative35;
      if(ok)abNormalizeEmbeddedUI();
      return ok;
    }catch(err){abShowError(err,'mount()');return false;}
  }
  function abEvalWithPreMountRoot(source){
    const hadOwnRoot=Object.prototype.hasOwnProperty.call(window,'AB35Root');
    const previousRoot=window.AB35Root;
    if(!previousRoot){window.AB35Root={getElementById:function(){return null;},querySelector:function(){return null;},querySelectorAll:function(){return [];}};}
    try{(0,eval)(source+'\n//# sourceURL=compras-ab-native-v35-preview-repair.js');}
    finally{if(previousRoot)window.AB35Root=previousRoot;else if(hadOwnRoot)window.AB35Root=previousRoot;else delete window.AB35Root;}
  }
  async function abRepair(){
    if(abRepairPromise)return abRepairPromise;
    abRepairPromise=(async function(){
      await new Promise(function(resolve){setTimeout(resolve,700);});
      if(abIsMounted()){abNormalizeEmbeddedUI();return true;}
      if(await abMountDirect())return true;
      try{
        const response=await fetch('/assets/js/modules/compras-ab-native-v35.js?preview-repair='+Date.now(),{cache:'no-store'});
        if(!response.ok)throw new Error('HTTP '+response.status+' ao obter compras-ab-native-v35.js');
        const source=await response.text();
        try{abEvalWithPreMountRoot(source);}catch(err){abShowError(err,'avaliação do módulo');return false;}
        if(!window.VG?.comprasNative35){abShowError(new Error('O ficheiro foi executado, mas window.VG.comprasNative35 não ficou registado.'),'registo do módulo');return false;}
        return await abMountDirect();
      }catch(err){abShowError(err,'carregamento do módulo');return false;}
    })().finally(function(){abRepairPromise=null;});
    return abRepairPromise;
  }
  function scheduleABRepair(){setTimeout(function(){if(abIsMounted())abNormalizeEmbeddedUI();else void abRepair();},200);}
  function install(){
    if(!api())return false;
    showBadge();
    if(modernMode){document.addEventListener('click',function(event){const view=viewFromNav(event.target);if(!view||!MODERN_VIEWS.has(view))return;event.preventDefault();event.stopImmediatePropagation();void go(view);},true);}
    document.addEventListener('click',function(event){if(viewFromNav(event.target)==='ab')scheduleABRepair();},false);
    window.addEventListener('hashchange',function(){if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();});
    if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();
    window.VG.modernPreview.enabled=modernMode;
    window.VG.modernPreview.compatibilityMode=!modernMode;
    window.VG.modernPreview.migratedViews=Array.from(MODERN_VIEWS);
    window.VG.modernPreview.repairAB=abRepair;
    return true;
  }
  if(!install()){
    window.addEventListener('vg-modern-preview-ready',install,{once:true});
    let tries=0;
    const timer=setInterval(function(){tries++;if(install()||tries>80)clearInterval(timer);},100);
  }
})();