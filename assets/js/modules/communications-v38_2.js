(function(){
'use strict';
if(window.__VG_COMMUNICATIONS_FIX_V38_2__)return;
window.__VG_COMMUNICATIONS_FIX_V38_2__=true;

const rawFetch=window.fetch.bind(window);
function paddedMembers(list){
  const ids=(Array.isArray(list)?list:[]).map(x=>String(x||'').trim()).filter(Boolean);
  const out=[];let cursor=0;
  for(const id of ids){
    const idx=Math.max(id.length,cursor);
    while(out.length<idx)out.push('');
    out[idx]=id;
    cursor=idx+1;
  }
  return out;
}
window.fetch=function(input,init){
  try{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url.includes('/.netlify/functions/communications-v38') && init && typeof init.body==='string' && /[?&]action=(create|add-members)(?:&|$)/.test(url)){
      const body=JSON.parse(init.body||'{}');
      if(Array.isArray(body.members)){
        body.members=paddedMembers(body.members);
        init=Object.assign({},init,{body:JSON.stringify(body)});
      }
    }
  }catch(e){console.warn('VG Dashboard: normalização de destinatários falhou',e);}
  return rawFetch(input,init);
};

const routes={
  complaint:{view:'complaints',open:'vgComplaintsOpen',item:'.vcp-item[data-id]',refresh:'#vcpRefresh',closed:'#vcpClosed',active:'#vcpOpen'},
  refund:{view:'refunds',open:'vgRefundsOpen',item:'.vrf-item[data-id]',refresh:'#vrfRefresh',closed:'#vrfClosed',active:'#vrfOpen'},
  budget:{view:'budgets',open:'vgBudgetsOpen',item:'.vgb-item[data-id]',refresh:'#vgbRefresh',closed:'#vgbClosed',active:'#vgbOpen'}
};
function escCss(v){return window.CSS&&CSS.escape?CSS.escape(String(v)):String(v).replace(/(["\\])/g,'\\$1')}
function isClosedStatus(s){return /arquivad|conclu|fechad/i.test(String(s||''))}
async function markRead(id){
  try{
    const t=window.vgAuthToken?.()||'';
    await rawFetch('/.netlify/functions/communications-v38?action=notice-read',{method:'POST',headers:{'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:JSON.stringify({id}),cache:'no-store'});
  }catch(e){}
}
function openProcess(type,processId,status){
  const r=routes[type];if(!r)return;
  try{sessionStorage.setItem('vg-process-focus',processId)}catch(e){}
  try{
    if(typeof window[r.open]==='function')window[r.open]();
    else if(typeof window.setView==='function')window.setView(r.view);
  }catch(e){if(typeof window.setView==='function')window.setView(r.view)}
  let attempts=0,refreshed=false,modeSet=false;
  const seek=()=>{
    attempts++;
    if(!modeSet){
      const mode=document.querySelector(isClosedStatus(status)?r.closed:r.active);
      if(mode){mode.click();modeSet=true;}
    }
    const item=document.querySelector(`${r.item}[data-id="${escCss(processId)}"]`);
    if(item){item.click();item.scrollIntoView?.({block:'nearest'});return;}
    if(!refreshed&&attempts>=2){const b=document.querySelector(r.refresh);if(b){b.click();refreshed=true;}}
    if(attempts<30)setTimeout(seek,180);
  };
  setTimeout(seek,80);
}

document.addEventListener('click',function(e){
  const el=e.target.closest?.('.vg-msg-notice[data-notice]');
  if(!el)return;
  const id=el.dataset.notice||'';
  const parts=id.split(':');
  const type=parts[0],processId=parts[1];
  if(!routes[type]||!processId)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  el.classList.remove('unread');
  markRead(id);
  openProcess(type,processId,parts[2]||el.textContent||'');
},true);
})();
