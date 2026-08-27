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
  function applySnapshotCollapse(container,header){
    const open=container.dataset.vgSnapshotsOpen==='1';
    const list=snapshots();
    const current=document.getElementById('occSnapSel');
    const currentOpt=current?.selectedOptions?.[0]?.textContent?.trim()||'';
    const latest=list[list.length-1];
    const latestLabel=String(latest?.label||latest?.id||'—');
    container.style.display=open?'':'none';
    const count=list.length || Array.from(container.children).filter(function(c){return /^Snapshot\s+\d+/i.test(String(c.textContent||'').trim());}).length;
    header.innerHTML='<span><strong>Snapshots carregados ('+count+')</strong><span style="margin-left:10px;opacity:.65;font-size:.92em">'+(currentOpt||('Mais recente: '+latestLabel))+'</span></span><span aria-hidden="true" style="font-size:16px;opacity:.7">'+(open?'⌄':'›')+'</span>';
    header.setAttribute('aria-expanded',open?'true':'false');
  }
  function installSnapshotCollapse(){
    const view=document.getElementById('view-ocupacao');
    if(!view)return false;
    const chipLike=Array.from(view.querySelectorAll('button,span,div')).filter(function(el){
      const t=String(el.textContent||'').trim();
      return /^Snapshot\s+\d+\s*[·-]/i.test(t) || /^Snapshot\s+\d+$/i.test(t);
    });
    if(chipLike.length<3)return false;
    let container=null;
    for(const el of chipLike){
      const p=el.parentElement;
      if(!p)continue;
      const count=Array.from(p.children).filter(function(c){return /^Snapshot\s+\d+/i.test(String(c.textContent||'').trim());}).length;
      if(count>=3){container=p;break;}
    }
    if(!container)return false;
    container.dataset.vgSnapshotList='1';
    let header=view.querySelector('[data-vg-snapshot-toggle="1"]');
    if(!header){
      header=document.createElement('button');
      header.type='button';
      header.dataset.vgSnapshotToggle='1';
      header.style.cssText='width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;margin:0 0 8px;border:1px solid rgba(120,120,120,.18);border-radius:10px;background:rgba(255,255,255,.025);color:inherit;cursor:pointer;font:inherit;text-align:left';
      container.parentElement?.insertBefore(header,container);
      header.addEventListener('click',function(){
        const open=container.dataset.vgSnapshotsOpen==='1';
        container.dataset.vgSnapshotsOpen=open?'0':'1';
        applySnapshotCollapse(container,header);
      });
    }
    if(container.dataset.vgSnapshotsOpen===undefined)container.dataset.vgSnapshotsOpen='0';
    applySnapshotCollapse(container,header);
    return true;
  }
  function refresh(){
    const started=performance.now();
    try{
      if(typeof occUpdateUI==='function'){
        occUpdateUI();
        setTimeout(installSnapshotCollapse,0);
        return {ok:true,method:'occUpdateUI',elapsedMs:+(performance.now()-started).toFixed(2)};
      }
      if(typeof occRender==='function'){
        occRender();
        setTimeout(installSnapshotCollapse,0);
        return {ok:true,method:'occRender',elapsedMs:+(performance.now()-started).toFixed(2)};
      }
      setTimeout(installSnapshotCollapse,0);
      return {ok:false,method:'none',elapsedMs:+(performance.now()-started).toFixed(2)};
    }catch(e){
      return {ok:false,method:'error',elapsedMs:+(performance.now()-started).toFixed(2),error:String(e&&e.message||e)};
    }
  }
  function scheduleSnapshotCollapse(){
    [0,150,500,1200].forEach(function(ms){setTimeout(installSnapshotCollapse,ms);});
  }
  document.addEventListener('click',function(e){
    if(e.target?.closest?.('#nav-ocupacao'))scheduleSnapshotCollapse();
  },false);
  window.addEventListener('hashchange',function(){
    if(location.hash.replace(/^#/,'')==='ocupacao')scheduleSnapshotCollapse();
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(location.hash.replace(/^#/,'')==='ocupacao')scheduleSnapshotCollapse();},{once:true});
  else if(location.hash.replace(/^#/,'')==='ocupacao')scheduleSnapshotCollapse();

  window.VG.occupancyModernBridge=Object.freeze({
    version:4,
    read(){return cloneLite(snapshots())||[];},
    selection,
    applySelection,
    stats,
    refresh,
    collapseSnapshots:installSnapshotCollapse
  });
})();