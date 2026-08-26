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
    mount.innerHTML='<section class="od-card od-empty" style="text-align:left"><h3>Falha ao iniciar Custos &amp; Compras</h3><p><b>Etapa:</b> '+stage+'</p><p style="white-space:pre-wrap">'+msg.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+'</p><p>Este detalhe aparece apenas no Deploy Preview para podermos identificar a origem real da falha.</p></section>';
  }
  async function abMountDirect(){
    const mount=abMount();
    const mod=window.VG&&window.VG.comprasNative35;
    if(!mount||!mod||typeof mod.mount!=='function')return false;
    try{
      await mod.mount(mount);
      return abIsMounted()||!!window.VG?.comprasNative35;
    }catch(err){
      abShowError(err,'mount()');
      return false;
    }
  }
  async function abRepair(){
    if(abRepairPromise)return abRepairPromise;
    abRepairPromise=(async function(){
      await new Promise(function(resolve){setTimeout(resolve,1400);});
      if(abIsMounted())return true;
      if(await abMountDirect())return true;

      try{
        const response=await fetch('/assets/js/modules/compras-ab-native-v35.js?preview-repair='+Date.now(),{cache:'no-store'});
        if(!response.ok)throw new Error('HTTP '+response.status+' ao obter compras-ab-native-v35.js');
        const source=await response.text();
        try{(0,eval)(source+'\n//# sourceURL=compras-ab-native-v35-preview-repair.js');}
        catch(err){abShowError(err,'avaliação do módulo');return false;}
        if(!window.VG?.comprasNative35){
          abShowError(new Error('O ficheiro foi executado, mas window.VG.comprasNative35 não ficou registado.'),'registo do módulo');
          return false;
        }
        return await abMountDirect();
      }catch(err){
        abShowError(err,'carregamento do módulo');
        return false;
      }
    })().finally(function(){abRepairPromise=null;});
    return abRepairPromise;
  }
  function scheduleABRepair(){
    setTimeout(function(){if(!abIsMounted())void abRepair();},300);
  }

  function install(){
    if(!api())return false;
    showBadge();

    if(modernMode){
      document.addEventListener('click',function(event){
        const view=viewFromNav(event.target);
        if(!view||!MODERN_VIEWS.has(view))return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void go(view);
      },true);
    }

    // Compras & A&B fica no runtime legado. Se o lazy-loader normal não concluir,
    // o preview faz uma tentativa direta e, em vez de ficar eternamente em
    // "A carregar...", apresenta a etapa e a exceção exatas que bloquearam o módulo.
    document.addEventListener('click',function(event){
      if(viewFromNav(event.target)==='ab')scheduleABRepair();
    },false);
    window.addEventListener('hashchange',function(){
      if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();
    });
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
    const timer=setInterval(function(){
      tries++;
      if(install()||tries>80)clearInterval(timer);
    },100);
  }
})();
