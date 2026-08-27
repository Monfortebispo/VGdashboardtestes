import { approvalsActions, approvalsData, type ApprovalDecision } from '../data/approvals-service';
import { approvalsState,type ApprovalsSelection } from './approvals-state';
export class ApprovalsController{
  setSelection(n:Partial<ApprovalsSelection>){return approvalsState.replace(n);}
  async prepare(force=false){const data=await approvalsData(force);return{selection:approvalsState.current(),data};}
  refresh(){return this.prepare(true);}
  async message(id:string,text:string){if(!text.trim())throw new Error('Escreva uma mensagem.');await approvalsActions.message(id,text.trim());return this.prepare(false);}
  async submit(id:string,comment=''){await approvalsActions.submit(id,comment.trim());return this.prepare(false);}
  async decide(id:string,decision:ApprovalDecision,comment:string){if(!comment.trim())throw new Error('O comentário da decisão é obrigatório.');await approvalsActions.decision(id,decision,comment.trim());return this.prepare(false);}
  async changeState(id:string,status:string,comment:string){if(!status.trim())throw new Error('Selecione o novo estado.');if(!comment.trim())throw new Error('O comentário é obrigatório ao alterar o estado.');await approvalsActions.changeState(id,status.trim(),comment.trim());return this.prepare(false);}
  async archive(id:string){await approvalsActions.archive(id);return this.prepare(false);}
}
export const approvalsController=new ApprovalsController();
