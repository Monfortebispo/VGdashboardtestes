import { currentCostsData } from '../data/costs-service';
import { currentFinancialsData } from '../data/financials-service';
import { resolveFinancialViewContext } from '../revenue/financial-view-context';
import type { CostsSelection } from './costs-state';

export interface CostsRenderActions {onSelectionChange?:(next:Partial<CostsSelection>)=>void;onRefresh?:()=>void|Promise<void>;}
function money(v:number,currencySymbol='€'):string{return `${currencySymbol}${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:0}).format(v)}`;}
function selectControl(labelText:string,value:string,options:Array<{value:string;label:string}>):HTMLLabelElement{
  const label=document.createElement('label');label.className='modern-costs-filter';
  const span=document.createElement('span');span.textContent=labelText;
  const select=document.createElement('select');select.dataset.filter=labelText.toLowerCase();
  options.forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.label;select.appendChild(el);});select.value=value;label.append(span,select);return label;
}
export function renderCostsReadOnly(root:HTMLElement,selection:Readonly<CostsSelection>,actions:CostsRenderActions={}):HTMLElement{
  const source=currentCostsData();
  const financials=currentFinancialsData();
  const context=financials?resolveFinancialViewContext(financials):null;
  let host=root.querySelector<HTMLElement>('[data-modern-costs-readonly]');
  if(!host){host=document.createElement('section');host.dataset.modernCostsReadonly='true';root.appendChild(host);}
  const title=document.createElement('h2');title.textContent='Custos';
  if(!source?.stats.available){const empty=document.createElement('p');empty.textContent='Sem dados de custos disponíveis na fonte financeira.';host.replaceChildren(title,empty);return host;}
  const scopedHotels=context?.activeHotels?.length?new Set(context.activeHotels):null;
  const scopedRecords=scopedHotels?source.records.filter(r=>scopedHotels.has(r.hotel)):source.records;
  const hotels=[...new Set(scopedRecords.map(r=>r.hotel))].sort((a,b)=>a.localeCompare(b,'pt'));
  const categories=[...new Set(scopedRecords.map(r=>r.category))].sort((a,b)=>a.localeCompare(b,'pt'));
  const periods=[...new Set(scopedRecords.map(r=>r.period))].sort((a,b)=>a.localeCompare(b,'pt'));
  const effectiveHotel=selection.hotel==='__all__'||hotels.includes(selection.hotel)?selection.hotel:'__all__';
  const rows=scopedRecords.filter(r=>(effectiveHotel==='__all__'||r.hotel===effectiveHotel)&&(selection.category==='__all__'||r.category===selection.category)&&(selection.period==='__all__'||r.period===selection.period));
  const controls=document.createElement('div');controls.dataset.modernCostsControls='true';
  const h=selectControl('Hotel',effectiveHotel,[{value:'__all__',label:'Todos os hotéis'},...hotels.map(v=>({value:v,label:v}))]);
  const c=selectControl('Rubrica',selection.category,[{value:'__all__',label:'Todas as rubricas'},...categories.map(v=>({value:v,label:v}))]);
  const p=selectControl('Período',selection.period,[{value:'__all__',label:'Todos os períodos'},...periods.map(v=>({value:v,label:v}))]);
  h.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({hotel:(e.target as HTMLSelectElement).value}));
  c.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({category:(e.target as HTMLSelectElement).value}));
  p.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({period:(e.target as HTMLSelectElement).value}));
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Atualizar custos';refresh.addEventListener('click',async()=>{refresh.disabled=true;try{await actions.onRefresh?.();}finally{refresh.disabled=false;}});
  controls.append(h,c,p,refresh);
  const total=rows.reduce((s,r)=>s+r.value,0);const summary=document.createElement('p');summary.textContent=`${rows.length} registos · ${money(total,context?.currencySymbol||'€')}`;
  const table=document.createElement('table');table.dataset.modernCostsTable='true';
  const head=document.createElement('thead');const hr=document.createElement('tr');['Hotel','Rubrica','Período','Valor'].forEach(v=>{const th=document.createElement('th');th.textContent=v;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');rows.slice(0,1000).forEach(r=>{const tr=document.createElement('tr');[r.hotel,r.category,r.period,money(r.value,context?.currencySymbol||'€')].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td);});body.appendChild(tr);});table.appendChild(body);
  if(rows.length>1000){const note=document.createElement('p');note.textContent=`A mostrar 1000 de ${rows.length} registos.`;host.replaceChildren(title,controls,summary,table,note);}else host.replaceChildren(title,controls,summary,table);
  return host;
}
export function clearCostsReadOnly(root:HTMLElement):void{root.querySelector('[data-modern-costs-readonly]')?.remove();}
