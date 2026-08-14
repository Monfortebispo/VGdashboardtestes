
(function(){
  'use strict';
  var V17 = { booted:false, version:'17 clean corrigida' };

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function txt(el, value){ if(el) el.textContent = value; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function toast(msg, bad){
    try { if (typeof window.showToast === 'function') return window.showToast(msg, !!bad); } catch(e){}
    if (bad) console.error(msg); else console.log(msg);
  }
  function getStoreMonths(){
    try { return Object.keys(window.STORE || {}).map(Number).filter(Boolean).sort(function(a,b){ return a-b; }); }
    catch(e){ return []; }
  }
  function getHotelList(){
    try {
      if (window.RAW && Array.isArray(window.RAW.hotel_list)) return window.RAW.hotel_list.slice();
      var months = getStoreMonths();
      var set = new Set();
      months.forEach(function(m){ ((window.STORE[m] && window.STORE[m].hotel_list) || []).forEach(function(h){ set.add(h); }); });
      return Array.from(set);
    } catch(e){ return []; }
  }
  function getSelectedHotelCount(){
    try { if (window.selectedHotels && typeof window.selectedHotels.size === 'number') return window.selectedHotels.size; } catch(e){}
    return getHotelList().length;
  }
  function monthName(m){
    var names = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return names[Number(m)] || String(m);
  }
  function getSelectedMonthsText(){
    try {
      var arr = window.selectedMeses && typeof window.selectedMeses.forEach === 'function' ? Array.from(window.selectedMeses).sort(function(a,b){return a-b;}) : getStoreMonths();
      if (!arr.length) return 'sem meses carregados';
      if (arr.length === 1) return monthName(arr[0]);
      if (arr.length === getStoreMonths().length) return 'todos os meses carregados';
      return arr.map(monthName).join(' + ');
    } catch(e){ return '—'; }
  }
  function viewLabel(){
    var active = qs('.sb-nav-btn.active');
    return active ? active.textContent.replace(/\s+/g,' ').trim() : 'Resumo';
  }

  function ensureNavSearch(){
    var nav = qs('.sb-nav');
    if (!nav || qs('#v17NavSearch')) return;
    var wrap = document.createElement('div');
    wrap.className = 'v17-nav-search-wrap';
    wrap.innerHTML = '<input id="v17NavSearch" class="v17-nav-search" type="search" autocomplete="off" placeholder="Pesquisar módulo...">';
    nav.parentNode.insertBefore(wrap, nav);
    var input = qs('#v17NavSearch');
    input.addEventListener('input', function(){
      var term = input.value.trim().toLowerCase();
      qsa('.sb-nav-btn').forEach(function(btn){
        var hit = !term || btn.textContent.toLowerCase().indexOf(term) >= 0;
        btn.classList.toggle('v17-hidden-by-search', !hit);
      });
      qsa('.sb-nav-group').forEach(function(group){
        var visible = qsa('.sb-nav-btn', group).some(function(btn){ return !btn.classList.contains('v17-hidden-by-search'); });
        group.classList.toggle('v17-hidden-by-search', !visible && !!term);
      });
    });
  }

  function ensureScopeCard(){
    // v17: o cartão 'Âmbito activo' foi removido a pedido do utilizador.
    var existing = qs('#v17ScopeCard');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function updateScopeCard(){
    // Mantida como no-op para não interferir com wrappers antigos que a chamam.
    var existing = qs('#v17ScopeCard');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function clearUxFilters(){
    try { if (typeof window.selectAllMeses === 'function') window.selectAllMeses(); } catch(e){}
    try { if (typeof window.toggleAll === 'function') window.toggleAll(true); } catch(e){}
    var hs = qs('#sidebarHotelSearch'); if (hs) { hs.value=''; try { if (typeof window.filterHotelSidebar === 'function') window.filterHotelSidebar(); } catch(e){} }
    updateScopeCard();
    toast('Filtros repostos.');
  }

  function safeSetView(view){
    try {
      if (typeof window.setView === 'function') {
        window.setView(view);
        window.setTimeout(updateScopeCard, 120);
      }
    } catch(e){ console.error('[v17] erro ao mudar vista', e); }
  }

  function ensureCuaPanel(){
    var view = qs('#view-cua');
    if (!view || qs('#v17CuaPanel')) return;
    var panel = document.createElement('div');
    panel.id = 'v17CuaPanel';
    panel.className = 'v17-cua-panel';
    panel.innerHTML = ''+
      '<div class="v17-cua-head">'+
        '<div>'+ 
          '<div class="v17-cua-title">Custo / Actividade — leitura operacional</div>'+ 
          '<div class="v17-cua-desc">Atalhos para chegar rapidamente aos desvios por hotel, rubrica e artigo. A lógica de cálculo original foi mantida.</div>'+ 
        '</div>'+
        '<div class="v17-cua-actions">'+
          '<button type="button" data-tab="resumo">Resumo</button>'+ 
          '<button type="button" data-tab="ranking">Ranking hotéis</button>'+ 
          '<button type="button" data-tab="rubrica">Rubricas</button>'+ 
          '<button type="button" data-action="artigos" class="primary">Artigos com desvio</button>'+ 
        '</div>'+ 
      '</div>';
    view.insertBefore(panel, view.firstChild);
    panel.addEventListener('click', function(ev){
      var btn = ev.target.closest('button');
      if (!btn) return;
      var tab = btn.getAttribute('data-tab');
      var action = btn.getAttribute('data-action');
      if (tab && typeof window.cuaSetTab === 'function') {
        try { window.cuaSetTab(tab); } catch(e){ console.warn('[v17] CUA tab', e); }
      }
      if (action === 'artigos') showArticleDeviations();
    });
  }

  function showArticleDeviations(){
    safeSetView('cua');
    window.setTimeout(function(){
      try {
        if (typeof window.cuaAnswerArtigos === 'function') return window.cuaAnswerArtigos();
        if (typeof window.cuaPerguntar === 'function') return window.cuaPerguntar('artigos com desvio');
      } catch(e){ console.warn('[v17] artigos com desvio', e); }
      toast('Não encontrei a função de artigos com desvio nesta versão.', true);
    }, 180);
  }

  function enhanceChartDefaults(){
    try {
      if (!window.Chart || !window.Chart.defaults) return;
      window.Chart.defaults.font = window.Chart.defaults.font || {};
      window.Chart.defaults.font.family = "'Plus Jakarta Sans', Arial, sans-serif";
      window.Chart.defaults.font.size = 12;
      window.Chart.defaults.plugins = window.Chart.defaults.plugins || {};
      window.Chart.defaults.plugins.legend = window.Chart.defaults.plugins.legend || {};
      window.Chart.defaults.plugins.legend.labels = window.Chart.defaults.plugins.legend.labels || {};
      window.Chart.defaults.plugins.legend.labels.boxWidth = 10;
      window.Chart.defaults.plugins.legend.labels.boxHeight = 10;
      window.Chart.defaults.plugins.tooltip = window.Chart.defaults.plugins.tooltip || {};
      window.Chart.defaults.plugins.tooltip.padding = 10;
      window.Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '700' };
      window.Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    } catch(e){ console.warn('[v17] Chart defaults', e); }
  }

  function restoreSnapshotFromObject(snap){
    if (typeof window.restoreFromSnapshot !== 'function') throw new Error('restoreFromSnapshot não está disponível.');
    window.restoreFromSnapshot(snap);
    var meses = Object.keys(window.STORE || {}).length;
    var hoteis = Object.keys(window.REP_STORE || {}).length;
    try {
      var dt = snap.savedAt ? new Date(snap.savedAt).toLocaleString('pt-PT') : '—';
      if (typeof window.idbSetStatus === 'function') window.idbSetStatus('✓ Importado de ficheiro · guardado em ' + dt);
    } catch(e){}
    toast('✓ Sessão importada — ' + meses + ' meses P&L, ' + hoteis + ' hotéis reputação');
    window.setTimeout(function(){ updateScopeCard(); ensureCuaPanel(); }, 250);
  }

  function installZipSessionImport(){
    if (window.__v17ZipImportInstalled) return;
    window.__v17ZipImportInstalled = true;
    var originalImport = window.importSession;
    window.importSession = function(event){
      var file = event && event.target && event.target.files && event.target.files[0];
      if (!file) return;
      var name = String(file.name || '').toLowerCase();
      if (!name.endsWith('.zip')) {
        if (typeof originalImport === 'function') return originalImport.call(this, event);
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e){
        try {
          if (!window.fflate || typeof window.fflate.unzipSync !== 'function') throw new Error('Leitor ZIP não carregado.');
          var bytes = new Uint8Array(e.target.result);
          var files = window.fflate.unzipSync(bytes);
          var jsonName = Object.keys(files).find(function(k){ return /\.json$/i.test(k); });
          if (!jsonName) throw new Error('O ZIP não contém ficheiro JSON de sessão.');
          var text = window.fflate.strFromU8(files[jsonName]);
          var snap = JSON.parse(text);
          restoreSnapshotFromObject(snap);
        } catch(err) {
          console.error('[v17] Erro ao importar ZIP', err);
          toast('Erro ao importar ZIP: ' + err.message, true);
        }
      };
      reader.readAsArrayBuffer(file);
      try { event.target.value = ''; } catch(e){}
    };
  }

  function syncSessionInputs(){
    qsa('input[type="file"]').forEach(function(input){
      var acc = input.getAttribute('accept') || '';
      if (acc === '.json') input.setAttribute('accept', '.json,.zip');
    });
    qsa('label.sb-action-btn').forEach(function(label){
      if (label.textContent.indexOf('Importar sessão (.json)') >= 0) {
        label.childNodes.forEach(function(n){
          if (n.nodeType === 3 && n.nodeValue.indexOf('Importar sessão') >= 0) n.nodeValue = ' Importar sessão (.json/.zip) ';
        });
      }
    });
  }

  function wrapFunction(name){
    try {
      var fn = window[name];
      if (typeof fn !== 'function' || fn.__v17Wrapped) return;
      var wrapped = function(){
        var result = fn.apply(this, arguments);
        window.setTimeout(updateScopeCard, 60);
        window.setTimeout(ensureCuaPanel, 60);
        return result;
      };
      wrapped.__v17Wrapped = true;
      window[name] = wrapped;
    } catch(e){}
  }

  function boot(){
    if (V17.booted) { updateScopeCard(); return; }
    V17.booted = true;
    // Pesquisa lateral removida por estabilidade e clareza.
    ensureScopeCard();
    ensureCuaPanel();
    enhanceChartDefaults();
    installZipSessionImport();
    syncSessionInputs();
    ['setView','refreshAll','buildMesButtons','toggleMes','selectAllMeses','toggleAll','applyMesSelection'].forEach(wrapFunction);
    updateScopeCard();
    window.setTimeout(updateScopeCard, 500);
    window.setTimeout(updateScopeCard, 1500);
    console.info('[v17] Clean corrigida carregada sem alterar o motor da v16.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
