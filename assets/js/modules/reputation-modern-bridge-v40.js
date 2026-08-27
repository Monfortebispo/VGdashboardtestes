(function(){
  'use strict';
  window.VG=window.VG||{};
  if(window.VG.reputationModernBridge)return;

  function clone(value){
    try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}
    catch(e){return null;}
  }
  function legacyStore(){
    try{
      if(window.VG?.reputationStore&&typeof window.VG.reputationStore==='object')return window.VG.reputationStore;
      if(typeof window.VG?.reputation?.read==='function')return window.VG.reputation.read();
    }catch(e){}
    try{
      if(typeof REP_STORE!=='undefined'&&REP_STORE&&typeof REP_STORE==='object')return REP_STORE;
    }catch(e){}
    return null;
  }
  function read(){
    try{return clone(legacyStore())||null;}catch(e){return null;}
  }
  function countRecords(value){
    if(Array.isArray(value))return value.length;
    if(!value||typeof value!=='object')return 0;
    return Object.values(value).reduce(function(sum,item){
      if(Array.isArray(item))return sum+item.length;
      if(item&&typeof item==='object')return sum+countRecords(item);
      return sum;
    },0);
  }
  function stats(){
    var data=read();
    var records=countRecords(data);
    return {records:records,available:records>0};
  }

  window.VG.reputationModernBridge=Object.freeze({version:3,read:read,stats:stats});
})();
