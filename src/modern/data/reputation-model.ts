export interface ReputationSourceSnapshot {
  data:unknown;
  stats:{records:number;available:boolean};
}

export interface ReputationDepartmentMetric {
  name:string;
  value:number|null;
  delta:number|null;
}

export interface ReputationSourceMetric {
  name:string;
  score:number|null;
  delta:number|null;
  reviews:number|null;
}

export interface ReputationCategoryMetric {
  category:string;
  mentions:number|null;
  impact:number|null;
}

export interface ReputationRecord {
  hotel:string;
  source:string;
  period:string;
  week:string;
  score:number|null;
  reviews:number|null;
  reviewsDelta:number|null;
  gri:number|null;
  griDelta:number|null;
  griGoal:number|null;
  managementResponse:number|null;
  cqi:number|null;
  rankVG:number|null;
  departments:ReputationDepartmentMetric[];
  sources:ReputationSourceMetric[];
  negativeCategories:ReputationCategoryMetric[];
  positiveCategories:ReputationCategoryMetric[];
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
function departmentMetrics(value:unknown):ReputationDepartmentMetric[]{
  const obj=asRecord(value);if(!obj)return [];
  return Object.entries(obj).map(([name,item])=>{
    const row=asRecord(item);
    return {name,value:num(row?.val??row?.value??item),delta:num(row?.delta)};
  });
}
function sourceMetrics(value:unknown):ReputationSourceMetric[]{
  if(!Array.isArray(value))return [];
  return value.map(item=>{
    const row=asRecord(item);if(!row)return null;
    return {name:text(row.name,'Origem'),score:num(row.score??row.val),delta:num(row.delta),reviews:num(row.reviews)};
  }).filter((v):v is ReputationSourceMetric=>!!v);
}
function categoryMetrics(value:unknown):ReputationCategoryMetric[]{
  if(!Array.isArray(value))return [];
  return value.map(item=>{
    const row=asRecord(item);if(!row)return null;
    return {category:text(row.cat??row.category,'Categoria'),mentions:num(row.mentions),impact:num(row.impact)};
  }).filter((v):v is ReputationCategoryMetric=>!!v);
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
      const week=text(record.week??record.period,period);
      const gri=num(record.gri);
      // Uma entrada do REP_STORE é um resumo ReviewPro completo. depts/srcList/categorias
      // são dimensões desse resumo e nunca devem ser promovidas a linhas independentes.
      out.push({
        hotel,
        source:'ReviewPro',
        period,
        week,
        score:gri,
        reviews:num(record.reviews),
        reviewsDelta:num(record.reviewsDelta),
        gri,
        griDelta:num(record.griDelta),
        griGoal:num(record.griGoal),
        managementResponse:num(record.mgmtResp),
        cqi:num(record.cqi),
        rankVG:num(record.rankVG),
        departments:departmentMetrics(record.depts),
        sources:sourceMetrics(record.srcList),
        negativeCategories:categoryMetrics(record.negCats),
        positiveCategories:categoryMetrics(record.posCats),
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

const MONTHS:Record<string,number>={jan:0,feb:1,fev:1,mar:2,apr:3,abr:3,may:4,mai:4,jun:5,jul:6,aug:7,ago:7,sep:8,set:8,oct:9,out:9,nov:10,dec:11,dez:11};
export function reputationPeriodDate(value:string):number{
  const normalized=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const matches=[...normalized.matchAll(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/g)];
  const m=matches.length?matches[matches.length-1]:null;if(!m)return 0;
  const month=MONTHS[m[2].slice(0,3).toLowerCase()];
  return month==null?0:new Date(Number(m[3]),month,Number(m[1])).getTime();
}

export function latestReputationRecordsByHotel(records:ReputationRecord[]):ReputationRecord[]{
  const latest=new Map<string,ReputationRecord>();
  records.forEach(record=>{
    const current=latest.get(record.hotel);
    if(!current||reputationPeriodDate(record.period)>reputationPeriodDate(current.period))latest.set(record.hotel,record);
  });
  return [...latest.values()].sort((a,b)=>a.hotel.localeCompare(b.hotel,'pt'));
}
