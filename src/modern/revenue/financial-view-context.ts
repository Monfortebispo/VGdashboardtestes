import type { FinancialsSourceSnapshot } from '../data/financials-model';

export type FinancialSection='hotels_rev'|'hotels_ops'|'hotels_costs';
export type FinancialRaw={hotel_list?:string[];hotels_rev?:Record<string,Record<string,Record<string,unknown>>>;hotels_ops?:Record<string,Record<string,Record<string,unknown>>>;hotels_costs?:Record<string,Record<string,Record<string,unknown>>>};
type ContextWindow=Window&{getActiveHotels?:()=>string[];VG?:Window['VG']&{market?:{symbol?:()=>string}}};
export interface FinancialViewContext{data:FinancialRaw;activeHotels:string[];previousYear:string;currentYear:string;currencySymbol:string;totalHotels:number;}

export function financialRaw(snapshot:FinancialsSourceSnapshot):FinancialRaw{return snapshot.raw&&typeof snapshot.raw==='object'?snapshot.raw as FinancialRaw:{};}
export function financialValue(data:FinancialRaw,section:FinancialSection,hotel:string,field:string,year:string):number{const n=Number(data[section]?.[hotel]?.[field]?.[year]);return Number.isFinite(n)?n:0;}
export function resolveFinancialViewContext(snapshot:FinancialsSourceSnapshot):FinancialViewContext{
  const data=financialRaw(snapshot),w=window as ContextWindow,found=new Set<string>();
  for(const section of ['hotels_ops','hotels_rev'] as const)for(const hotel of Object.values(data[section]||{}))for(const field of Object.values(hotel||{}))for(const key of Object.keys(field||{}))if(/^20\d{2}$/.test(key))found.add(key);
  const sorted=[...found].sort((a,b)=>Number(a)-Number(b)),currentYear=sorted.at(-1)||String(new Date().getFullYear()),previousYear=sorted.at(-2)||String(Number(currentYear)-1);
  const selected=w.getActiveHotels?.();
  const activeHotels=Array.isArray(selected)&&selected.length?selected:Array.isArray(data.hotel_list)?data.hotel_list.slice():Object.keys(data.hotels_ops||{});
  return{data,activeHotels,previousYear,currentYear,currencySymbol:w.VG?.market?.symbol?.()||'€',totalHotels:data.hotel_list?.length||Object.keys(data.hotels_ops||{}).length};
}
