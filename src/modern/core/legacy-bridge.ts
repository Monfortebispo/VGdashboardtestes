export interface LegacyRuntime {
  setView?: (view: string) => void;
  vgAuthCurrent?: () => unknown;
  VG?: Record<string, unknown>;
}

export function legacyRuntime(): LegacyRuntime {
  const w = window as Window & LegacyRuntime;
  return {
    setView: w.setView,
    vgAuthCurrent: w.vgAuthCurrent,
    VG: w.VG
  };
}

export function legacyView(view: string): void {
  const runtime = legacyRuntime();
  if (typeof runtime.setView !== 'function') {
    throw new Error('Runtime legado ainda não disponibilizou setView().');
  }
  runtime.setView(view);
}
