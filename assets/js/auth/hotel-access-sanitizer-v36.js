(function(){
  'use strict';

  const FALLBACK_HOTELS=[
    'ALBACORA','ALENTEJO VINEYARDS','AMPALIUS','ATLANTICO','CASAS DE ELVAS','CASCAIS','CERRO ALAGOA','COIMBRA',
    'COLLECTION ALTER REAL','COLLECTION BRAGA','COLLECTION DOURO','COLLECTION ELVAS','COLLECTION FIGUEIRA DA FOZ',
    'COLLECTION MONTE DO VILAR','COLLECTION PALACIO DOS ARCOS','COLLECTION PONTE DE LIMA VINEYARDS','COLLECTION PRAIA',
    'COLLECTION S. MIGUEL','COLLECTION SERRA DA ESTRELA','COLLECTION SINTRA','COLLECTION TOMAR','DOURO VINEYARDS','ERICEIRA',
    'ESTORIL','EVORA','ISLA CANELA','LAGOS','MARINA','NAUTICO','NEP KIDS','OPERA','PORTO','PORTO RIBEIRA','SANTA CRUZ','TAVIRA'
  ];

  const norm=v=>String(v||'').trim().toUpperCase();

  function officialHotels(){
    const out=[];
    const add=list=>(Array.isArray(list)?list:[]).forEach(h=>{
      const value=String(h||'').trim();
      if(value&&!out.some(x=>norm(x)===norm(value)))out.push(value);
    });

    try{add(window.VG?.market?.def?.()?.hotels)}catch(e){}
    document.querySelectorAll('.sb-hotel-item[data-hotel]').forEach(el=>add([el.dataset.hotel]));

    // Se a lista oficial da geografia ainda não estiver inicializada, usa apenas
    // o catálogo fixo de hotéis. Nunca usa opções de outros selects da aplicação.
    if(!out.length)add(FALLBACK_HOTELS);
    return out;
  }

  function cleanHotelAccess(){
    const wrap=document.getElementById('vgHotelAccessWrap');
    if(!wrap)return;
    const official=officialHotels();
    const allowed=new Set(official.map(norm));

    wrap.querySelectorAll('label').forEach(label=>{
      const cb=label.querySelector('input.vgHotelAccess');
      if(!cb)return;
      if(!allowed.has(norm(cb.value)))label.remove();
    });
  }

  function install(){
    cleanHotelAccess();
    const wrap=document.getElementById('vgHotelAccessWrap');
    if(!wrap)return false;
    if(wrap.dataset.vgHotelSanitizer==='1')return true;
    wrap.dataset.vgHotelSanitizer='1';
    new MutationObserver(()=>queueMicrotask(cleanHotelAccess)).observe(wrap,{childList:true,subtree:true});
    return true;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
    if(!install()){
      const timer=setInterval(()=>{if(install())clearInterval(timer)},250);
      setTimeout(()=>clearInterval(timer),15000);
    }
  },{once:true});
  else if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},250);
    setTimeout(()=>clearInterval(timer),15000);
  }
})();
