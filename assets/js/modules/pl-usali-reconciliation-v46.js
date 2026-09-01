// ==========================================================
// P&L USALI — reconciliação com a fonte financeira viva
// O USALI tem de respeitar exactamente os filtros ativos
// (hotéis/região/período). Por isso usa os helpers legados que
// lêem o RAW já filtrado e não a snapshot/cache financeira moderna.
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
  const n=Number(value);return Number.isFinite(n)?n:null;
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
  for(const key of map[field]||[]){const v=liveOps(key,year,hotels);if(v!=null&&v!==0)return v;}
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

// GOP com sede: usa a imputação real de cada hotel, nunca uma distribuição
// artificial. A diferença entre GOP sem sede e GOP com sede é o custo de sede
// imputado à seleção atual. Funciona para 1 hotel, vários hotéis ou Todos.
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
function headOfficeDeduction(hotel,year){
  const hs=hotel?[hotel]:hotelsOf();
  const without=metricTotal('GOP sem sede',year,hs);
  const withHeadOffice=metricTotal('GOP com sede',year,hs);
  if(without==null||withHeadOffice==null)return null;
  return without-withHeadOffice;
}
function relabelGopWithHeadOffice(){
  try{
    document.querySelectorAll('#view-pl .pl-nop td:first-child').forEach(td=>{
      if(/NET OPERATING PROFIT|NOP/i.test(td.textContent||''))td.textContent='GOP COM SEDE';
    });
  }catch(e){}
}

if(originalCost){try{plSum=liveCost;}catch(e){}window.plSum=liveCost;}
try{plSumRev=reconciledRevenue;}catch(e){}window.plSumRev=reconciledRevenue;
try{plSumOps=liveOpsSum;}catch(e){}window.plSumOps=liveOpsSum;
try{getNopValue=headOfficeDeduction;}catch(e){}window.getNopValue=headOfficeDeduction;
if(originalBuildStmt){
  const reconciledBuildStmt=function(){const result=originalBuildStmt.apply(this,arguments);relabelGopWithHeadOffice();return result;};
  try{plBuildStmt=reconciledBuildStmt;}catch(e){}window.plBuildStmt=reconciledBuildStmt;
}
try{window.dispatchEvent(new CustomEvent('vg-pl-usali-reconciled',{detail:{source:'live-filtered-financials',gopWithHeadOffice:true}}));}catch(e){}
})();
