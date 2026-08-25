import type { ModernModule } from '../core/module-registry';
import { reputationDiagnostics, reputationData } from '../data/reputation-service';
import { clearReputationReadOnly, renderReputationReadOnly } from '../reputation/reputation-renderer';

const reputation:ModernModule = {
  id:'reputation',
  async mount(root){
    await reputationData();
    const diagnostics=await reputationDiagnostics(false);
    root.dataset.modernReputation='ready';
    root.dataset.modernReputationRecords=String(diagnostics.records);
    root.dataset.modernReputationAvailable=String(diagnostics.available);
    renderReputationReadOnly(root);
  },
  unmount(){
    const root=document.querySelector<HTMLElement>('[data-modern-reputation="ready"]');
    if(root)clearReputationReadOnly(root);
  }
};

export default reputation;
