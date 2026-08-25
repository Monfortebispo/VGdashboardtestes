import type { ModernModule } from '../core/module-registry';
import { reputationController } from '../reputation/reputation-controller';
import { clearReputationReadOnly, renderReputationReadOnly } from '../reputation/reputation-renderer';

let mountedRoot:HTMLElement|undefined;

const reputation:ModernModule = {
  id:'reputation',
  async mount(root){
    mountedRoot=root;
    const prepared=await reputationController.prepare();
    root.dataset.modernReputation='ready';
    root.dataset.modernReputationRecords=String(prepared.diagnostics.records);
    root.dataset.modernReputationAvailable=String(prepared.diagnostics.available);
    renderReputationReadOnly(root);
  },
  unmount(){
    if(mountedRoot)clearReputationReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default reputation;
