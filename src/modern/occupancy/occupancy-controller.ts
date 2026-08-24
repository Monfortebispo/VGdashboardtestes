import { occupancyData, pickupFor, type OccupancyDiagnostics, occupancyDiagnostics } from '../data/occupancy-service';
import { occupancyState, type OccupancySelection } from './occupancy-state';

export interface OccupancyLegacyAdapter {
  readSelection?():Partial<OccupancySelection>;
  applySelection?(selection:Readonly<OccupancySelection>):void;
  refreshView?():void | Promise<void>;
}

export interface OccupancyPreparation {
  selection:Readonly<OccupancySelection>;
  diagnostics:OccupancyDiagnostics;
}

export class OccupancyController {
  constructor(private readonly legacy?:OccupancyLegacyAdapter) {}

  syncFromLegacy():Readonly<OccupancySelection> {
    const legacySelection=this.legacy?.readSelection?.()||{};
    return occupancyState.replace(legacySelection);
  }

  setSelection(next:Partial<OccupancySelection>):Readonly<OccupancySelection> {
    const selection=occupancyState.replace(next);
    this.legacy?.applySelection?.(selection);
    return selection;
  }

  async prepare(force=false):Promise<OccupancyPreparation> {
    this.syncFromLegacy();
    await occupancyData(force);
    const diagnostics=await occupancyDiagnostics(false);
    return { selection:occupancyState.current(), diagnostics };
  }

  async refresh():Promise<void> {
    await occupancyData(true);
    await this.legacy?.refreshView?.();
  }

  pickup(hotel:string,year:string|number) {
    return pickupFor(hotel,year);
  }
}
