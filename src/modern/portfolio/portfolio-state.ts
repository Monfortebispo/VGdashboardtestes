export interface PortfolioSelection {
  geography:string;
  hotel:string;
  period:string;
}

export type PortfolioSelectionListener=(selection:Readonly<PortfolioSelection>)=>void;

const DEFAULT_SELECTION:PortfolioSelection=Object.freeze({geography:'__all__',hotel:'__all__',period:'__latest__'});

export class PortfolioStateStore {
  private selection:PortfolioSelection={...DEFAULT_SELECTION};
  private readonly listeners=new Set<PortfolioSelectionListener>();

  current():Readonly<PortfolioSelection>{return Object.freeze({...this.selection});}

  replace(next:Partial<PortfolioSelection>):Readonly<PortfolioSelection>{
    const normalized:PortfolioSelection={
      geography:String(next.geography??this.selection.geography??'__all__'),
      hotel:String(next.hotel??this.selection.hotel??'__all__'),
      period:String(next.period??this.selection.period??'__latest__')
    };
    const changed=JSON.stringify(normalized)!==JSON.stringify(this.selection);
    this.selection=normalized;
    if(changed)this.listeners.forEach(listener=>listener(this.current()));
    return this.current();
  }

  subscribe(listener:PortfolioSelectionListener):()=>void{
    this.listeners.add(listener);
    return ()=>this.listeners.delete(listener);
  }
}

export const portfolioState=new PortfolioStateStore();
