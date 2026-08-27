import { cachedData, ensureDataSource } from './data-registry';
import { costsSnapshot, type CostsSourceSnapshot } from './costs-model';

export interface CostsDiagnostics {loadMs:number;records:number;hotels:number;categories:number;available:boolean;}

export async function costsData(force=false):Promise<CostsSourceSnapshot>{
  const financials=await ensureDataSource<unknown>('financials',{force});
  return costsSnapshot(financials);
}

export function currentCostsData():CostsSourceSnapshot|undefined{
  const financials=cachedData<unknown>('financials');
  return financials===undefined?undefined:costsSnapshot(financials);
}

export async function costsDiagnostics(force=false):Promise<CostsDiagnostics>{
  const started=performance.now();
  const data=await costsData(force);
  return {loadMs:Number((performance.now()-started).toFixed(2)),records:data.stats.records,hotels:data.stats.hotels,categories:data.stats.categories,available:data.stats.available};
}
