export interface ReputationSelection {
  hotel:string;
  source:string;
  period:string;
}

export type ReputationSelectionListener=(selection:Readonly<ReputationSelection>)=>void;

const DEFAULT_SELECTION:ReputationSelection=Object.freeze({hotel:'__all__',source:'__all__',period:'__latest__'});

export class ReputationStateStore {
  private selection:ReputationSelection={...DEFAULT_SELECTION};
  private readonly listeners=new Set<ReputationSelectionListener>();

  current():Readonly<ReputationSelection>{return Object.freeze({...this.selection});}

  replace(next:Partial<ReputationSelection>):Readonly<ReputationSelection>{
    const normalized:ReputationSelection={
      hotel:String(next.hotel??this.selection.hotel??'__all__'),
      source:String(next.source??this.selection.source??'__all__'),
      period:String(next.period??this.selection.period??'__latest__')
    };
    const changed=JSON.stringify(normalized)!==JSON.stringify(this.selection);
    this.selection=normalized;
    if(changed)this.listeners.forEach(listener=>listener(this.current()));
    return this.current();
  }

  subscribe(listener:ReputationSelectionListener):()=>void{
    this.listeners.add(listener);
    return ()=>this.listeners.delete(listener);
  }
}

export const reputationState=new ReputationStateStore();
