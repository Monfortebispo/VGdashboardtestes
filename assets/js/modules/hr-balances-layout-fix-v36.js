(function(){'use strict';
const $=id=>document.getElementById(id);
function isHr(){return location.hash==='#hrbalances'||$('view-hrbalances')?.classList.contains('active')}
function install(){if($('vgHrLayoutHardFix'))return;const s=document.createElement('style');s.id='vgHrLayoutHardFix';s.textContent=`
#view-hrbalances.active{position:fixed!important;top:48px!important;left:var(--sidebar-w,232px)!important;right:var(--context-w,220px)!important;bottom:0!important;z-index:90!important;overflow:auto!important;margin:0!important;padding:10px 12px 24px!important;min-height:0!important;max-height:none!important;background:var(--surface-0,#fff)!important;transform:none!important}
#view-hrbalances .vhr-head{margin-top:0!important}
body:has(#view-hrbalances.active) #emptyState{display:none!important}
@media(max-width:1180px){#view-hrbalances.active{right:0!important}}
@media(max-width:960px){#view-hrbalances.active{left:0!important;right:0!important;top:48px!important}}
`;document.head.appendChild(s)}
function hideEmpty(){if(!isHr())return;const e=$('emptyState');if(e){e.style.setProperty('display','none','important');e.classList.add('agenda-hidden')}try{window.scrollTo(0,0)}catch(e){}}
function initSelect(id,label){const s=$(id);if(s&&!s.options.length)s.innerHTML='<option value="ALL">'+label+'</option>'}
function initUi(){if(!$('view-hrbalances'))return;initSelect('vhrHotel','Todos os hotéis');initSelect('vhrDept','Todos');initSelect('vhrType','Todos');const m=$('vhrMeta');if(m&&!m.textContent.trim())m.textContent='A carregar saldos RH…';const t=$('vhrTable');if(t&&!t.innerHTML.trim())t.innerHTML='<div class="vhr-sub" style="padding:12px 2px">A obter saldos do servidor…</div>'}
function patchOpen(){const original=window.vgHrBalancesOpen;if(typeof original!=='function'||original.__layoutFixed)return false;const wrapped=function(){const r=original.apply(this,arguments);[0,30,100,300,800].forEach(ms=>setTimeout(()=>{hideEmpty();initUi()},ms));return r};wrapped.__layoutFixed=true;window.vgHrBalancesOpen=wrapped;return true}
function apply(){install();hideEmpty();initUi();patchOpen()}
function boot(){apply();let n=0;const t=setInterval(()=>{apply();if(++n>50)clearInterval(t)},120);window.addEventListener('hashchange',()=>setTimeout(apply,0));new MutationObserver(()=>{if(isHr())queueMicrotask(apply)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();