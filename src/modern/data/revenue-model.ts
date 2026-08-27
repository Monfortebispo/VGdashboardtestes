export interface RevenueSourceSnapshot {
  data:unknown;
  stats:{records:number;available:boolean};
}

export interface RevenueRecord {
  hotel:string;
  period:string;
  metric:string;
  value:number|null;
  forecast:number|null;
  budget:number|null;
  previous:number|null;
  raw:unknown;
}

function text(v:unknown):string{
  return v==null?'':String(v).trim();
}
function num(v:unknown):number|null{
  if(typeof v==='number'&&Number.isFinite(v))return v;
  if(typeof v!=='string')return null;
  const cleaned=v.replace(/\s/g,'').replace(/%/g,'').replace(/\./g,'').replace(',','.').replace(/[^0-9+\-.]/g,'');
  const n=Number(cleaned);
  return Number.isFinite(n)?n:null;
}
function pick(obj:Record<string,unknown>,keys:string[]):unknown{
  const entries=Object.entries(obj);
  for(const key of keys){
    const found=entries.find(([k])=>k.toLowerCase().replace(/[^a-z0-9]/g,'')===key.toLowerCase().replace(/[^a-z0-9]/g,''));
    if(found)return found[1];
  }
  return undefined;
}
function recordFromObject(obj:Record<string,unknown>,fallbackHotel='',fallbackPeriod='',fallbackMetric=''):RevenueRecord|null{
  const hotel=text(pick(obj,['hotel','unidade','unit','property']))||fallbackHotel;
  const period=text(pick(obj,['period','periodo','mês','mes','month','data','date']))||fallbackPeriod;
  const metric=text(pick(obj,['metric','metrica','indicador','kpi','rubrica','tipo']))||fallbackMetric;
  const value=num(pick(obj,['value','valor','actual','atual','real','result','resultado']));
  const forecast=num(pick(obj,['forecast','previsao','previsão','forecastvalue']));
  const budget=num(pick(obj,['budget','orcamento','orçamento','target','objetivo']));
  const previous=num(pick(obj,['previous','anterior','lastyear','ly','stly','2025']));
  if(!hotel&&!period&&!metric&&value==null&&forecast==null&&budget==null&&previous==null)return null;
  return {hotel:hotel||'—',period:period||'—',metric:metric||'Valor',value,forecast,budget,previous,raw:obj};
}

export function revenueRecords(value:unknown):RevenueRecord[]{
  const out:RevenueRecord[]=[];
  const walk=(node:unknown,path:string[])=>{
    if(Array.isArray(node)){
      node.forEach(item=>walk(item,path));
      return;
    }
    if(!node||typeof node!=='object')return;
    const obj=node as Record<string,unknown>;
    const rec=recordFromObject(obj,path[0]||'',path[1]||'',path[2]||'');
    if(rec&&(rec.value!=null||rec.forecast!=null||rec.budget!=null||rec.previous!=null))out.push(rec);
    Object.entries(obj).forEach(([key,child])=>{
      if(child&&typeof child==='object')walk(child,[...path,key].slice(-3));
    });
  };
  walk(value,[]);
  const seen=new Set<string>();
  return out.filter(r=>{
    const key=[r.hotel,r.period,r.metric,r.value,r.forecast,r.budget,r.previous].join('|');
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}

export function revenueRecordCount(value:unknown):number {
  return revenueRecords(value).length || (Array.isArray(value)?value.length:value&&typeof value==='object'?Object.keys(value as Record<string,unknown>).length:value==null?0:1);
}

export function revenueHotels(records:RevenueRecord[]):string[]{return [...new Set(records.map(r=>r.hotel).filter(v=>v&&v!=='—'))].sort((a,b)=>a.localeCompare(b,'pt'));}
export function revenuePeriods(records:RevenueRecord[]):string[]{return [...new Set(records.map(r=>r.period).filter(v=>v&&v!=='—'))].sort((a,b)=>a.localeCompare(b,'pt'));}
export function revenueMetrics(records:RevenueRecord[]):string[]{return [...new Set(records.map(r=>r.metric).filter(v=>v&&v!=='—'))].sort((a,b)=>a.localeCompare(b,'pt'));}
