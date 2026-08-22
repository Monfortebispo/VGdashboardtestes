import { loadModule, registerModule } from './core/module-registry';

/**
 * Entrada da arquitetura moderna.
 *
 * IMPORTANTE: este ficheiro ainda não é carregado pelo index.html de produção.
 * Serve para permitir migração incremental e builds isolados sem alterar o
 * runtime legado atual.
 */

registerModule('shell', async () => ({
  id: 'shell',
  mount(root) {
    root.dataset.vgModernShell = 'ready';
  },
  unmount() {
    // reservado para a futura desmontagem do shell moderno
  }
}));

registerModule('portfolio', async () => (await import('./modules/portfolio')).default);
registerModule('occupancy', async () => (await import('./modules/occupancy')).default);
registerModule('reputation', async () => (await import('./modules/reputation')).default);
registerModule('revenue', async () => (await import('./modules/revenue')).default);

export async function openModernModule(id: 'portfolio'|'occupancy'|'reputation'|'revenue'): Promise<void> {
  const mod = await loadModule(id);
  await mod.mount?.(document.body);
}

export const modernArchitecture = Object.freeze({
  status: 'isolated',
  version: 1,
  lazyModules: ['portfolio','occupancy','reputation','revenue'] as const
});
