import { currentReputationData } from '../data/reputation-service';
import { reputationRecords } from '../data/reputation-model';
import type { ReputationSelection } from './reputation-state';

export interface ReputationRenderActions {
  onSelectionChange?:(next:Partial<ReputationSelection>)=>void;
  onRefresh?:()=>void|Promise<void>;
}

function control(labelText:string,value:string,values:string[]):HTMLLabelElement{
  const label=document.createElement('label');label.className='modern-reputation-filter';
  const span=document.createElement('span');span.textContent=labelText;
  const select=document.createElement('select');select.dataset.filter=labelText.toLowerCase();
  values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v==='__all__'?'Todos':v==='__latest__'?'Mais recente':v;select.appendChild(o);});
  select.value=value;label.append(span,select);return label;
}
function fmt(v:number|null):string{return v==null?'—':Number.isInteger(v)?String(v):v.toFixed(1);}

export function renderReputationReadOnly(root:HTMLElement,selection:Readonly<ReputationSelection>,actions:ReputationRenderActions={}):HTMLElement {
  const source=currentReputationData();
  let host=root.querySelector<HTMLElement>('[data-modern-reputation-readonly]');
  if(!host){host=document.createElement('section');host.dataset.modernReputationReadonly='true';root.appendChild(host);}
  const title=document.createElement('h2');title.textContent='Reputação & Guest Experience';
  if(!source?.stats.available){const empty=document.createElement('p');empty.textContent='Sem dados de reputação disponíveis.';host.replaceChildren(title,empty);return host;}

  const records=reputationRecords(source.data);
  const hotels=[...new Set(records.map(r=>r.hotel).filter(v=>v!=='—'))].sort((a,b)=>a.localeCompare(b,'pt'));
  const sources=[...new Set(records.map(r=>r.source).filter(v=>v!=='—'))].sort((a,b)=>a.localeCompare(b,'pt'));
  const periods=[...new Set(records.map(r=>r.period).filter(v=>v!=='—'))].sort((a,b)=>b.localeCompare(a,'pt'));
  const currentPeriod=selection.period==='__latest__'?(periods[0]||'__latest__'):selection.period;
  const filtered=records.filter(r=>(selection.hotel==='__all__'||r.hotel===selection.hotel)&&(selection.source==='__all__'||r.source===selection.source)&&(selection.period==='__latest__'?(!periods.length||r.period===currentPeriod):r.period===selection.period));

  const meta=document.createElement('p');meta.textContent=`${filtered.length} registos na seleção atual · ${records.length} registos normalizados`;
  const controls=document.createElement('div');controls.dataset.modernReputationControls='true';
  const hc=control('Hotel',selection.hotel,['__all__',...hotels]);
  const sc=control('Fonte',selection.source,['__all__',...sources]);
  const pc=control('Período',selection.period,['__latest__',...periods]);
  const hs=hc.querySelector('select')!,ss=sc.querySelector('select')!,ps=pc.querySelector('select')!;
  hs.addEventListener('change',()=>actions.onSelectionChange?.({hotel:hs.value}));
  ss.addEventListener('change',()=>actions.onSelectionChange?.({source:ss.value}));
  ps.addEventListener('change',()=>actions.onSelectionChange?.({period:ps.value}));
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Atualizar reputação';refresh.addEventListener('click',async()=>{refresh.disabled=true;try{await actions.onRefresh?.();}finally{refresh.disabled=false;}});
  controls.append(hc,sc,pc,refresh);

  const table=document.createElement('table');table.dataset.modernReputationTable='true';
  const thead=document.createElement('thead');const hr=document.createElement('tr');['Hotel','Fonte','Período','Score','GRI','Avaliações'].forEach(t=>{const th=document.createElement('th');th.textContent=t;hr.appendChild(th);});thead.appendChild(hr);table.appendChild(thead);
  const tbody=document.createElement('tbody');filtered.forEach(r=>{const tr=document.createElement('tr');[r.hotel,r.source,r.period,fmt(r.score),fmt(r.gri),fmt(r.reviews)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td);});tbody.appendChild(tr);});table.appendChild(tbody);
  if(!filtered.length){const empty=document.createElement('p');empty.textContent='Sem registos para os filtros selecionados.';host.replaceChildren(title,meta,controls,empty);return host;}
  host.replaceChildren(title,meta,controls,table);return host;
}

export function clearReputationReadOnly(root:HTMLElement):void {root.querySelector('[data-modern-reputation-readonly]')?.remove();}
