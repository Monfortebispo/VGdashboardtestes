// VG Operations — Consumo Teórico A&B: filtro por hotel e limpeza de ingredientes
(function(){
'use strict';
if(window.__VG_THEORETICAL_FIX_V41__)return;
window.__VG_THEORETICAL_FIX_V41__=true;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const fmt=(v,d=2)=>Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=v=>'€ '+Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2});
const canon=v=>{try{return window.VG?.domains33?.canonHotel?.(v)||String(v||'').trim();}catch(e){return String(v||'').trim();}};
const BAD_NAMES=new Set(['A COMPOSICAO','COMPOSICAO','OS INGREDIENTES','INGREDIENTES','INGREDIENTE','QT','QTD','QUANTIDADE','UNIDADE','ACAO','ACOES','ADICIONAR','DECORAR','PREPARACAO','MODO DE PREPARACAO','OBSERVACOES','OBSERVACAO']);
const BAD_UNITS=new Set(['ACAO','ACOES','ADICIONAR','DECORAR']);

let selected=sessionStorage.getItem('vg-theoretical-hotel')||'Todos';
let timer=null;
let ticks=0;
let lastFingerprint='';

function validIngredient(i){
  const name=String(i?.ingredient??i?.name??'').trim(),n=norm(name),u=norm(i?.unit||'');
  if(!name||name.length<2||/^[\d\s.,%+\-\/]+$/.test(name))return false;
  if(BAD_NAMES.has(n)||BAD_UNITS.has(u))return false;
  if(n.startsWith('A COMPOSICAO')||n.startsWith('OS INGREDIENTES'))return false;
  return true;
}
function cleanUnit(v){const s=String(v||'').trim();return !s||BAD_UNITS.has(norm(s))?'—':s;}
function root(){return document.getElementById('abHubRoot');}
function active(){return !!root()?.querySelector('[data-abtab="theoretical"].active');}
function data(){try{return window.VG?.domains33?.theoreticalData?.()||{matched:[],unmatched:[]};}catch(e){return {matched:[],unmatched:[]};}}
function hotelsFrom(d){
  return [...new Set([...(d.matched||[]),...(d.unmatched||[])].map(r=>canon(r.hotel)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));
}
function fingerprint(d,hs){return [d.matched?.length||0,d.unmatched?.length||0,hs.join('|')].join('::');}
function cardByTitle(r,title){return [...r.querySelectorAll('.od-card')].find(c=>norm(c.querySelector('h3')?.textContent)===norm(title));}
function filtered(d){
  const matchHotel=r=>selected==='Todos'||canon(r.hotel)===selected;
  const matched=(d.matched||[]).filter(matchHotel),unmatched=(d.unmatched||[]).filter(matchHotel),ingredients=new Map();
  matched.forEach(row=>{
    const q=Number(row.qtd)||0;
    (row.recipe?.ingredients||[]).forEach(ing=>{
      if(!validIngredient(ing))return;
      const unit=cleanUnit(ing.unit),key=norm(ing.ingredient)+'|'+norm(unit);
      const cur=ingredients.get(key)||{ingredient:String(ing.ingredient||'').trim(),unit,qty:0,cost:0,known:false};
      cur.qty+=(Number(ing.qty)||0)*q;
      const c=Number(ing.cost);if(Number.isFinite(c)){cur.cost+=c*q;cur.known=true;}
      ingredients.set(key,cur);
    });
  });
  return {matched,unmatched,ingredients:[...ingredients.values()].sort((a,b)=>Math.abs(b.cost)-Math.abs(a.cost)||b.qty-a.qty)};
}
function ensureToolbar(r,hs,waiting){
  let bar=r.querySelector('#vgTheoryHotelToolbar');
  if(!bar){
    bar=document.createElement('div');bar.id='vgTheoryHotelToolbar';bar.className='od-toolbar';
    const anchor=r.querySelector('.od-help')||r.querySelector('.od-kpis');
    anchor?.parentNode?.insertBefore(bar,anchor);
  }
  if(selected!=='Todos'&&!hs.includes(selected)){selected='Todos';sessionStorage.setItem('vg-theoretical-hotel','Todos');}
  bar.innerHTML='<label>Hotel<select id="vgTheoryHotel" '+(waiting?'disabled':'')+'><option value="Todos">Todos</option>'+hs.map(h=>'<option value="'+esc(h)+'" '+(h===selected?'selected':'')+'>'+esc(h)+'</option>').join('')+'</select></label><span class="od-chip">'+(waiting?'A aguardar dados de Receita Detalhada…':'Consumo teórico · '+(selected==='Todos'?'todos os hotéis':esc(selected)))+'</span>';
  const sel=bar.querySelector('#vgTheoryHotel');
  if(sel)sel.onchange=function(){selected=this.value;sessionStorage.setItem('vg-theoretical-hotel',selected);render(true);};
}
function render(force=false){
  const r=root();if(!r||!active())return;
  const d=data(),hs=hotelsFrom(d),fp=fingerprint(d,hs),waiting=!(d.matched?.length||d.unmatched?.length);
  ensureToolbar(r,hs,waiting);
  if(!force&&fp===lastFingerprint&&r.dataset.vgTheorySelected===selected)return;
  lastFingerprint=fp;r.dataset.vgTheorySelected=selected;
  const f=filtered(d),sales=f.matched.slice().sort((a,b)=>(Number(b.vn)||0)-(Number(a.vn)||0));
  const totQty=sales.reduce((s,x)=>s+(Number(x.qtd)||0),0),totRev=sales.reduce((s,x)=>s+(Number(x.vn)||0),0),totCost=sales.reduce((s,x)=>s+(Number(x.cost)||0),0);
  const kpis=r.querySelector('.od-kpis');
  if(kpis)kpis.innerHTML='<article><span>Vendas com ficha</span><strong>'+fmt(totQty,0)+'</strong><small>'+sales.length+' linhas de venda</small></article><article><span>Receita líquida</span><strong>'+money(totRev)+'</strong></article><article><span>Custo teórico</span><strong>'+money(totCost)+'</strong><small>somente fichas com custo conhecido</small></article><article class="'+(f.unmatched.length?'warn':'')+'"><span>Sem correspondência</span><strong>'+f.unmatched.length+'</strong><small>não entram no cálculo</small></article>';
  const saleCard=cardByTitle(r,'Venda → ficha técnica');
  if(saleCard){const w=saleCard.querySelector('.od-table-scroll');if(w)w.innerHTML='<table><thead><tr><th>Hotel</th><th>PdV</th><th>Artigo</th><th>Ficha</th><th>Qtd.</th><th>Receita</th><th>Custo teórico</th></tr></thead><tbody>'+(sales.length?sales.slice(0,400).map(x=>'<tr><td>'+esc(canon(x.hotel))+'</td><td>'+esc(x.pdv||'—')+'</td><td>'+esc(x.art||'')+'</td><td>'+esc(x.recipe?.name||'—')+'</td><td>'+fmt(x.qtd,0)+'</td><td>'+money(x.vn)+'</td><td>'+(x.cost==null?'—':money(x.cost))+'</td></tr>').join(''):'<tr><td colspan="7" class="muted">'+(waiting?'A aguardar dados de vendas…':'Sem vendas com ficha para a seleção atual.')+'</td></tr>')+'</tbody></table>';}
  const ingCard=cardByTitle(r,'Consumo teórico por ingrediente');
  if(ingCard){const w=ingCard.querySelector('.od-table-scroll');if(w)w.innerHTML='<table><thead><tr><th>Ingrediente</th><th>Quantidade teórica</th><th>Unidade</th><th>Custo teórico</th></tr></thead><tbody>'+(f.ingredients.length?f.ingredients.slice(0,300).map(x=>'<tr><td>'+esc(x.ingredient)+'</td><td>'+fmt(x.qty,2)+'</td><td>'+esc(x.unit)+'</td><td>'+(x.known?money(x.cost):'—')+'</td></tr>').join(''):'<tr><td colspan="4" class="muted">'+(waiting?'A aguardar dados de vendas e fichas técnicas…':'Sem ingredientes válidos para a seleção atual.')+'</td></tr>')+'</tbody></table>';}
}
function startPolling(){
  if(timer)clearInterval(timer);ticks=0;lastFingerprint='';
  render(true);
  timer=setInterval(function(){
    if(!active()){clearInterval(timer);timer=null;return;}
    ticks++;render(false);
    if(ticks>=40){clearInterval(timer);timer=null;}
  },500);
}
function init(){
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-abtab="theoretical"]'))setTimeout(startPolling,0);},true);
  window.VG?.events?.on?.('revenue-detail:changed',()=>{if(active())startPolling();});
  window.VG?.events?.on?.('state:changed',()=>{if(active())startPolling();});
  setTimeout(()=>{if(active())startPolling();},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
