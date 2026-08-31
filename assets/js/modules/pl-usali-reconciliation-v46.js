// ==========================================================
// P&L USALI — reconciliação com Receita Total oficial
// Garante que a classificação USALI não perde receitas e usa
// o mesmo contexto financeiro moderno de Receitas/Custos.
// ==========================================================
(function(){
'use strict';
if(window.__VG_PL_USALI_RECON_V48__)return;
window.__VG_PL_USALI_RECON_V48__=true;

const originalCost=(typeof plSum==='function')?plSum:(typeof window.plSum==='function'?window.plSum:null);
const originalRev=(typeof plSumRev==='function')?plSumRev:(typeof window.plSumRev==='function'?window.plSumRev:null);
const originalOps=(typeof plSumOps==='function')?plSumOps:(typeof window.plSumOps==='function'?window.plSumOps:null);
if(!originalRev)return;

function bridge(){return window.VG?.modernFinancials||null;}
function sharedContext(){
  const b=bridge();if(!b||typeof b.context!=='function')return null;
  try{return b.context()||null;}catch(e){return null;}
}
function hotelsOf(hotels){
  if(Array.isArray(hotels))return hotels;
  const context=sharedContext();
  if(Array.isArray(context?.activeHotels))return context.activeHotels;
  try{return typeof getActiveHotels==='function'?getActiveHotels():[];}catch(e){return [];}
}
function modernSum(section,field,year,hotels){
  const b=bridge();if(!b||typeof b.sum!=='function')return null;
  try{const v=b.sum(section,field,year,hotelsOf(hotels));return Number.isFinite(Number(v))?Number(v):null;}catch(e){return null;}
}
function officialTotal(year,hotels){
  const hs=hotelsOf(hotels),b=bridge();
  try{if(b&&typeof b.officialRevenue==='function'){const v=b.officialRevenue(year,hs);if(Number.isFinite(Number(v)))return Number(v);}}catch(e){}
  return originalOps?Number(originalOps('Receita Total',year,hs))||0:0;
}
function bridgedCost(field,year,hotels){const hs=hotelsOf(hotels),v=modernSum('hotels_costs',field,year,hs);return v==null?(originalCost?originalCost(field,year,hs):0):v;}
function bridgedOps(field,year,hotels){const hs=hotelsOf(hotels),v=modernSum('hotels_ops',field,year,hs);return v==null?(originalOps?originalOps(field,year,hs):0):v;}
function baseRevenue(field,year,hotels){const hs=hotelsOf(hotels),v=modernSum('hotels_rev',field,year,hs);return v==null?originalRev(field,year,hs):v;}
function reconciledRevenue(field,year,hotels){
  const hs=hotelsOf(hotels);
  if(field!=='DIVERSOS')return baseRevenue(field,year,hs);
  const total=officialTotal(year,hs);
  const rooms=Number(baseRevenue('ALOJAMENTO',year,hs))||0;
  const fb=Number(baseRevenue('ALIMENTACAO',year,hs))||0;
  if(total||rooms||fb)return total-rooms-fb;
  return baseRevenue(field,year,hs);
}

if(originalCost){try{plSum=bridgedCost;}catch(e){}window.plSum=bridgedCost;}
try{plSumRev=reconciledRevenue;}catch(e){}window.plSumRev=reconciledRevenue;
if(originalOps){try{plSumOps=bridgedOps;}catch(e){}window.plSumOps=bridgedOps;}
try{window.dispatchEvent(new CustomEvent('vg-pl-usali-reconciled',{detail:{context:sharedContext()}}));}catch(e){}
})();
