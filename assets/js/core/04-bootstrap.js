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

  function loadLostFoundEmailMobile(){
    if(document.querySelector('script[data-vg-module="lostfound-email-mobile"]'))return;
    const e=document.createElement('script');
    e.src='assets/js/modules/lost-found-email-mobile-v36.js';
    e.async=false;
    e.dataset.vgModule='lostfound-email-mobile';
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

(function(){
  function loadAccess(){
    if(document.querySelector('script[data-vg-module="hrbalances-access"]'))return;
    const a=document.createElement('script');
    a.src='assets/js/auth/hr-balances-access-v36.js';
    a.async=false;
    a.dataset.vgModule='hrbalances-access';
    document.head.appendChild(a);
  }
  if(document.querySelector('script[data-vg-module="hrbalances"]')){loadAccess();return;}
  const s=document.createElement('script');
  s.src='assets/js/modules/hr-balances-v36.js';
  s.async=false;
  s.dataset.vgModule='hrbalances';
  s.onload=loadAccess;
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
  const validViews = ['resumo','receitas','recdet','receitasdet','ab','housekeeping','custos','kpis','pl','costanalysis','cua','reputacao','lostfound','hrbalances','ocupacao','instagram','agenda','hoteis','upload','alertas','compare','ranking','sazonalidade','simulador','notas'];
  setView(hash && validViews.includes(hash) ? hash : 'resumo');
  window.addEventListener('popstate', () => {
    const h = window.location.hash.replace('#', '');
    if (h && validViews.includes(h)) setView(h);
  });
  idbAutoRestore();
});
