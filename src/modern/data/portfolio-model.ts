export interface PortfolioSourceSnapshot {
  data:unknown;
  stats:{
    available:boolean;
    sections:number;
    approxRecords:number;
  };
}

export function countSections(value:unknown):number{
  if(!value||typeof value!=='object'||Array.isArray(value))return 0;
  return Object.keys(value as Record<string,unknown>).length;
}

export function countApproxRecords(value:unknown):number{
  if(Array.isArray(value))return value.length;
  if(!value||typeof value!=='object')return 0;
  return Object.values(value as Record<string,unknown>).reduce((sum,item)=>sum+(Array.isArray(item)?item.length:1),0);
}
