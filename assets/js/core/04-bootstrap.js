// Login prioritário: associa o botão Entrar antes do DOMContentLoaded.
(function(){
  if(document.querySelector('script[data-vg-module="early-login"]'))return;
  const s=document.createElement('script');
  s.src='assets/js/auth/early-login-v36.js';
  s.async=false;
  s.dataset.vgModule='early-login';
  document.head.appendChild(s);
})();

// ==========================================================
// MÓDULOS NATIVOS ADICIONAIS
// ==========================================================
(function(){
  if(!document.querySelector('script[data-vg-module="hotel-access-sanitizer"]')){
    const h=document.createElement('script');
    h.src='assets/js/auth/hotel-access-sanitizer-v36.js';
    h.async=false;
    h.dataset.vgModule='hotel-access-sanitizer';
    document.head.appendChild(h);
  }

  function loadGovernantaFix(){
    if(document.querySelector('script[data-vg-module="governanta-mobile-fix"]'))return;
    const g=document.createElement('script');
    g.src='assets/js/modules/governanta-mobile-fix-v36.js';
    g.async=false;
    g.dataset.vgModule='governanta-mobile-fix';
    document.head.appendChild(g);
  }
  function loadLostFoundEmailMobile(){
    if(document.querySelector('script[data-vg-module="lostfound-email-mobile"]')){loadGovernantaFix();return;}
    const e=document.createElement('script');
    e.src='assets/js/modules/lost-found-email-mobile-v36.js';
    e.async=false;
    e.dataset.vgModule='lostfound-email-mobile';
    e.onload=loadGovernantaFix;
    document.head.appendChild(e);
  }
  function loadLostFoundAccessBridge(){
    if(document.querySelector('script[data-vg-module="lostfound-access-bridge"]')){loadLostFoundEmailMobile();return;}
    const a=document.createElement('script');
    a.src='assets/js/auth/lostfound-access-bridge-v36.js';
    a.async=false;
    a.dataset.vgModule='lostfound-access-bridge';
    a.onload=loadLostFoundEmailMobile;
    document.head.appendChild(a);
  }
  function loadLostFoundStatus(){
    if(!document.querySelector('script[data-vg-module="lostfound-status-comment"]')){
      const p=document.createElement('script');
      p.src='assets/js/modules/lost-found-status-comment-v36.js';
      p.async=false;
      p.dataset.vgModule='lostfound-status-comment';
      p.onload=loadLostFoundAccessBridge;
      document.head.appendChild(p);
    }else loadLostFoundAccessBridge();
  }

  if(document.querySelector('script[data-vg-module="lostfound"]')){loadLostFoundStatus();return;}
  const s=document.createElement('script');
  s.src='assets/js/modules/lost-found-v36.js';
  s.async=false;
  s.dataset.vgModule='lostfound';
  s.onload=loadLostFoundStatus;
  document.head.appendChild(s);
})();

// Reclamações: processo nativo com workflow, decisão DO e persistência server-side.
(function(){
  if(document.querySelector('script[data-vg-module="complaints"]'))return;
  const s=document.createElement('script');
  s.src='assets/js/modules/complaints-v36.js';
  s.async=false;
  s.dataset.vgModule='complaints';
  document.head.appendChild(s);
})();

// Devoluções: aprovação DO, DAF, processamento e arquivo.
(function(){
  if(document.querySelector('script[data-vg-module="refunds"]'))return;
  const s=document.createElement('script');
  s.src='assets/js/modules/refunds-v36.js';
  s.async=false;
  s.dataset.vgModule='refunds';
  document.head.appendChild(s);
})();

// Orçamentos: 3–4 propostas, decisão DO, adjudicação e ligação à intervenção.
(function(){
  if(document.querySelector('script[data-vg-module="budgets"]'))return;
  const s=document.createElement('script');
  s.src='assets/js/modules/budgets-v36.js';
  s.async=false;
  s.dataset.vgModule='budgets';
  document.head.appendChild(s);
})();

