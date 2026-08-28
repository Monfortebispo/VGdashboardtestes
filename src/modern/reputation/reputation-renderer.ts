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

function fmt(v:number|null,digits=1):string{return v==null?'—':Number.isInteger(v)?String(v):v.toFixed(digits);}
function pct(v:number|null):string{return v==null?'—':`${fmt(v)}%`;}
function signed(v:number|null,suffix=''):string{return v==null?'—':`${v>=0?'+':''}${fmt(v)}${suffix}`;}
function average(values:(number|null)[]):number|null{const valid=values.filter((v):v is number=>v!=null&&Number.isFinite(v));return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;}
function sum(values:(number|null)[]):number{return values.reduce<number>((a,b)=>a+(b??0),0);}
function latest(records:ReputationRecord[]):ReputationRecord[]{return latestReputationRecordsByHotel(records);}
function heading(text:string,level:2|3=2):HTMLHeadingElement{const h=document.createElement(level===2?'h2':'h3');h.textContent=text;return h;}
function section(className:string):HTMLElement{const el=document.createElement('section');el.className=className;return el;}
function td(value:string):HTMLTableCellElement{const el=document.createElement('td');el.textContent=value;return el;}
function th(value:string):HTMLTableCellElement{const el=document.createElement('th');el.textContent=value;return el;}
function badge(label:string,value:string,detail?:string):HTMLElement{const el=document.createElement('article');el.className='rep-kpi';const a=document.createElement('span');a.className='rep-kpi-label';a.textContent=label;const b=document.createElement('strong');b.className='rep-kpi-value';b.textContent=value;el.append(a,b);if(detail){const c=document.createElement('small');c.textContent=detail;el.appendChild(c);}return el;}

function selectedRecords(records:ReputationRecord[],selection:Readonly<ReputationSelection>):ReputationRecord[]{
  const byHotel=selection.hotel==='__all__'?records:records.filter(r=>r.hotel===selection.hotel);
  if(selection.period==='__latest__')return latest(byHotel);
  return byHotel.filter(r=>r.period===selection.period).sort((a,b)=>a.hotel.localeCompare(b.hotel,'pt'));
}

function control(labelText:string,value:string,values:string[]):HTMLLabelElement{
  const label=document.createElement('label');label.className='rep-filter';
  const span=document.createElement('span');span.textContent=labelText;
  const select=document.createElement('select');
  values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v==='__all__'?'Todos os hotéis':v==='__latest__'?'Mais recente':v;select.appendChild(o);});
  select.value=value;label.append(span,select);return label;
}

function chartCard(titleText:string,id:string,subtitle?:string):HTMLElement{
  const card=section('rep-panel rep-chart-panel');
  const head=document.createElement('div');head.className='rep-panel-head';head.appendChild(heading(titleText,3));
  if(subtitle){const s=document.createElement('small');s.textContent=subtitle;head.appendChild(s);}card.appendChild(head);
  const body=document.createElement('div');body.className='rep-chart-body';const canvas=document.createElement('canvas');canvas.id=id;body.appendChild(canvas);card.appendChild(body);return card;
}

function rankingTable(records:ReputationRecord[]):HTMLElement{
  const panel=section('rep-panel rep-ranking');
  const head=document.createElement('div');head.className='rep-panel-head';head.appendChild(heading('Ranking GRI',3));const note=document.createElement('small');note.textContent='Ordenado pela seleção atual';head.appendChild(note);panel.appendChild(head);
  const viewport=document.createElement('div');viewport.className='rep-table-scroll';
  const table=document.createElement('table');table.className='rep-table';
  const thead=document.createElement('thead'),hr=document.createElement('tr');['#','Hotel','GRI','Meta','Δ GRI','Avaliações','Resposta'].forEach(x=>hr.appendChild(th(x)));thead.appendChild(hr);table.appendChild(thead);
  const body=document.createElement('tbody');[...records].sort((a,b)=>(b.gri??-Infinity)-(a.gri??-Infinity)).forEach((r,i)=>{const tr=document.createElement('tr');if(r.gri!=null&&r.griGoal!=null)tr.dataset.goal=r.gri>=r.griGoal?'hit':'miss';[String(i+1),r.hotel,pct(r.gri),pct(r.griGoal),signed(r.griDelta,' p.p.'),fmt(r.reviews,0),pct(r.managementResponse)].forEach(x=>tr.appendChild(td(x)));body.appendChild(tr);});table.appendChild(body);viewport.appendChild(table);panel.appendChild(viewport);return panel;
}

