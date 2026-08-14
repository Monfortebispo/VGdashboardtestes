
(function(){
  'use strict';
  if(window.__VG_NAV_SHELL__) return;
  window.__VG_NAV_SHELL__ = true;
  var modules = [
    ['resumo','◆','Visão Executiva','Operação'],
    ['ocupacao','▥','Ocupação','Revenue'],
    ['revenueint','◈','Revenue Intelligence','Revenue'],
    ['custos','↘','Custos','Financeiro'],
    ['costanalysis','⌁','Análise de Custos','Financeiro'],
    ['cua','⚡','Custo / Actividade','Financeiro'],
    ['compras','▤','Compras & Artigos','Financeiro'],
    ['pl','▦','P&L USALI','Financeiro'],
    ['sazonalidade','◌','Sazonalidade','Revenue'],
    ['orcamento','▣','Orçamento','Planeamento'],
    ['alertas','!','Alertas','Planeamento'],
    ['upload','⇧','Carregar Docs','Admin']
  ];
  var quick = ['resumo','ocupacao','custos','cua','sazonalidade','orcamento'];
  var idx = 0, results = modules.slice();
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function mod(id){for(var i=0;i<modules.length;i++){if(modules[i][0]===id)return modules[i]}return modules[0]}
  function go(id){
    try{
      if(typeof window.setView === 'function') window.setView(id);
      else { var b=q('#nav-'+id); if(b) b.click(); }
      closeCmd();
    }catch(e){console.error('VG navigation error',e)}
  }
  function buildDock(){
    var d=q('#vgNavDock'); if(!d) return;
    var html = '<button class="vg-nav-primary" data-cmd="1">⌕ Comando</button>';
    quick.forEach(function(id){ var m=mod(id); html += '<button data-view="'+esc(m[0])+'">'+esc(m[1])+' '+esc(m[2])+'</button>'; });
    html += '<button data-theme="toggle">Original</button>';
    d.innerHTML=html;
    qa('[data-view]',d).forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-view'))})});
    q('[data-cmd]',d).addEventListener('click',openCmd);
    q('[data-theme]',d).addEventListener('click',function(){
      var cur = document.body.classList.contains('vg-interface-modern') ? '2.0' : document.body.classList.contains('theme-v2') ? 'v2' : 'original';
      var next = cur === '2.0' ? 'original' : cur === 'original' ? 'v2' : '2.0';
      applyThemeMode(next);
    });
  }
  function applyThemeMode(mode){
    document.body.classList.remove('vg-interface-modern','theme-v2');
    if(mode === '2.0') document.body.classList.add('vg-interface-modern');
    if(mode === 'v2') document.body.classList.add('theme-v2');
    try{ localStorage.setItem('vg_theme_mode', mode); }catch(e){}
    var btn = q('#vgNavDock [data-theme]');
    if(btn) btn.textContent = mode === '2.0' ? 'Original' : mode === 'original' ? 'V2' : 'Interface 2.0';
    if(typeof buildChartsResumo === 'function' && currentView === 'resumo' && typeof RAW !== 'undefined' && RAW) buildChartsResumo();
  }
  function buildCmd(){
    var el=q('#vgNavCmd'); if(!el) return;
    el.innerHTML = '<div class="vg-nav-cmd-head"><input id="vgNavInput" placeholder="Pesquisar módulo: custos, ocupação, orçamento…" autocomplete="off"><button id="vgNavClose">Fechar</button></div><div class="vg-nav-cmd-list" id="vgNavList"></div>';
    q('#vgNavClose').addEventListener('click',closeCmd);
    q('#vgNavInput').addEventListener('input',renderCmd);
    q('#vgNavBackdrop').addEventListener('click',closeCmd);
    renderCmd();
  }
  function renderCmd(){
    var input=q('#vgNavInput'); var list=q('#vgNavList'); if(!list) return;
    var term=(input&&input.value||'').toLowerCase().trim();
    results=modules.filter(function(m){return !term || (m[0]+' '+m[2]+' '+m[3]).toLowerCase().indexOf(term)>=0});
    if(idx>=results.length) idx=Math.max(0,results.length-1);
    if(!results.length){list.innerHTML='<div style="padding:20px;color:#64748b;font-weight:800">Sem resultados.</div>';return;}
    list.innerHTML=results.map(function(m,i){return '<div class="vg-nav-cmd-item '+(i===idx?'active':'')+'" data-view="'+esc(m[0])+'"><div><strong>'+esc(m[1])+' '+esc(m[2])+'</strong><br><span>'+esc(m[3])+'</span></div><span>Enter</span></div>';}).join('');
    qa('[data-view]',list).forEach(function(x){x.addEventListener('click',function(){go(x.getAttribute('data-view'))})});
  }
  function openCmd(){document.body.classList.add('vg-nav-cmd-open');idx=0;setTimeout(function(){var i=q('#vgNavInput'); if(i){i.value='';i.focus();renderCmd();}},30)}
  function closeCmd(){document.body.classList.remove('vg-nav-cmd-open')}
  function bindKeys(){
    document.addEventListener('keydown',function(ev){
      var tag=(ev.target&&ev.target.tagName||'').toLowerCase(); var typing=['input','textarea','select'].indexOf(tag)>=0;
      if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();openCmd();return;}
      if(ev.key==='Escape'){closeCmd();return;}
      if(ev.altKey&&/^[1-6]$/.test(ev.key)){ev.preventDefault();go(quick[parseInt(ev.key,10)-1]);return;}
      if(document.body.classList.contains('vg-nav-cmd-open')){
        if(ev.key==='ArrowDown'){ev.preventDefault();idx=Math.min(results.length-1,idx+1);renderCmd();}
        if(ev.key==='ArrowUp'){ev.preventDefault();idx=Math.max(0,idx-1);renderCmd();}
        if(ev.key==='Enter'&&!typing&&results[idx]){ev.preventDefault();go(results[idx][0]);}
      }
    });
  }
  function init(){
    try{
      var saved = null;
      try{ saved = localStorage.getItem('vg_theme_mode'); }catch(e){}
      if(saved === null){
        var legacy = null;
        try{ legacy = localStorage.getItem('vg20_safe_off'); }catch(e){}
        saved = legacy === '1' ? 'original' : '2.0';
      }
      buildDock(); buildCmd(); bindKeys();
      applyThemeMode(saved);
    }catch(e){console.error('VG navigation init error',e)}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
