import { revenueData, revenueDiagnostics, type RevenueDiagnostics } from '../data/revenue-service';
import { revenueState, type RevenueSelection } from './revenue-state';

export interface RevenuePreparation {
  selection:Readonly<RevenueSelection>;
  diagnostics:RevenueDiagnostics;
}

export class RevenueController {
  setSelection(next:Partial<RevenueSelection>):Readonly<RevenueSelection>{
    return revenueState.replace(next);
  }

  async prepare(force=false):Promise<RevenuePreparation>{
    await revenueData(force);
    const diagnostics=await revenueDiagnostics(false);
    return {selection:revenueState.current(),diagnostics};
  }

  async refresh():Promise<RevenuePreparation>{
    return this.prepare(true);
  }
}

export const revenueController=new RevenueController();