function metricList(titleText:string,headers:string[],rows:string[][]):HTMLElement{
  const block=section('rep-detail-block');block.appendChild(heading(titleText,3));
  if(!rows.length){const p=document.createElement('p');p.className='rep-empty';p.textContent='Sem dados disponíveis.';block.appendChild(p);return block;}
  const table=document.createElement('table');table.className='rep-mini-table';const thead=document.createElement('thead'),hr=document.createElement('tr');headers.forEach(x=>hr.appendChild(th(x)));thead.appendChild(hr);table.appendChild(thead);const body=document.createElement('tbody');rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(x=>tr.appendChild(td(x)));body.appendChild(tr);});table.appendChild(body);block.appendChild(table);return block;
}

function detailPanel(record:ReputationRecord|undefined):HTMLElement{
  const panel=section('rep-panel rep-detail-panel');
  const head=document.createElement('div');head.className='rep-panel-head';head.appendChild(heading(record?`Detalhe · ${record.hotel}`:'Detalhe por hotel',3));const note=document.createElement('small');note.textContent=record?record.period:'Selecione um hotel para análise detalhada';head.appendChild(note);panel.appendChild(head);
  if(!record){const p=document.createElement('p');p.className='rep-empty rep-detail-empty';p.textContent='O comparativo global está ativo. Escolha um hotel no filtro para ver origens, departamentos e categorias desse hotel.';panel.appendChild(p);return panel;}
  const summary=document.createElement('div');summary.className='rep-detail-kpis';summary.append(badge('GRI',pct(record.gri),`Meta ${pct(record.griGoal)}`),badge('Avaliações',fmt(record.reviews,0),`Δ ${signed(record.reviewsDelta)}`),badge('Resposta gestão',pct(record.managementResponse)),badge('CQI',pct(record.cqi)),badge('Rank VG',fmt(record.rankVG,0)));
  const grids=document.createElement('div');grids.className='rep-detail-grid';grids.append(
    metricList('Origens',['Origem','Score','Δ','Reviews'],record.sources.map(s=>[s.name,pct(s.score),signed(s.delta,' p.p.'),fmt(s.reviews,0)])),
    metricList('Departamentos',['Departamento','Score','Δ'],record.departments.map(d=>[d.name,pct(d.value),signed(d.delta,' p.p.')])),
    metricList('Categorias negativas',['Categoria','Menções','Impacto'],record.negativeCategories.map(c=>[c.category,fmt(c.mentions,0),signed(c.impact)])),
    metricList('Categorias positivas',['Categoria','Menções','Impacto'],record.positiveCategories.map(c=>[c.category,fmt(c.mentions,0),signed(c.impact)]))
  );
  panel.append(summary,grids);return panel;
}

function chartConstructor():ChartConstructor|undefined{return (window as unknown as {Chart?:ChartConstructor}).Chart;}
function destroyChart(canvas:HTMLCanvasElement,Chart:ChartConstructor):void{try{Chart.getChart?.(canvas)?.destroy();}catch{}}
function makeChart(root:HTMLElement,id:string,config:ChartConfig):void{const Chart=chartConstructor();if(!Chart)return;const canvas=root.querySelector<HTMLCanvasElement>(`#${id}`);if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;destroyChart(canvas,Chart);new Chart(ctx,config);}

