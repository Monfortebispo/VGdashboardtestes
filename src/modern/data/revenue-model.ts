export interface RevenueSourceSnapshot {
  data:unknown;
  stats:{records:number;available:boolean};
}

export function revenueRecordCount(value:unknown):number {
  if(Array.isArray(value))return value.length;
  if(value&&typeof value==='object')return Object.keys(value as Record<string,unknown>).length;
  return value==null?0:1;
}
