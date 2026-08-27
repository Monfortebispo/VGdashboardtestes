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

const HOTEL_KEYS=['hotel','Hotel','HOTEL','unidade','Unidade','property','Property'];
const SOURCE_KEYS=['source','Source','fonte','Fonte','canal','Canal','platform','Platform'];
const PERIOD_KEYS=['period','Period','periodo','Período','semana','Semana','week','Week','date','Date','data','Data','mes','Mês'];
const SCORE_KEYS=['score','Score','rating','Rating','nota','Nota','indice','Índice','satisfaction','Satisfaction'];
const REVIEW_KEYS=['reviews','Reviews','reviewCount','count','Count','comentarios','Comentários','avaliacoes','Avaliações'];
const GRI_KEYS=['gri','GRI','griScore','GRI Score'];

function asRecord(value:unknown):Record<string,unknown>|null{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
}
function pick(record:Record<string,unknown>,keys:string[]):unknown{
  for(const key of keys)if(record[key]!=null&&record[key]!=='')return record[key];
  return undefined;
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
function looksLikeRecord(record:Record<string,unknown>):boolean{
  const keys=Object.keys(record);
  return [...HOTEL_KEYS,...SOURCE_KEYS,...PERIOD_KEYS,...SCORE_KEYS,...REVIEW_KEYS,...GRI_KEYS].some(k=>keys.includes(k));
}

export function reputationRecordCount(value:unknown):number {
  if(Array.isArray(value))return value.length;
  if(!value||typeof value!=='object')return 0;
  return Object.values(value as Record<string,unknown>).reduce<number>((sum,item)=>{
    if(Array.isArray(item))return sum+item.length;
    if(item&&typeof item==='object')return sum+reputationRecordCount(item);
    return sum;
  },0);
}

export function reputationTopLevelKeys(value:unknown):string[] {
  if(!value||typeof value!=='object'||Array.isArray(value))return [];
  return Object.keys(value as Record<string,unknown>);
}

export function reputationRecords(value:unknown):ReputationRecord[]{
  const out:ReputationRecord[]=[];
  const visit=(node:unknown,context:Partial<ReputationRecord>={})=>{
    if(Array.isArray(node)){node.forEach(item=>visit(item,context));return;}
    const record=asRecord(node);if(!record)return;
    const next:Partial<ReputationRecord>={...context};
    const hotel=pick(record,HOTEL_KEYS),source=pick(record,SOURCE_KEYS),period=pick(record,PERIOD_KEYS);
    if(hotel!=null)next.hotel=text(hotel);
    if(source!=null)next.source=text(source);
    if(period!=null)next.period=text(period);
    if(looksLikeRecord(record)){
      out.push({
        hotel:next.hotel||'—',source:next.source||'—',period:next.period||'—',
        score:num(pick(record,SCORE_KEYS)),reviews:num(pick(record,REVIEW_KEYS)),gri:num(pick(record,GRI_KEYS)),raw:record
      });
    }
    Object.entries(record).forEach(([key,item])=>{
      if(item&&typeof item==='object'){
        const child={...next};
        if(!child.hotel&&/hotel|unidade/i.test(key))child.hotel=key;
        visit(item,child);
      }
    });
  };
  visit(value);
  const seen=new Set<string>();
  return out.filter(r=>{
    const key=`${r.hotel}|${r.source}|${r.period}|${r.score}|${r.reviews}|${r.gri}`;
    if(seen.has(key))return false;seen.add(key);return true;
  });
}
