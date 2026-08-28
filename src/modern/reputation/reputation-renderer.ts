import { currentReputationData } from '../data/reputation-service';
import { latestReputationRecordsByHotel, reputationPeriodDate, reputationRecords } from '../data/reputation-model';
import type { ReputationRecord } from '../data/reputation-model';
import type { ReputationSelection } from './reputation-state';

export interface ReputationRenderActions {
  onSelectionChange?:(next:Partial<ReputationSelection>)=>void;
  onRefresh?:()=>void|Promise<void>;
}

type ChartConfig={type:string;data:{labels:string[];datasets:Array<Record<string,unknown>>};options?:Record<string,unknown>};
type ChartInstance={destroy:()=>void};
type ChartConstructor={new(ctx:CanvasRenderingContext2D,config:ChartConfig):ChartInstance;getChart?:(canvas:HTMLCanvasElement)=>ChartInstance|undefined};

function control(labelText:string,value:string,values:string[]):HTMLLabelElement{
  const label=document.createElement('label');label.className='modern-reputation-filter';
  const span=document.createElement('span');span.textContent=labelText;
  const select=document.createElement('select');select.dataset.filter=labelText.toLowerCase();
  values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v==='__all__'?'Todos':v==='__latest__'?'Mais recente':v;select.appendChild(o);});
  select.value=value;label.append(span,select);return label;
}
function fmt(v:number|null,digits=1):string{return v==null?'—':Number.isInteger(v)?String(v):v.toFixed(digits);}
function pct(v:number|null):string{return v==null?'—':`${fmt(v)}%`;}
function signed(v:number|null,suffix=''):string{return v==null?'—':`${v>=0?'+':''}${fmt(v)}${suffix}`;}
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
  const head=document.createElement('thead'),hr=document.createElement('tr');['#','Hotel','Período','GRI','Meta','Δ GRI','Avaliações','Δ Avaliações','Resposta Gestão','CQI','Rank VG'].forEach(t=>{const th=document.createElement('th');th.textContent=t;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');[...records].sort((a,b)=>(b.gri??-Infinity)-(a.gri??-Infinity)).forEach((r,i)=>{const tr=document.createElement('tr');[String(i+1),r.hotel,r.period,pct(r.gri),pct(r.griGoal),signed(r.griDelta,' p.p.'),fmt(r.reviews,0),signed(r.reviewsDelta),pct(r.managementResponse),pct(r.cqi),fmt(r.rankVG,0)].forEach(v=>tr.appendChild(cell(v)));body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);return wrap;
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
  const table=document.createElement('table');table.dataset.modernReputationEvolution='true';const head=document.createElement('thead'),hr=document.createElement('tr');['Hotel','Período','GRI','Δ GRI','Avaliações','Δ Avaliações','Resposta Gestão'].forEach(t=>{const th=document.createElement('th');th.textContent=t;hr.appendChild(th);});head.appendChild(hr);table.appendChild(head);
  const body=document.createElement('tbody');[...scoped].sort((a,b)=>a.hotel.localeCompare(b.hotel,'pt')||reputationPeriodDate(a.period)-reputationPeriodDate(b.period)).forEach(r=>{const tr=document.createElement('tr');[r.hotel,r.period,pct(r.gri),signed(r.griDelta,' p.p.'),fmt(r.reviews,0),signed(r.reviewsDelta),pct(r.managementResponse)].forEach(v=>tr.appendChild(cell(v)));body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);return wrap;
}
function miniTable(titleText:string,headers:string[],rows:string[][]):HTMLElement{
  const block=document.createElement('div');block.className='modern-reputation-detail-block';block.appendChild(heading(titleText));
  if(!rows.length){const p=document.createElement('p');p.textContent='Sem dados.';block.appendChild(p);return block;}
  const table=document.createElement('table');const thead=document.createElement('thead'),hr=document.createElement('tr');headers.forEach(h=>{const th=document.createElement('th');th.textContent=h;hr.appendChild(th);});thead.appendChild(hr);table.appendChild(thead);
  const tbody=document.createElement('tbody');rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(v=>tr.appendChild(cell(v)));tbody.appendChild(tr);});table.appendChild(tbody);block.appendChild(table);return block;
}
function renderDetail(records:ReputationRecord[]):HTMLElement{
  const wrap=section('modern-reputation-section');wrap.dataset.modernReputationDetail='true';wrap.appendChild(heading('Detalhe por unidade e semana'));
  const cards=document.createElement('div');cards.className='modern-reputation-detail-grid';
  records.forEach(r=>{
    const card=document.createElement('article');card.className='modern-reputation-detail-card';
    const h=document.createElement('h4');h.textContent=`${r.hotel} · ${r.week}`;
    const summary=document.createElement('div');summary.className='modern-reputation-detail-summary';
    summary.append(
      metricCard('GRI',pct(r.gri),`Δ ${signed(r.griDelta,' p.p.')}`),
      metricCard('Meta',pct(r.griGoal)),
      metricCard('Avaliações',fmt(r.reviews,0),`Δ ${signed(r.reviewsDelta)}`),
      metricCard('Resposta gestão',pct(r.managementResponse)),
      metricCard('CQI',pct(r.cqi)),
      metricCard('Rank VG',fmt(r.rankVG,0))
    );
    card.append(h,summary,
      miniTable('Origens',['Origem','Score','Δ','Reviews'],r.sources.map(s=>[s.name,pct(s.score),signed(s.delta,' p.p.'),fmt(s.reviews,0)])),
      miniTable('Departamentos',['Departamento','Score','Δ'],r.departments.map(d=>[d.name,pct(d.value),signed(d.delta,' p.p.')])),
      miniTable('Categorias negativas',['Categoria','Menções','Impacto'],r.negativeCategories.map(c=>[c.category,fmt(c.mentions,0),signed(c.impact)])),
      miniTable('Categorias positivas',['Categoria','Menções','Impacto'],r.positiveCategories.map(c=>[c.category,fmt(c.mentions,0),signed(c.impact)]))
    );
    cards.appendChild(card);
  });
  wrap.appendChild(cards);return wrap;
}
function chartCard(titleText:string,id:string):HTMLElement{
  const card=document.createElement('div');card.className='modern-reputation-chart-card';card.appendChild(heading(titleText));
  const canvas=document.createElement('canvas');canvas.id=id;canvas.height=220;card.appendChild(canvas);return card;
}
function renderChartArea():HTMLElement{
  const wrap=section('modern-reputation-section');wrap.dataset.modernReputationCharts='true';wrap.appendChild(heading('Gráficos de reputação'));
  const grid=document.createElement('div');grid.className='modern-reputation-chart-grid';
  grid.append(chartCard('GRI por hotel','modernRepChartGri'),chartCard('Resultados por origem','modernRepChartSources'),chartCard('Departamentos','modernRepChartDepartments'),chartCard('Evolução GRI','modernRepChartEvolution'));
  wrap.appendChild(grid);return wrap;
}
function chartConstructor():ChartConstructor|undefined{return (window as unknown as {Chart?:ChartConstructor}).Chart;}
function destroyChart(canvas:HTMLCanvasElement,Chart:ChartConstructor):void{try{Chart.getChart?.(canvas)?.destroy();}catch{}}
function buildCharts(root:HTMLElement,visible:ReputationRecord[],all:ReputationRecord[],selection:Readonly<ReputationSelection>):void{
  const Chart=chartConstructor();if(!Chart)return;
  const make=(id:string,config:ChartConfig)=>{const canvas=root.querySelector<HTMLCanvasElement>(`#${id}`);if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;destroyChart(canvas,Chart);new Chart(ctx,config);};
  const labels=visible.map(r=>r.hotel);
  make('modernRepChartGri',{type:'bar',data:{labels,datasets:[{label:'GRI %',data:visible.map(r=>r.gri),borderWidth:1} ]},options:{responsive:true,maintainAspectRatio:false}});
  const sourceNames=[...new Set(visible.flatMap(r=>r.sources.map(s=>s.name)))];
  make('modernRepChartSources',{type:'bar',data:{labels,datasets:sourceNames.map(name=>({label:name,data:visible.map(r=>r.sources.find(s=>s.name===name)?.score??null),borderWidth:1}))},options:{responsive:true,maintainAspectRatio:false}});
  const deptNames=[...new Set(visible.flatMap(r=>r.departments.map(d=>d.name)))];
  make('modernRepChartDepartments',{type:'bar',data:{labels,datasets:deptNames.map(name=>({label:name,data:visible.map(r=>r.departments.find(d=>d.name===name)?.value??null),borderWidth:1}))},options:{responsive:true,maintainAspectRatio:false}});
  const scoped=selection.hotel==='__all__'?all:all.filter(r=>r.hotel===selection.hotel);
  const periods=[...new Set(scoped.map(r=>r.period))].sort((a,b)=>reputationPeriodDate(a)-reputationPeriodDate(b));
  const hotels=[...new Set(scoped.map(r=>r.hotel))];
  make('modernRepChartEvolution',{type:'line',data:{labels:periods,datasets:hotels.map(h=>({label:h,data:periods.map(p=>scoped.find(r=>r.hotel===h&&r.period===p)?.gri??null),spanGaps:true,tension:.3,borderWidth:2}))},options:{responsive:true,maintainAspectRatio:false}});
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

  const chartArea=renderChartArea();
  const detailRecords=selection.hotel==='__all__'?filtered:records.filter(r=>r.hotel===selection.hotel).sort((a,b)=>reputationPeriodDate(b.period)-reputationPeriodDate(a.period));
  host.replaceChildren(title,meta,controls,kpis,chartArea,renderRanking(filtered),renderSources(filtered),renderDepartments(filtered),renderEvolution(records,selection),renderDetail(detailRecords));
  window.requestAnimationFrame(()=>buildCharts(host!,filtered,records,selection));
  return host;
}

export function clearReputationReadOnly(root:HTMLElement):void {root.querySelector('[data-modern-reputation-readonly]')?.remove();}
