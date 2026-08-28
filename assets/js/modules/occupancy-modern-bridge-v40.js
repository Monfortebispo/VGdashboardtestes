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
  function eligibleHotels(){
    try{
      const el=document.getElementById('occHotelSel');
      if(!el||!el.options)return [];
      return Array.from(el.options)
        .map(function(o){return String(o.value||'').trim();})
        .filter(function(v){return v&&v!=='__all__'&&v!=='todos'&&v!=='all';});
    }catch(e){return [];}
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
        syncSnapshotManager();
        return {ok:true,method:'occUpdateUI',elapsedMs:+(performance.now()-started).toFixed(2)};
      }
      if(typeof occRender==='function'){
        occRender();
        syncSnapshotManager();
        return {ok:true,method:'occRender',elapsedMs:+(performance.now()-started).toFixed(2)};
      }
      return {ok:false,method:'none',elapsedMs:+(performance.now()-started).toFixed(2)};
    }catch(e){
      return {ok:false,method:'error',elapsedMs:+(performance.now()-started).toFixed(2),error:String(e&&e.message||e)};
    }
  }

  let snapshotObserver=null;
  function syncSnapshotManager(){
    const chips=document.getElementById('occSnapshots');
    if(!chips)return false;
    let toggle=document.getElementById('vgOccSnapshotToggle');
    if(!toggle){
      toggle=document.createElement('button');
      toggle.id='vgOccSnapshotToggle';
      toggle.type='button';
      toggle.setAttribute('aria-expanded','false');
      toggle.style.cssText='margin:4px 0 10px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text-2);font:600 10px/1.2 var(--font);cursor:pointer';
      toggle.addEventListener('click',function(){
        const open=toggle.getAttribute('aria-expanded')==='true';
        toggle.setAttribute('aria-expanded',open?'false':'true');
        chips.style.display=open?'none':'';
        updateSnapshotToggleLabel(toggle,!open);
      });
      chips.insertAdjacentElement('beforebegin',toggle);
    }
    const open=toggle.getAttribute('aria-expanded')==='true';
    chips.style.display=open?'':'none';
    updateSnapshotToggleLabel(toggle,open);
    if(!snapshotObserver){
      snapshotObserver=new MutationObserver(function(){
        const current=document.getElementById('vgOccSnapshotToggle');
        if(current)updateSnapshotToggleLabel(current,current.getAttribute('aria-expanded')==='true');
      });
      snapshotObserver.observe(chips,{childList:true,subtree:true});
    }
    return true;
  }
  function updateSnapshotToggleLabel(toggle,open){
    const count=stats().snapshots;
    toggle.textContent=open?'Ocultar snapshots':`Gerir snapshots (${count})`;
    toggle.style.display=count>0?'':'none';
  }
  function installSnapshotManager(){
    if(syncSnapshotManager())return;
    let tries=0;
    const timer=setInterval(function(){
      tries++;
      if(syncSnapshotManager()||tries>=40)clearInterval(timer);
    },100);
  }

  window.VG.occupancyModernBridge=Object.freeze({
    version:6,
    read(){return cloneLite(snapshots())||[];},
    selection,
    eligibleHotels,
    applySelection,
    stats,
    refresh,
    syncSnapshotManager
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installSnapshotManager,{once:true});
  else installSnapshotManager();
})();
