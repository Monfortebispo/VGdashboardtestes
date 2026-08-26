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

  // Compras & A&B continua a usar integralmente o módulo legado/nativo V35.
  // No preview carregamo-lo uma única vez logo no arranque. Assim evitamos a
  // corrida entre o lazy-loader do domínio e os reloads de scripts do Deploy
  // Preview, que podia deixar o ecrã em "Módulo ab não se registou".
  function preloadABNative(){
    window.VG=window.VG||{};
    if(window.VG.comprasNative35)return;
    let sc=document.querySelector('script[data-vg-native35="ab"]');
    if(sc)return;
    sc=document.createElement('script');
    sc.src='/assets/js/modules/compras-ab-native-v35.js';
    sc.async=true;
    sc.dataset.vgNative35='ab';
    sc.onload=function(){
      if(!window.VG?.comprasNative35)console.error('[VG preview] Compras & A&B carregou mas não registou comprasNative35');
      else console.info('[VG preview] Compras & A&B nativo preparado');
    };
    sc.onerror=function(){console.error('[VG preview] Falha ao carregar Compras & A&B nativo');};
    document.head.appendChild(sc);
  }

  function install(){
    if(!api())return false;
    showBadge();
    preloadABNative();

    // Regra de segurança do preview:
    // - por defeito, toda a dashboard mantém a navegação legada integral;
    // - em ?modern=1, só vistas com paridade funcional comprovada são interceptadas;
    // - Reputação, Compras & A&B e restantes vistas continuam no runtime legado.
    if(modernMode){
      document.addEventListener('click',function(event){
        const view=viewFromNav(event.target);
        if(!view||!MODERN_VIEWS.has(view))return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void go(view);
      },true);
    }

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
