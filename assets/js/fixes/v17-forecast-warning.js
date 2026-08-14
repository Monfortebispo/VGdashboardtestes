
(function(){
  'use strict';
  var MONTHS = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var installDone = false;
  function qs(s, root){ return (root || document).querySelector(s); }
  function qsa(s, root){ return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function monthName(m){ return MONTHS[Number(m)] || String(m); }
  function syncGlobals(){
    try { if (typeof STORE !== 'undefined') window.STORE = STORE; } catch(e) {}
    try { if (typeof RAW !== 'undefined') window.RAW = RAW; } catch(e) {}
    try { if (typeof selectedMeses !== 'undefined') window.selectedMeses = selectedMeses; } catch(e) {}
  }
  function storeMonths(){
    try { if (typeof STORE !== 'undefined') return Object.keys(STORE).map(Number).filter(Boolean).sort(function(a,b){return a-b;}); } catch(e) {}
    try { return Object.keys(window.STORE || {}).map(Number).filter(Boolean).sort(function(a,b){return a-b;}); } catch(e) {}
    return [];
  }
  function selectedMonths(){
    try {
      if (typeof selectedMeses !== 'undefined' && selectedMeses && typeof selectedMeses.forEach === 'function') {
        var a = Array.from(selectedMeses).map(Number).filter(Boolean).sort(function(x,y){return x-y;});
        if (a.length) return a;
      }
    } catch(e) {}
    try {
      if (window.selectedMeses && typeof window.selectedMeses.forEach === 'function') {
        var b = Array.from(window.selectedMeses).map(Number).filter(Boolean).sort(function(x,y){return x-y;});
        if (b.length) return b;
      }
    } catch(e) {}
    var active = [];
    qsa('.sb-mes-btn.active, #gfbMesBtns button.active').forEach(function(btn){
      var id = btn.id || '';
      var m = Number((id.match(/(\d{1,2})$/) || [])[1]);
      if (!m) {
        var txt = btn.textContent.toLowerCase();
        MONTHS.forEach(function(n, idx){ if(idx && txt.indexOf(n.toLowerCase()) >= 0) m = idx; });
      }
      if (m) active.push(m);
    });
    active = Array.from(new Set(active)).sort(function(a,b){return a-b;});
    return active.length ? active : storeMonths();
  }
  function monthHasReal2026(m){
    m = Number(m);
    try {
      var store = (typeof STORE !== 'undefined' ? STORE : window.STORE || {})[m];
      if (!store) return false;
      // Um STORE sintético (previsão) nunca conta como real
      if (store['__orc_forecast__']) return false;
      var yr = '2026';
      return (store.hotel_list || []).some(function(h){
        var ops = store.hotels_ops && store.hotels_ops[h];
        var v = ops && ops['Receita Total'] && ops['Receita Total'][yr];
        return v != null && Number(v) > 0;
      });
    } catch(e) { return false; }
  }
  function monthIsForecast(m){
    m = Number(m);
    if (!m) return false;
    // Se já foram carregados dados reais de 2026 para este mês, não é previsão
    if (monthHasReal2026(m)) return false;
    var now = new Date();
    var year = now.getFullYear();
    var currentMonth = now.getMonth() + 1;
    var notClosedByDate = year < 2026 ? true : (year === 2026 ? m >= currentMonth : false);
    var budgetRule = m >= 7;
    return notClosedByDate || budgetRule;
  }
  function forecastMonths(){
    return selectedMonths().filter(monthIsForecast);
  }
  function unique(arr){ return Array.from(new Set(arr)); }
  function insertAfter(ref, node){ if(ref && ref.parentNode) ref.parentNode.insertBefore(node, ref.nextSibling); }
  function ensureTopPill(){
    var pill = qs('#v17ForecastTopbarPill');
    if (pill) return pill;
    pill = document.createElement('div');
    pill.id = 'v17ForecastTopbarPill';
    pill.className = 'v17-prev-top-pill';
    pill.textContent = '⚠ Previsão';
    var right = qs('.topbar-right') || qs('.topbar-center') || qs('.topbar');
    if (right) right.appendChild(pill);
    return pill;
  }
  function ensureWarning(){
    var box = qs('#v17ForecastWarning');
    if (box) return box;
    box = document.createElement('div');
    box.id = 'v17ForecastWarning';
    box.className = 'v17-prev-warning';
    box.setAttribute('role','status');
    box.setAttribute('aria-live','polite');
    box.innerHTML = '<div class="ico">⚠</div><div><div class="title">Período com previsão</div><div class="txt" id="v17ForecastWarningText"></div></div>';
    var gfb = qs('#globalFilterBar');
    var main = qs('.main');
    if (gfb) insertAfter(gfb, box);
    else if (main) main.insertBefore(box, main.firstChild);
    else document.body.insertBefore(box, document.body.firstChild);
    return box;
  }
  function ensureOrcNote(){
    var view = qs('#view-orcamento');
    if (!view) return null;
    var note = qs('#v17ForecastOrcNote');
    if (note) return note;
    note = document.createElement('div');
    note.id = 'v17ForecastOrcNote';
    note.className = 'v17-prev-orc-note';
    note.textContent = 'Atenção: julho a dezembro são previsão/orçamento. Regra aplicada: receitas = 2025 × 1,05; custos = 2025 × 1,08.';
    view.insertBefore(note, view.firstChild);
    return note;
  }
  function badgeMonthButtons(forecastSet){
    qsa('.v17-prev-month-badge').forEach(function(b){ b.remove(); });
    qsa('.sb-mes-btn, #gfbMesBtns button, .mes-btn').forEach(function(btn){
      var id = btn.id || '';
      var m = Number((id.match(/(\d{1,2})$/) || [])[1]);
      if (!m) {
        var low = btn.textContent.toLowerCase();
        MONTHS.forEach(function(n, idx){ if(idx && low.indexOf(n.toLowerCase()) >= 0) m = idx; });
      }
      if (m && forecastSet.indexOf(m) >= 0 && btn.textContent.indexOf('Prev.') < 0) {
        var b = document.createElement('span');
        b.className = 'v17-prev-month-badge';
        b.textContent = 'Prev.';
        btn.appendChild(b);
      }
    });
  }
  function updateForecastWarning(){
    syncGlobals();
    var months = unique(forecastMonths()).sort(function(a,b){return a-b;});
    var has = months.length > 0;
    var box = ensureWarning();
    var txt = qs('#v17ForecastWarningText');
    var pill = ensureTopPill();
    var note = ensureOrcNote();
    if (box) box.classList.toggle('visible', has);
    if (pill) pill.classList.toggle('visible', has);
    if (note) note.classList.toggle('visible', has && selectedMonths().some(function(m){ return Number(m) >= 7; }));
    badgeMonthButtons(months);
    if (txt && has) {
      var labels = months.map(monthName).join(', ');
      var hasBudget = months.some(function(m){ return Number(m) >= 7; });
      var msg = 'Está a visualizar ' + labels + '. Estes valores não devem ser tratados como fecho real.';
      if (hasBudget) msg += ' Para julho a dezembro aplica-se a regra de orçamento: receitas = 2025 × 1,05 e custos = 2025 × 1,08.';
      else msg += ' O mês em curso/futuro ainda está aberto e pode mudar.';
      txt.textContent = msg;
    }
  }
  function wrap(name){
    try {
      var fn = window[name];
      if (typeof fn !== 'function' || fn.__v17ForecastWrapped) return;
      var wrapped = function(){
        var r = fn.apply(this, arguments);
        setTimeout(updateForecastWarning, 80);
        setTimeout(updateForecastWarning, 350);
        return r;
      };
      wrapped.__v17ForecastWrapped = true;
      window[name] = wrapped;
    } catch(e) {}
  }
  function install(){
    if (installDone) return;
    installDone = true;
    syncGlobals();
    ensureTopPill();
    ensureWarning();
    ensureOrcNote();
    ['setView','refreshAll','buildMesButtons','toggleMes','selectAllMeses','applyMesSelection','restoreFromSnapshot','importSession','loadFromIndexedDB'].forEach(wrap);
    document.addEventListener('click', function(ev){
      if (ev.target && ev.target.closest && ev.target.closest('.sb-mes-btn,#gfbMesBtns button,.mes-btn,.sb-nav-btn')) setTimeout(updateForecastWarning, 120);
    }, true);
    document.addEventListener('change', function(){ setTimeout(updateForecastWarning, 160); }, true);
    if (window.MutationObserver) {
      var obs = new MutationObserver(function(){ setTimeout(updateForecastWarning, 80); });
      obs.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
      setTimeout(function(){ try { obs.disconnect(); } catch(e){} }, 12000);
    }
    updateForecastWarning();
    setTimeout(updateForecastWarning, 500);
    setTimeout(updateForecastWarning, 1500);
    setTimeout(updateForecastWarning, 3000);
    console.info('[v17] Aviso de previsão corrigido carregado de forma isolada.');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
