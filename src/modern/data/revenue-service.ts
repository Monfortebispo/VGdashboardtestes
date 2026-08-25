import { cachedData, ensureDataSource } from './data-registry';
import type { RevenueSourceSnapshot } from './revenue-model';

export interface RevenueDiagnostics {
  loadMs:number;
  records:number;
  available:boolean;
  approxBytes:number;
}

function approxBytes(value:unknown):number {
  try{return new Blob([JSON.stringify(value)]).size;}catch(e){
    try{return JSON.stringify(value).length;}catch(_){return 0;}
  }
}

export async function revenueData(force=false):Promise<RevenueSourceSnapshot>{
  return ensureDataSource<RevenueSourceSnapshot>('revenue',{force});
}

export function currentRevenueData():RevenueSourceSnapshot|undefined{
  return cachedData<RevenueSourceSnapshot>('revenue');
}

export async function revenueDiagnostics(force=false):Promise<RevenueDiagnostics>{
  const started=performance.now();
  const data=await revenueData(force);
  return {
    loadMs:Number((performance.now()-started).toFixed(2)),
    records:data.stats.records,
    available:data.stats.available,
    approxBytes:approxBytes(data.data)
  };
}
