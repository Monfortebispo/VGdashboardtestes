// ==========================================================
// VG DASHBOARD — RUNTIME INTERNO v14 (Fase 1 / P0)
// Namespace transversal para eventos, rotas e coordenação de arranque.
// Mantém compatibilidade com as funções globais existentes.
// ==========================================================
(function(){
  'use strict';
  const VG = window.VG = window.VG || {};
  const bus = new EventTarget();

  VG.version = '14.0';
  window.SHARED_API_URL = window.SHARED_API_URL || '/.netlify/functions/dashboard-sessao';
  VG.shared = VG.shared || { endpoint: window.SHARED_API_URL };
  VG.events = VG.events || {
    on(name, handler){ bus.addEventListener(name, handler); return () => bus.removeEventListener(name, handler); },
    once(name, handler){ bus.addEventListener(name, handler, {once:true}); },
    emit(name, detail){ bus.dispatchEvent(new CustomEvent(name, {detail: detail || {}})); }
  };

  // ----------------------------------------------------------
  // REGISTO CANÓNICO DE ROTAS
  // Uma única fonte de verdade para os IDs de módulos/vistas.
  // Nesta primeira etapa não substitui setView(); serve de contrato
  // transversal e permite eliminar listas divergentes progressivamente.
  // ----------------------------------------------------------
  const ROUTES = [
    'resumo','hotel360','hoteis','fichahotel',
    'agenda','actions','approvals','cityledger','messages',
    'receitas','receitasdet','custos','pl','unitEconomics','revenuehub','benchmark','anomalies',
    'ab','housekeeping','compras','reputacao','instagram',
    'lostfound','complaints','refunds','unbilled','budgets','energy','hrbalances',
    'documents','automaticreports','analyticalassistant',
    'ocupacao','costanalysis','cua','compare','ranking','sazonalidade','simulador','orcamento','alertas','notas',
    'datacenter','governance','backup','upload'
  ];
  const ROUTE_ALIASES = Object.freeze({
    recdet:'receitasdet',
    kpis:'resumo',
    hotelperformance:'hotel360',
    revenueint:'revenuehub',
    forecast:'revenuehub',
    scenariocompare:'revenuehub',
    'actions-v30':'actions'
  });
  const routeSet = new Set(ROUTES);
  VG.routes = Object.assign(VG.routes || {}, {
    all(){ return ROUTES.slice(); },
    aliases(){ return Object.assign({}, ROUTE_ALIASES); },
    canonical(id){
      const key = String(id || '').replace(/^#/, '');
      return ROUTE_ALIASES[key] || key;
    },
    isKnown(id){
      const key = String(id || '').replace(/^#/, '');
      return routeSet.has(key) || routeSet.has(ROUTE_ALIASES[key]);
    }
  });

  VG.state = VG.state || {
    changed(reason, detail){
      VG.events.emit('state:changed', Object.assign({reason: reason || 'unknown', at: Date.now()}, detail || {}));
    },
    currentYear(){
      try { if (typeof YR_CUR !== 'undefined' && YR_CUR) return String(YR_CUR); } catch(e){}
      return String(new Date().getFullYear());
    },
    previousYear(){
      try { if (typeof YR_PREV !== 'undefined' && YR_PREV) return String(YR_PREV); } catch(e){}
      return String(Number(VG.state.currentYear()) - 1);
    },
    selectedMonths(){
      try { if (typeof selectedMeses !== 'undefined' && selectedMeses && selectedMeses.size) return Array.from(selectedMeses).map(Number).filter(Boolean).sort((a,b)=>a-b); } catch(e){}
      try { return Object.keys(typeof STORE !== 'undefined' ? STORE : {}).map(Number).filter(Boolean).sort((a,b)=>a-b); } catch(e){ return []; }
    }
  };

  VG.util = VG.util || {
    clone(value){ return value == null ? value : JSON.parse(JSON.stringify(value)); },
    monthName(month){
      const names=['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      return names[Number(month)] || String(month);
    },
    escapeHtml(value){
      return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  };

  // ----------------------------------------------------------
  // COORDENADOR DE ARRANQUE
  // Problema anterior: idbAutoRestore() podia arrancar pelo bootstrap,
  // pelo restore-after-auth e pelo pós-login em simultâneo.
  // O coordenador mantém duas fases legítimas:
  //   1) local         — antes de existir sessão/token;
  //   2) authenticated — depois do login, com acesso aos dados partilhados.
  // Cada fase corre no máximo uma vez por sessão e nunca concorre com a outra.
  // ----------------------------------------------------------
  const startup = VG.startup = VG.startup || {};
  startup.status = startup.status || {
    installed:false,
    local:'pending',
    authenticated:'pending',
    lastError:null
  };
  let localPromise = null;
  let authenticatedPromise = null;
  let authenticatedToken = '';
  let serial = Promise.resolve();

  function authToken(){
    try { return (typeof window.vgAuthToken === 'function' && window.vgAuthToken()) || ''; }
    catch(e){ return ''; }
  }

  function installRestoreCoordinator(){
    if(startup.status.installed) return true;
    const original = window.idbAutoRestore;
    if(typeof original !== 'function') return false;
    if(original.__vgStartupCoordinated){ startup.status.installed = true; return true; }

    async function coordinatedRestore(){
      const token = authToken();
      const phase = token ? 'authenticated' : 'local';

      // Um token diferente representa uma nova sessão autenticada. Não reutilizar
      // a Promise da conta anterior, caso contrário o novo utilizador poderia
      // ficar sem sincronizar os dados partilhados após login.
      if(phase === 'authenticated' && token !== authenticatedToken){
        authenticatedToken = token;
        authenticatedPromise = null;
        startup.status.authenticated = 'pending';
      }

      if(phase === 'local' && localPromise) return localPromise;
      if(phase === 'authenticated' && authenticatedPromise) return authenticatedPromise;

      const args = arguments;
      const self = this;
      const run = async function(){
        startup.status[phase] = 'running';
        VG.events.emit('startup:restore-start', {phase});
        try {
          const result = await original.apply(self, args);
          startup.status[phase] = 'done';
          startup.status.lastError = null;
          VG.events.emit('startup:restore-done', {phase});
          return result;
        } catch(err) {
          startup.status[phase] = 'error';
          startup.status.lastError = String(err?.message || err || 'Erro desconhecido');
          VG.events.emit('startup:restore-error', {phase,error:startup.status.lastError});
          throw err;
        }
      };

      // Serializa as duas fases. Se o login ocorrer enquanto o restauro local
      // ainda decorre, a sincronização autenticada espera pela conclusão local.
      const queued = serial.then(run, run);
      serial = queued.catch(()=>{});
      if(phase === 'local') localPromise = queued;
      else authenticatedPromise = queued;
      return queued;
    }

    coordinatedRestore.__vgStartupCoordinated = true;
    coordinatedRestore.__vgOriginal = original;
    window.idbAutoRestore = coordinatedRestore;
    startup.status.installed = true;
    startup.restore = coordinatedRestore;
    return true;
  }

  startup.installRestoreCoordinator = installRestoreCoordinator;
  startup.resetAuthenticatedPhase = function(){
    authenticatedPromise = null;
    authenticatedToken = '';
    startup.status.authenticated = 'pending';
  };

  // Como este ficheiro é o primeiro script defer do runtime, este listener é
  // registado antes do bootstrap. Quando DOMContentLoaded dispara, o módulo de
  // persistência já definiu idbAutoRestore(), permitindo embrulhá-lo antes da
  // primeira chamada do bootstrap.
  document.addEventListener('DOMContentLoaded', function(){
    installRestoreCoordinator();
  }, {once:true});
})();
