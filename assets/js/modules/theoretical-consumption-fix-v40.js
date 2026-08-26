// VG Operations — correção do Consumo Teórico A&B no Deploy Preview
(function(){
'use strict';
if(window.__VG_THEORETICAL_FIX_V40__)return;
window.__VG_THEORETICAL_FIX_V40__=true;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const fmt=(v,d=2)=>Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=v=>'€ '+Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2});
const canon=v=>{try{return window.VG?.domains33?.canonHotel?.(v)||norm(v);}catch(e){return norm(v);}};

const BAD_NAMES=new Set(['A COMPOSICAO','COMPOSICAO','OS INGREDIENTES','INGREDIENTES','INGREDIENTE','QT','QTD','QUANTIDADE','UNIDADE','ACAO','ACOES','ADICIONAR','DECORAR','PREPARACAO','MODO DE PREPARACAO','OBSERVACOES','OBSERVACAO']);
const BAD_UNITS=new Set(['ACAO','ACOES','ADICIONAR','DECORAR']);
function validIngredient(i){const name=String(i?.ingredient??i?.name??'').trim(),n=norm(name),u=norm(i?.unit||'');if(!name||name.length<2)return false;if(/^[\d\s.,%+\-\/]+$/.test(name))return false;if(BAD_NAMES.has(n)||BAD_UNITS.has(u))return false;if(n.startsWith('A COMPOSICAO')||n.startsWith('OS INGREDIENTES'))return false;return true;}
function cleanUnit(v){const s=String(v||'').trim(),n=norm(s);return !s||BAD_UNITS.has(n)?'—':s;}
function baseData(){try{return window.VG?.domains33?.theoreticalData?.()||{matched:[],unmatched:[],ingredients:[]};}catch(e){return {matched:[],unmatched:[],ingredients:[]};}}
function hotels(){const d=baseData();return [...new Set([...(d.matched||[]).map(r=>canon(r.hotel)),...(d.unmatched||[]).map(r=>canon(r.hotel))].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));}
function build(selected){
  const base=baseData(),matched=(base.matched||[]).filter(r=>selected==='Todos'||canon(r.hotel)===selected),unmatched=(base.unmatched||[]).filter(r=>selected==='Todos'||canon(r.hotel)===selected),ingredients=new Map();
  for(const row of matched){
    const q=Number(row.qtd)||0,rec=row.recipe||{};
    for(const ing of rec.ingredients||[]){
      if(!validIngredient(ing))continue;
      const unit=cleanUnit(ing.unit),key=norm(ing.ingredient)+'|'+norm(unit),cur=ingredients.get(key)||{ingredient:String(ing.ingredient||'').trim(),unit,qty:0,cost:0,known:false};
      cur.qty+=(Number(ing.qty)||0)*q;
      const c=Number(ing.cost);if(Number.isFinite(c)){cur.cost+=c*q;cur.known=true;}
      ingredients.set(key,cur);
    }
  }
  return {matched,unmatched,ingredients:[...ingredients.values()].sort((a,b)=>Math.abs(b.cost)-Math.abs(a.cost)||b.qty-a.qty)};
}
function currentSelected(){return sessionStorage.getItem('vg-theoretical-hotel')||'Todos';}
function setSelected(v){sessionStorage.setItem('vg-theoretical-hotel',v||'Todos');}
function cardByTitle(root,title){return [...root.querySelectorAll('.od-card')].find(c=>norm(c.querySelector('h3')?.textContent)===norm(title));}
function isTheoretical(root){return !!root?.querySelector('[data-abtab="theoretical"].active');}
let applying=false;
function apply(){
  if(applying)return;const root=document.getElementById('abHubRoot');if(!root||!isTheoretical(root))return;applying=true;
  try{
    let selected=currentSelected();const hs=hotels();if(selected!=='Todos'&&!hs.includes(selected)){selected='Todos';setSelected(selected);}
    let toolbar=root.querySelector('#vgTheoryHotelToolbar');if(!toolbar){toolbar=document.createElement('div');toolbar.id='vgTheoryHotelToolbar';toolbar.className='od-toolbar';const anchor=root.querySelector('.od-help')||root.querySelector('.od-kpis');anchor?.parentNode?.insertBefore(toolbar,anchor);}
    toolbar.innerHTML='<label>Hotel<select id="vgTheoryHotel"><option value="Todos">Todos</option>'+hs.map(h=>`<option value="${esc(h)}" ${h===selected?'selected':''}>${esc(h)}</option>`).join('')+'</select></label><span class="od-chip">Consumo teórico '+(selected==='Todos'?'· todos os hotéis':'· '+esc(selected))+'</span>';
    toolbar.querySelector('#vgTheoryHotel').onchange=e=>{setSelected(e.target.value);apply();};
    const d=build(selected),sales=d.matched.slice().sort((a,b)=>(Number(b.vn)||0)-(Number(a.vn)||0)),totQty=sales.reduce((s,x)=>s+(Number(x.qtd)||0),0),totRev=sales.reduce((s,x)=>s+(Number(x.vn)||0),0),totCost=sales.reduce((s,x)=>s+(Number(x.cost)||0),0);
    const kpis=root.querySelector('.od-kpis');if(kpis)kpis.innerHTML=`<article><span>Vendas com ficha</span><strong>${fmt(totQty,0)}</strong><small>${sales.length} linhas de venda</small></article><article><span>Receita líquida</span><strong>${money(totRev)}</strong></article><article><span>Custo teórico</span><strong>${money(totCost)}</strong><small>somente fichas com custo conhecido</small></article><article class="${d.unmatched.length?'warn':''}"><span>Sem correspondência</span><strong>${d.unmatched.length}</strong><small>não entram no cálculo</small></article>`;
    const saleCard=cardByTitle(root,'Venda → ficha técnica');if(saleCard){const wrap=saleCard.querySelector('.od-table-scroll');if(wrap)wrap.innerHTML='<table><thead><tr><th>Hotel</th><th>PdV</th><th>Artigo</th><th>Ficha</th><th>Qtd.</th><th>Receita</th><th>Custo teórico</th></tr></thead><tbody>'+sales.slice(0,400).map(x=>`<tr><td>${esc(canon(x.hotel))}</td><td>${esc(x.pdv||'—')}</td><td>${esc(x.art||'')}</td><td>${esc(x.recipe?.name||'—')}</td><td>${fmt(x.qtd,0)}</td><td>${money(x.vn)}</td><td>${x.cost==null?'—':money(x.cost)}</td></tr>`).join('')+'</tbody></table>';}
    const ingCard=cardByTitle(root,'Consumo teórico por ingrediente');if(ingCard){const wrap=ingCard.querySelector('.od-table-scroll');if(wrap){const rows=d.ingredients.slice(0,300).map(x=>`<tr><td>${esc(x.ingredient)}</td><td>${fmt(x.qty,2)}</td><td>${esc(x.unit)}</td><td>${x.known?money(x.cost):'—'}</td></tr>`).join('');wrap.innerHTML='<table><thead><tr><th>Ingrediente</th><th>Quantidade teórica</th><th>Unidade</th><th>Custo teórico</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4" class="muted">Sem ingredientes válidos para a seleção atual.</td></tr>')+'</tbody></table>';}}
  }finally{applying=false;}
}
function schedule(){setTimeout(apply,0);setTimeout(apply,180);}
const observer=new MutationObserver(()=>schedule());
function init(){const root=document.getElementById('abHubRoot');if(root)observer.observe(root,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target?.closest?.('[data-abtab="theoretical"]'))schedule();},true);schedule();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
