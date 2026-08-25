export interface ReputationSourceSnapshot {
  data:unknown;
  stats:{records:number;available:boolean};
}

export function reputationRecordCount(value:unknown):number {
  if(Array.isArray(value))return value.length;
  if(!value||typeof value!=='object')return 0;
  return Object.values(value as Record<string,unknown>).reduce((sum,item)=>{
    if(Array.isArray(item))return sum+item.length;
    if(item&&typeof item==='object')return sum+reputationRecordCount(item);
    return sum;
  },0);
}

export function reputationTopLevelKeys(value:unknown):string[] {
  if(!value||typeof value!=='object'||Array.isArray(value))return [];
  return Object.keys(value as Record<string,unknown>);
}
