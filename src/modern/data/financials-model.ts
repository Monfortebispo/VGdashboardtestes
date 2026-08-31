export interface FinancialsSourceSnapshot {
  raw:unknown;
  store?:unknown;
  available:boolean;
  topLevelKeys:string[];
  approxRecords:number;
}

export interface CanonicalFinancialTotals {
  revenue:number;
  gop:number|null;
}

type FinancialRaw={hotels_ops?:Record<string,Record<string,Record<string,unknown>>>};

function approxRecords(value:unknown):number{
  if(Array.isArray(value))return value.length;
  if(value&&typeof value==='object')return Object.keys(value as Record<string,unknown>).length;
  return value==null?0:1;
}
function finite(v:unknown):number|null{const n=Number(v);return Number.isFinite(n)?n:null;}
function rawOf(value:FinancialsSourceSnapshot|unknown):FinancialRaw|undefined{
  const candidate=value&&typeof value==='object'&&'raw' in (value as Record<string,unknown>)?(value as FinancialsSourceSnapshot).raw:value;
  return candidate&&typeof candidate==='object'?candidate as FinancialRaw:undefined;
}
export function canonicalFinancialValue(value:FinancialsSourceSnapshot|unknown,hotel:string,metric:string,year:string|number):number|null{
  return finite(rawOf(value)?.hotels_ops?.[hotel]?.[metric]?.[String(year)]);
}
export function canonicalFinancialTotal(value:FinancialsSourceSnapshot|unknown,hotels:readonly string[],metric:string,year:string|number):number{
  return hotels.reduce((sum,hotel)=>sum+(canonicalFinancialValue(value,hotel,metric,year)||0),0);
}
export function canonicalFinancialTotals(value:FinancialsSourceSnapshot|unknown,hotels:readonly string[],year:string|number):CanonicalFinancialTotals{
  const revenue=canonicalFinancialTotal(value,hotels,'Receita Total',year);
  const gopCandidates=['GOP sem sede','GOP Sem Sede','GOP'];
  let gop:number|null=null;
  for(const metric of gopCandidates){
    const vals=hotels.map(h=>canonicalFinancialValue(value,h,metric,year)).filter((v):v is number=>v!=null);
    if(vals.length){gop=vals.reduce((a,b)=>a+b,0);break;}
  }
  return{revenue,gop};
}
export function reconcileUsaliRevenue(value:FinancialsSourceSnapshot|unknown,hotels:readonly string[],year:string|number,rooms:number,fb:number,legacyOther:number):{rooms:number;fb:number;other:number;total:number;residual:number}{
  const official=canonicalFinancialTotal(value,hotels,'Receita Total',year);
  const classified=rooms+fb+legacyOther;
  const residual=official-classified;
  return{rooms,fb,other:legacyOther+residual,total:official,residual};
}

export function financialsSnapshot(value:unknown,store?:unknown):FinancialsSourceSnapshot{
  return{raw:value,store,available:value!=null,topLevelKeys:value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value as Record<string,unknown>):[],approxRecords:approxRecords(value)};
}
