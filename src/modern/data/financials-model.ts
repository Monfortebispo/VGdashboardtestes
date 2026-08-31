export interface FinancialsSourceSnapshot {
  raw:unknown;
  available:boolean;
  topLevelKeys:string[];
  approxRecords:number;
}

function approxRecords(value:unknown):number{
  if(Array.isArray(value))return value.length;
  if(value&&typeof value==='object')return Object.keys(value as Record<string,unknown>).length;
  return value==null?0:1;
}

export function financialsSnapshot(value:unknown):FinancialsSourceSnapshot{
  return{
    raw:value,
    available:value!=null,
    topLevelKeys:value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value as Record<string,unknown>):[],
    approxRecords:approxRecords(value)
  };
}
