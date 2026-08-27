import type { ModernModule } from '../core/module-registry';
import { approvalsController } from '../approvals/approvals-controller';
import { approvalsState } from '../approvals/approvals-state';
import { clearApprovals, renderApprovals } from '../approvals/approvals-renderer';
let mountedRoot:HTMLElement|undefined;let unsubscribe:(()=>void)|undefined;
async function paint(){if(!mountedRoot)return;const prepared=await approvalsController.prepare();renderApprovals(mountedRoot,prepared.selection,{onSelectionChange:n=>approvalsController.setSelection(n),onRefresh:async()=>{await approvalsController.refresh();await paint();}});}
const approvals:ModernModule={id:'approvals',async mount(root){mountedRoot=root;await approvalsController.prepare();unsubscribe=approvalsState.subscribe(()=>void paint());await paint();root.dataset.modernApprovals='ready';},unmount(){unsubscribe?.();unsubscribe=undefined;if(mountedRoot)clearApprovals(mountedRoot);mountedRoot=undefined;}};
export default approvals;
