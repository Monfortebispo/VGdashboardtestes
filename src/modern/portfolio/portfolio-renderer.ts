import { currentPortfolioData } from '../data/portfolio-service';
import { normalizePortfolioRecords } from '../data/portfolio-model';
import type { PortfolioSelection } from './portfolio-state';

export interface PortfolioRenderActions {
  onSelectionChange?:(next:Partial<PortfolioSelection>)=>void;
  onRefresh?:()=>void|Promise<void>;
}

function selectControl(labelText:string,value:string,options:Array<{value:string;label:string}>):HTMLLabelElement{
  const label=document.createElement('label');label.className='modern-portfolio-filter';
  const span=document.createElement('span');span.textContent=labelText;
  const select=document.createElement('select');select.dataset.filter=labelText.toLowerCase();
  options.forEach(o=>{const el=document.createElement('option');el.value=o.value;el.textContent=o.label;select.appendChild(el);});
  select.value=value;label.append(span,select);return label;
}
function displayValue(value:number|string|null):string{
  if(value==null)return '—';
  if(typeof value==='number')return new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(value);
  return value;
}

export function renderPortfolioReadOnly(root:HTMLElement,selection:Readonly<PortfolioSelection>,actions:PortfolioRenderActions={}):HTMLElement{
  const source=currentPortfolioData();
  let host=root.querySelector<HTMLElement>('[data-modern-portfolio-readonly]');
  if(!host){host=document.createElement('section');host.dataset.modernPortfolioReadonly='true';root.appendChild(host);}

  const title=document.createElement('h2');title.textContent='Visão Executiva';
  if(!source?.stats.available){
    const empty=document.createElement('p');empty.textContent='Sem fonte moderna de Portefólio disponível.';
    host.replaceChildren(title,empty);return host;
  }

  const records=normalizePortfolioRecords(source.data);
  const geographies=[...new Set(records.map(r=>r.geography))].sort((a,b)=>a.localeCompare(b,'pt'));
  const hotels=[...new Set(records.filter(r=>selection.geography==='__all__'||r.geography===selection.geography).map(r=>r.hotel))].sort((a,b)=>a.localeCompare(b,'pt'));
  const periods=[...new Set(records.map(r=>r.period))].sort((a,b)=>a.localeCompare(b,'pt'));
  let rows=records.filter(r=>(selection.geography==='__all__'||r.geography===selection.geography)&&(selection.hotel==='__all__'||r.hotel===selection.hotel)&&(selection.period==='__latest__'||r.period===selection.period));

  const controls=document.createElement('div');controls.dataset.modernPortfolioControls='true';
  const geo=selectControl('Geografia',selection.geography,[{value:'__all__',label:'Todas'},...geographies.map(v=>({value:v,label:v}))]);
  const hotel=selectControl('Hotel',selection.hotel,[{value:'__all__',label:'Todos os hotéis'},...hotels.map(v=>({value:v,label:v}))]);
  const period=selectControl('Período',selection.period,[{value:'__latest__',label:'Atual / mais recente'},...periods.map(v=>({value:v,label:v}))]);
  geo.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({geography:(e.target as HTMLSelectElement).value,hotel:'__all__'}));
  hotel.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({hotel:(e.target as HTMLSelectElement).value}));
  period.querySelector('select')!.addEventListener('change',e=>actions.onSelectionChange?.({period:(e.target as HTMLSelectElement).value}));
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Atualizar visão';refresh.addEventListener('click',async()=>{refresh.disabled=true;try{await actions.onRefresh?.();}finally{refresh.disabled=false;}});
  controls.append(geo,hotel,period,refresh);

  const summary=document.createElement('div');summary.dataset.modernPortfolioSummary='true';
  const numeric=rows.filter(r=>typeof r.value==='number');
  const metrics=new Set(rows.map(r=>r.metric));
  const rowCount=document.createElement('p');rowCount.textContent=`${rows.length} indicadores · ${metrics.size} métricas · ${new Set(rows.map(r=>r.hotel)).size} hotéis`;
  summary.appendChild(rowCount);

  const table=document.createElement('table');table.dataset.modernPortfolioTable='true';
  const head=document.createElement('thead');const hr=document.createElement('tr');['Geografia','Hotel','Período','Indicador','Valor'].forEach(v=>{const th=document.createElement('th');th.textContent=v;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');
  rows.slice(0,800).forEach(r=>{const tr=document.createElement('tr');[r.geography,r.hotel,r.period,r.metric,displayValue(r.value)].forEach(v=>{const td=document.createElement('td');td.textContent=String(v);tr.appendChild(td);});body.appendChild(tr);});
  table.appendChild(body);
  const note=document.createElement('p');note.textContent=rows.length>800?`A mostrar 800 de ${rows.length} indicadores.`:`Fonte seletiva: ${source.stats.sections} secções · ~${source.stats.approxRecords} registos${numeric.length?` · ${numeric.length} valores numéricos`:''}.`;
  host.replaceChildren(title,controls,summary,table,note);
  return host;
}

export function clearPortfolioReadOnly(root:HTMLElement):void{
  root.querySelector('[data-modern-portfolio-readonly]')?.remove();
}
