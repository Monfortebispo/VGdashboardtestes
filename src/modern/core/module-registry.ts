export type ModernModuleId =
  | 'shell'
  | 'portfolio'
  | 'revenue'
  | 'costs'
  | 'occupancy'
  | 'reputation'
  | 'city-ledger'
  | 'purchases'
  | 'housekeeping'
  | 'energy'
  | 'approvals';

export interface ModernModule {
  id: ModernModuleId;
  mount?: (root: HTMLElement) => void | Promise<void>;
  unmount?: () => void | Promise<void>;
}

type Loader = () => Promise<ModernModule>;

const loaders = new Map<ModernModuleId, Loader>();
const loaded = new Map<ModernModuleId, ModernModule>();

export function registerModule(id: ModernModuleId, loader: Loader): void {
  if (loaders.has(id)) throw new Error(`Módulo já registado: ${id}`);
  loaders.set(id, loader);
}

export async function loadModule(id: ModernModuleId): Promise<ModernModule> {
  const cached = loaded.get(id);
  if (cached) return cached;

  const loader = loaders.get(id);
  if (!loader) throw new Error(`Módulo moderno não registado: ${id}`);

  const mod = await loader();
  if (mod.id !== id) throw new Error(`Módulo inválido: esperado ${id}, recebido ${mod.id}`);
  loaded.set(id, mod);
  return mod;
}

export function isModuleLoaded(id: ModernModuleId): boolean {
  return loaded.has(id);
}

export function loadedModuleIds(): ModernModuleId[] {
  return [...loaded.keys()];
}
