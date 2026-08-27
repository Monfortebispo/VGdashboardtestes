import { currentOccupancyData } from '../data/occupancy-service';
import { averageOccupancy, latestSnapshot, yearValues } from '../data/occupancy-model';
import type { OccupancySelection } from './occupancy-state';

const MONTHS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export interface OccupancyRenderActions {
  onSelectionChange?:(next:Partial<OccupancySelection>)=>void;
  onRefresh?:()=>void|Promise<void>;
}

function pct(value:number|null):string {
  return value==null?'—':`${value.toFixed(1)}%`;
}

function selectedSnapshotId(selection:Readonly<OccupancySelection>, latestId:number|string|null):string|number|null {
  return selection.snapshot==='__latest__'?latestId:selection.snapshot;
}

function resolveSnapshot(selection:Readonly<OccupancySelection>) {
  const source=currentOccupancyData();
  if(!source)return null;
  const wanted=selectedSnapshotId(selection,source.stats.latestId);
  return source.snapshots.find(s=>String(s.id)===String(wanted))||latestSnapshot(source.snapshots);
}

function selectControl(labelText:string, value:string, options:Array<{value:string;label:string}>):HTMLLabelElement {
  const label=document.createElement('label');
  label.className='modern-occupancy-filter';
  const caption=document.createElement('span');
  caption.textContent=labelText;
  const select=document.createElement('select');
  select.dataset.filter=labelText.toLowerCase();
  options.forEach(option=>{
    const el=document.createElement('option');
    el.value=option.value;
    el.textContent=option.label;
    select.appendChild(el);
  });
  select.value=value;
  label.append(caption,select);
  return label;
}

export function renderOccupancyReadOnly(root:HTMLElement,selection:Readonly<OccupancySelection>,actions:OccupancyRenderActions={}):HTMLElement {
  const source=currentOccupancyData();
  const snapshot=resolveSnapshot(selection);
  let host=root.querySelector<HTMLElement>('[data-modern-occupancy-readonly]');
  if(!host){
    host=document.createElement('section');
    host.dataset.modernOccupancyReadonly='true';
    root.appendChild(host);
  }

  if(!source||!snapshot){
    host.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Sem dados de ocupação disponíveis.'}));
    return host;
  }

  const snapshotHotels=Object.keys(snapshot.data).sort((a,b)=>a.localeCompare(b,'pt'));
  const eligibleSet=new Set((source.eligibleHotels||[]).map(String));
  const regionHotels=eligibleSet.size?snapshotHotels.filter(h=>eligibleSet.has(h)):snapshotHotels;
  const hotels=selection.hotel==='__all__'?regionHotels:[selection.hotel].filter(h=>regionHotels.includes(h)&&Boolean(snapshot.data[h]));
  const allYears=[...new Set(regionHotels.flatMap(h=>Object.keys(snapshot.data[h]||{})))].sort();
  const years=selection.year?[selection.year].filter(year=>allYears.includes(year)):allYears;

  const title=document.createElement('h2');
  title.textContent='Ocupação';
  const meta=document.createElement('p');
  const regional=eligibleSet.size&&regionHotels.length!==snapshotHotels.length?` · filtro regional: ${regionHotels.length}/${snapshotHotels.length} hotéis`:'';
  meta.textContent=`Snapshot: ${snapshot.label||snapshot.id} · ${hotels.length} ${hotels.length===1?'hotel':'hotéis'}${regional}`;

  const controls=document.createElement('div');
  controls.dataset.modernOccupancyControls='true';

  const hotelValue=selection.hotel==='__all__'||regionHotels.includes(selection.hotel)?selection.hotel:'__all__';
  const hotelControl=selectControl('Hotel',hotelValue,[{value:'__all__',label:'Todos os hotéis'},...regionHotels.map(h=>({value:h,label:h}))]);
  const snapshotControl=selectControl('Snapshot',selection.snapshot,[{value:'__latest__',label:'Mais recente'},...source.snapshots.map(s=>({value:String(s.id),label:String(s.label||s.id)}))]);
  const yearControl=selectControl('Ano',selection.year||'', [{value:'',label:'Todos os anos'},...allYears.map(y=>({value:y,label:y}))]);
  const monthControl=selectControl('Mês',selection.month==null?'':String(selection.month), [{value:'',label:'Todos os meses'},...MONTHS.map((m,i)=>({value:String(i),label:m}))]);

  const hotelSelect=hotelControl.querySelector('select')!;
  const snapshotSelect=snapshotControl.querySelector('select')!;
  const yearSelect=yearControl.querySelector('select')!;
  const monthSelect=monthControl.querySelector('select')!;
  hotelSelect.addEventListener('change',()=>actions.onSelectionChange?.({hotel:hotelSelect.value}));
  snapshotSelect.addEventListener('change',()=>actions.onSelectionChange?.({snapshot:snapshotSelect.value}));
  yearSelect.addEventListener('change',()=>actions.onSelectionChange?.({year:yearSelect.value||undefined}));
  monthSelect.addEventListener('change',()=>actions.onSelectionChange?.({month:monthSelect.value===''?null:Number(monthSelect.value)}));

  const refresh=document.createElement('button');
  refresh.type='button';
  refresh.textContent='Atualizar ocupação';
  refresh.addEventListener('click',async()=>{
    refresh.disabled=true;
    try{await actions.onRefresh?.();}finally{refresh.disabled=false;}
  });
  controls.append(hotelControl,snapshotControl,yearControl,monthControl,refresh);

  const table=document.createElement('table');
  table.dataset.modernOccupancyTable='true';
  const thead=document.createElement('thead');
  const headRow=document.createElement('tr');
  const visibleMonths=selection.month==null?MONTHS:[MONTHS[selection.month]];
  ['Hotel','Ano',...visibleMonths,'Média'].forEach(label=>{
    const th=document.createElement('th');
    th.textContent=label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody=document.createElement('tbody');
  hotels.forEach(hotel=>{
    years.filter(year=>snapshot.data[hotel]?.[year]).forEach(year=>{
      const values=yearValues(snapshot,hotel,year);
      const shownValues=selection.month==null?values:[values[selection.month]??null];
      const row=document.createElement('tr');
      const cells=[hotel,year,...shownValues.map(pct),pct(averageOccupancy(values))];
      cells.forEach(value=>{
        const td=document.createElement('td');
        td.textContent=String(value);
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  });
  table.appendChild(tbody);

  host.replaceChildren(title,meta,controls,table);
  return host;
}

export function clearOccupancyReadOnly(root:HTMLElement):void {
  root.querySelector('[data-modern-occupancy-readonly]')?.remove();
}
