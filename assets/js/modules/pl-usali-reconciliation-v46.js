// ==========================================================
// P&L USALI — reconciliação com as fontes financeiras oficiais
// Usa primeiro hotels_rev; quando a classificação departamental
// não existe/está vazia, reconcilia com hotels_ops para não
// apresentar receitas a zero quando o P&L oficial tem valores.
// ==========================================================
(function(){
'use strict';
if(window.__VG_PL_USALI_RECON_V46__)return;
window.__VG_PL_USALI_RECON_V46__=true;
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
function legacyOps(field,year,hotels){
  if(!originalOps)return null;
  try{const v=originalOps(field,year,hotelsOf(hotels));return Number.isFinite(Number(v))?Number(v):null;}catch(e){return null;}
}
function opsValue(field,year,hotels){
  const hs=hotelsOf(hotels),v=modernSum('hotels_ops',field,year,hs);
  return v==null?legacyOps(field,year,hs):v;
}
function officialTotal(year,hotels){
  const hs=hotelsOf(hotels),b=bridge();
  try{if(b&&typeof b.officialRevenue==='function'){const v=b.officialRevenue(year,hs);if(Number.isFinite(Number(v))&&Number(v)!==0)return Number(v);}}catch(e){}
  return Number(opsValue('Receita Total',year,hs))||0;
}
function bridgedCost(field,year,hotels){const hs=hotelsOf(hotels),v=modernSum('hotels_costs',field,year,hs);return v==null?(originalCost?originalCost(field,year,hs):0):v;}
function bridgedOps(field,year,hotels){const hs=hotelsOf(hotels),v=modernSum('hotels_ops',field,year,hs);return v==null?(originalOps?originalOps(field,year,hs):0):v;}
function baseRevenue(field,year,hotels){
  const hs=hotelsOf(hotels),modern=modernSum('hotels_rev',field,year,hs);
  if(modern!=null&&modern!==0)return modern;
  const legacy=originalRev(field,year,hs);
  if(Number.isFinite(Number(legacy))&&Number(legacy)!==0)return Number(legacy);
  return 0;
}
function operationalRevenue(field,year,hotels){
  const map={ALOJAMENTO:['Receita Alojamento','ALOJAMENTO'],ALIMENTACAO:['Receita FB','Receita F&B','ALIMENTACAO']};
  for(const key of map[field]||[]){const v=opsValue(key,year,hotels);if(v!=null&&v!==0)return v;}
  return 0;
}
function reconciledRevenue(field,year,hotels){
  const hs=hotelsOf(hotels);
  if(field==='ALOJAMENTO'||field==='ALIMENTACAO'){
    const classified=baseRevenue(field,year,hs);
    return classified!==0?classified:operationalRevenue(field,year,hs);
  }
  if(field==='DIVERSOS'){
    const total=officialTotal(year,hs);
    const rooms=Number(reconciledRevenue('ALOJAMENTO',year,hs))||0;
    const fb=Number(reconciledRevenue('ALIMENTACAO',year,hs))||0;
    if(total!==0)return total-rooms-fb;
    return baseRevenue(field,year,hs);
  }
  return baseRevenue(field,year,hs);
}

if(originalCost){try{plSum=bridgedCost;}catch(e){}window.plSum=bridgedCost;}
try{plSumRev=reconciledRevenue;}catch(e){}window.plSumRev=reconciledRevenue;
if(originalOps){try{plSumOps=bridgedOps;}catch(e){}window.plSumOps=bridgedOps;}
try{window.dispatchEvent(new CustomEvent('vg-pl-usali-reconciled',{detail:{context:sharedContext()}}));}catch(e){}
})();
