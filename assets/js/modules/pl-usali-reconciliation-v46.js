// ==========================================================
// P&L USALI — reconciliação com a fonte financeira viva
// Respeita hotéis/região/período ativos e apresenta a ponte
// explícita entre GOP sem sede e GOP com sede.
// ==========================================================
(function(){
'use strict';
if(window.__VG_PL_USALI_RECON_V46__)return;
window.__VG_PL_USALI_RECON_V46__=true;
window.__VG_PL_USALI_RECON_V48__=true;

const originalCost=(typeof plSum==='function')?plSum:(typeof window.plSum==='function'?window.plSum:null);
const originalRev=(typeof plSumRev==='function')?plSumRev:(typeof window.plSumRev==='function'?window.plSumRev:null);
const originalOps=(typeof plSumOps==='function')?plSumOps:(typeof window.plSumOps==='function'?window.plSumOps:null);
const originalBuildStmt=(typeof plBuildStmt==='function')?plBuildStmt:(typeof window.plBuildStmt==='function'?window.plBuildStmt:null);
if(!originalRev||!originalOps)return;

function hotelsOf(hotels){
  if(Array.isArray(hotels))return hotels;
  try{return typeof getActiveHotels==='function'?getActiveHotels():[];}catch(e){return [];}
}
function finite(value){
  if(value==null||value==='')return null;
  const num=Number(value);return Number.isFinite(num)?num:null;
}
function liveOps(field,year,hotels){
  try{return finite(originalOps(field,year,hotelsOf(hotels)));}catch(e){return null;}
}
function liveRev(field,year,hotels){
  try{return finite(originalRev(field,year,hotelsOf(hotels)));}catch(e){return null;}
}
function officialTotal(year,hotels){return liveOps('Receita Total',year,hotels)||0;}
function operationalRevenue(field,year,hotels){
  const map={ALOJAMENTO:['Receita Alojamento','ALOJAMENTO'],ALIMENTACAO:['Receita FB','Receita F&B','ALIMENTACAO']};
  for(const key of map[field]||[]){const value=liveOps(key,year,hotels);if(value!=null&&value!==0)return value;}
  return 0;
}
function reconciledRevenue(field,year,hotels){
  const hs=hotelsOf(hotels);
  if(field==='ALOJAMENTO'||field==='ALIMENTACAO'){
    const classified=liveRev(field,year,hs);
    return classified!=null&&classified!==0?classified:operationalRevenue(field,year,hs);
  }
  if(field==='DIVERSOS'){
    const total=officialTotal(year,hs);
    const rooms=reconciledRevenue('ALOJAMENTO',year,hs)||0;
    const fb=reconciledRevenue('ALIMENTACAO',year,hs)||0;
    if(total!==0)return total-rooms-fb;
    return liveRev(field,year,hs)||0;
  }
  return liveRev(field,year,hs)||0;
}
function liveCost(field,year,hotels){
  if(!originalCost)return 0;
  try{return finite(originalCost(field,year,hotelsOf(hotels)))||0;}catch(e){return 0;}
}
function liveOpsSum(field,year,hotels){return liveOps(field,year,hotels)||0;}

function normMetric(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase();
}
function rawOpsMetric(hotel,metric,year){
  try{
    const bucket=window.RAW?.hotels_ops?.[hotel];
    if(!bucket||typeof bucket!=='object')return null;
    const wanted=normMetric(metric);
    const key=Object.keys(bucket).find(k=>normMetric(k)===wanted);
    return key?finite(bucket[key]?.[String(year)]):null;
  }catch(e){return null;}
}
function metricTotal(metric,year,hotels){
  let found=false,total=0;
  for(const hotel of hotelsOf(hotels)){
    const value=rawOpsMetric(hotel,metric,year);
    if(value!=null){found=true;total+=value;}
  }
  return found?total:null;
}
function metricTotalAny(metrics,year,hotels){
  for(const metric of metrics){
    const value=metricTotal(metric,year,hotels);
    if(value!=null)return value;
  }
  return null;
}
function gopSemSedeTotal(year,hotels){
  return metricTotalAny(['GOP SEM SEDE','GOP sem sede','GOP Sem Sede'],year,hotels);
}
function gopComSedeTotal(year,hotels){
  return metricTotalAny(['GOP COM SEDE','GOP com sede','GOP Com Sede'],year,hotels);
}
function headOfficeDeduction(hotel,year){
  const hs=hotel?[hotel]:hotelsOf();
  const without=gopSemSedeTotal(year,hs);
  const withHeadOffice=gopComSedeTotal(year,hs);
  if(without==null||withHeadOffice==null)return null;
  return without-withHeadOffice;
}
function fmtMoney(value){
  try{return typeof plFmtE==='function'?plFmtE(value):(window.VG?.market?.formatMoneyCompact?window.VG.market.formatMoneyCompact(value,2):String(value));}
  catch(e){return String(value??'—');}
}
function fmtPct(value,total){
  if(value==null||!total)return '—';
  try{return typeof fmt==='function'?fmt(value/total*100,1)+'%':(value/total*100).toFixed(1)+'%';}
  catch(e){return (value/total*100).toFixed(1)+'%';}
}
function fmtVar(previous,current){
  if(previous==null||current==null||Math.abs(previous)<1)return '<span class="pl-pct">—</span>';
  const pct=(current-previous)/Math.abs(previous)*100;
  const cls=pct>=0?'pl-var-pos':'pl-var-neg';
  let text;
  try{text=typeof fmt==='function'?fmt(pct,1):pct.toFixed(1);}catch(e){text=pct.toFixed(1);}
  return `<span class="${cls}">${pct>=0?'+':''}${text}%</span>`;
}
function injectHeadOfficeRows(){
  try{
    const table=document.querySelector('#view-pl .pl-stmt-tbl');
    const gopRow=table?.querySelector('tr.pl-gop');
    if(!table||!gopRow)return;
    table.querySelectorAll('tr[data-vg-head-office]').forEach(row=>row.remove());
    const hs=hotelsOf();
    if(!hs.length)return;
    const yPrev=typeof YR_PREV!=='undefined'?YR_PREV:null;
    const yCur=typeof YR_CUR!=='undefined'?YR_CUR:null;
    if(yPrev==null||yCur==null)return;

    const sem25=gopSemSedeTotal(yPrev,hs);
    const sem26=gopSemSedeTotal(yCur,hs);
    const com25=gopComSedeTotal(yPrev,hs);
    const com26=gopComSedeTotal(yCur,hs);
    if(com25==null&&com26==null)return;

    const sede25=sem25!=null&&com25!=null?sem25-com25:null;
    const sede26=sem26!=null&&com26!=null?sem26-com26:null;
    const tot25=officialTotal(yPrev,hs);
    const tot26=officialTotal(yCur,hs);

    const sede=document.createElement('tr');
    sede.dataset.vgHeadOffice='costs';
    sede.className='pl-indent1';
    sede.innerHTML=`<td>(-) Imputações / Custos de Sede</td><td>${fmtMoney(sede25)}</td><td class="pl-pct">${fmtPct(sede25,tot25)}</td><td>${fmtMoney(sede26)}</td><td class="pl-pct">${fmtPct(sede26,tot26)}</td><td>${fmtVar(sede25,sede26)}</td>`;

    const com=document.createElement('tr');
    com.dataset.vgHeadOffice='gop';
    com.className='pl-nop';
    com.innerHTML=`<td>GOP COM SEDE</td><td>${fmtMoney(com25)}</td><td class="pl-pct">${fmtPct(com25,tot25)}</td><td>${fmtMoney(com26)}</td><td class="pl-pct">${fmtPct(com26,tot26)}</td><td>${fmtVar(com25,com26)}</td>`;

    gopRow.insertAdjacentElement('afterend',sede);
    sede.insertAdjacentElement('afterend',com);
    table.querySelectorAll('tr.pl-nop:not([data-vg-head-office])').forEach(row=>row.remove());
  }catch(e){}
}

if(originalCost){try{plSum=liveCost;}catch(e){}window.plSum=liveCost;}
try{plSumRev=reconciledRevenue;}catch(e){}window.plSumRev=reconciledRevenue;
try{plSumOps=liveOpsSum;}catch(e){}window.plSumOps=liveOpsSum;
try{getNopValue=headOfficeDeduction;}catch(e){}window.getNopValue=headOfficeDeduction;
if(originalBuildStmt){
  const reconciledBuildStmt=function(){const result=originalBuildStmt.apply(this,arguments);injectHeadOfficeRows();return result;};
  try{plBuildStmt=reconciledBuildStmt;}catch(e){}window.plBuildStmt=reconciledBuildStmt;
}
try{window.dispatchEvent(new CustomEvent('vg-pl-usali-reconciled',{detail:{source:'live-filtered-financials',gopWithHeadOffice:true}}));}catch(e){}
})();
