import { cachedData, ensureDataSource } from './data-registry';
import type { PortfolioSourceSnapshot } from './portfolio-model';

export interface PortfolioDiagnostics {
  loadMs:number;
  available:boolean;
  sections:number;
  approxRecords:number;
  approxBytes:number;
}

function approxBytes(value:unknown):number{
  try{return new Blob([JSON.stringify(value)]).size;}catch(e){
    try{return JSON.stringify(value).length;}catch(_){return 0;}
  }
}

export async function portfolioData(force=false):Promise<PortfolioSourceSnapshot>{
  return ensureDataSource<PortfolioSourceSnapshot>('portfolio',{force});
}

export function currentPortfolioData():PortfolioSourceSnapshot|undefined{
  return cachedData<PortfolioSourceSnapshot>('portfolio');
}

export async function portfolioDiagnostics(force=false):Promise<PortfolioDiagnostics>{
  const started=performance.now();
  const data=await portfolioData(force);
  return {
    loadMs:Number((performance.now()-started).toFixed(2)),
    available:data.stats.available,
    sections:data.stats.sections,
    approxRecords:data.stats.approxRecords,
    approxBytes:approxBytes(data.data)
  };
}
