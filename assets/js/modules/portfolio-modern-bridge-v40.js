(function(){
  'use strict';
  window.VG=window.VG||{};
  if(window.VG.portfolioModernBridge)return;

  function source(){
    try{return window.VG.portfolio??window.VG.summary??null;}catch(e){return null;}
  }
  function cloneLite(value){
    try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}
    catch(e){return null;}
  }
  function countSections(value){
    return value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value).length:0;
  }
  function countApproxRecords(value){
    if(Array.isArray(value))return value.length;
    if(!value||typeof value!=='object')return 0;
    return Object.values(value).reduce(function(sum,item){return sum+(Array.isArray(item)?item.length:1);},0);
  }
  function stats(){
    var value=source();
    return {available:value!=null,sections:countSections(value),approxRecords:countApproxRecords(value)};
  }

  window.VG.portfolioModernBridge=Object.freeze({
    version:1,
    read:function(){return cloneLite(source());},
    stats:stats
  });
})();
