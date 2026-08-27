import {cityLedgerData} from '../data/city-ledger-service';import {cityLedgerState,type CityLedgerSelection} from './city-ledger-state';
export class CityLedgerController{setSelection(n:Partial<CityLedgerSelection>){return cityLedgerState.replace(n);}async prepare(force=false){const data=await cityLedgerData(force);return{selection:cityLedgerState.current(),data};}refresh(){return this.prepare(true);}}
export const cityLedgerController=new CityLedgerController();
