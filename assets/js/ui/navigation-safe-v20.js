
(function(){
  'use strict';
  if(window.__VG20_SAFE__) return;
  window.__VG20_SAFE__ = true;
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
    }catch(e){console.error('VG20 go error',e)}
  }
  function buildDock(){
    var d=q('#vg20SafeDock'); if(!d) return;
    var html = '<button class="vg20-primary" data-cmd="1">⌕ Comando</button>';
    quick.forEach(function(id){ var m=mod(id); html += '<button data-view="'+esc(m[0])+'">'+esc(m[1])+' '+esc(m[2])+'</button>'; });
    html += '<button data-theme="toggle">Original</button>';
    d.innerHTML=html;
    qa('[data-view]',d).forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-view'))})});
    q('[data-cmd]',d).addEventListener('click',openCmd);
    q('[data-theme]',d).addEventListener('click',function(){
      var cur = document.body.classList.contains('vg20-safe') ? '2.0' : document.body.classList.contains('theme-v2') ? 'v2' : 'original';
      var next = cur === '2.0' ? 'original' : cur === 'original' ? 'v2' : '2.0';
      applyThemeMode(next);
    });
  }
  function applyThemeMode(mode){
    document.body.classList.remove('vg20-safe','theme-v2');
    if(mode === '2.0') document.body.classList.add('vg20-safe');
    if(mode === 'v2') document.body.classList.add('theme-v2');
    try{ localStorage.setItem('vg_theme_mode', mode); }catch(e){}
    var btn = q('#vg20SafeDock [data-theme]');
    if(btn) btn.textContent = mode === '2.0' ? 'Original' : mode === 'original' ? 'V2' : 'Interface 2.0';
    if(typeof buildChartsResumo === 'function' && currentView === 'resumo' && typeof RAW !== 'undefined' && RAW) buildChartsResumo();
  }
  function buildCmd(){
    var el=q('#vg20SafeCmd'); if(!el) return;
    el.innerHTML = '<div class="vg20-cmd-head"><input id="vg20SafeInput" placeholder="Pesquisar módulo: custos, ocupação, orçamento…" autocomplete="off"><button id="vg20SafeClose">Fechar</button></div><div class="vg20-cmd-list" id="vg20SafeList"></div>';
    q('#vg20SafeClose').addEventListener('click',closeCmd);
    q('#vg20SafeInput').addEventListener('input',renderCmd);
    q('#vg20SafeBackdrop').addEventListener('click',closeCmd);
    renderCmd();
  }
  function renderCmd(){
    var input=q('#vg20SafeInput'); var list=q('#vg20SafeList'); if(!list) return;
    var term=(input&&input.value||'').toLowerCase().trim();
    results=modules.filter(function(m){return !term || (m[0]+' '+m[2]+' '+m[3]).toLowerCase().indexOf(term)>=0});
    if(idx>=results.length) idx=Math.max(0,results.length-1);
    if(!results.length){list.innerHTML='<div style="padding:20px;color:#64748b;font-weight:800">Sem resultados.</div>';return;}
    list.innerHTML=results.map(function(m,i){return '<div class="vg20-cmd-item '+(i===idx?'active':'')+'" data-view="'+esc(m[0])+'"><div><strong>'+esc(m[1])+' '+esc(m[2])+'</strong><br><span>'+esc(m[3])+'</span></div><span>Enter</span></div>';}).join('');
    qa('[data-view]',list).forEach(function(x){x.addEventListener('click',function(){go(x.getAttribute('data-view'))})});
  }
  function openCmd(){document.body.classList.add('vg20-cmd-open');idx=0;setTimeout(function(){var i=q('#vg20SafeInput'); if(i){i.value='';i.focus();renderCmd();}},30)}
  function closeCmd(){document.body.classList.remove('vg20-cmd-open')}
  function bindKeys(){
    document.addEventListener('keydown',function(ev){
      var tag=(ev.target&&ev.target.tagName||'').toLowerCase(); var typing=['input','textarea','select'].indexOf(tag)>=0;
      if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();openCmd();return;}
      if(ev.key==='Escape'){closeCmd();return;}
      if(ev.altKey&&/^[1-6]$/.test(ev.key)){ev.preventDefault();go(quick[parseInt(ev.key,10)-1]);return;}
      if(document.body.classList.contains('vg20-cmd-open')){
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
    }catch(e){console.error('VG20 safe init error',e)}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
