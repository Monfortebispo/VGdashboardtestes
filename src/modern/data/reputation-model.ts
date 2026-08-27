export interface ReputationSourceSnapshot {
  data:unknown;
  stats:{records:number;available:boolean};
}

export interface ReputationRecord {
  hotel:string;
  source:string;
  period:string;
  score:number|null;
  reviews:number|null;
  gri:number|null;
  raw:Record<string,unknown>;
}

function asRecord(value:unknown):Record<string,unknown>|null{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
}
function text(value:unknown,fallback='—'):string{
  if(value==null||value==='')return fallback;
  if(typeof value==='string'||typeof value==='number')return String(value);
  return fallback;
}
function num(value:unknown):number|null{
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(typeof value==='string'){
    const n=Number(value.replace(',','.').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:null;
  }
  return null;
}

export function reputationRecordCount(value:unknown):number {
  if(Array.isArray(value))return value.filter(Boolean).length;
  if(!value||typeof value!=='object')return 0;
  return Object.values(value as Record<string,unknown>).reduce<number>((sum,item)=>sum+(Array.isArray(item)?item.filter(Boolean).length:0),0);
}

export function reputationTopLevelKeys(value:unknown):string[] {
  if(!value||typeof value!=='object'||Array.isArray(value))return [];
  return Object.keys(value as Record<string,unknown>);
}

export function reputationRecords(value:unknown):ReputationRecord[]{
  if(!value||typeof value!=='object'||Array.isArray(value))return [];
  const out:ReputationRecord[]=[];
  Object.entries(value as Record<string,unknown>).forEach(([storeKey,rows])=>{
    const list=Array.isArray(rows)?rows:[rows];
    list.forEach(item=>{
      const record=asRecord(item);if(!record)return;
      const hotel=text(record.hotel,storeKey||'—');
      const period=text(record.period??record.week,'—');
      const gri=num(record.gri);
      const reviews=num(record.reviews);
      // Cada entrada do REP_STORE representa um único resumo ReviewPro por hotel/período.
      // Não percorremos depts/srcList/negCats/posCats como se fossem registos independentes.
      out.push({
        hotel,
        source:'ReviewPro',
        period,
        score:gri,
        reviews,
        gri,
        raw:record
      });
    });
  });
  const seen=new Set<string>();
  return out.filter(r=>{
    const key=`${r.hotel}|${r.period}`;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