function buildCharts(root:HTMLElement,visible:ReputationRecord[],all:ReputationRecord[],selection:Readonly<ReputationSelection>):void{
  const ranked=[...visible].filter(r=>r.gri!=null).sort((a,b)=>(b.gri??0)-(a.gri??0));
  makeChart(root,'repChartRanking',{type:'bar',data:{labels:ranked.map(r=>r.hotel),datasets:[{label:'GRI %',data:ranked.map(r=>r.gri),borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{min:70,max:100}}}});

  const scoped=selection.hotel==='__all__'?all:all.filter(r=>r.hotel===selection.hotel);
  const periods=[...new Set(scoped.map(r=>r.period))].sort((a,b)=>reputationPeriodDate(a)-reputationPeriodDate(b));
  const trend=periods.map(p=>{const rows=scoped.filter(r=>r.period===p);return average(rows.map(r=>r.gri));});
  makeChart(root,'repChartEvolution',{type:'line',data:{labels:periods,datasets:[{label:selection.hotel==='__all__'?'GRI médio':'GRI',data:trend,spanGaps:true,tension:.25,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:70,max:100}}}});
}

export function renderReputationReadOnly(root:HTMLElement,selection:Readonly<ReputationSelection>,actions:ReputationRenderActions={}):HTMLElement {
  const source=currentReputationData();
  let host=root.querySelector<HTMLElement>('[data-modern-reputation-readonly]');
  if(!host){host=document.createElement('section');host.dataset.modernReputationReadonly='true';root.appendChild(host);}
  host.className='rep-dashboard';

  if(!source?.stats.available){const empty=document.createElement('p');empty.className='rep-empty';empty.textContent='Sem dados de reputação disponíveis.';host.replaceChildren(heading('Reputação & Guest Experience'),empty);return host;}

  const records=reputationRecords(source.data);
  const hotels=[...new Set(records.map(r=>r.hotel).filter(v=>v!=='—'))].sort((a,b)=>a.localeCompare(b,'pt'));
  const periods=[...new Set(records.map(r=>r.period).filter(v=>v!=='—'))].sort((a,b)=>reputationPeriodDate(b)-reputationPeriodDate(a)||b.localeCompare(a,'pt'));
  const visible=selectedRecords(records,selection);

  const top=document.createElement('div');top.className='rep-topbar';
  const titleWrap=document.createElement('div');titleWrap.className='rep-title';titleWrap.appendChild(heading('Reputação & Guest Experience'));
  const subtitle=document.createElement('p');subtitle.textContent=`${visible.length} unidades na seleção · ${records.length} resumos carregados`;titleWrap.appendChild(subtitle);
  const controls=document.createElement('div');controls.className='rep-controls';
  const hc=control('Hotel',selection.hotel,['__all__',...hotels]),pc=control('Período',selection.period,['__latest__',...periods]);
  const hs=hc.querySelector('select')!,ps=pc.querySelector('select')!;hs.addEventListener('change',()=>actions.onSelectionChange?.({hotel:hs.value}));ps.addEventListener('change',()=>actions.onSelectionChange?.({period:ps.value}));
  const refresh=document.createElement('button');refresh.type='button';refresh.className='rep-refresh';refresh.textContent='Atualizar';refresh.addEventListener('click',async()=>{refresh.disabled=true;try{await actions.onRefresh?.();}finally{refresh.disabled=false;}});controls.append(hc,pc,refresh);top.append(titleWrap,controls);

  if(!visible.length){const empty=document.createElement('p');empty.className='rep-empty';empty.textContent='Sem registos para os filtros selecionados.';host.replaceChildren(top,empty);return host;}

  const kpis=document.createElement('div');kpis.className='rep-kpi-grid';const avgGri=average(visible.map(r=>r.gri)),avgGoal=average(visible.map(r=>r.griGoal)),avgResp=average(visible.map(r=>r.managementResponse));const evaluable=visible.filter(r=>r.gri!=null&&r.griGoal!=null),hits=evaluable.filter(r=>(r.gri??0)>=(r.griGoal??0)).length;
  kpis.append(badge('GRI médio',pct(avgGri),avgGoal==null?'Sem meta média':`Meta ${pct(avgGoal)}`),badge('Avaliações',String(sum(visible.map(r=>r.reviews)))),badge('Resposta gestão',pct(avgResp)),badge('Na meta',`${hits}/${evaluable.length}`),badge('Melhor GRI',pct([...visible].sort((a,b)=>(b.gri??-Infinity)-(a.gri??-Infinity))[0]?.gri??null)));

  const charts=document.createElement('div');charts.className='rep-chart-grid';charts.append(chartCard('GRI por hotel','repChartRanking','Comparação direta da seleção'),chartCard('Evolução GRI','repChartEvolution',selection.hotel==='__all__'?'Média do portefólio selecionado':selection.hotel));

  const analysis=document.createElement('div');analysis.className='rep-analysis-grid';const selectedDetail=selection.hotel==='__all__'?undefined:[...visible].sort((a,b)=>reputationPeriodDate(b.period)-reputationPeriodDate(a.period))[0];analysis.append(rankingTable(visible),detailPanel(selectedDetail));

  host.replaceChildren(top,kpis,charts,analysis);
  window.requestAnimationFrame(()=>buildCharts(host!,visible,records,selection));
  return host;
}

export function clearReputationReadOnly(root:HTMLElement):void {root.querySelector('[data-modern-reputation-readonly]')?.remove();}
