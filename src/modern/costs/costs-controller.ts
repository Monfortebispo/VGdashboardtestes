import { costsData, costsDiagnostics, type CostsDiagnostics } from '../data/costs-service';
import { costsState, type CostsSelection } from './costs-state';
export interface CostsPreparation{selection:Readonly<CostsSelection>;diagnostics:CostsDiagnostics;}
export class CostsController{
  setSelection(next:Partial<CostsSelection>):Readonly<CostsSelection>{return costsState.replace(next);}
  async prepare(force=false):Promise<CostsPreparation>{await costsData(force);const diagnostics=await costsDiagnostics(false);return{selection:costsState.current(),diagnostics};}
  async refresh():Promise<CostsPreparation>{return this.prepare(true);}
}
export const costsController=new CostsController();
