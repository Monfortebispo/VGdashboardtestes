export interface PortfolioSourceSnapshot {
  data:unknown;
  stats:{
    available:boolean;
    sections:number;
    approxRecords:number;
  };
}

export interface PortfolioRecord {
  geography:string;
  hotel:string;
  period:string;
  metric:string;
  value:number|string|null;
}

export function countSections(value:unknown):number{
  if(!value||typeof value!=='object'||Array.isArray(value))return 0;
  return Object.keys(value as Record<string,unknown>).length;
}

export function countApproxRecords(value:unknown):number{
  if(Array.isArray(value))return value.length;
  if(!value||typeof value!=='object')return 0;
  return Object.values(value as Record<string,unknown>).reduce<number>((sum,item)=>sum+(Array.isArray(item)?item.length:1),0);
}

function asText(value:unknown):string{
  if(value==null)return '';
  return String(value).trim();
}
function first(obj:Record<string,unknown>,keys:string[]):unknown{
  for(const key of keys)if(obj[key]!=null)return obj[key];
  return undefined;
}
function numberOrText(value:unknown):number|string|null{
  if(value==null||value==='')return null;
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(typeof value==='string'){
    const cleaned=value.replace(/\s/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.').replace(/[^\d.-]/g,'');
    const n=Number(cleaned);
    if(cleaned&&Number.isFinite(n))return n;
    return value;
  }
  return null;
}
function pushLeaf(out:PortfolioRecord[],path:string[],value:unknown):void{
  const keys=path.map(v=>asText(v)).filter(Boolean);
  const metric=keys.at(-1)||'Indicador';
  const hotel=keys.find(v=>/hotel|vila gal[eé]|collection/i.test(v))||'Portefólio';
  const period=keys.find(v=>/20\d{2}|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez/i.test(v))||'Atual';
  const geography=keys.find(v=>/portugal|brasil|espanha|norte|centro|lisboa|alentejo|algarve|ilha/i.test(v))||'Todos';
  out.push({geography,hotel,period,metric,value:numberOrText(value)});
}

export function normalizePortfolioRecords(value:unknown):PortfolioRecord[]{
  const out:PortfolioRecord[]=[];
  const walk=(node:unknown,path:string[])=>{
    if(node==null)return;
    if(Array.isArray(node)){
      node.forEach((item,index)=>{
        if(item&&typeof item==='object'&&!Array.isArray(item)){
          const obj=item as Record<string,unknown>;
          const hotel=asText(first(obj,['hotel','Hotel','unidade','unit','name','nome']))||path.at(-1)||`Registo ${index+1}`;
          const geography=asText(first(obj,['geography','geografia','region','regiao','região','pais','country']))||'Todos';
          const period=asText(first(obj,['period','periodo','período','month','mes','mês','date','data']))||'Atual';
          let added=false;
          Object.entries(obj).forEach(([key,val])=>{
            if(['hotel','Hotel','unidade','unit','name','nome','geography','geografia','region','regiao','região','pais','country','period','periodo','período','month','mes','mês','date','data'].includes(key))return;
            if(typeof val==='number'||typeof val==='string'){
              const parsed=numberOrText(val);if(parsed!==null){out.push({geography,hotel,period,metric:key,value:parsed});added=true;}
            }
          });
          if(!added)walk(item,[...path,hotel]);
        }else if(typeof item==='number'||typeof item==='string')pushLeaf(out,[...path,String(index+1)],item);
        else walk(item,[...path,String(index+1)]);
      });
      return;
    }
    if(typeof node==='object'){
      Object.entries(node as Record<string,unknown>).forEach(([key,val])=>{
        if(typeof val==='number'||typeof val==='string')pushLeaf(out,[...path,key],val);
        else walk(val,[...path,key]);
      });
    }
  };
  walk(value,[]);
  return out.filter(r=>r.value!==null).slice(0,5000);
}
