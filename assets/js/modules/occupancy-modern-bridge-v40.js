(function(){
  'use strict';
  window.VG=window.VG||{};
  if(window.VG.occupancyModernBridge)return;

  function snapshots(){
    try{
      if(typeof OCC_SNAPSHOTS==='undefined'||!Array.isArray(OCC_SNAPSHOTS))return [];
      return OCC_SNAPSHOTS;
    }catch(e){return [];}
  }
  function cloneLite(value){
    try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}
    catch(e){return null;}
  }
  function selection(){
    const hotel=document.getElementById('occHotelSel')?.value||'__all__';
    const snap=document.getElementById('occSnapSel')?.value||'__latest__';
    return {hotel,snapshot:snap};
  }
  function setSelectValue(id,value){
    const el=document.getElementById(id);
    if(!el||value==null)return false;
    const wanted=String(value);
    const hasOption=!el.options||Array.from(el.options).some(o=>String(o.value)===wanted);
    if(!hasOption)return false;
    if(String(el.value)!==wanted)el.value=wanted;
    return true;
  }
  function applySelection(next){
    const result={hotel:false,snapshot:false};
    if(next&&Object.prototype.hasOwnProperty.call(next,'hotel'))result.hotel=setSelectValue('occHotelSel',next.hotel);
    if(next&&Object.prototype.hasOwnProperty.call(next,'snapshot'))result.snapshot=setSelectValue('occSnapSel',next.snapshot);
    return result;
  }
  function stats(){
    const list=snapshots();
    const latest=list[list.length-1]||null;
    const hotels=latest&&latest.data?Object.keys(latest.data):[];
    return {
      snapshots:list.length,
      hotels:hotels.length,
      latestId:latest?.id??null,
      latestLabel:latest?.label??null,
      latestTs:latest?.ts??null
    };
  }
  function refresh(){
    const started=performance.now();
    try{
      if(typeof occUpdateUI==='function'){
        occUpdateUI();
        return {ok:true,method:'occUpdateUI',elapsedMs:+(performance.now()-started).toFixed(2)};
      }
      if(typeof occRender==='function'){
        occRender();
        return {ok:true,method:'occRender',elapsedMs:+(performance.now()-started).toFixed(2)};
      }
      return {ok:false,method:'none',elapsedMs:+(performance.now()-started).toFixed(2)};
    }catch(e){
      return {ok:false,method:'error',elapsedMs:+(performance.now()-started).toFixed(2),error:String(e&&e.message||e)};
    }
  }
  window.VG.occupancyModernBridge=Object.freeze({
    version:3,
    read(){return cloneLite(snapshots())||[];},
    selection,
    applySelection,
    stats,
    refresh
  });
})();
