import type { FinancialsSourceSnapshot } from '../data/financials-model';
import { resolveFinancialViewContext, financialValue, type FinancialRaw } from './financial-view-context';

const STORAGE_KEY='vg_ctx_kpis_visible_v2';
const DEFAULT_IDS=['rec_total','gop','occupancy','adr','hotels'];
type MonthlyStore=Record<string,FinancialRaw>;
type MarketWindow=Window&{VG?:Window['VG']&{market?:{formatMoneyCompact?:(value:number,decimals?:number)=>string}}};

function fmt(v:number,d=0):string{return new Intl.NumberFormat('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);}
function money(v:number,symbol:string):string{const custom=(window as MarketWindow).VG?.market?.formatMoneyCompact?.(v,2);if(custom)return custom;const a=Math.abs(v),sign=v<0?'-':'';if(a>=1e6)return `${sign}${symbol}${fmt(a/1e6,a>=1e7?1:2)}M`;if(a>=1e3)return `${sign}${symbol}${fmt(a/1e3)}K`;return `${sign}${symbol}${fmt(a)}`;}
function varHtml(previous:number,current:number):string{if(!previous)return'';const p=(current-previous)/Math.abs(previous)*100;return `<span class="ctx-kpi-var ${p>=0?'pos':'neg'}">${p>=0?'+':''}${fmt(p,1)}%</span>`;}
function ppHtml(previous:number,current:number):string{const p=current-previous;return `<span class="ctx-kpi-var ${p>=0?'pos':'neg'}">${p>=0?'+':''}${fmt(p,1)} p.p.</span>`;}
function loadVisible(available:string[]):string[]{let ids:unknown=null;try{ids=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{}const list=Array.isArray(ids)&&ids.length?ids.map(String):DEFAULT_IDS;const filtered=list.filter(id=>available.includes(id));return filtered.length?filtered:DEFAULT_IDS.filter(id=>available.includes(id));}
function selectedMonths(store:MonthlyStore):number[]{const text=document.getElementById('ctxMeses')?.textContent||'';const names=['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];const parsed=names.map((name,i)=>i&&text.includes(name)?i:0).filter(Boolean);return parsed.length?parsed:Object.keys(store).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);}
function optionalOp(data:FinancialRaw,hotel:string,field:string,year:string):number|null{const value=data.hotels_ops?.[hotel]?.[field]?.[year];const n=Number(value);return value==null||value===''||!Number.isFinite(n)?null:n;}
function costTotal(data:FinancialRaw,hotel:string,year:string):number{return financialValue(data,'hotels_costs',hotel,'TOTAIS',year);}

export function renderFinancialContextPanel(snapshot:FinancialsSourceSnapshot):boolean{
  const panel=document.getElementById('contextPanel'),target=document.getElementById('ctxKpis');if(!panel||!target)return false;
  const ctx=resolveFinancialViewContext(snapshot),{data,activeHotels:hotels,previousYear:prev,currentYear:cur,currencySymbol:symbol,totalHotels}=ctx;
  const sum=(section:'hotels_ops'|'hotels_costs',field:string,year:string)=>hotels.reduce((s,h)=>s+financialValue(data,section,h,field,year),0);
  const recC=sum('hotels_ops','Receita Total',cur),recP=sum('hotels_ops','Receita Total',prev),alojC=sum('hotels_ops','Receita Alojamento',cur),alojP=sum('hotels_ops','Receita Alojamento',prev),fbC=sum('hotels_ops','Receita FB',cur),fbP=sum('hotels_ops','Receita FB',prev);
  const costC=hotels.reduce((s,h)=>s+costTotal(data,h,cur),0),costP=hotels.reduce((s,h)=>s+costTotal(data,h,prev),0),gopC=recC-costC,gopP=recP-costP,gopPctC=recC?gopC/recC*100:0,gopPctP=recP?gopP/recP*100:0;
  const dispC=sum('hotels_ops','Disponiveis',cur),dispP=sum('hotels_ops','Disponiveis',prev),occC=sum('hotels_ops','Ocupados',cur),occP=sum('hotels_ops','Ocupados',prev),dormC=sum('hotels_ops','Dormidas',cur),dormP=sum('hotels_ops','Dormidas',prev);
  const occRateC=dispC?occC/dispC*100:0,occRateP=dispP?occP/dispP*100:0,adrC=occC?alojC/occC:0,adrP=occP?alojP/occP:0,revparC=dispC?alojC/dispC:0,revparP=dispP?alojP/dispP:0,trevparC=dispC?recC/dispC:0,costPctC=recC?costC/recC*100:0;
  const store=(snapshot.store&&typeof snapshot.store==='object'?snapshot.store:{} ) as MonthlyStore,months=selectedMonths(store);
  let gcsC=0,gcsP=0,hasGcs=false;for(const month of months){const snap=store[String(month)]||store[month as unknown as string];if(!snap)continue;for(const h of hotels){const c=optionalOp(snap,h,'GOP COM SEDE',cur),p=optionalOp(snap,h,'GOP COM SEDE',prev);if(c!=null){gcsC+=c;hasGcs=true;}if(p!=null)gcsP+=p;}}
  const gcsPctC=recC?gcsC/recC*100:0,gcsPctP=recP?gcsP/recP*100:0;
  const items=[
    {id:'rec_total',label:'Receita Total',val:money(recC,symbol),sub:varHtml(recP,recC)},
    {id:'gop',label:'GOP SEM SEDE',val:money(gopC,symbol),sub:`${fmt(gopPctC,1)}% margem ${varHtml(gopP,gopC)}`},
    {id:'gop_com_sede',label:'GOP COM SEDE',val:hasGcs?money(gcsC,symbol):'—',sub:hasGcs?`${fmt(gcsPctC,1)}% margem ${varHtml(gcsP,gcsC)}`:'Carrega o Excel P&L'},
    {id:'gop_pct',label:'GOP % COM SEDE',val:fmt(hasGcs?gcsPctC:gopPctC,1)+'%',sub:`${prev}: ${fmt(hasGcs?gcsPctP:gopPctP,1)}% ${ppHtml(hasGcs?gcsPctP:gopPctP,hasGcs?gcsPctC:gopPctC)}`},
    {id:'occupancy',label:'Occupancy',val:fmt(occRateC,1)+'%',sub:`${fmt(occC)} quartos occ. ${ppHtml(occRateP,occRateC)}`},
    {id:'adr',label:'ADR',val:symbol+fmt(adrC),sub:`RevPAR ${symbol}${fmt(revparC)} ${varHtml(adrP,adrC)}`},
    {id:'revpar',label:'RevPAR',val:symbol+fmt(revparC),sub:`${prev}: ${symbol}${fmt(revparP)} ${varHtml(revparP,revparC)}`},
    {id:'trevpar',label:'TRevPAR',val:symbol+fmt(trevparC),sub:'Receita total por quarto disponível'},
    {id:'rec_aloj',label:'Receita Alojamento',val:money(alojC,symbol),sub:varHtml(alojP,alojC)},
    {id:'rec_fb',label:'Receita F&B',val:money(fbC,symbol),sub:varHtml(fbP,fbC)},
    {id:'custos',label:'Custos Totais',val:money(costC,symbol),sub:`${fmt(costPctC,1)}% da receita ${varHtml(costP,costC)}`},
    {id:'ocupados',label:'Quartos Ocupados',val:fmt(occC),sub:varHtml(occP,occC)},
    {id:'disponiveis',label:'Quartos Disponíveis',val:fmt(dispC),sub:`${prev}: ${fmt(dispP)}`},
    {id:'dormidas',label:'Dormidas',val:fmt(dormC),sub:varHtml(dormP,dormC)},
    {id:'hotels',label:'Hotéis activos',val:String(hotels.length),sub:`de ${totalHotels} no portfólio`}
  ];
  const visible=loadVisible(items.map(i=>i.id));target.innerHTML=items.filter(i=>visible.includes(i.id)).map(i=>`<div class="ctx-kpi"><div class="ctx-kpi-label">${i.label}</div><div class="ctx-kpi-val">${i.val}</div><div class="ctx-kpi-sub">${i.sub}</div></div>`).join('');
  panel.dataset.modernFinancialContext='ready';return true;
}
