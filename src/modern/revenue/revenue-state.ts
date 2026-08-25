export interface RevenueSelection {
  hotel:string;
  period:string;
  metric:string;
}

export type RevenueSelectionListener=(selection:Readonly<RevenueSelection>)=>void;

const DEFAULT_SELECTION:RevenueSelection=Object.freeze({hotel:'__all__',period:'__latest__',metric:'__all__'});

export class RevenueStateStore {
  private selection:RevenueSelection={...DEFAULT_SELECTION};
  private readonly listeners=new Set<RevenueSelectionListener>();

  current():Readonly<RevenueSelection>{return Object.freeze({...this.selection});}

  replace(next:Partial<RevenueSelection>):Readonly<RevenueSelection>{
    const normalized:RevenueSelection={
      hotel:String(next.hotel??this.selection.hotel??'__all__'),
      period:String(next.period??this.selection.period??'__latest__'),
      metric:String(next.metric??this.selection.metric??'__all__')
    };
    const changed=JSON.stringify(normalized)!==JSON.stringify(this.selection);
    this.selection=normalized;
    if(changed)this.listeners.forEach(listener=>listener(this.current()));
    return this.current();
  }

  subscribe(listener:RevenueSelectionListener):()=>void{
    this.listeners.add(listener);
    return ()=>this.listeners.delete(listener);
  }
}

export const revenueState=new RevenueStateStore();
