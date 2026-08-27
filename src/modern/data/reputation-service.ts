import { cachedData, ensureDataSource } from './data-registry';
import type { ReputationSourceSnapshot } from './reputation-model';

export interface ReputationDiagnostics {
  loadMs:number;
  records:number;
  available:boolean;
}

export async function reputationData(force=false):Promise<ReputationSourceSnapshot>{
  const cached=cachedData<ReputationSourceSnapshot>('reputation');
  const mustRefresh=force||!cached||cached.stats.available===false||cached.stats.records===0;
  return ensureDataSource<ReputationSourceSnapshot>('reputation',{force:mustRefresh});
}

export function currentReputationData():ReputationSourceSnapshot|undefined {
  return cachedData<ReputationSourceSnapshot>('reputation');
}

export async function reputationDiagnostics(force=false):Promise<ReputationDiagnostics>{
  const started=performance.now();
  const data=await reputationData(force);
  return {
    loadMs:Number((performance.now()-started).toFixed(2)),
    records:data.stats.records,
    available:data.stats.available
  };
}
