(function(){
  'use strict';
  if(window.__VG_LOSTFOUND_ACCESS_BRIDGE_V36__)return;
  window.__VG_LOSTFOUND_ACCESS_BRIDGE_V36__=true;

  const MODULE='lostfound';
  const $=s=>document.querySelector(s);
  const user=()=>{try{return window.vgAuthCurrent?.()||null}catch(e){return null}};
  const authorized=()=>{
    const u=user();if(!u)return false;
    const role=String(u.role||'').toLowerCase();
    if(role==='direcao'||role==='admin')return true;
    try{return window.vgAuthCanAccessModule?.(MODULE)===true}catch(e){}
    return Array.isArray(u.modules)&&u.modules.includes(MODULE);
  };
  const open=()=>{
    if(!authorized())return;
    if(typeof window.vgLostFoundOpen==='function')window.vgLostFoundOpen();
    else if(typeof window.setView==='function')window.setView(MODULE);
  };

  function ensureSidebar(){
    const anchor=document.getElementById('nav-reputacao');
    if(!anchor)return;
    let b=document.getElementById('nav-lostfound');
    if(!b){
      b=document.createElement('button');
      b.id='nav-lostfound';b.type='button';b.className='sb-nav-btn';
      b.innerHTML='<span class="sb-nav-icon">⌕</span><span>Perdidos & Achados</span>';
      anchor.insertAdjacentElement('afterend',b);
    }
    b.onclick=open;
    b.style.display=authorized()?'':'none';
    const group=b.closest('.sb-nav-group');
    if(group&&authorized())group.style.display='';
  }

  function ensureMobile(){
    const root=document.getElementById('vgMobileMore');
    if(!root)return;
    let b=root.querySelector('[data-view="lostfound"]');
    if(!b){
      const grids=[...root.querySelectorAll('.vg-mobile-grid')];
      const grid=grids[0];if(!grid)return;
      b=document.createElement('button');
      b.className='vg-mobile-link primary';b.type='button';b.dataset.view='lostfound';
      b.innerHTML='<i>⌕</i><span>Perdidos & Achados<small>Objetos encontrados e entrega</small></span>';
      const city=grid.querySelector('[data-view="cityledger"]');
      city?city.insertAdjacentElement('afterend',b):grid.appendChild(b);
      b.addEventListener('click',e=>{e.preventDefault();open();document.getElementById('vgMobileMore')?.classList.remove('open')});
    }
    b.style.display=authorized()?'':'none';
  }

  function commandMatches(){
    const term=String(document.getElementById('vgNavInput')?.value||'').trim().toLowerCase();
    if(!term)return true;
    return ['lostfound','perdidos','achados','perdidos & achados','qualidade','objetos encontrados'].some(x=>x.includes(term)||term.includes(x));
  }
  function ensureCommand(){
    const list=document.getElementById('vgNavList');if(!list)return;
    const old=list.querySelector('[data-vg-lostfound-command="1"]');
    if(!authorized()||!commandMatches()){old?.remove();return;}
    if(old)return;
    const item=document.createElement('div');
    item.className='vg-nav-cmd-item';item.dataset.vgLostfoundCommand='1';item.dataset.view='lostfound';
    item.innerHTML='<div><strong>⌕ Perdidos & Achados</strong><br><span>Qualidade</span></div><span>Enter</span>';
    item.addEventListener('click',open);
    list.appendChild(item);
  }

  function ensureSetup(){
    const wrap=document.getElementById('vgModuleAccessWrap');if(!wrap)return;
    let cb=wrap.querySelector('input.vgModuleAccess[value="lostfound"]');
    if(!cb){
      const label=document.createElement('label');
      label.style.cssText='display:flex;gap:6px;align-items:flex-start;font-size:10px;padding:5px 6px;background:var(--surface-1);border:1px solid var(--border);border-radius:6px';
      label.innerHTML='<input type="checkbox" class="vgModuleAccess" value="lostfound"><span><b style="display:block">Perdidos & Achados</b><small style="color:var(--text-3)">Qualidade</small></span>';
      wrap.appendChild(label);cb=label.querySelector('input');
    }
  }

  function sync(){
    ensureSidebar();ensureMobile();ensureSetup();ensureCommand();
    try{window.vgAuthApplyMenuPermissions?.()}catch(e){}
    // applyMenuPermissions pode esconder o botão; a sessão é a fonte de verdade.
    const b=document.getElementById('nav-lostfound');if(b)b.style.display=authorized()?'':'none';
  }

  function install(){
    sync();
    const obs=new MutationObserver(()=>queueMicrotask(sync));
    obs.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('input',e=>{if(e.target?.id==='vgNavInput')setTimeout(ensureCommand,0)});
    document.addEventListener('change',e=>{if(e.target?.id==='vgNewRole')setTimeout(ensureSetup,0)});
    let n=0;const timer=setInterval(()=>{sync();if(++n>=60)clearInterval(timer)},250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
