(function(){
  'use strict';
  if(window.__VG_MODERN_PREVIEW_BOOTSTRAP__)return;
  window.__VG_MODERN_PREVIEW_BOOTSTRAP__=true;

  const MODERN_VIEWS=new Set(['resumo','ocupacao','revenuehub','custos','approvals','cityledger','reputacao']);
  const params=new URLSearchParams(location.search);
  const modernMode=params.get('modern')==='1';
  let abRepairPromise=null;

  function api(){return window.VG&&window.VG.modernPreview;}
  function viewFromNav(el){const node=el&&el.closest&&el.closest('[id^="nav-"]');return node?String(node.id).replace(/^nav-/,''):'';}
  function setMode(next){const url=new URL(location.href);if(next)url.searchParams.set('modern','1');else url.searchParams.delete('modern');location.href=url.toString();}
  function showBadge(){if(document.getElementById('vgModernPreviewBadge'))return;const badge=document.createElement('button');badge.id='vgModernPreviewBadge';badge.type='button';badge.textContent=modernMode?'TESTE · moderno ativo':'TESTE · compatibilidade';badge.title=modernMode?'Clique para voltar ao comportamento legado completo':'Clique para testar apenas os módulos já migrados';badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;background:#111827;color:#fff;border:1px solid #64748b;border-radius:999px;padding:7px 11px;font:600 11px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:.92;cursor:pointer';badge.addEventListener('click',function(){setMode(!modernMode);});document.body.appendChild(badge);}
  function showReputationPending(){
    const root=document.getElementById('view-reputacao');if(!root)return;
    document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
    root.classList.add('active');
    document.querySelectorAll('.sb-nav-btn').forEach(el=>el.classList.remove('active'));
    document.getElementById('nav-reputacao')?.classList.add('active');
    if(root.querySelector('[data-modern-reputation-readonly]'))return;
    Array.from(root.children).forEach(node=>{const el=node;if(el instanceof HTMLElement){el.dataset.modernReputationPreviewPrevDisplay=el.style.display||'';el.style.display='none';}});
    let pending=root.querySelector('[data-modern-reputation-preview-pending]');
    if(!pending){pending=document.createElement('div');pending.dataset.modernReputationPreviewPending='true';pending.textContent='A carregar reputação…';pending.style.cssText='padding:28px 20px;font:600 13px/1.4 system-ui,sans-serif;color:#64748b';root.appendChild(pending);}
  }
  function restoreReputationPending(){
    const root=document.getElementById('view-reputacao');if(!root)return;
    root.querySelector('[data-modern-reputation-preview-pending]')?.remove();
    Array.from(root.children).forEach(node=>{const el=node;if(el instanceof HTMLElement&&'modernReputationPreviewPrevDisplay' in el.dataset){el.style.display=el.dataset.modernReputationPreviewPrevDisplay||'';delete el.dataset.modernReputationPreviewPrevDisplay;}});
  }
  async function go(view){const modern=api();if(!modern||!modern.navigation)return false;try{await modern.navigation.go(view);if(view==='reputacao')document.getElementById('view-reputacao')?.querySelector('[data-modern-reputation-preview-pending]')?.remove();return true;}catch(err){if(view==='reputacao')restoreReputationPending();console.error('[VG modern preview] navigation failed',err);return false;}}
  function abMount(){return document.getElementById('ab35NativeMount');}function abModule(){return window.VG&&window.VG.comprasNative35;}function abRoot(){try{return abModule()?.getRoot?.()||window.AB35Root||null;}catch(e){return null;}}function abIsMounted(){const mount=abMount();return !!(mount&&mount.querySelector('.vg-compras-native-v35'));}
  function abIntegrate(){const root=abRoot();if(!root||!root.querySelector)return false;if(root.getElementById('vgAbEmbeddedStyle'))return true;const style=document.createElement('style');style.id='vgAbEmbeddedStyle';style.textContent=':host{display:block!important;max-width:100%!important;overflow:hidden!important}.ab35-shell{min-height:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:transparent!important}.ab35-top,.ab35-nav{display:none!important}#main{padding:14px 16px!important;min-height:0!important;width:100%!important;max-width:100%!important;overflow:visible!important}.view,.panel,.cards,.grid2,.tbl-wrap{max-width:100%!important}';root.appendChild(style);return true;}
  async function abMountDirect(){const mount=abMount(),mod=abModule();if(!mount||!mod||typeof mod.mount!=='function')return false;try{await mod.mount(mount);abIntegrate();return abIsMounted()||!!abModule();}catch(err){console.error('[VG preview] Compras & A&B mount',err);return false;}}
  async function abRepair(){if(abRepairPromise)return abRepairPromise;abRepairPromise=(async()=>{await new Promise(r=>setTimeout(r,700));if(abIsMounted()){abIntegrate();return true;}return abMountDirect();})().finally(()=>{abRepairPromise=null;});return abRepairPromise;}
  function scheduleABRepair(){[150,500,1200].forEach(ms=>setTimeout(()=>{if(abIsMounted())abIntegrate();else void abRepair();},ms));}
  function install(){if(!api())return false;showBadge();if(modernMode)document.addEventListener('click',function(event){const view=viewFromNav(event.target);if(!view||!MODERN_VIEWS.has(view))return;event.preventDefault();event.stopImmediatePropagation();if(view==='reputacao')showReputationPending();void go(view);},true);document.addEventListener('click',function(event){if(viewFromNav(event.target)==='ab')scheduleABRepair();},false);window.addEventListener('hashchange',function(){if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();});if(location.hash.replace(/^#/,'')==='ab')scheduleABRepair();window.VG.modernPreview.enabled=modernMode;window.VG.modernPreview.compatibilityMode=!modernMode;window.VG.modernPreview.migratedViews=Array.from(MODERN_VIEWS);window.VG.modernPreview.repairAB=abRepair;return true;}
  if(!install()){window.addEventListener('vg-modern-preview-ready',install,{once:true});let tries=0;const timer=setInterval(function(){tries++;if(install()||tries>80)clearInterval(timer);},100);}
})();
