// ==========================================================
// VG OPERATIONS v35.7 — COERÊNCIA DE VERSÃO / PWA + SHELL COMPACTO
// Garante coerência do shell, login responsivo desde o primeiro clique e
// reorganiza controlos globais sem alterar a lógica funcional dos módulos.
// ==========================================================
(function(){
  'use strict';
  const BUILD='32.9'; // identificador de compatibilidade do guard legado
  const PLATFORM_BUILD='35.7';
  const SW_URL='/service-worker.js?vg='+encodeURIComponent(PLATFORM_BUILD);
  window.__VG_APP_BUILD__=PLATFORM_BUILD;
  window.__VG_SW_URL__=SW_URL;

  // ----------------------------------------------------------
  // LOGIN EARLY-BOOTSTRAP
  // ----------------------------------------------------------
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
    if(typeof window.vgAuthLogin==='function'&&typeof btn.onclick==='function')return;
    e.preventDefault();e.stopImmediatePropagation();queueEarlyLogin();
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||!e.target||e.target.id!=='vgLoginPass')return;
    const btn=earlyLoginBtn();
    if(typeof window.vgAuthLogin==='function'&&btn&&typeof btn.onclick==='function')return;
    e.preventDefault();e.stopImmediatePropagation();queueEarlyLogin();
  },true);

  // ----------------------------------------------------------
  // SHELL V35.7 — resolver por estrutura, não por zoom
  // ----------------------------------------------------------
  function installShellStyle(){
    if(document.getElementById('vgShellV357Style'))return;
    const s=document.createElement('style');
    s.id='vgShellV357Style';
    s.textContent=`
      /* Popup de carregamento removido: o estado continua disponível na sidebar. */
      #vgLoadPop{display:none!important;visibility:hidden!important;pointer-events:none!important}

      /* A barra superior é sempre uma única faixa fechada. */
      html body header.topbar{
        height:48px!important;min-height:48px!important;max-height:48px!important;
        overflow:hidden!important;flex-wrap:nowrap!important;align-items:center!important;
      }
      html body header.topbar .topbar-center{
        min-width:0!important;overflow:hidden!important;flex-wrap:nowrap!important;
        gap:4px!important;padding:0 5px!important;
      }
      html body header.topbar .topbar-right{
        min-width:0!important;overflow:hidden!important;flex-wrap:nowrap!important;
        gap:4px!important;align-items:center!important;white-space:nowrap!important;
      }

      /* Período: o valor original fica escondido e o proxy mostra uma leitura curta. */
      #headerMes[data-vg-compact-source="1"]{display:none!important}
      #vgHeaderMesCompact{font-size:9px!important;font-weight:800!important;white-space:nowrap!important}
      #topbarComparativo{font-size:0!important;white-space:nowrap!important}
      #topbarComparativo strong{font-size:9px!important}
      #topbarComparativoPill{max-width:92px!important;overflow:hidden!important}
      #yearBtnsWrap{max-width:98px!important;overflow:hidden!important}

      /* Pesquisa e notificações permanecem no topo, mas apenas como ações icónicas. */
      #vgGlobalSearchTrigger,#vgNotificationsTrigger{
        width:28px!important;min-width:28px!important;max-width:28px!important;
        height:28px!important;min-height:28px!important;max-height:28px!important;
        padding:0!important;margin:0!important;display:inline-flex!important;
        align-items:center!important;justify-content:center!important;gap:0!important;
        overflow:visible!important;flex:0 0 28px!important;
      }
      #vgGlobalSearchTrigger .vg-search-label,#vgGlobalSearchTrigger .vg-search-key,
      #vgNotificationsTrigger .vg-notif-trigger-label{display:none!important}
      #vgGlobalSearchTrigger svg{width:12px!important;height:12px!important}
      #vgNotificationsTrigger .vg-notif-bell{font-size:12px!important;line-height:1!important}
      #vgNotificationsTrigger #vgNotificationBadge{
        top:0!important;right:0!important;transform:translate(35%,-22%)!important;
        min-width:13px!important;height:13px!important;padding:0 3px!important;
        border-width:1px!important;font-size:7px!important;line-height:11px!important;
      }

      /* O Assistente já existe no menu lateral: não duplica espaço no cabeçalho. */
      #v30TopAssistant{display:none!important}

      /* Online: só ponto + número. */
      #onlineUsersWrap{height:27px!important;min-height:27px!important;padding:3px 6px!important;gap:3px!important}
      #onlineUsersWrap span:last-child{display:none!important}
      #onlineCount{font-size:8.5px!important}

      /* Geografia vive no topo da sidebar e nunca na topbar. */
      html body #sidebar #vgMarketSwitch{
        display:flex!important;align-items:center!important;gap:5px!important;
        margin:6px 7px 2px!important;padding:5px 6px!important;
        min-height:31px!important;height:auto!important;max-width:none!important;
        background:var(--surface-2)!important;border:1px solid var(--border)!important;
        border-radius:8px!important;box-shadow:none!important;flex:0 0 auto!important;
      }
      html body #sidebar #vgMarketSwitch>span{
        display:block!important;flex:0 0 auto!important;font-size:8px!important;
        line-height:1!important;font-weight:800!important;letter-spacing:.06em!important;
        text-transform:uppercase!important;color:var(--text-3)!important;
      }
      html body #sidebar #vgMarketSwitch>div{
        display:grid!important;grid-template-columns:1fr 1fr!important;gap:3px!important;
        flex:1 1 auto!important;min-width:0!important;
      }
      html body #sidebar #vgMarketSwitch button{
        min-width:0!important;width:100%!important;height:22px!important;min-height:22px!important;
        padding:2px 4px!important;border-radius:5px!important;font-size:8.5px!important;
        line-height:1!important;white-space:nowrap!important;overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      html body #sidebar #vgMarketSwitch .vg-market-flag{display:none!important}
      html body .topbar-right #vgMarketSwitch{display:none!important}

      /* A versão deixa a topbar e passa a informação discreta no fim da sidebar. */
      html body #sidebar #vgBuildBadge{
        display:block!important;position:static!important;width:auto!important;height:auto!important;
        margin:2px 10px 10px!important;padding:7px 2px 0!important;
        border:0!important;border-top:1px solid var(--border)!important;border-radius:0!important;
        background:transparent!important;color:var(--text-3)!important;box-shadow:none!important;
        font-size:8px!important;line-height:1.2!important;font-weight:650!important;
        letter-spacing:.02em!important;text-align:left!important;white-space:nowrap!important;
        opacity:.82!important;flex:0 0 auto!important;
      }
      html body .topbar-right #vgBuildBadge{display:none!important}

      /* O Portefólio tinha uma segunda entrada de Notificações, redundante e cortada. */
      #v30ProfileHomeRoot .v30-profile-home.direction>header>button[onclick*="notifications"]{display:none!important}

      /* Proteção adicional: nenhum cabeçalho do Portefólio pode sair do cartão. */
      #v30ProfileHomeRoot .v30-profile-home.direction>header{
        overflow:hidden!important;min-width:0!important;align-items:flex-start!important;
      }
      #v30ProfileHomeRoot .v30-profile-home.direction>header>div{min-width:0!important}

      /* Autenticação no topo: mantém uma linha. */
      .vg-auth-pill{height:27px!important;min-height:27px!important;max-height:27px!important;overflow:hidden!important}
      .vg-auth-pill span{display:none!important}
      .vg-auth-btn{height:27px!important;min-height:27px!important;max-height:27px!important;padding:3px 7px!important;font-size:9px!important;white-space:nowrap!important}

      /* Se a largura apertar, o centro cede antes das ações da direita. */
      @media(max-width:1450px){
        html body header.topbar .topbar-pill{padding-left:5px!important;padding-right:5px!important;font-size:8.5px!important}
        #topbarComparativoPill{max-width:78px!important}
        #yearBtnsWrap{max-width:76px!important}
        .theme-dot{width:11px!important;height:11px!important}
      }
      @media(max-width:1180px){
        html body header.topbar .topbar-center{display:none!important}
        html body #sidebar #vgMarketSwitch{margin-top:5px!important}
      }
    `;
    (document.head||document.documentElement).appendChild(s);
  }

  const MONTHS=[
    ['janeiro','Jan'],['fevereiro','Fev'],['marco','Mar'],['abril','Abr'],
    ['maio','Mai'],['junho','Jun'],['julho','Jul'],['agosto','Ago'],
    ['setembro','Set'],['outubro','Out'],['novembro','Nov'],['dezembro','Dez']
  ];
  function fold(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function compactPeriod(raw){
    const clean=String(raw||'').replace(/\s+/g,' ').replace(/\s*\+\s*/g,' ').trim();
    if(!clean||clean==='—')return '—';
    const f=fold(clean),found=[];
    MONTHS.forEach((m,i)=>{if(new RegExp('\\b'+m[0]+'\\b','i').test(f))found.push({i,abbr:m[1]});});
    const year=(clean.match(/\b20\d{2}\b/)||[])[0]||'';
    if(found.length===1)return (found[0].abbr+(year?' '+year:'')).trim();
    if(found.length>1){
      found.sort((a,b)=>a.i-b.i);
      return `${found[0].abbr}–${found[found.length-1].abbr}${year?' '+year:''}`;
    }
    return clean.length>20?clean.slice(0,19)+'…':clean;
  }

  function installCompactPeriod(){
    const source=document.getElementById('headerMes');if(!source)return;
    let proxy=document.getElementById('vgHeaderMesCompact');
    if(!proxy){proxy=document.createElement('strong');proxy.id='vgHeaderMesCompact';source.insertAdjacentElement('afterend',proxy);}
    if(source.dataset.vgCompactSource!=='1'){
      source.dataset.vgCompactSource='1';
      const sync=()=>{
        const raw=String(source.textContent||'').trim();
        proxy.textContent=compactPeriod(raw);
        proxy.title=raw&&raw!=='—'?'Período selecionado: '+raw:'Período selecionado';
      };
      new MutationObserver(sync).observe(source,{childList:true,subtree:true,characterData:true});
      sync();
    }
  }

  function removeLoadPopup(){
    const pop=document.getElementById('vgLoadPop');
    if(pop)pop.remove();
  }

  function relocateShellControls(){
    removeLoadPopup();
    const sidebar=document.getElementById('sidebar');
    if(sidebar){
      const market=document.getElementById('vgMarketSwitch');
      if(market&&market.parentElement!==sidebar){
        const firstSection=sidebar.querySelector('.sb-section');
        if(firstSection)sidebar.insertBefore(market,firstSection);else sidebar.prepend(market);
      }
      const badge=document.getElementById('vgBuildBadge');
      if(badge&&badge.parentElement!==sidebar){
        badge.textContent='VG Operations · v'+PLATFORM_BUILD;
        badge.title='Versão instalada: '+PLATFORM_BUILD;
        sidebar.appendChild(badge);
      }
    }
    installCompactPeriod();
  }

  function bootCompactShell(){
    installShellStyle();
    relocateShellControls();
    // Alguns controlos são criados por módulos no DOMContentLoaded.
    [0,60,180,450,900,1600,2600,5000].forEach(ms=>setTimeout(relocateShellControls,ms));
    // Se algum módulo legado voltar a criar o popup, remove-o sem afetar o carregamento.
    new MutationObserver(removeLoadPopup).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootCompactShell,{once:true});else bootCompactShell();

  // ----------------------------------------------------------
  // PWA / VERSION GUARD
  // ----------------------------------------------------------
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

  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
    const controlled=navigator.serviceWorker.controller;
    const oldController=!!controlled&&swBuild(controlled)!==PLATFORM_BUILD;
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
      if(oldController)setTimeout(clearUpdatingScreen,12000);
    }).catch(err=>{
      console.warn('[VG build guard] atualização PWA não disponível',err);
      clearUpdatingScreen();
    });
  }

  // Diagnóstico legível em vez de placeholder infinito se um módulo falhar.
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
