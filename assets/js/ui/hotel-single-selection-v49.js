(function(){
'use strict';
if(window.__VG_HOTEL_SINGLE_SELECTION_V49__)return;
window.__VG_HOTEL_SINGLE_SELECTION_V49__=true;

function allowedHotels(){
  try{
    const list=Array.isArray(window.RAW?.hotel_list)?window.RAW.hotel_list:[];
    return list.filter(h=>typeof window.vgAuthCanAccessHotel!=='function'||!window.vgAuthCurrent?.()||window.vgAuthCanAccessHotel(h));
  }catch(e){return [];}
}
function repaint(){
  try{
    document.querySelectorAll('.sb-hotel-item[data-hotel]').forEach(item=>item.classList.toggle('on',selectedHotels.has(item.dataset.hotel)));
  }catch(e){}
}
function refreshSelection(){
  try{if(typeof syncRegionFromPills==='function')syncRegionFromPills();}catch(e){}
  try{if(typeof refreshAll==='function')refreshAll();}catch(e){}
}
function install(){
  if(typeof window.toggleHotel!=='function')return false;
  const original=window.toggleHotel;
  window.toggleHotel=function(el){
    const h=el?.dataset?.hotel;
    if(!h||typeof selectedHotels==='undefined')return original.apply(this,arguments);
    if(typeof window.vgAuthCanAccessHotel==='function'&&window.vgAuthCurrent?.()&&!window.vgAuthCanAccessHotel(h)){
      try{showToast('Este hotel não está no seu âmbito de acesso.',true);}catch(e){}
      return;
    }
    const allowed=allowedHotels();
    const allSelected=allowed.length>0&&selectedHotels.size===allowed.length&&allowed.every(x=>selectedHotels.has(x));

    // Ao partir de "Todos", clicar num hotel passa diretamente para esse hotel.
    if(allSelected){
      selectedHotels=new Set([h]);
      repaint();
      refreshSelection();
      return;
    }

    // Evita cair em seleção vazia ao clicar no único hotel selecionado.
    if(selectedHotels.size===1&&selectedHotels.has(h)){
      repaint();
      refreshSelection();
      return;
    }

    if(selectedHotels.has(h))selectedHotels.delete(h);else selectedHotels.add(h);
    if(selectedHotels.size===0)selectedHotels.add(h);
    repaint();
    refreshSelection();
  };
  window.toggleHotel.__vgSingleSelectionV49=true;
  return true;
}

if(!install()){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(install()||attempts>40)clearInterval(timer);
  },100);
}
})();
