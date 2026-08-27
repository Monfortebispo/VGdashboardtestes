import type { ModernModule } from '../core/module-registry';
import { reputationController } from '../reputation/reputation-controller';
import { reputationState } from '../reputation/reputation-state';
import { clearReputationReadOnly, renderReputationReadOnly } from '../reputation/reputation-renderer';

let mountedRoot:HTMLElement|undefined;
let unsubscribe:(()=>void)|undefined;

function render():void{
  if(!mountedRoot)return;
  renderReputationReadOnly(mountedRoot,reputationState.current(),{
    onSelectionChange(next){reputationController.setSelection(next);},
    async onRefresh(){await reputationController.refresh();render();}
  });
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
    render();
  },
  unmount(){
    unsubscribe?.();unsubscribe=undefined;
    if(mountedRoot)clearReputationReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default reputation;
