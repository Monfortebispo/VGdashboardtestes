// ==========================================================
// P&L USALI — reconciliação com Receita Total oficial
// Garante que a classificação USALI não perde receitas e,
// quando disponível, usa a fonte financeira moderna tipada.
// ==========================================================
(function(){
'use strict';
if(window.__VG_PL_USALI_RECON_V46__)return;
window.__VG_PL_USALI_RECON_V46__=true;

const originalCost=(typeof plSum==='function')?plSum:(typeof window.plSum==='function'?window.plSum:null);
const originalRev=(typeof plSumRev==='function')?plSumRev:(typeof window.plSumRev==='function'?window.plSumRev:null);
const originalOps=(typeof plSumOps==='function')?plSumOps:(typeof window.plSumOps==='function'?window.plSumOps:null);
if(!originalRev)return;

function bridge(){return window.VG?.modernFinancials||null;}
function data(){try{return typeof RAW!=='undefined'?RAW:window.RAW;}catch(e){return window.RAW;}}
function hotelsOf(hotels){
  if(Array.isArray(hotels))return hotels;
  try{return typeof getActiveHotels==='function'?getActiveHotels():[];}catch(e){return [];}
}
function modernSum(section,field,year,hotels){
  const b=bridge();if(!b||typeof b.sum!=='function')return null;
  try{const v=b.sum(section,field,year,hotelsOf(hotels));return Number.isFinite(Number(v))?Number(v):null;}catch(e){return null;}
}
function officialTotal(year,hotels){
  const hs=hotelsOf(hotels),b=bridge();
  try{if(b&&typeof b.officialRevenue==='function'){const v=b.officialRevenue(year,hs);if(Number.isFinite(Number(v)))return Number(v);}}catch(e){}
  const d=data();
  return hs.reduce((sum,h)=>{const v=Number(d?.hotels_ops?.[h]?.['Receita Total']?.[year]);return sum+(Number.isFinite(v)?v:0);},0);
}
function bridgedCost(field,year,hotels){const v=modernSum('hotels_costs',field,year,hotels);return v==null?(originalCost?originalCost(field,year,hotels):0):v;}
function bridgedOps(field,year,hotels){const v=modernSum('hotels_ops',field,year,hotels);return v==null?(originalOps?originalOps(field,year,hotels):0):v;}
function baseRevenue(field,year,hotels){const v=modernSum('hotels_rev',field,year,hotels);return v==null?originalRev(field,year,hotels):v;}
function reconciledRevenue(field,year,hotels){
  if(field!=='DIVERSOS')return baseRevenue(field,year,hotels);
  const hs=hotelsOf(hotels);
  const total=officialTotal(year,hs);
  const rooms=Number(baseRevenue('ALOJAMENTO',year,hs))||0;
  const fb=Number(baseRevenue('ALIMENTACAO',year,hs))||0;
  if(total||rooms||fb)return total-rooms-fb;
  return baseRevenue(field,year,hs);
}

if(originalCost){try{plSum=bridgedCost;}catch(e){}window.plSum=bridgedCost;}
try{plSumRev=reconciledRevenue;}catch(e){}window.plSumRev=reconciledRevenue;
if(originalOps){try{plSumOps=bridgedOps;}catch(e){}window.plSumOps=bridgedOps;}
try{window.dispatchEvent(new CustomEvent('vg-pl-usali-reconciled'));}catch(e){}
})();
