import { registerDataSource, type DataSourceId } from './data-registry';
import type { OccupancySourceSnapshot } from './occupancy-model';
import type { ReputationSourceSnapshot } from './reputation-model';
import type { RevenueSourceSnapshot } from './revenue-model';

type OccupancyBridge = {
  version:number;
  read:()=>unknown[];
  selection:()=>{hotel:string;snapshot:string};
  stats:()=>OccupancySourceSnapshot['stats'];
};

type ReputationBridge = {
  version:number;
  read:()=>unknown;
  stats:()=>ReputationSourceSnapshot['stats'];
};

type RevenueBridge = {
  version:number;
  read:()=>unknown;
  stats:()=>RevenueSourceSnapshot['stats'];
};

type LegacyWindow = Window & {
  RAW?: unknown;
  STORE?: unknown;
  VG?: Record<string, unknown> & {
    occupancyModernBridge?:OccupancyBridge;
    reputationModernBridge?:ReputationBridge;
    revenueModernBridge?:RevenueBridge;
  };
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

function reputationSnapshot(w:LegacyWindow):ReputationSourceSnapshot {
  const bridge=w.VG?.reputationModernBridge;
  if(bridge)return {data:bridge.read(),stats:bridge.stats()};
  return {data:null,stats:{records:0,available:false}};
}

function revenueSnapshot(w:LegacyWindow):RevenueSourceSnapshot {
  const bridge=w.VG?.revenueModernBridge;
  if(bridge)return {data:bridge.read(),stats:bridge.stats()};
  return {data:null,stats:{records:0,available:false}};
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
      return reputationSnapshot(w);
    case 'revenue':
      return revenueSnapshot(w);
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
 * Ocupação, Reputação e Revenue já usam contratos read-only específicos em vez de RAW.
 * As restantes fontes continuam a expor os dados que o runtime antigo já
 * carregou, até serem migradas uma a uma.
 */
export function registerLegacyDataSources(): void {
  (Object.keys(TTL) as DataSourceId[]).forEach(id => {
    registerDataSource({ id, ttlMs:TTL[id], load:() => snapshot(id) });
  });
}
