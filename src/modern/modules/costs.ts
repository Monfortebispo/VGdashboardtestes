import type { ModernModule } from '../core/module-registry';
import { costsController } from '../costs/costs-controller';
import { clearCostsReadOnly, renderCostsReadOnly } from '../costs/costs-renderer';
import { costsState } from '../costs/costs-state';

let mountedRoot:HTMLElement|undefined;
let unsubscribe:(()=>void)|undefined;

function renderCurrent():void{
  if(!mountedRoot)return;
  renderCostsReadOnly(mountedRoot,costsState.current(),{
    onSelectionChange(next){costsController.setSelection(next);},
    async onRefresh(){await costsController.refresh();renderCurrent();}
  });
}

const costs:ModernModule={
  id:'costs',
  async mount(root){
    const prepared=await costsController.prepare();
    mountedRoot=root;
    root.dataset.modernCosts='ready';
    root.dataset.modernCostsRecords=String(prepared.diagnostics.records);
    root.dataset.modernCostsHotels=String(prepared.diagnostics.hotels);
    unsubscribe?.();
    unsubscribe=costsState.subscribe(()=>renderCurrent());
    renderCurrent();
  },
  unmount(){
    unsubscribe?.();unsubscribe=undefined;
    if(mountedRoot)clearCostsReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default costs;
