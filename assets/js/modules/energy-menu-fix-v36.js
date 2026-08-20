(function(){
  'use strict';
  if(window.__VG_ENERGY_MENU_FIX_V36__)return;
  window.__VG_ENERGY_MENU_FIX_V36__=true;

  function current(){try{return window.vgAuthCurrent?.()||null}catch(e){return null}}
  function isDirection(u){const r=String(u?.role||'').toLowerCase();return r==='direcao'||r==='admin'}
  function canEnergy(u){
    if(!u)return false;
    if(isDirection(u))return true;
    try{if(window.vgAuthCanAccessModule?.('energy')===true)return true}catch(e){}
    return Array.isArray(u.modules)&&u.modules.includes('energy');
  }
  function ensure(){
    let b=document.getElementById('nav-energy');
    if(!b){
      const anchor=document.getElementById('nav-custos')||document.getElementById('nav-pl')||document.getElementById('nav-ab');
      if(!anchor||typeof window.vgEnergyOpen!=='function')return;
      b=document.createElement('button');
      b.id='nav-energy';
      b.className='sb-nav-btn';
      b.type='button';
      b.innerHTML='<span class="sb-nav-icon">⚡</span><span>Energia & Consumos</span>';
      anchor.insertAdjacentElement('afterend',b);
    }
    b.onclick=()=>window.vgEnergyOpen?.();
    const u=current();
    if(!u){b.style.display='';return;}
    const ok=canEnergy(u);
    b.style.display=ok?'':'none';
    if(ok)delete b.dataset.vgAccessHidden;
  }

  const original=window.vgAuthApplyMenuPermissions;
  if(typeof original==='function'&&!original.__vgEnergyWrapped){
    const wrapped=function(){const r=original.apply(this,arguments);ensure();return r};
    wrapped.__vgEnergyWrapped=true;
    window.vgAuthApplyMenuPermissions=wrapped;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});
  else ensure();
})();
