import type { ModernModule } from '../core/module-registry';
import { approvalsController } from '../approvals/approvals-controller';
import { approvalsState } from '../approvals/approvals-state';
import { clearApprovals, renderApprovals } from '../approvals/approvals-renderer';
let mountedRoot:HTMLElement|undefined;let unsubscribe:(()=>void)|undefined;
async function paint(){if(!mountedRoot)return;const prepared=await approvalsController.prepare();renderApprovals(mountedRoot,prepared.selection,{onSelectionChange:n=>approvalsController.setSelection(n),onRefresh:async()=>{await approvalsController.refresh();await paint();},onMessage:async(r,text)=>{await approvalsController.message(r.id,text);await paint();},onSubmit:async(r,c)=>{await approvalsController.submit(r.id,c);await paint();},onDecision:async(r,d,c)=>{await approvalsController.decide(r.id,d,c);await paint();},onState:async(r,s,c)=>{await approvalsController.changeState(r.id,s,c);await paint();},onArchive:async r=>{await approvalsController.archive(r.id);await paint();}});}
const approvals:ModernModule={id:'approvals',async mount(root){mountedRoot=root;await approvalsController.prepare(true);unsubscribe=approvalsState.subscribe(()=>void paint());await paint();root.dataset.modernApprovals='ready';root.dataset.modernApprovalsWrite='enabled';},unmount(){unsubscribe?.();unsubscribe=undefined;if(mountedRoot)clearApprovals(mountedRoot);mountedRoot=undefined;}};
export default approvals;
