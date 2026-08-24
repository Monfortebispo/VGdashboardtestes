import { registerDataSource, type DataSourceId } from './data-registry';

type LegacyWindow = Window & {
  RAW?: unknown;
  STORE?: unknown;
  VG?: Record<string, unknown>;
};

function snapshot(id: DataSourceId): unknown {
  const w = window as LegacyWindow;
  switch (id) {
    case 'core':
      return { RAW:w.RAW, STORE:w.STORE, VG:w.VG };
    case 'financials':
      return w.RAW;
    case 'occupancy':
      return { RAW:w.RAW, occupancy:w.VG?.occupancy };
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
 * Apenas expõem ao runtime moderno os dados que a aplicação antiga já carregou.
 * Mais tarde cada fonte poderá ser substituída por uma API específica sem
 * alterar o router nem os módulos consumidores.
 */
export function registerLegacyDataSources(): void {
  (Object.keys(TTL) as DataSourceId[]).forEach(id => {
    registerDataSource({ id, ttlMs:TTL[id], load:() => snapshot(id) });
  });
}
