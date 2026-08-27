import { approvalsData } from '../data/approvals-service';import { approvalsState,type ApprovalsSelection } from './approvals-state';
export class ApprovalsController{setSelection(n:Partial<ApprovalsSelection>){return approvalsState.replace(n);}async prepare(force=false){const data=await approvalsData(force);return{selection:approvalsState.current(),data};}refresh(){return this.prepare(true);}}
export const approvalsController=new ApprovalsController();
