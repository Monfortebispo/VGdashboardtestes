(function(){
  'use strict';
  if(window.__VG_GOVERNANTA_MOBILE_FIX_V36__)return;
  window.__VG_GOVERNANTA_MOBILE_FIX_V36__=true;

  const $=id=>document.getElementById(id);
  const user=()=>{try{return window.vgAuthCurrent?.()||null}catch(e){return null}};
  const role=()=>String(user()?.role||'').toLowerCase();
  const isGov=()=>role()==='governanta';
  const hotels=()=>{try{return (window.vgAuthHotels?.()||[]).filter(h=>h&&h!=='*')}catch(e){return[]}};
  const canLostFound=()=>{
    if(!isGov())return false;
    try{if(window.vgAuthCanAccessModule?.('lostfound')===true)return true}catch(e){}
    return Array.isArray(user()?.modules)&&user().modules.includes('lostfound');
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function installStyle(){
    if($('vgGovFixStyle'))return;
    const s=document.createElement('style');s.id='vgGovFixStyle';s.textContent=`
      body.vg-governanta-session{overflow:hidden!important}
      #vgGovEntry36{position:fixed;inset:0;z-index:2147482000;background:var(--surface-0,#071525);color:var(--text-1,#fff);overflow:auto;padding:18px 14px 60px;box-sizing:border-box}
      #vgGovEntry36 .vg36-wrap{width:min(620px,100%);margin:0 auto}
      #vgGovEntry36 .vg36-head{padding:4px 2px 14px}
      #vgGovEntry36 .vg36-head h1{font-size:19px;line-height:1.15;margin:0 0 5px;font-weight:800}
      #vgGovEntry36 .vg36-head p{font-size:11px;margin:0;color:var(--text-2,#a9b5c4)}
      #vgGovEntry36 .vg36-card{width:100%;display:block;text-align:left;padding:17px 15px;margin:9px 0;border:1px solid var(--border,#294158);border-radius:13px;background:var(--surface-1,#10243b);color:var(--text-1,#fff);cursor:pointer;font:inherit}
      #vgGovEntry36 .vg36-card b{display:block;font-size:14px;margin-bottom:4px}
      #vgGovEntry36 .vg36-card span{font-size:11px;color:var(--text-2,#a9b5c4)}
      #vgGovEntry36 .vg36-card[disabled]{opacity:.45;cursor:not-allowed}
      #vgGovEntry36 .vg36-note{margin-top:12px;padding:10px 12px;border:1px solid var(--border,#294158);border-radius:10px;font-size:10px;color:var(--text-2,#a9b5c4)}
      #vgGovReturn36{position:fixed;right:12px;bottom:14px;z-index:2147482100;border:0;border-radius:999px;padding:11px 15px;background:var(--gold,#caa53d);color:#fff;font:800 10px inherit;cursor:pointer;display:none}

      /* Inventários da Governanta: ocupam o viewport; nunca ficam empurrados para o fundo da dashboard. */
      body.vg-gov-inventory-mode{overflow:hidden!important}
      body.vg-gov-inventory-mode #view-housekeeping{display:block!important;position:fixed!important;inset:0!important;z-index:2147481900!important;width:100vw!important;height:100dvh!important;max-width:none!important;margin:0!important;padding:0!important;overflow:auto!important;background:var(--surface-0,#071525)!important}
      body.vg-gov-inventory-mode #view-housekeeping>*{margin-top:0!important}
      body.vg-gov-inventory-mode header.topbar,
      body.vg-gov-inventory-mode .global-filter-bar,
      body.vg-gov-inventory-mode #sidebar,
      body.vg-gov-inventory-mode #portfolioRail{visibility:hidden!important;pointer-events:none!important}
      body.vg-gov-inventory-mode main{margin:0!important;padding:0!important;min-height:0!important}

      /* Perdidos & Achados da Governanta é igualmente exclusivo: nunca mostra inventários por baixo. */
      body.vg-gov-lostfound-mode{overflow:hidden!important}
      body.vg-gov-lostfound-mode header.topbar,
      body.vg-gov-lostfound-mode .global-filter-bar,
      body.vg-gov-lostfound-mode #sidebar,
      body.vg-gov-lostfound-mode #portfolioRail,
      body.vg-gov-lostfound-mode #view-housekeeping{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.vg-gov-lostfound-mode main{margin:0!important;padding:0!important;min-height:0!important}
      body.vg-gov-lostfound-mode #vgGovMobile{
        display:block!important;position:fixed!important;inset:0!important;z-index:2147481950!important;
        width:100vw!important;height:100dvh!important;max-width:none!important;margin:0!important;
        overflow:auto!important;background:var(--surface-0,#071525)!important;padding:18px 14px 80px!important;
      }
      body.vg-gov-lostfound-mode #view-lostfound{
        display:block!important;position:fixed!important;inset:0!important;z-index:2147481950!important;
        width:100vw!important;height:100dvh!important;max-width:none!important;margin:0!important;
        overflow:auto!important;background:var(--surface-0,#071525)!important;padding:12px!important;
      }
    `;document.head.appendChild(s);
  }

  function hideLegacyGov(){
    const old=$('vgGovMobile');
    if(old)old.style.display='none';
    const oldReturn=$('vgGovReturn');
    if(oldReturn)oldReturn.style.display='none';
  }

  function showEntry(){
    if(!isGov())return;
    document.body.classList.remove('vg-gov-inventory-mode','vg-gov-lostfound-mode');
    document.body.classList.add('vg-governanta-session');
    hideLegacyGov();
    let root=$('vgGovEntry36');
    if(!root){buildEntry();root=$('vgGovEntry36')}
    if(root)root.style.display='block';
    const ret=$('vgGovReturn36');if(ret)ret.style.display='none';
    try{window.scrollTo?.(0,0)}catch(e){}
  }

  function openInventory(){
    const root=$('vgGovEntry36');if(root)root.style.display='none';
    document.body.classList.remove('vg-governanta-session','vg-gov-lostfound-mode');
    document.body.classList.add('vg-gov-inventory-mode');
    hideLegacyGov();
    try{window.setView?.('housekeeping')}catch(e){}
    const ret=$('vgGovReturn36');if(ret)ret.style.display='block';
    window.scrollTo?.(0,0);
  }

  function openLostFound(){
    if(!canLostFound())return;
    const root=$('vgGovEntry36');if(root)root.style.display='none';
    document.body.classList.remove('vg-governanta-session','vg-gov-inventory-mode');
    document.body.classList.add('vg-gov-lostfound-mode');
    const legacy=$('vgGovMobile');
    if(legacy){
      legacy.style.display='block';
      const home=$('vgGovHome'),form=$('vgGovLfForm');
      if(home)home.style.display='none';
      if(form)form.style.display='block';
    }else if(typeof window.vgLostFoundOpen==='function'){
      window.vgLostFoundOpen();
      setTimeout(()=>document.getElementById('vlfNew')?.click(),100);
    }
    const ret=$('vgGovReturn36');if(ret)ret.style.display='block';
    window.scrollTo?.(0,0);
  }

  function buildEntry(){
    const hs=hotels();
    if(!hs.length)return;
    const root=document.createElement('section');root.id='vgGovEntry36';
    const lf=canLostFound();
    root.innerHTML=`<div class="vg36-wrap"><div class="vg36-head"><h1>Operação · Governanta</h1><p>${esc(user()?.name||'')} · ${hs.length===1?esc(hs[0]):hs.length+' hotéis atribuídos'}</p></div><button class="vg36-card" id="vg36Inventory" type="button"><b>Inventários</b><span>Contagem física, quebras e inventário de Housekeeping & Têxtil.</span></button>${lf?'<button class="vg36-card" id="vg36LostFound" type="button"><b>Registar Perdido & Achado</b><span>Novo registo no hotel atribuído, incluindo fotografia.</span></button>':'<div class="vg36-note">Perdidos & Achados não está autorizado para este utilizador. A autorização é definida no Setup.</div>'}</div>`;
    document.body.appendChild(root);
    $('vg36Inventory').onclick=openInventory;
    if($('vg36LostFound'))$('vg36LostFound').onclick=openLostFound;
    const ret=document.createElement('button');ret.id='vgGovReturn36';ret.type='button';ret.textContent='Menu Governanta';ret.onclick=showEntry;document.body.appendChild(ret);
  }

  function sync(){
    if(!isGov()){
      document.body.classList.remove('vg-governanta-session','vg-gov-inventory-mode','vg-gov-lostfound-mode');
      $('vgGovEntry36')?.remove();$('vgGovReturn36')?.remove();
      return;
    }
    installStyle();
    if(!$('vgGovEntry36'))buildEntry();
    const root=$('vgGovEntry36');
    const inMode=document.body.classList.contains('vg-gov-inventory-mode')||document.body.classList.contains('vg-gov-lostfound-mode');
    if(root&&root.style.display!=='none'&&!inMode){hideLegacyGov();document.body.classList.add('vg-governanta-session')}
  }

  function boot(){
    installStyle();
    let tries=0;
    const t=setInterval(()=>{
      tries++;sync();
      if(isGov()&&hotels().length){clearInterval(t);showEntry()}
      if(tries>80)clearInterval(t);
    },125);
    window.addEventListener('hashchange',()=>{
      if(isGov()&&(document.body.classList.contains('vg-gov-inventory-mode')||document.body.classList.contains('vg-gov-lostfound-mode')))window.scrollTo?.(0,0)
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
