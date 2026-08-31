import { currentFinancialsData } from './financials-service';
import { resolveFinancialViewContext, type FinancialViewContext } from '../revenue/financial-view-context';

type FinancialSection='hotels_costs'|'hotels_rev'|'hotels_ops';
type RawFinancials=Record<FinancialSection,Record<string,Record<string,Record<string,unknown>>>>;

export interface ModernFinancialsBridge {
  version:number;
  available:()=>boolean;
  context:()=>FinancialViewContext|null;
  value:(section:FinancialSection,hotel:string,field:string,year:string|number)=>number|null;
  sum:(section:FinancialSection,field:string,year:string|number,hotels:readonly string[])=>number|null;
  officialRevenue:(year:string|number,hotels:readonly string[])=>number|null;
}

function snapshot(){return currentFinancialsData();}
function raw():Partial<RawFinancials>|null{
  const data=snapshot();
  return data?.raw&&typeof data.raw==='object'?data.raw as Partial<RawFinancials>:null;
}
function context():FinancialViewContext|null{
  const data=snapshot();
  return data?resolveFinancialViewContext(data):null;
}
function finite(value:unknown):number|null{const n=Number(value);return Number.isFinite(n)?n:null;}
function value(section:FinancialSection,hotel:string,field:string,year:string|number):number|null{
  return finite(raw()?.[section]?.[hotel]?.[field]?.[String(year)]);
}
function sum(section:FinancialSection,field:string,year:string|number,hotels:readonly string[]):number|null{
  const source=raw();if(!source)return null;
  let found=false,total=0;
  for(const hotel of hotels){const v=finite(source[section]?.[hotel]?.[field]?.[String(year)]);if(v!=null){found=true;total+=v;}}
  return found?total:null;
}

export function installFinancialsBridge():ModernFinancialsBridge{
  const bridge:ModernFinancialsBridge={version:2,available:()=>!!raw(),context,value,sum,officialRevenue:(year,hotels)=>sum('hotels_ops','Receita Total',year,hotels)};
  const w=window as Window&{VG?:Record<string,unknown>&{modernFinancials?:ModernFinancialsBridge}};
  w.VG=w.VG||{};w.VG.modernFinancials=bridge;
  return bridge;
}
