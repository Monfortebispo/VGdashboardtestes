// ==========================================================
// P&L USALI — reconciliação com Receita Total oficial
// Garante que a classificação USALI não perde receitas que
// existam fora de ALOJAMENTO / ALIMENTACAO / DIVERSOS.
// ==========================================================
(function(){
'use strict';
if(window.__VG_PL_USALI_RECON_V46__)return;
window.__VG_PL_USALI_RECON_V46__=true;

const original=(typeof plSumRev==='function')?plSumRev:(typeof window.plSumRev==='function'?window.plSumRev:null);
if(!original)return;

function data(){
  try{return typeof RAW!=='undefined'?RAW:window.RAW;}catch(e){return window.RAW;}
}
function hotelsOf(hotels){
  if(Array.isArray(hotels))return hotels;
  try{return typeof getActiveHotels==='function'?getActiveHotels():[];}catch(e){return [];}
}
function officialTotal(year,hotels){
  const d=data();
  return hotelsOf(hotels).reduce((sum,h)=>{
    const v=Number(d?.hotels_ops?.[h]?.['Receita Total']?.[year]);
    return sum+(Number.isFinite(v)?v:0);
  },0);
}
function reconciledPlSumRev(field,year,hotels){
  if(field!=='DIVERSOS')return original(field,year,hotels);
  const hs=hotelsOf(hotels);
  const total=officialTotal(year,hs);
  const rooms=Number(original('ALOJAMENTO',year,hs))||0;
  const fb=Number(original('ALIMENTACAO',year,hs))||0;
  // "Outros Departamentos" passa a ser a rubrica residual de reconciliação.
  // Inclui DIVERSOS, DRHP e qualquer outra receita operacional não classificada
  // separadamente, preservando sempre o total oficial do dashboard.
  if(total||rooms||fb)return total-rooms-fb;
  return original(field,year,hs);
}

try{plSumRev=reconciledPlSumRev;}catch(e){}
window.plSumRev=reconciledPlSumRev;
try{window.dispatchEvent(new CustomEvent('vg-pl-usali-reconciled'));}catch(e){}
})();
