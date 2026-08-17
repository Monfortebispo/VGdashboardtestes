// ==========================================================
// VG OPERATIONS v36.1 — COERÊNCIA DE VERSÃO / PWA
// Garante que o HTML atual não corre com JS/CSS de um shell antigo.
// Inclui bootstrap precoce do login para o botão responder logo que aparece.
// ==========================================================
(function(){
  'use strict';
  const BUILD='32.9'; // identificador de compatibilidade do guard legado
  const PLATFORM_BUILD='35.6';
  const SW_URL='/service-worker.js?vg='+encodeURIComponent(PLATFORM_BUILD);
  window.__VG_APP_BUILD__=PLATFORM_BUILD;
  window.__VG_SW_URL__=SW_URL;

  // LOGIN EARLY-BOOTSTRAP
  // O formulário surge antes do DOMContentLoaded. Enquanto o módulo auth ainda
  // não ligou o onclick, capturamos o primeiro clique/Enter e executamo-lo assim
  // que window.vgAuthLogin ficar disponível. Evita o período em que o botão
  // parecia clicável mas não fazia nada.
  let earlyLoginPending=false;
  let earlyLoginTimer=null;
  let earlyLoginTries=0;

  function earlyLoginBtn(){return document.getElementById('vgLoginBtn');}
  function earlyLoginError(){return document.getElementById('vgLoginError');}
  function resetEarlyLoginButton(){
    const btn=earlyLoginBtn();
    if(btn){btn.disabled=false;btn.textContent='Entrar';btn.removeAttribute('aria-busy');}
  }
  function tryEarlyLogin(){
    if(!earlyLoginPending)return true;
    if(typeof window.vgAuthLogin==='function'){
      earlyLoginPending=false;
      if(earlyLoginTimer){clearInterval(earlyLoginTimer);earlyLoginTimer=null;}
      const btn=earlyLoginBtn();
      if(btn){btn.disabled=false;btn.removeAttribute('aria-busy');}
      window.vgAuthLogin();
      return true;
    }
    return false;
  }
  function queueEarlyLogin(){
    if(earlyLoginPending)return;
    earlyLoginPending=true;
    earlyLoginTries=0;
    const btn=earlyLoginBtn();
    const err=earlyLoginError();
    if(err)err.textContent='';
    if(btn){btn.disabled=true;btn.textContent='A iniciar…';btn.setAttribute('aria-busy','true');}
    if(tryEarlyLogin())return;
    earlyLoginTimer=setInterval(function(){
      earlyLoginTries++;
      if(tryEarlyLogin())return;
      if(earlyLoginTries>=400){
        clearInterval(earlyLoginTimer);earlyLoginTimer=null;earlyLoginPending=false;
        resetEarlyLoginButton();
        const e=earlyLoginError();if(e)e.textContent='A aplicação ainda não terminou de iniciar. Recarregue a página.';
      }
    },50);
  }

  document.addEventListener('click',function(e){
    const btn=e.target&&e.target.closest?e.target.closest('#vgLoginBtn'):null;
    if(!btn)return;
    // Quando o auth já instalou o handler normal, deixa o clique seguir.
    if(typeof window.vgAuthLogin==='function'&&typeof btn.onclick==='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    queueEarlyLogin();
  },true);

  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||!e.target||e.target.id!=='vgLoginPass')return;
    const btn=earlyLoginBtn();
    if(typeof window.vgAuthLogin==='function'&&btn&&typeof btn.onclick==='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    queueEarlyLogin();
  },true);

  function swBuild(controller){
    try{return new URL(controller?.scriptURL||'',location.href).searchParams.get('vg')||'';}catch(e){return '';}
  }
  function addUpdatingScreen(){
    if(document.getElementById('vgBuildGuardStyle'))return;
    const s=document.createElement('style');s.id='vgBuildGuardStyle';
    s.textContent=`html.vg-build-updating body{visibility:hidden!important}html.vg-build-updating:after{content:'A atualizar VG Operations…';position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#fff7f7;color:#7d100b;font:700 15px Arial,sans-serif;letter-spacing:.1px}`;
    (document.head||document.documentElement).appendChild(s);
    document.documentElement.classList.add('vg-build-updating');
  }
  function clearUpdatingScreen(){document.documentElement.classList.remove('vg-build-updating');}
  function reloadOnce(){
    try{
      const key='vg_build_reloaded_'+PLATFORM_BUILD;
      if(sessionStorage.getItem(key)==='1'){clearUpdatingScreen();return;}
      sessionStorage.setItem(key,'1');
    }catch(e){}
    location.reload();
  }

  // O bootstrap de login acima deve funcionar mesmo sem Service Worker.
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  const controlled=navigator.serviceWorker.controller;
  const oldController=!!controlled && swBuild(controlled)!==PLATFORM_BUILD;
  if(oldController)addUpdatingScreen();

  let controllerTimer=null;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    clearTimeout(controllerTimer);
    controllerTimer=setTimeout(()=>{
      if(swBuild(navigator.serviceWorker.controller)===PLATFORM_BUILD)reloadOnce();
    },40);
  });

  navigator.serviceWorker.register(SW_URL,{scope:'/',updateViaCache:'none'}).then(reg=>{
    try{reg.update();}catch(e){}
    if(reg.waiting)try{reg.waiting.postMessage({type:'SKIP_WAITING'});}catch(e){}
    if(swBuild(navigator.serviceWorker.controller)===PLATFORM_BUILD)clearUpdatingScreen();
    // Nunca deixar um ecrã de atualização bloqueado indefinidamente.
    if(oldController)setTimeout(clearUpdatingScreen,12000);
  }).catch(err=>{
    console.warn('[VG build guard] atualização PWA não disponível',err);
    clearUpdatingScreen();
  });

  // Diagnóstico legível em vez de um placeholder infinito se um módulo falhar.
  window.addEventListener('load',()=>setTimeout(()=>{
    const checks=[
      ['documentsRoot','Gestão de Documentos',()=>typeof window.documentManagementRender==='function'],
      ['approvalsRoot','Workflow de Aprovações',()=>typeof window.approvalsRender==='function'],
      ['scenarioComparisonRoot','Comparação de Cenários',()=>typeof window.scenarioComparisonRender==='function'],
      ['hotel360Root','Hotel 360º',()=>typeof window.hotel360Render==='function'],
      ['revenueHubRoot','Revenue & Forecast',()=>!!window.VG?.revenueHub],
      ['abHubRoot','Compras & A&B',()=>!!window.VG?.domains33],
      ['housekeepingRoot','Housekeeping & Têxtil',()=>!!window.VG?.domains33],
      ['receitasDetalheRoot','Receita Detalhada',()=>!!window.VG?.domains33]
    ];
    for(const [id,label,ok] of checks){
      const root=document.getElementById(id);if(!root||ok())continue;
      root.innerHTML=`<div style="padding:28px;border:1px dashed #d9b2b0;border-radius:12px;text-align:center"><strong>${label} não carregou corretamente.</strong><div style="margin-top:8px;font-size:12px;opacity:.72">A aplicação detetou uma versão incompleta ou um ficheiro em falta.</div><button type="button" onclick="location.reload()" style="margin-top:14px;padding:8px 14px;border:1px solid #b42318;border-radius:8px;background:#fff;color:#8b1b13;font-weight:700;cursor:pointer">Recarregar aplicação</button></div>`;
    }
  },2500),{once:true});
})();
