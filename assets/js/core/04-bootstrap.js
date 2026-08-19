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

  if(document.querySelector('script[data-vg-module="lostfound"]'))return;
  const s=document.createElement('script');
  s.src='assets/js/modules/lost-found-v36.js';
  s.async=false;
  s.dataset.vgModule='lostfound';
  s.onload=()=>{
    if(document.querySelector('script[data-vg-module="lostfound-status-comment"]'))return;
    const p=document.createElement('script');
    p.src='assets/js/modules/lost-found-status-comment-v36.js';
    p.async=false;
    p.dataset.vgModule='lostfound-status-comment';
    document.head.appendChild(p);
  };
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
  // Close drawer when a nav button is tapped on mobile
  document.querySelectorAll('.sb-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (window.innerWidth <= 960) drawerClose(); });
  });
  buildMesButtons();  // also calls updateYearGlobals internally
  // Default: load highest month available
  if (Object.keys(STORE).length > 0) {
    const defaultMes = Math.max(...Object.keys(STORE).map(Number));
    selectedMeses.add(defaultMes);
    applyMesSelection();
  }
  // Hash routing — restore view from URL, else default to resumo
  const hash = window.location.hash.replace('#', '');
  const validViews = ['resumo','receitas','recdet','receitasdet','ab','housekeeping','custos','kpis','pl','costanalysis','cua','reputacao','lostfound','ocupacao','instagram','agenda','hoteis','upload','alertas','compare','ranking','sazonalidade','simulador','notas'];
  setView(hash && validViews.includes(hash) ? hash : 'resumo');
  window.addEventListener('popstate', () => {
    const h = window.location.hash.replace('#', '');
    if (h && validViews.includes(h)) setView(h);
  });
  // v18: módulos secundários inicializam quando a respetiva vista é aberta.
  // Evita renderizar Reputação, Agenda e Hotéis durante o primeiro paint.
  // Auto-restauro ao arrancar (sobrepõe dados embutidos se existir sessão guardada)
  idbAutoRestore();
});
