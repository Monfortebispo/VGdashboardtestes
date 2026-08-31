import type { TheoryViewModel } from './theoretical-model';

const ESC:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,m=>ESC[m]||m);
const fmt=(v:unknown,d=0)=>Number(v||0).toLocaleString('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d});
export interface TheoryRenderOptions {money:(value:number,digits?:number)=>string;onHotel:(hotel:string)=>void;}

function bodyOf(hub:HTMLElement):HTMLElement|null{
  const nav=hub.querySelector(':scope > nav.od-tabs');
  return (nav?.nextElementSibling as HTMLElement|null)||null;
}
function cardByTitle(body:HTMLElement,title:RegExp):HTMLElement|null{
  return [...body.querySelectorAll<HTMLElement>('.od-card')].find(card=>title.test(card.querySelector('h3')?.textContent||''))||null;
}
function replaceCardBody(card:HTMLElement,html:string):void{
  const header=card.querySelector(':scope > header');
  [...card.children].forEach(child=>{if(child!==header)child.remove();});
  card.insertAdjacentHTML('beforeend',html);
}
export function renderTheoreticalConsumption(hub:HTMLElement,model:TheoryViewModel,options:TheoryRenderOptions):void{
  if(hub.dataset.tab!=='theoretical')return;
  const body=bodyOf(hub);if(!body)return;
  let toolbar=body.querySelector<HTMLElement>('[data-modern-theory-toolbar]');
  if(!toolbar){toolbar=document.createElement('div');toolbar.dataset.modernTheoryToolbar='true';toolbar.className='od-toolbar vg-theory-filterbar';body.insertBefore(toolbar,body.firstChild);}
  toolbar.innerHTML=`<label>Hotel<select data-modern-theory-hotel><option value="__all">Todos</option>${model.hotels.map(h=>`<option value="${esc(h)}" ${model.selectedHotel===h?'selected':''}>${esc(h)}</option>`).join('')}</select></label><span class="od-chip">${model.selectedHotel==='__all'?'Todos os hotéis':esc(model.selectedHotel)}</span><span class="od-chip">${model.hasSource?'Receita Detalhada disponível':'Sem Receita Detalhada'}</span>`;
  toolbar.querySelector<HTMLSelectElement>('[data-modern-theory-hotel]')?.addEventListener('change',e=>options.onHotel((e.currentTarget as HTMLSelectElement).value));

  let status=body.querySelector<HTMLElement>('[data-modern-theory-status]');
  if(!status){status=document.createElement('div');status.dataset.modernTheoryStatus='true';status.className='od-help';const help=body.querySelector('.od-help');help?.insertAdjacentElement('afterend',status);if(!help)body.insertBefore(status,toolbar.nextSibling);}
  status.innerHTML=model.hasSource?`<b>Âmbito:</b> ${model.selectedHotel==='__all'?'todos os hotéis':esc(model.selectedHotel)} · ${model.totals.matchedLines} linhas com ficha · ${model.totals.unmatchedLines} sem correspondência.${model.selectedHotel==='__all'?'':' A associação manual mantém-se global para preservar o registo auditável.'}`:'<b>Sem Receita Detalhada:</b> os indicadores permanecem a zero até existirem vendas detalhadas.';

  const kpis=body.querySelector<HTMLElement>('.od-kpis');
  if(kpis)kpis.innerHTML=`<article><span>Vendas com ficha</span><strong>${fmt(model.totals.quantity,0)}</strong><small>${model.totals.matchedLines} linhas de venda</small></article><article><span>Receita líquida</span><strong>${options.money(model.totals.revenue,2)}</strong></article><article><span>Custo teórico</span><strong>${options.money(model.totals.cost,2)}</strong><small>somente fichas com custo conhecido</small></article><article class="${model.totals.unmatchedLines?'warn':''}"><span>Sem correspondência</span><strong>${model.totals.unmatchedLines}</strong><small>não entram no cálculo</small></article>`;

  const sales=cardByTitle(body,/Venda\s*→\s*ficha técnica/i);
  if(sales)replaceCardBody(sales,model.matched.length?`<div class="od-table-scroll"><table><thead><tr><th>Hotel</th><th>PdV</th><th>Artigo</th><th>Ficha</th><th>Match</th><th>Qtd.</th><th>Receita</th><th>Custo teórico</th><th>Rácio</th></tr></thead><tbody>${model.matched.slice(0,400).map(x=>{const revenue=Number(x.vn)||0,cost=Number(x.cost);return `<tr><td>${esc(x.hotel)}</td><td>${esc(x.pdv||'—')}</td><td>${esc(x.art||x.artigo)}</td><td>${esc(x.recipe?.name||'—')}</td><td><span class="od-tag good">${esc(x.match||'Exato')}</span></td><td>${fmt(x.qtd,0)}</td><td>${options.money(revenue,2)}</td><td>${Number.isFinite(cost)?options.money(cost,2):'—'}</td><td>${revenue&&Number.isFinite(cost)?fmt(cost/revenue*100,1)+'%':'—'}</td></tr>`;}).join('')}</tbody></table></div>`:`<p class="muted">${model.hasSource?'Sem correspondências para a seleção atual.':'Sem Receita Detalhada carregada para calcular o consumo teórico.'}</p>`);

  const ingredients=cardByTitle(body,/Consumo teórico por ingrediente/i);
  if(ingredients)replaceCardBody(ingredients,model.ingredients.length?`<div class="od-table-scroll"><table><thead><tr><th>Ingrediente</th><th>Quantidade teórica</th><th>Unidade</th><th>Custo teórico</th></tr></thead><tbody>${model.ingredients.slice(0,300).map(x=>`<tr><td>${esc(x.ingredient)}</td><td>${fmt(x.qty,2)}</td><td>${esc(x.unit||'—')}</td><td>${x.knownCost?options.money(x.cost,2):'—'}</td></tr>`).join('')}</tbody></table></div>`:`<p class="muted">${model.hasSource?'Sem ingredientes calculáveis para a seleção atual.':'Sem Receita Detalhada carregada para calcular o consumo teórico.'}</p>`);

  hub.dataset.vgModernTheoretical='ready';
}
