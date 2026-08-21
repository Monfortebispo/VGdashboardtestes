(function(){
'use strict';
if(window.__VG_COMMUNICATIONS_STABILITY_V38_1__)return;window.__VG_COMMUNICATIONS_STABILITY_V38_1__=true;
const VIEW='view-messages',PAUSED='vg-msg-interaction-paused';
function view(){return document.getElementById(VIEW)}
function pause(){const v=view();if(!v)return;v.classList.add(PAUSED)}
function resume(){const v=view();if(!v)return;v.classList.remove(PAUSED)}
function modalOpen(){return !!document.getElementById('vgMsgModal')?.classList.contains('open')}
function composing(){const t=document.getElementById('vgMsgText'),f=document.getElementById('vgMsgFile'),a=document.activeElement;return modalOpen()||!!t?.value||!!f?.files?.length||a===t||a===f||!!a?.closest?.('#vgMsgModal')}
function settle(){setTimeout(()=>{if(composing())pause();else resume()},220)}
document.addEventListener('click',e=>{const id=e.target?.closest?.('button')?.id;if(id==='vgMsgNew')setTimeout(pause,0);if(id==='vgMsgModalClose')setTimeout(resume,0);if(id==='vgMsgCreate'||id==='vgMsgSend')setTimeout(settle,450)},true);
document.addEventListener('focusin',e=>{if(e.target?.closest?.('#vgMsgModal,#vgMsgText,#vgMsgFile'))pause()},true);
document.addEventListener('focusout',e=>{if(e.target?.closest?.('#vgMsgModal,#vgMsgText,#vgMsgFile'))settle()},true);
document.addEventListener('input',e=>{if(e.target?.closest?.('#vgMsgModal,#vgMsgText'))pause()},true);
document.addEventListener('change',e=>{if(e.target?.closest?.('#vgMsgModal,#vgMsgFile'))pause()},true);
window.addEventListener('hashchange',()=>{if(location.hash!=='#messages')resume()});
window.VG=window.VG||{};window.VG.communicationsStability={version:'38.1.1',pause,resume,isPaused:()=>view()?.classList.contains(PAUSED)||false};
})();
