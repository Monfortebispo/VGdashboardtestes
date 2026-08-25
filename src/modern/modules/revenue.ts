import type { ModernModule } from '../core/module-registry';
import { revenueController } from '../revenue/revenue-controller';
import { clearRevenueReadOnly, renderRevenueReadOnly } from '../revenue/revenue-renderer';

let mountedRoot:HTMLElement|undefined;

const revenue:ModernModule = {
  id:'revenue',
  async mount(root){
    mountedRoot=root;
    const prepared=await revenueController.prepare();
    root.dataset.modernRevenue='ready';
    root.dataset.modernRevenueRecords=String(prepared.diagnostics.records);
    root.dataset.modernRevenueAvailable=String(prepared.diagnostics.available);
    renderRevenueReadOnly(root);
  },
  unmount(){
    if(mountedRoot)clearRevenueReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default revenue;
