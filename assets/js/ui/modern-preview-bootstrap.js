(function(){
  'use strict';
  if(window.__VG_MODERN_PREVIEW_BOOTSTRAP__)return;
  window.__VG_MODERN_PREVIEW_BOOTSTRAP__=true;

  // Reputação permanece temporariamente em paridade legada no preview: a fonte
  // moderna ainda não reproduz integralmente o motor ReviewPro existente.
  const MODERN_VIEWS=new Set(['resumo','ocupacao','revenuehub']);
  const params=new URLSearchParams(location.search);
  const modernMode=params.get('modern')==='1';

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
  function abMounted(){const mount=abMount();return !!(mount&&mount.querySelector('.vg-compras-native-v35'));}
  function mountAB(){
    const mount=abMount();
    const mod=window.VG&&window.VG.comprasNative35;
    if(!mount||!mod||typeof mod.mount!=='function')return false;
    Promise.resolve(mod.mount(mount)).catch(function(err){console.error('[VG preview] A&B mount failed',err);});
    return true;
  }
  function repairAB(){
    if(abMounted()||mountAB())return;
    const old=document.querySelector('script[data-vg-native35="ab"]');
    if(old&&old.parentNode)old.parentNode.removeChild(old);
    const sc=document.createElement('script');
    sc.src='assets/js/modules/compras-ab-native-v35.js?preview='+Date.now();
    sc.async=true;
    sc.dataset.vgNative35='ab';
    sc.onload=function(){if(!mountAB())console.error('[VG preview] A&B carregou sem registar comprasNative35');};
    sc.onerror=function(){console.error('[VG preview] Falha ao recarregar módulo A&B');};
    document.head.appendChild(sc);
  }
  function scheduleABRepair(){
    setTimeout(function(){if(!abMounted())repairAB();},1800);
    setTimeout(function(){if(!abMounted())repairAB();},4500);
  }

  function install(){
    if(!api())return false;
    showBadge();

    // Regra de segurança do preview:
    // - por defeito, toda a dashboard mantém a navegação legada integral;
    // - em ?modern=1, só vistas com paridade funcional comprovada são interceptadas;
    // - Reputação e restantes vistas continuam a executar setView/initializers legados.
    if(modernMode){
      document.addEventListener('click',function(event){
        const view=viewFromNav(event.target);
        if(!view||!MODERN_VIEWS.has(view))return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void go(view);
      },true);
    }

    // O carregador A&B é lazy. Em alguns Deploy Previews pode ficar preso quando
    // encontra uma tag <script> já resolvida mas sem o global registado. Este
    // watchdog atua apenas no preview e só quando o utilizador abre Compras & A&B.
    document.addEventListener('click',function(event){
      if(viewFromNav(event.target)==='ab')scheduleABRepair();
    },false);
    if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();

    window.VG.modernPreview.enabled=modernMode;
    window.VG.modernPreview.compatibilityMode=!modernMode;
    window.VG.modernPreview.migratedViews=Array.from(MODERN_VIEWS);
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
