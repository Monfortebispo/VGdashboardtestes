// VG Operations — Consumo Teórico A&B: filtro por hotel robusto + limpeza de ingredientes
(function(){
  'use strict';
  if(window.__VG_THEORETICAL_FIX_V43__)return;
  window.__VG_THEORETICAL_FIX_V43__=true;

  let selected='__all',timer=null,retries=0,lastSignature='';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const fmt=(v,d=0)=>Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d});
  const money=(v,d=2)=>'€ '+Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d});

  function hub(){return document.getElementById('abHubRoot');}
  function active(){return !!(hub()&&hub().dataset.tab==='theoretical');}
  function rawData(){try{return window.VG?.domains33?.theoreticalData?.()||{matched:[],unmatched:[],ingredients:[]};}catch(e){return{matched:[],unmatched:[],ingredients:[]};}}
  function canonical(v){try{return window.VG?.domains33?.canonHotel?.(v)||String(v||'').trim();}catch(e){return String(v||'').trim();}}

  function dashboardHotels(){
    const set=new Set();
    const add=x=>{const h=canonical(x);if(h)set.add(h);};
    try{if(typeof window.getActiveHotels==='function')(window.getActiveHotels()||[]).forEach(add);}catch(e){}
    try{(window.RAW?.hotel_list||[]).forEach(add);}catch(e){}
    try{
      const u=typeof window.vgAuthCurrent==='function'?window.vgAuthCurrent():null;
      (Array.isArray(u?.hotels)?u.hotels:(u?.hotel&&u.hotel!=='*'?[u.hotel]:[])).forEach(add);
    }catch(e){}
    return [...set].sort((a,b)=>a.localeCompare(b,'pt'));
  }

  function dataHotels(d){
    const set=new Set();
    [...(d.matched||[]),...(d.unmatched||[])].forEach(x=>{const h=canonical(x.hotel);if(h)set.add(h);});
    return [...set].sort((a,b)=>a.localeCompare(b,'pt'));
  }
  function availableHotels(d){const dh=dataHotels(d);return dh.length?dh:dashboardHotels();}
  function validIngredient(x){
    const n=norm(x?.ingredient),u=norm(x?.unit);
    if(!n||/^\d+(?:[.,]\d+)?$/.test(n))return false;
    if(['A COMPOSICAO','COMPOSICAO','OS INGREDIENTES','INGREDIENTES','INGREDIENTE','QT','QTD','QUANTIDADE'].includes(n))return false;
    if(['ADICIONAR','DECORAR','ACAO','ACÇÃO'].includes(u))return false;
    return true;
  }

  function ensureToolbar(d){
    const h=hub();if(!h)return null;
    const anchor=h.querySelector('.od-help');
    let bar=document.getElementById('vgTheoryFilterBar');
    if(!bar){
      bar=document.createElement('div');bar.id='vgTheoryFilterBar';bar.className='od-toolbar vg-theory-filterbar';
      bar.innerHTML='<label>Hotel<select id="vgTheoryHotel"></select></label><span class="od-chip" id="vgTheoryScope"></span>';
      (anchor?.parentNode||h).insertBefore(bar,anchor||h.firstChild);
      document.getElementById('vgTheoryHotel').addEventListener('change',e=>{selected=e.target.value;render();});
    }
    const sel=document.getElementById('vgTheoryHotel'),hotels=availableHotels(d),cur=selected;
    const sig=hotels.join('|');
    if(sel.dataset.sig!==sig){
      sel.dataset.sig=sig;
      sel.disabled=false;
      sel.innerHTML='<option value="__all">Todos</option>'+hotels.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
    }
    if(cur!=='__all'&&hotels.includes(cur))sel.value=cur;else{selected='__all';sel.value='__all';}
    return hotels;
  }

  function filtered(d){
    const by=x=>selected==='__all'||canonical(x.hotel)===selected;
    const matched=(d.matched||[]).filter(by),unmatched=(d.unmatched||[]).filter(by),ingredients=new Map();
    for(const x of matched){
      for(const ing of x.recipe?.ingredients||[]){
        const row={ingredient:ing.ingredient,unit:ing.unit||'',qty:(Number(ing.qty)||0)*(Number(x.qtd)||0),cost:0,knownCost:false};
        if(!validIngredient(row))continue;
        const k=norm(row.ingredient)+'|'+norm(row.unit),cur=ingredients.get(k)||{ingredient:row.ingredient,unit:row.unit,qty:0,cost:0,knownCost:false};
        cur.qty+=row.qty;
        if(Number.isFinite(Number(ing.cost))){cur.cost+=Number(ing.cost)*(Number(x.qtd)||0);cur.knownCost=true;}
        ingredients.set(k,cur);
      }
    }
    return{matched,unmatched,ingredients:[...ingredients.values()].sort((a,b)=>Math.abs(b.cost)-Math.abs(a.cost)||b.qty-a.qty)};
  }

  function emptyText(hasSource){return hasSource?'Sem correspondências para a seleção atual.':'Sem Receita Detalhada carregada para calcular o consumo teórico.';}
  function render(){
    if(!active())return;
    const d=rawData(),hotels=ensureToolbar(d)||[],f=filtered(d),rows=f.matched.slice().sort((a,b)=>(b.vn||0)-(a.vn||0));
    const totRev=rows.reduce((s,x)=>s+(Number(x.vn)||0),0),totCost=rows.reduce((s,x)=>s+(Number(x.cost)||0),0),qty=rows.reduce((s,x)=>s+(Number(x.qtd)||0),0);
    const hasSource=(d.matched?.length||0)+(d.unmatched?.length||0)>0;
    const scope=document.getElementById('vgTheoryScope');if(scope)scope.textContent=selected==='__all'?'Consumo teórico · todos os hotéis':'Consumo teórico · '+selected;
    const help=hub().querySelector('.od-help');
    if(help){
      let status=document.getElementById('vgTheoryDataStatus');
      if(!status){status=document.createElement('div');status.id='vgTheoryDataStatus';status.className='od-help';help.insertAdjacentElement('beforebegin',status);}
      status.innerHTML=hasSource?'<b>Fonte:</b> Receita Detalhada disponível · '+dataHotels(d).length+' hotel(is) com vendas reconhecíveis.':'<b>Sem Receita Detalhada:</b> o filtro de Hotel continua disponível, mas os indicadores ficam a zero até existirem vendas detalhadas.';
    }
    const cards=hub().querySelector('.od-kpis');
    if(cards)cards.innerHTML=`<article><span>Vendas com ficha</span><strong>${fmt(qty,0)}</strong><small>${rows.length} linhas de venda</small></article><article><span>Receita líquida</span><strong>${money(totRev,2)}</strong></article><article><span>Custo teórico</span><strong>${money(totCost,2)}</strong><small>somente fichas com custo conhecido</small></article><article class="${f.unmatched.length?'warn':''}"><span>Sem correspondência</span><strong>${f.unmatched.length}</strong><small>não entram no cálculo</small></article>`;
    const sections=[...hub().querySelectorAll('.od-grid2 .od-card')];
    const sales=sections.find(s=>/Venda\s*→\s*ficha técnica/i.test(s.querySelector('h3')?.textContent||''));
    const ingr=sections.find(s=>/Consumo teórico por ingrediente/i.test(s.querySelector('h3')?.textContent||''));
    if(sales){const body=sales.querySelector('.od-table-scroll, .od-empty, p.muted, section.od-card');const html=rows.length?`<div class="od-table-scroll"><table><thead><tr><th>Hotel</th><th>PdV</th><th>Artigo</th><th>Ficha</th><th>Qtd.</th><th>Receita</th><th>Custo teórico</th></tr></thead><tbody>${rows.slice(0,400).map(x=>`<tr><td>${esc(x.hotel)}</td><td>${esc(x.pdv||'—')}</td><td>${esc(x.art)}</td><td>${esc(x.recipe?.name||'—')}</td><td>${fmt(x.qtd,0)}</td><td>${money(x.vn,2)}</td><td>${x.cost==null?'—':money(x.cost,2)}</td></tr>`).join('')}</tbody></table></div>`:`<p class="muted">${emptyText(hasSource)}</p>`;if(body)body.outerHTML=html;}
    if(ingr){const body=ingr.querySelector('.od-table-scroll, p.muted');const html=f.ingredients.length?`<div class="od-table-scroll"><table><thead><tr><th>Ingrediente</th><th>Quantidade teórica</th><th>Unidade</th><th>Custo teórico</th></tr></thead><tbody>${f.ingredients.slice(0,300).map(x=>`<tr><td>${esc(x.ingredient)}</td><td>${fmt(x.qty,2)}</td><td>${esc(x.unit||'—')}</td><td>${x.knownCost?money(x.cost,2):'—'}</td></tr>`).join('')}</tbody></table></div>`:`<p class="muted">${emptyText(hasSource)}</p>`;if(body)body.outerHTML=html;}
    lastSignature=[hotels.join('|'),d.matched?.length||0,d.unmatched?.length||0,selected].join('::');
  }

  function schedule(ms=50){clearTimeout(timer);timer=setTimeout(()=>{if(active())render();},ms);}
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-abtab="theoretical"]')){retries=0;[50,250,700,1500,3000].forEach(schedule);}},false);
  window.VG?.events?.on?.('revenue-detail:changed',()=>{retries=0;schedule(40);});
  const obs=new MutationObserver(()=>{if(active()&&!document.getElementById('vgTheoryFilterBar'))schedule(60);});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  [100,400,1000,2500].forEach(ms=>setTimeout(()=>active()&&render(),ms));
})();
