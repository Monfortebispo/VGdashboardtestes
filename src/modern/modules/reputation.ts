import type { ModernModule } from '../core/module-registry';
import { reputationController } from '../reputation/reputation-controller';
import { reputationState } from '../reputation/reputation-state';
import { clearReputationReadOnly, renderReputationReadOnly } from '../reputation/reputation-renderer';

let mountedRoot:HTMLElement|undefined;
let unsubscribe:(()=>void)|undefined;
let retryTimers:number[]=[];
let hiddenLegacy:HTMLElement[]=[];

function render():void{
  if(!mountedRoot)return;
  renderReputationReadOnly(mountedRoot,reputationState.current(),{
    onSelectionChange(next){reputationController.setSelection(next);},
    async onRefresh(){await reputationController.refresh();render();}
  });
}
async function refreshFromLegacy():Promise<void>{
  if(!mountedRoot)return;
  const prepared=await reputationController.refresh();
  mountedRoot.dataset.modernReputationRecords=String(prepared.diagnostics.records);
  mountedRoot.dataset.modernReputationAvailable=String(prepared.diagnostics.available);
  if(prepared.diagnostics.records>0)clearRetries();
  render();
}
function onLegacyChange(){void refreshFromLegacy();}
function clearRetries(){retryTimers.forEach(id=>window.clearTimeout(id));retryTimers=[];}
function scheduleEmptyRetries(records:number){
  clearRetries();
  if(records>0)return;
  [300,1000,2500,5000,10000].forEach(ms=>retryTimers.push(window.setTimeout(id=>void refreshFromLegacy(),ms)) as unknown as number);
}
function hideLegacyView(root:HTMLElement){
  hiddenLegacy=[];
  Array.from(root.children).forEach(node=>{
    const el=node as HTMLElement;
    if(el.dataset.modernReputationReadonly==='true')return;
    if(el.style.display==='none')return;
    el.dataset.modernReputationPrevDisplay=el.style.display||'';
    el.style.display='none';
    hiddenLegacy.push(el);
  });
}
function enableFallback(){document.documentElement.classList.add('vg-modern-reputation-fallback');}
function disableFallback(){document.documentElement.classList.remove('vg-modern-reputation-fallback');}
function restoreLegacyView(){
  hiddenLegacy.forEach(el=>{
    el.style.display=el.dataset.modernReputationPrevDisplay||'';
    delete el.dataset.modernReputationPrevDisplay;
  });
  hiddenLegacy=[];
}
function showLoading(root:HTMLElement){
  let host=root.querySelector<HTMLElement>('[data-modern-reputation-readonly]');
  if(!host){host=document.createElement('section');host.dataset.modernReputationReadonly='true';root.appendChild(host);}
  host.replaceChildren();
  const title=document.createElement('h2');title.textContent='Reputação & Guest Experience';
  const loading=document.createElement('p');loading.textContent='A carregar reputação…';loading.setAttribute('role','status');loading.setAttribute('aria-live','polite');
  host.append(title,loading);
}

const reputation:ModernModule = {
  id:'reputation',
  async mount(root){
    mountedRoot=root;
    disableFallback();
    // Além do guard de CSS instalado no <head>, mantemos display:none inline para
    // isolamento durante toda a vida do módulo moderno.
    hideLegacyView(root);
    showLoading(root);
    root.dataset.modernReputation='loading';
    try{
      const prepared=await reputationController.prepare();
      root.dataset.modernReputation='ready';
      root.dataset.modernReputationRecords=String(prepared.diagnostics.records);
      root.dataset.modernReputationAvailable=String(prepared.diagnostics.available);
      unsubscribe?.();
      unsubscribe=reputationState.subscribe(()=>render());
      window.removeEventListener('vg-reputation-data-changed',onLegacyChange);
      window.addEventListener('vg-reputation-data-changed',onLegacyChange);
      scheduleEmptyRetries(prepared.diagnostics.records);
      render();
    }catch(error){
      root.dataset.modernReputation='error';
      clearReputationReadOnly(root);
      restoreLegacyView();
      enableFallback();
      mountedRoot=undefined;
      throw error;
    }
  },
  unmount(){
    unsubscribe?.();unsubscribe=undefined;
    clearRetries();
    window.removeEventListener('vg-reputation-data-changed',onLegacyChange);
    if(mountedRoot)clearReputationReadOnly(mountedRoot);
    restoreLegacyView();
    disableFallback();
    mountedRoot=undefined;
  }
};

export default reputation;
