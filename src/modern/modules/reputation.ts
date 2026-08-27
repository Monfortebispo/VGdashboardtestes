import type { ModernModule } from '../core/module-registry';
import { reputationController } from '../reputation/reputation-controller';
import { reputationState } from '../reputation/reputation-state';
import { clearReputationReadOnly, renderReputationReadOnly } from '../reputation/reputation-renderer';

let mountedRoot:HTMLElement|undefined;
let unsubscribe:(()=>void)|undefined;
let retryTimers:number[]=[];

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
  render();
}
function onLegacyChange(){void refreshFromLegacy();}
function clearRetries(){retryTimers.forEach(id=>window.clearTimeout(id));retryTimers=[];}
function scheduleEmptyRetries(records:number){
  clearRetries();
  if(records>0)return;
  [300,1000,2500].forEach(ms=>retryTimers.push(window.setTimeout(()=>void refreshFromLegacy(),ms)));
}

const reputation:ModernModule = {
  id:'reputation',
  async mount(root){
    mountedRoot=root;
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
  },
  unmount(){
    unsubscribe?.();unsubscribe=undefined;
    clearRetries();
    window.removeEventListener('vg-reputation-data-changed',onLegacyChange);
    if(mountedRoot)clearReputationReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default reputation;
