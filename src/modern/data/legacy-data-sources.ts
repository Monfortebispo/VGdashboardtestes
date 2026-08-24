import { registerDataSource, type DataSourceId } from './data-registry';
import type { OccupancySourceSnapshot } from './occupancy-model';

type OccupancyBridge = {
  version:number;
  read:()=>unknown[];
  selection:()=>{hotel:string;snapshot:string};
  stats:()=>OccupancySourceSnapshot['stats'];
};

type LegacyWindow = Window & {
  RAW?: unknown;
  STORE?: unknown;
  VG?: Record<string, unknown> & { occupancyModernBridge?:OccupancyBridge };
};

function occupancySnapshot(w:LegacyWindow): OccupancySourceSnapshot {
  const bridge=w.VG?.occupancyModernBridge;
  if(bridge){
    return {
      snapshots:bridge.read() as OccupancySourceSnapshot['snapshots'],
      selection:bridge.selection(),
      stats:bridge.stats()
    };
  }
  return {
    snapshots:[],
    selection:{hotel:'__all__',snapshot:'__latest__'},
    stats:{snapshots:0,hotels:0,latestId:null,latestLabel:null,latestTs:null}
  };
}

function snapshot(id: DataSourceId): unknown {
  const w = window as LegacyWindow;
  switch (id) {
    case 'core':
      return { RAW:w.RAW, STORE:w.STORE, VG:w.VG };
    case 'financials':
      return w.RAW;
    case 'occupancy':
      return occupancySnapshot(w);
    case 'reputation':
      return { RAW:w.RAW, reputation:w.VG?.reputation };
    case 'revenue':
      return { RAW:w.RAW, revenueHub:w.VG?.revenueHub };
    case 'approvals':
      return w.VG?.approvals;
    case 'hotels':
      return { RAW:w.RAW, hotels:w.VG?.hotels };
    case 'documents':
      return w.VG?.documents;
    case 'purchases':
      return { RAW:w.RAW, purchases:w.VG?.purchases };
  }
}

const TTL: Readonly<Record<DataSourceId, number>> = Object.freeze({
  core: 15_000,
  financials: 60_000,
  occupancy: 30_000,
  reputation: 120_000,
  revenue: 30_000,
  approvals: 15_000,
  hotels: 300_000,
  documents: 60_000,
  purchases: 60_000
});

/**
 * Adaptadores temporários: nesta fase não criam tráfego de rede.
 * A fonte occupancy já usa um contrato read-only específico em vez de RAW.
 * As restantes fontes continuam a expor os dados que o runtime antigo já
 * carregou, até serem migradas uma a uma.
 */
export function registerLegacyDataSources(): void {
  (Object.keys(TTL) as DataSourceId[]).forEach(id => {
    registerDataSource({ id, ttlMs:TTL[id], load:() => snapshot(id) });
  });
}
