(function(){
'use strict';
if(window.__VG_COMMUNICATIONS_V39__)return;window.__VG_COMMUNICATIONS_V39__=true;
const API='/.netlify/functions/communications-v38';
const $=id=>document.getElementById(id), me=()=>window.vgAuthCurrent?.()||null, token=()=>window.vgAuthToken?.()||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let busy=false,lastChat='',timer=null;
async function req(action,method='GET',body,extra=''){
 const h={'Content-Type':'application/json'},t=token();if(t)h.Authorization='Bearer '+t;
 const r=await fetch(API+'?action='+encodeURIComponent(action)+(extra||''),{method,headers:h,cache:'no-store',body:body===undefined?undefined:JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d;
}
function visible(){return !!$('view-messages')?.classList.contains('active')||!!$('view-messages')?.classList.contains('vg-msg-interaction-paused')}
function chatId(){return document.querySelector('.vg-msg-conv.active')?.dataset.chat||lastChat||''}
function composing(){const t=$('vgMsgText'),m=$('vgMsgModal');return !!m?.classList.contains('open')||!!t?.value||document.activeElement===t}
function nameFor(id){const c=window.VG?.communications?.state?.users?.find?.(u=>String(u.id||u.user)===String(id));return c?.name||c?.displayName||String(id||'')}
function membersOf(c){return Array.isArray(c?.members)?c.members:[]}
function recipients(c){const mine=String(me()?.user||'');return membersOf(c).filter(x=>String(x)!==mine).map(nameFor).filter(Boolean)}
function enhanceHeader(){
 const state=window.VG?.communications?.state;if(!state)return;const id=state.current||chatId(),c=state.chats?.find?.(x=>x.id===id);if(!c)return;
 const head=document.querySelector('#vgMsgMain .vg-msg-head>div');if(!head)return;
 const rs=recipients(c),title=c.group?(c.name||'Grupo'):(rs[0]||c.name||'Conversa');
 const sub=c.group?('Participantes: '+([nameFor(me()?.user),...rs].filter(Boolean).join(' · '))):('Conversa com '+(rs[0]||'destinatário'));
 head.innerHTML='<b>'+esc(title)+'</b><div class="vg-msg-prev">'+esc(sub)+'</div>';
 document.querySelectorAll('#vgMsgThread .vg-msg-row.me .vg-msg-meta').forEach(x=>{if(!x.dataset.v39){x.dataset.v39='1';x.insertAdjacentHTML('afterbegin','<span>Para '+esc(rs.join(', ')||'destinatário')+' · </span>')}});
}
function scrollEnd(){const th=$('vgMsgThread');if(th)requestAnimationFrame(()=>{th.scrollTop=th.scrollHeight})}
async function sync(force=false){
 if(busy||!visible())return;if(composing()&&!force)return;busy=true;
 try{
   const st=window.VG?.communications?.state;const id=st?.current||chatId();
   if(typeof window.VG?.communications?.refresh==='function')await window.VG.communications.refresh(false);
   if(id&&typeof window.VG?.communications?.openChat==='function')await window.VG.communications.openChat(id);
   enhanceHeader();scrollEnd();
 }catch(e){console.warn('VG Dashboard Mensagens V39: sincronização',e)}finally{busy=false}
}
function optimisticSend(e){
 const b=e.target.closest?.('#vgMsgSend');if(!b)return;const t=$('vgMsgText');if(!t||!t.value.trim())return;
 const text=t.value,st=window.VG?.communications?.state,id=st?.current||chatId(),c=st?.chats?.find?.(x=>x.id===id),rs=recipients(c);
 // O V38 continua responsável pelo envio; V39 preserva a composição e força reconciliação logo após a confirmação.
 setTimeout(()=>{const current=$('vgMsgText');if(current&&current.value===text)current.value='';enhanceHeader();scrollEnd();sync(true)},350);
 setTimeout(()=>sync(true),1200);
}
function afterOpen(e){const c=e.target.closest?.('.vg-msg-conv[data-chat]');if(c){lastChat=c.dataset.chat||'';setTimeout(()=>{enhanceHeader();scrollEnd()},80)}}
document.addEventListener('click',optimisticSend,true);
document.addEventListener('click',afterOpen,true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync(true)});
window.addEventListener('focus',()=>sync(true));
window.addEventListener('hashchange',()=>{if(location.hash==='#messages')setTimeout(()=>sync(true),100)});
function start(){clearInterval(timer);timer=setInterval(()=>sync(false),12000);setTimeout(()=>sync(true),800)}
start();
window.VG=window.VG||{};window.VG.communicationsV39={version:39,sync,enhanceHeader,recipients};
})();
