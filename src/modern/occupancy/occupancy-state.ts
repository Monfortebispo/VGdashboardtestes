export interface OccupancySelection {
  hotel:string;
  snapshot:string;
  year?:string;
  month?:number|null;
}

export type OccupancySelectionListener = (selection:Readonly<OccupancySelection>) => void;

const DEFAULT_SELECTION:OccupancySelection = Object.freeze({
  hotel:'__all__',
  snapshot:'__latest__',
  year:undefined,
  month:null
});

export class OccupancyStateStore {
  private selection:OccupancySelection = { ...DEFAULT_SELECTION };
  private readonly listeners = new Set<OccupancySelectionListener>();

  current():Readonly<OccupancySelection> {
    return Object.freeze({ ...this.selection });
  }

  replace(next:Partial<OccupancySelection>):Readonly<OccupancySelection> {
    const normalized:OccupancySelection = {
      hotel: String(next.hotel ?? this.selection.hotel ?? '__all__'),
      snapshot: String(next.snapshot ?? this.selection.snapshot ?? '__latest__'),
      year: next.year == null ? this.selection.year : String(next.year),
      month: next.month == null ? next.month ?? this.selection.month ?? null : Math.max(0,Math.min(11,Number(next.month)))
    };
    const changed = JSON.stringify(normalized)!==JSON.stringify(this.selection);
    this.selection = normalized;
    if(changed) this.listeners.forEach(listener=>listener(this.current()));
    return this.current();
  }

  reset():Readonly<OccupancySelection> {
    this.selection = { ...DEFAULT_SELECTION };
    this.listeners.forEach(listener=>listener(this.current()));
    return this.current();
  }

  subscribe(listener:OccupancySelectionListener):()=>void {
    this.listeners.add(listener);
    return ()=>this.listeners.delete(listener);
  }
}

export const occupancyState = new OccupancyStateStore();