// Energia & Consumos: faturas, persistência, análise, documentos e gestão do registo.
(function(){
  function loadEnergyRecordManagement(){
    if(document.querySelector('script[data-vg-module="energy-record-management"]'))return;
    const r=document.createElement('script');
    r.src='assets/js/modules/energy-record-management-v36.js';
    r.async=false;
    r.dataset.vgModule='energy-record-management';
    document.head.appendChild(r);
  }
  function loadEnergyDocumentDelete(){
    if(document.querySelector('script[data-vg-module="energy-document-delete-ui"]')){loadEnergyRecordManagement();return;}
    const d=document.createElement('script');
    d.src='assets/js/modules/energy-document-delete-ui-v36.js';
    d.async=false;
    d.dataset.vgModule='energy-document-delete-ui';
    d.onload=loadEnergyRecordManagement;
    document.head.appendChild(d);
  }
  function loadEnergyMultiPdf(){
    if(document.querySelector('script[data-vg-module="energy-multi-pdf"]')){loadEnergyDocumentDelete();return;}
    const x=document.createElement('script');
    x.src='assets/js/modules/energy-multi-pdf-v36.js';
    x.async=false;
    x.dataset.vgModule='energy-multi-pdf';
    x.onload=loadEnergyDocumentDelete;
    document.head.appendChild(x);
  }
  function loadEnergyMenuFix(){
    if(document.querySelector('script[data-vg-module="energy-menu-fix"]')){loadEnergyMultiPdf();return;}
    const f=document.createElement('script');
    f.src='assets/js/modules/energy-menu-fix-v36.js';
    f.async=false;
    f.dataset.vgModule='energy-menu-fix';
    f.onload=loadEnergyMultiPdf;
    document.head.appendChild(f);
  }
  if(document.querySelector('script[data-vg-module="energy"]')){loadEnergyMenuFix();return;}
  const s=document.createElement('script');
  s.src='assets/js/modules/energy-v36.js';
  s.async=false;
  s.dataset.vgModule='energy';
  s.onload=loadEnergyMenuFix;
  document.head.appendChild(s);
})();

// Banco de Horas & Férias: módulo consolidado, sem observers/polling auxiliares.
(function(){
  if(document.querySelector('script[data-vg-module="hrbalances"]'))return;
  const s=document.createElement('script');
  s.src='assets/js/modules/hr-balances-v36.js';
  s.async=false;
  s.dataset.vgModule='hrbalances';
  document.head.appendChild(s);
})();

function drawerOpen() {
  document.getElementById('sidebar').classList.add('open');
  const ov = document.getElementById('drawerOverlay');
  ov.style.display = 'block';
  requestAnimationFrame(() => ov.classList.add('open'));
  document.getElementById('hamburgerBtn').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function drawerClose() {
  document.getElementById('sidebar').classList.remove('open');
  const ov = document.getElementById('drawerOverlay');
  ov.classList.remove('open');
  setTimeout(() => { if (!ov.classList.contains('open')) ov.style.display = 'none'; }, 300);
  document.getElementById('hamburgerBtn').classList.remove('open');
  document.body.style.overflow = '';
}
function drawerToggle() {
  document.getElementById('sidebar').classList.contains('open') ? drawerClose() : drawerOpen();
}
// ==========================================================
// END DRAWER
// ==========================================================

// ── Upload status helper ──────────────────────────────────
function uploadSetStatus(elId, msg, ok) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = msg; el.style.color = ok ? '#2ecc8f' : '#e05c4e'; }
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.sb-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (window.innerWidth <= 960) drawerClose(); });
  });
  buildMesButtons();
  if (Object.keys(STORE).length > 0) {
    const defaultMes = Math.max(...Object.keys(STORE).map(Number));
    selectedMeses.add(defaultMes);
    applyMesSelection();
  }
  const hash = window.location.hash.replace('#', '');
  const validViews = ['resumo','receitas','recdet','receitasdet','ab','housekeeping','custos','kpis','pl','costanalysis','cua','reputacao','lostfound','complaints','refunds','budgets','energy','hrbalances','ocupacao','instagram','agenda','hoteis','upload','alertas','compare','ranking','sazonalidade','simulador','notas'];
  setView(hash && validViews.includes(hash) ? hash : 'resumo');
  window.addEventListener('popstate', () => {
    const h = window.location.hash.replace('#', '');
    if (h && validViews.includes(h)) setView(h);
  });
  idbAutoRestore();
});
