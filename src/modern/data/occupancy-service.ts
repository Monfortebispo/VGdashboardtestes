import { cachedData, ensureDataSource } from './data-registry';
import { occupancyPickup, type OccupancySourceSnapshot } from './occupancy-model';

export interface OccupancyDiagnostics {
  loadMs:number;
  snapshots:number;
  hotels:number;
  approxBytes:number;
  source:'bridge'|'empty';
}

function approxBytes(value:unknown):number {
  try{return new Blob([JSON.stringify(value)]).size;}catch(e){
    try{return JSON.stringify(value).length;}catch(_){return 0;}
  }
}

export async function occupancyData(force=false):Promise<OccupancySourceSnapshot>{
  return ensureDataSource<OccupancySourceSnapshot>('occupancy',{force});
}

export function currentOccupancyData():OccupancySourceSnapshot|undefined {
  return cachedData<OccupancySourceSnapshot>('occupancy');
}

export async function occupancyDiagnostics(force=false):Promise<OccupancyDiagnostics>{
  const started=performance.now();
  const data=await occupancyData(force);
  const loadMs=performance.now()-started;
  return {
    loadMs:Number(loadMs.toFixed(2)),
    snapshots:data.stats.snapshots,
    hotels:data.stats.hotels,
    approxBytes:approxBytes(data.snapshots),
    source:data.stats.snapshots>0?'bridge':'empty'
  };
}

export async function pickupFor(hotel:string,year:string|number):Promise<{before:number|null;after:number|null;delta:number|null}>{
  const data=await occupancyData();
  return occupancyPickup(data.snapshots,hotel,year);
}
