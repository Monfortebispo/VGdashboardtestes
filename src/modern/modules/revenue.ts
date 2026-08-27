import type { ModernModule } from '../core/module-registry';
import { revenueController } from '../revenue/revenue-controller';
import { clearRevenueReadOnly, renderRevenueReadOnly } from '../revenue/revenue-renderer';
import { revenueState } from '../revenue/revenue-state';

let mountedRoot:HTMLElement|undefined;
let unsubscribe:(()=>void)|undefined;

function renderCurrent():void{
  if(!mountedRoot)return;
  renderRevenueReadOnly(mountedRoot,revenueState.current(),{
    onSelectionChange(next){revenueController.setSelection(next);},
    async onRefresh(){await revenueController.refresh();renderCurrent();}
  });
}

const revenue:ModernModule = {
  id:'revenue',
  async mount(root){
    mountedRoot=root;
    const prepared=await revenueController.prepare();
    root.dataset.modernRevenue='ready';
    root.dataset.modernRevenueRecords=String(prepared.diagnostics.records);
    root.dataset.modernRevenueAvailable=String(prepared.diagnostics.available);
    unsubscribe?.();
    unsubscribe=revenueState.subscribe(()=>renderCurrent());
    renderCurrent();
  },
  unmount(){
    unsubscribe?.();unsubscribe=undefined;
    if(mountedRoot)clearRevenueReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default revenue;
