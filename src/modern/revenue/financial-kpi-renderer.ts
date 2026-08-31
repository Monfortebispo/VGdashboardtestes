import type { FinancialsSourceSnapshot } from '../data/financials-model';

type RawFinancials={
  hotel_list?:string[];
  hotels_ops?:Record<string,Record<string,Record<string,unknown>>>;
  hotels_costs?:Record<string,Record<string,Record<string,unknown>>>;
};
type KpiWindow=Window&{
  getActiveHotels?:()=>string[];
  VG?:Window['VG']&{market?:{symbol?:()=>string;formatMoneyCompact?:(value:number,decimals?:number)=>string}};
};

function raw(snapshot:FinancialsSourceSnapshot):RawFinancials{return snapshot.raw&&typeof snapshot.raw==='object'?snapshot.raw as RawFinancials:{};}
function num(v:unknown):number{const n=Number(v);return Number.isFinite(n)?n:0;}
function value(data:RawFinancials,section:'hotels_ops'|'hotels_costs',hotel:string,field:string,year:string):number{return num(data[section]?.[hotel]?.[field]?.[year]);}
function optionalValue(data:RawFinancials,hotel:string,field:string,year:string):number|null{const v=data.hotels_ops?.[hotel]?.[field]?.[year];const n=Number(v);return v==null||v===''||!Number.isFinite(n)?null:n;}
function years(data:RawFinancials):[string,string]{const found=new Set<string>();for(const hotel of Object.values(data.hotels_ops||{}))for(const field of Object.values(hotel||{}))for(const key of Object.keys(field||{}))if(/^20\d{2}$/.test(key))found.add(key);const sorted=[...found].sort((a,b)=>Number(a)-Number(b));const current=sorted.at(-1)||String(new Date().getFullYear());return[sorted.at(-2)||String(Number(current)-1),current];}
function hotels(data:RawFinancials,w:KpiWindow):string[]{const selected=w.getActiveHotels?.();if(Array.isArray(selected)&&selected.length)return selected;if(Array.isArray(data.hotel_list))return data.hotel_list.slice();return Object.keys(data.hotels_ops||{});}
function fmt(v:number,d=0):string{return new Intl.NumberFormat('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);}
function pct(v:number):string{return `${v>=0?'+':''}${fmt(v,1)}%`;}
function totalCosts(data:RawFinancials,hotel:string,year:string):number{const direct=value(data,'hotels_costs',hotel,'TOTAIS',year);if(direct)return direct;const c=data.hotels_costs?.[hotel]||{};return Object.entries(c).filter(([k])=>k!=='TOTAIS').reduce((sum,[,years])=>sum+num(years?.[year]),0);}
function gop(data:RawFinancials,hotel:string,year:string):number|null{for(const field of ['GOP COM SEDE','GOP Com Sede','GOP']){const v=optionalValue(data,hotel,field,year);if(v!=null)return v;}const revenue=value(data,'hotels_ops',hotel,'Receita Total',year),cost=totalCosts(data,hotel,year);return revenue||cost?revenue-cost:null;}
function moneyCompact(w:KpiWindow,v:number):string{const custom=w.VG?.market?.formatMoneyCompact?.(v,2);if(custom)return custom;const symbol=w.VG?.market?.symbol?.()||'€',a=Math.abs(v),sign=v<0?'-':'';if(a>=1e6)return `${sign}${symbol}${fmt(a/1e6,a>=1e7?1:2)}M`;if(a>=1e3)return `${sign}${symbol}${fmt(a/1e3,0)}K`;return `${sign}${symbol}${fmt(a,0)}`;}
function delta(v:number,cost=false):string{const positive=cost?v<=0:v>=0;return `<span class="kpi-delta ${positive?'delta-pos':'delta-neg'}">${pct(v)}</span>`;}

export function renderFinancialKpis(snapshot:FinancialsSourceSnapshot,targetId='kpiGrid'):boolean{
  const target=document.getElementById(targetId);if(!target)return false;
  const w=window as KpiWindow,data=raw(snapshot),active=hotels(data,w),[previous,current]=years(data),symbol=w.VG?.market?.symbol?.()||'€';
  let recP=0,recC=0,alojP=0,alojC=0,fbP=0,fbC=0,occP=0,occC=0,disP=0,disC=0,dormP=0,dormC=0,gopP=0,gopC=0;
  let ctotP=0,ctotC=0,ccomP=0,ccomC=0,cbebP=0,cbebC=0,cpesP=0,cpesC=0,ceneP=0,ceneC=0,cmanP=0,cmanC=0,copiP=0,copiC=0;
  for(const h of active){recP+=value(data,'hotels_ops',h,'Receita Total',previous);recC+=value(data,'hotels_ops',h,'Receita Total',current);alojP+=value(data,'hotels_ops',h,'Receita Alojamento',previous);alojC+=value(data,'hotels_ops',h,'Receita Alojamento',current);fbP+=value(data,'hotels_ops',h,'Receita FB',previous);fbC+=value(data,'hotels_ops',h,'Receita FB',current);occP+=value(data,'hotels_ops',h,'Ocupados',previous);occC+=value(data,'hotels_ops',h,'Ocupados',current);disP+=value(data,'hotels_ops',h,'Disponiveis',previous);disC+=value(data,'hotels_ops',h,'Disponiveis',current);dormP+=value(data,'hotels_ops',h,'Dormidas',previous);dormC+=value(data,'hotels_ops',h,'Dormidas',current);gopP+=gop(data,h,previous)||0;gopC+=gop(data,h,current)||0;ctotP+=totalCosts(data,h,previous);ctotC+=totalCosts(data,h,current);ccomP+=value(data,'hotels_costs',h,'COMIDAS',previous);ccomC+=value(data,'hotels_costs',h,'COMIDAS',current);cbebP+=value(data,'hotels_costs',h,'BEBIDAS',previous);cbebC+=value(data,'hotels_costs',h,'BEBIDAS',current);cpesP+=value(data,'hotels_costs',h,'PESSOAL',previous);cpesC+=value(data,'hotels_costs',h,'PESSOAL',current);ceneP+=value(data,'hotels_costs',h,'ENERGIA',previous);ceneC+=value(data,'hotels_costs',h,'ENERGIA',current);cmanP+=value(data,'hotels_costs',h,'MANUTENÇÃO',previous);cmanC+=value(data,'hotels_costs',h,'MANUTENÇÃO',current);copiP+=value(data,'hotels_costs',h,'OPERACIONAIS',previous);copiC+=value(data,'hotels_costs',h,'OPERACIONAIS',current);}
  const ratio=(a:number,b:number)=>a>0?(b-a)/a*100:0,occRateP=disP>0?occP/disP*100:0,occRateC=disC>0?occC/disC*100:0,revparP=disP>0?alojP/disP:0,revparC=disC>0?alojC/disC:0,adrP=occP>0?alojP/occP:0,adrC=occC>0?alojC/occC:0,trevP=disP>0?recP/disP:0,trevC=disC>0?recC/disC:0,gopPctP=recP>0?gopP/recP*100:0,gopPctC=recC>0?gopC/recC*100:0;
  const coutP=ctotP-ccomP-cbebP-cpesP-ceneP-cmanP-copiP,coutC=ctotC-ccomC-cbebC-cpesC-ceneC-cmanC-copiC,totalHotels=data.hotel_list?.length||Object.keys(data.hotels_ops||{}).length;
  const cards=[
    [`Receita Total ${current}`,moneyCompact(w,recC),`${previous}: ${moneyCompact(w,recP)}  ${delta(ratio(recP,recC))}`,''],
    ['Receita Alojamento',moneyCompact(w,alojC),`${previous}: ${moneyCompact(w,alojP)}  ${delta(ratio(alojP,alojC))}`,''],
    ['Receita F&B',moneyCompact(w,fbC),`${previous}: ${moneyCompact(w,fbP)}  ${delta(ratio(fbP,fbC))}`,'kpi-blue'],
    [`GOP ${current}`,moneyCompact(w,gopC),`Margem: ${fmt(gopPctC,1)}%  ${previous}: ${fmt(gopPctP,1)}%  ${delta(gopP!==0?(gopC-gopP)/Math.abs(gopP)*100:0)}`,'kpi-green'],
    [`Taxa Ocupação ${current}`,fmt(occRateC,1)+'%',`${previous}: ${fmt(occRateP,1)}%  ${delta(ratio(occRateP,occRateC))}`,''],
    [`RevPAR ${current}`,symbol+fmt(revparC,2),`${previous}: ${symbol}${fmt(revparP,2)}  ${delta(ratio(revparP,revparC))}`,'kpi-green'],
    [`ADR ${current}`,symbol+fmt(adrC,2),`${previous}: ${symbol}${fmt(adrP,2)}  ${delta(ratio(adrP,adrC))}`,''],
    [`TRevPAR ${current}`,symbol+fmt(trevC,2),`${previous}: ${symbol}${fmt(trevP,2)}  ${delta(ratio(trevP,trevC))}`,''],
    [`Dormidas ${current}`,fmt(dormC),`${previous}: ${fmt(dormP)}  ${delta(ratio(dormP,dormC))}`,'kpi-blue'],
    ['Hotéis Activos',String(active.length),`de ${totalHotels} total`,''],
    [`Custos Totais ${current}`,moneyCompact(w,ctotC),`${previous}: ${moneyCompact(w,ctotP)}  ${delta(ratio(ctotP,ctotC),true)}`,'kpi-red'],
    ['Custos Comidas',moneyCompact(w,ccomC),`${previous}: ${moneyCompact(w,ccomP)}  ${delta(ratio(ccomP,ccomC),true)}`,'kpi-red'],
    ['Custos Bebidas',moneyCompact(w,cbebC),`${previous}: ${moneyCompact(w,cbebP)}  ${delta(ratio(cbebP,cbebC),true)}`,'kpi-red'],
    ['Custos Pessoal',moneyCompact(w,cpesC),`${previous}: ${moneyCompact(w,cpesP)}  ${delta(ratio(cpesP,cpesC),true)}`,'kpi-red'],
    ['Custos Energia',moneyCompact(w,ceneC),`${previous}: ${moneyCompact(w,ceneP)}  ${delta(ratio(ceneP,ceneC),true)}`,'kpi-red'],
    ['Custos Manutenção',moneyCompact(w,cmanC),`${previous}: ${moneyCompact(w,cmanP)}  ${delta(ratio(cmanP,cmanC),true)}`,'kpi-red'],
    ['Outros Custos',moneyCompact(w,coutC),`${previous}: ${moneyCompact(w,coutP)}  ${delta(ratio(coutP,coutC),true)}`,'kpi-red']
  ];
  target.innerHTML=cards.map(([labelText,val,sub,cls])=>`<div class="kpi-card ${cls}"><div class="kpi-label">${labelText}</div><div class="kpi-value">${val}</div><div class="kpi-sub">${sub}</div></div>`).join('');
  return true;
}
