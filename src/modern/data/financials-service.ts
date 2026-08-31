import { cachedData, ensureDataSource } from './data-registry';
import type { FinancialsSourceSnapshot } from './financials-model';

export async function financialsData(force=false):Promise<FinancialsSourceSnapshot>{
  return ensureDataSource<FinancialsSourceSnapshot>('financials',{force});
}

export function currentFinancialsData():FinancialsSourceSnapshot|undefined{
  return cachedData<FinancialsSourceSnapshot>('financials');
}
