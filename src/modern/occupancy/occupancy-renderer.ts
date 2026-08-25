import { currentOccupancyData } from '../data/occupancy-service';
import { averageOccupancy, latestSnapshot, yearValues } from '../data/occupancy-model';
import type { OccupancySelection } from './occupancy-state';

const MONTHS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

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

export function renderOccupancyReadOnly(root:HTMLElement,selection:Readonly<OccupancySelection>):HTMLElement {
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

  const hotels=selection.hotel==='__all__'?Object.keys(snapshot.data):[selection.hotel].filter(h=>Boolean(snapshot.data[h]));
  const years=[...new Set(hotels.flatMap(h=>Object.keys(snapshot.data[h]||{})))].sort();

  const title=document.createElement('h2');
  title.textContent='Ocupação';
  const meta=document.createElement('p');
  meta.textContent=`Snapshot: ${snapshot.label||snapshot.id} · ${hotels.length} ${hotels.length===1?'hotel':'hotéis'}`;

  const table=document.createElement('table');
  table.dataset.modernOccupancyTable='true';
  const thead=document.createElement('thead');
  const headRow=document.createElement('tr');
  ['Hotel','Ano',...MONTHS,'Média'].forEach(label=>{
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
      const row=document.createElement('tr');
      const cells=[hotel,year,...values.map(pct),pct(averageOccupancy(values))];
      cells.forEach(value=>{
        const td=document.createElement('td');
        td.textContent=String(value);
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  });
  table.appendChild(tbody);

  host.replaceChildren(title,meta,table);
  return host;
}

export function clearOccupancyReadOnly(root:HTMLElement):void {
  root.querySelector('[data-modern-occupancy-readonly]')?.remove();
}
