export type DataSourceId =
  | 'core'
  | 'financials'
  | 'occupancy'
  | 'reputation'
  | 'revenue'
  | 'approvals'
  | 'hotels'
  | 'documents'
  | 'purchases';

export interface DataLoadContext {
  force?: boolean;
  signal?: AbortSignal;
}

export interface DataSource<T = unknown> {
  id: DataSourceId;
  ttlMs: number;
  load(context: DataLoadContext): Promise<T> | T;
}

interface CacheEntry<T = unknown> {
  value: T;
  loadedAt: number;
}

const sources = new Map<DataSourceId, DataSource>();
const cache = new Map<DataSourceId, CacheEntry>();
const inflight = new Map<DataSourceId, Promise<unknown>>();

export function registerDataSource(source: DataSource): void {
  if (sources.has(source.id)) throw new Error(`Fonte de dados já registada: ${source.id}`);
  sources.set(source.id, source);
}

export function hasDataSource(id: DataSourceId): boolean {
  return sources.has(id);
}

export function cachedData<T = unknown>(id: DataSourceId): T | undefined {
  return cache.get(id)?.value as T | undefined;
}

export function invalidateData(id?: DataSourceId): void {
  if (id) {
    cache.delete(id);
    return;
  }
  cache.clear();
}

function isFresh(id: DataSourceId, source: DataSource): boolean {
  const entry = cache.get(id);
  if (!entry) return false;
  return Date.now() - entry.loadedAt < source.ttlMs;
}

export async function ensureDataSource<T = unknown>(id: DataSourceId, context: DataLoadContext = {}): Promise<T> {
  const source = sources.get(id);
  if (!source) throw new Error(`Fonte de dados não registada: ${id}`);

  if (!context.force && isFresh(id, source)) return cache.get(id)!.value as T;

  const pending = inflight.get(id);
  if (pending && !context.force) return pending as Promise<T>;

  const promise = Promise.resolve(source.load(context)).then(value => {
    cache.set(id, { value, loadedAt: Date.now() });
    return value;
  }).finally(() => {
    if (inflight.get(id) === promise) inflight.delete(id);
  });

  inflight.set(id, promise);
  return promise as Promise<T>;
}

export async function ensureDataSources(ids: readonly DataSourceId[], context: DataLoadContext = {}): Promise<void> {
  await Promise.all(ids.map(id => ensureDataSource(id, context)));
}

export function dataRegistryStats(): { registered:DataSourceId[]; cached:DataSourceId[]; inflight:DataSourceId[] } {
  return {
    registered: [...sources.keys()],
    cached: [...cache.keys()],
    inflight: [...inflight.keys()]
  };
}
