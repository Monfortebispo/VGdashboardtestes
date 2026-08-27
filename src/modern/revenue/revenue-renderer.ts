import { currentRevenueData } from '../data/revenue-service';
import { revenueHotels, revenueMetrics, revenuePeriods, revenueRecords } from '../data/revenue-model';
import type { RevenueSelection } from './revenue-state';

export interface RevenueRenderActions{
  onSelectionChange?:(next:Partial<RevenueSelection>)=>void;
  onRefresh?:()=>void|Promise<void>;
}

function selectControl(labelText:string,value:string,options:Array<{value:string;label:string}>):HTMLLabelElement{
  const label=document.createElement('label');
  label.className='modern-revenue-filter';
  const cap=document.createElement('span');cap.textContent=labelText;
  const sel=document.createElement('select');sel.dataset.filter=labelText.toLowerCase();
  options.forEach(o=>{const op=document.createElement('option');op.value=o.value;op.textContent=o.label;sel.appendChild(op);});
  sel.value=value;label.append(cap,sel);return label;
}
function fmt(v:number|null):string{return v==null?'—':new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(v);}

export function renderRevenueReadOnly(root:HTMLElement,selection:Readonly<RevenueSelection>,actions:RevenueRenderActions={}):HTMLElement{
  const source=currentRevenueData();
  let host=root.querySelector<HTMLElement>('[data-modern-revenue-readonly]');
  if(!host){host=document.createElement('section');host.dataset.modernRevenueReadonly='true';root.appendChild(host);}

  const title=document.createElement('h2');title.textContent='Revenue & Forecast';
  if(!source||!source.stats.available){
    const p=document.createElement('p');p.textContent='Sem dados de Revenue disponíveis.';host.replaceChildren(title,p);return host;
  }

  const records=revenueRecords(source.data);
  const hotels=revenueHotels(records),periods=revenuePeriods(records),metrics=revenueMetrics(records);
  const filtered=records.filter(r=>(selection.hotel==='__all__'||r.hotel===selection.hotel)&&(selection.period==='__latest__'||selection.period==='__all__'||r.period===selection.period)&&(selection.metric==='__all__'||r.metric===selection.metric));

  const summary=document.createElement('p');
  summary.textContent=`${filtered.length} registos · ${hotels.length} hotéis · ${periods.length} períodos`;

  const controls=document.createElement('div');controls.dataset.modernRevenueControls='true';
  const hotel=selectControl('Hotel',selection.hotel,[{value:'__all__',label:'Todos os hotéis'},...hotels.map(x=>({value:x,label:x}))]);
  const periodValue=selection.period==='__latest__'?(periods.at(-1)||'__all__'):selection.period;
  const period=selectControl('Período',periodValue,[{value:'__all__',label:'Todos os períodos'},...periods.map(x=>({value:x,label:x}))]);
  const metric=selectControl('Indicador',selection.metric,[{value:'__all__',label:'Todos os indicadores'},...metrics.map(x=>({value:x,label:x}))]);
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Atualizar Revenue';
  hotel.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({hotel:(e.currentTarget as HTMLSelectElement).value}));
  period.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({period:(e.currentTarget as HTMLSelectElement).value}));
  metric.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({metric:(e.currentTarget as HTMLSelectElement).value}));
  refresh.addEventListener('click',async()=>{refresh.disabled=true;try{await actions.onRefresh?.();}finally{refresh.disabled=false;}});
  controls.append(hotel,period,metric,refresh);

  const table=document.createElement('table');table.dataset.modernRevenueTable='true';
  const thead=document.createElement('thead');thead.innerHTML='<tr><th>Hotel</th><th>Período</th><th>Indicador</th><th>Atual</th><th>Forecast</th><th>Orçamento</th><th>Anterior</th></tr>';table.appendChild(thead);
  const tbody=document.createElement('tbody');
  filtered.slice(0,1000).forEach(r=>{const tr=document.createElement('tr');[r.hotel,r.period,r.metric,fmt(r.value),fmt(r.forecast),fmt(r.budget),fmt(r.previous)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td);});tbody.appendChild(tr);});
  table.appendChild(tbody);

  host.replaceChildren(title,summary,controls,table);
  return host;
}

export function clearRevenueReadOnly(root:HTMLElement):void{root.querySelector('[data-modern-revenue-readonly]')?.remove();}
