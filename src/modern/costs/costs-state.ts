export interface CostsSelection {hotel:string;category:string;period:string;}
export type CostsSelectionListener=(selection:Readonly<CostsSelection>)=>void;
const DEFAULT:CostsSelection=Object.freeze({hotel:'__all__',category:'__all__',period:'__all__'});
export class CostsStateStore{
  private selection:CostsSelection={...DEFAULT};
  private readonly listeners=new Set<CostsSelectionListener>();
  current():Readonly<CostsSelection>{return Object.freeze({...this.selection});}
  replace(next:Partial<CostsSelection>):Readonly<CostsSelection>{
    const normalized:CostsSelection={hotel:String(next.hotel??this.selection.hotel??'__all__'),category:String(next.category??this.selection.category??'__all__'),period:String(next.period??this.selection.period??'__all__')};
    const changed=JSON.stringify(normalized)!==JSON.stringify(this.selection);this.selection=normalized;if(changed)this.listeners.forEach(l=>l(this.current()));return this.current();
  }
  subscribe(listener:CostsSelectionListener):()=>void{this.listeners.add(listener);return()=>this.listeners.delete(listener);}
}
export const costsState=new CostsStateStore();
