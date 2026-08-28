import { currentReputationData } from '../data/reputation-service';
import { latestReputationRecordsByHotel, reputationPeriodDate, reputationRecords } from '../data/reputation-model';
import type { ReputationRecord } from '../data/reputation-model';
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
function fmt(v:number|null,digits=1):string{return v==null?'—':Number.isInteger(v)?String(v):v.toFixed(digits);}
function pct(v:number|null):string{return v==null?'—':`${fmt(v)}%`;}
function average(values:(number|null)[]):number|null{
  const valid=values.filter((v):v is number=>v!=null&&Number.isFinite(v));
  return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;
}
function sum(values:(number|null)[]):number{return values.reduce<number>((a,b)=>a+(b??0),0);}
function cell(value:string):HTMLTableCellElement{const td=document.createElement('td');td.textContent=value;return td;}
function heading(text:string):HTMLHeadingElement{const h=document.createElement('h3');h.textContent=text;return h;}
function section(className:string):HTMLElement{const s=document.createElement('section');s.className=className;return s;}
function metricCard(label:string,value:string,detail?:string):HTMLElement{
  const card=document.createElement('div');card.className='modern-reputation-kpi';
  const l=document.createElement('span');l.textContent=label;const v=document.createElement('strong');v.textContent=value;card.append(l,v);
  if(detail){const d=document.createElement('small');d.textContent=detail;card.appendChild(d);}return card;
}
function selectedRecords(records:ReputationRecord[],selection:Readonly<ReputationSelection>):ReputationRecord[]{
  const hotelFiltered=selection.hotel==='__all__'?records:records.filter(r=>r.hotel===selection.hotel);
  if(selection.period==='__latest__')return latestReputationRecordsByHotel(hotelFiltered);
  return hotelFiltered.filter(r=>r.period===selection.period).sort((a,b)=>a.hotel.localeCompare(b.hotel,'pt'));
}
function renderRanking(records:ReputationRecord[]):HTMLElement{
  const wrap=section('modern-reputation-section');wrap.appendChild(heading('Ranking GRI'));
  const table=document.createElement('table');table.dataset.modernReputationRanking='true';
  const head=document.createElement('thead'),hr=document.createElement('tr');['#','Hotel','Período','GRI','Meta','Δ GRI','Avaliações','Resposta Gestão'].forEach(t=>{const th=document.createElement('th');th.textContent=t;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');[...records].sort((a,b)=>(b.gri??-Infinity)-(a.gri??-Infinity)).forEach((r,i)=>{const tr=document.createElement('tr');[String(i+1),r.hotel,r.period,pct(r.gri),pct(r.griGoal),r.griDelta==null?'—':`${r.griDelta>=0?'+':''}${fmt(r.griDelta)} p.p.`,fmt(r.reviews,0),pct(r.managementResponse)].forEach(v=>tr.appendChild(cell(v)));body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);return wrap;
}
function renderSources(records:ReputationRecord[]):HTMLElement{
  const wrap=section('modern-reputation-section');wrap.appendChild(heading('Resultados por origem'));
  const names=[...new Set(records.flatMap(r=>r.sources.map(s=>s.name)))];
  const table=document.createElement('table');table.dataset.modernReputationSources='true';const head=document.createElement('thead'),hr=document.createElement('tr');['Hotel',...names].forEach(t=>{const th=document.createElement('th');th.textContent=t;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');records.forEach(r=>{const tr=document.createElement('tr');tr.appendChild(cell(r.hotel));names.forEach(name=>tr.appendChild(cell(pct(r.sources.find(s=>s.name===name)?.score??null))));body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);return wrap;
}
function renderDepartments(records:ReputationRecord[]):HTMLElement{
  const wrap=section('modern-reputation-section');wrap.appendChild(heading('Departamentos'));
  const names=[...new Set(records.flatMap(r=>r.departments.map(d=>d.name)))];
  const table=document.createElement('table');table.dataset.modernReputationDepartments='true';const head=document.createElement('thead'),hr=document.createElement('tr');['Hotel',...names].forEach(t=>{const th=document.createElement('th');th.textContent=t;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');records.forEach(r=>{const tr=document.createElement('tr');tr.appendChild(cell(r.hotel));names.forEach(name=>tr.appendChild(cell(pct(r.departments.find(d=>d.name===name)?.value??null))));body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);return wrap;
}
function renderEvolution(records:ReputationRecord[],selection:Readonly<ReputationSelection>):HTMLElement{
  const wrap=section('modern-reputation-section');wrap.appendChild(heading('Evolução temporal'));
  const scoped=selection.hotel==='__all__'?records:records.filter(r=>r.hotel===selection.hotel);
  const table=document.createElement('table');table.dataset.modernReputationEvolution='true';const head=document.createElement('thead'),hr=document.createElement('tr');['Hotel','Período','GRI','Avaliações','Resposta Gestão'].forEach(t=>{const th=document.createElement('th');th.textContent=t;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');[...scoped].sort((a,b)=>a.hotel.localeCompare(b.hotel,'pt')||reputationPeriodDate(a.period)-reputationPeriodDate(b.period)).forEach(r=>{const tr=document.createElement('tr');[r.hotel,r.period,pct(r.gri),fmt(r.reviews,0),pct(r.managementResponse)].forEach(v=>tr.appendChild(cell(v)));body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);return wrap;
}

export function renderReputationReadOnly(root:HTMLElement,selection:Readonly<ReputationSelection>,actions:ReputationRenderActions={}):HTMLElement {
  const source=currentReputationData();
  let host=root.querySelector<HTMLElement>('[data-modern-reputation-readonly]');
  if(!host){host=document.createElement('section');host.dataset.modernReputationReadonly='true';root.appendChild(host);}
  const title=document.createElement('h2');title.textContent='Reputação & Guest Experience';
  if(!source?.stats.available){const empty=document.createElement('p');empty.textContent='Sem dados de reputação disponíveis.';host.replaceChildren(title,empty);return host;}

  const records=reputationRecords(source.data);
  const hotels=[...new Set(records.map(r=>r.hotel).filter(v=>v!=='—'))].sort((a,b)=>a.localeCompare(b,'pt'));
  const periods=[...new Set(records.map(r=>r.period).filter(v=>v!=='—'))].sort((a,b)=>reputationPeriodDate(b)-reputationPeriodDate(a)||b.localeCompare(a,'pt'));
  const filtered=selectedRecords(records,selection);

  const meta=document.createElement('p');meta.textContent=`${filtered.length} hotéis/resumos na seleção atual · ${records.length} resumos ReviewPro carregados`;
  const controls=document.createElement('div');controls.dataset.modernReputationControls='true';
  const hc=control('Hotel',selection.hotel,['__all__',...hotels]);
  const pc=control('Período',selection.period,['__latest__',...periods]);
  const hs=hc.querySelector('select')!,ps=pc.querySelector('select')!;
  hs.addEventListener('change',()=>actions.onSelectionChange?.({hotel:hs.value}));
  ps.addEventListener('change',()=>actions.onSelectionChange?.({period:ps.value}));
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Atualizar reputação';refresh.addEventListener('click',async()=>{refresh.disabled=true;try{await actions.onRefresh?.();}finally{refresh.disabled=false;}});
  controls.append(hc,pc,refresh);

  if(!filtered.length){const empty=document.createElement('p');empty.textContent='Sem registos para os filtros selecionados.';host.replaceChildren(title,meta,controls,empty);return host;}

  const kpis=document.createElement('div');kpis.className='modern-reputation-kpis';
  const avgGri=average(filtered.map(r=>r.gri)),avgGoal=average(filtered.map(r=>r.griGoal)),avgResp=average(filtered.map(r=>r.managementResponse));
  const goalHits=filtered.filter(r=>r.gri!=null&&r.griGoal!=null&&r.gri>=r.griGoal).length;
  kpis.append(
    metricCard('GRI médio',pct(avgGri),avgGoal==null?undefined:`Meta média ${pct(avgGoal)}`),
    metricCard('Avaliações',String(sum(filtered.map(r=>r.reviews)))),
    metricCard('Resposta da gestão',pct(avgResp)),
    metricCard('Hotéis na meta',`${goalHits}/${filtered.filter(r=>r.griGoal!=null).length}`)
  );

  host.replaceChildren(title,meta,controls,kpis,renderRanking(filtered),renderSources(filtered),renderDepartments(filtered),renderEvolution(records,selection));return host;
}

export function clearReputationReadOnly(root:HTMLElement):void {root.querySelector('[data-modern-reputation-readonly]')?.remove();}
