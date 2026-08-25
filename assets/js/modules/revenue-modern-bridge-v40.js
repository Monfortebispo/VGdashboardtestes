(function(){
  'use strict';
  window.VG=window.VG||{};
  if(window.VG.revenueModernBridge)return;

  function source(){
    try{return window.VG.revenueHub??null;}catch(e){return null;}
  }
  function clone(value){
    if(value==null)return null;
    try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}
    catch(e){return null;}
  }
  function count(value){
    if(Array.isArray(value))return value.length;
    if(value&&typeof value==='object')return Object.keys(value).length;
    return value==null?0:1;
  }
  function stats(){
    const value=source();
    return {records:count(value),available:value!=null};
  }

  window.VG.revenueModernBridge=Object.freeze({
    version:1,
    read(){return clone(source());},
    stats
  });
})();
