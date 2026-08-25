import { reputationData, reputationDiagnostics, type ReputationDiagnostics } from '../data/reputation-service';
import { reputationState, type ReputationSelection } from './reputation-state';

export interface ReputationPreparation {
  selection:Readonly<ReputationSelection>;
  diagnostics:ReputationDiagnostics;
}

export class ReputationController {
  setSelection(next:Partial<ReputationSelection>):Readonly<ReputationSelection>{
    return reputationState.replace(next);
  }

  async prepare(force=false):Promise<ReputationPreparation>{
    await reputationData(force);
    const diagnostics=await reputationDiagnostics(false);
    return {selection:reputationState.current(),diagnostics};
  }

  async refresh():Promise<ReputationPreparation>{
    return this.prepare(true);
  }
}

export const reputationController=new ReputationController();
