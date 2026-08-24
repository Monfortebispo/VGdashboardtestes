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
  window.VG.occupancyModernBridge=Object.freeze({
    version:1,
    read(){return cloneLite(snapshots())||[];},
    selection,
    stats
  });
})();
