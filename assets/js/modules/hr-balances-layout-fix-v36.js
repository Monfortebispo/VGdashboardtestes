(function(){'use strict';
const $=id=>document.getElementById(id);
function isHr(){return location.hash==='#hrbalances'||$('view-hrbalances')?.classList.contains('active')}
function hideEmpty(){
  if(!isHr())return;
  const e=$('emptyState');
  if(e){e.style.setProperty('display','none','important');e.classList.add('agenda-hidden')}
  const v=$('view-hrbalances');
  if(v){
    v.style.setProperty('margin','0','important');
    v.style.setProperty('padding-top','10px','important');
    v.style.setProperty('min-height','0','important');
    v.style.setProperty('position','relative','important');
    v.style.setProperty('top','auto','important');
    v.style.setProperty('transform','none','important');
  }
  try{window.scrollTo(0,0)}catch(e){}
}
function initSelect(id,label){const s=$(id);if(s&&!s.options.length)s.innerHTML='<option value="ALL">'+label+'</option>'}
function initUi(){
  if(!$('view-hrbalances'))return;
  initSelect('vhrHotel','Todos os hotéis');
  initSelect('vhrDept','Todos');
  initSelect('vhrType','Todos');
  const m=$('vhrMeta');
  if(m&&!m.textContent.trim())m.textContent='A carregar saldos RH…';
  const t=$('vhrTable');
  if(t&&!t.innerHTML.trim())t.innerHTML='<div class="vhr-sub" style="padding:12px 2px">A obter saldos do servidor…</div>';
}
function patchOpen(){
  const original=window.vgHrBalancesOpen;
  if(typeof original!=='function'||original.__layoutFixed)return false;
  const wrapped=function(){hideEmpty();initUi();const r=original.apply(this,arguments);[0,50,150,400,1000].forEach(ms=>setTimeout(()=>{hideEmpty();initUi()},ms));return r};
  wrapped.__layoutFixed=true;window.vgHrBalancesOpen=wrapped;return true;
}
function apply(){hideEmpty();initUi();patchOpen()}
function boot(){
  apply();
  let n=0;const t=setInterval(()=>{apply();if(++n>40)clearInterval(t)},150);
  window.addEventListener('hashchange',()=>setTimeout(apply,0));
  new MutationObserver(()=>{if(isHr())queueMicrotask(apply)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();