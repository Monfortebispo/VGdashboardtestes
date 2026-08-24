import { loadModule, registerModule, type ModernModuleId } from './core/module-registry';
import { createLegacyRuntime } from './core/legacy-runtime';
import { ModernViewRouter } from './core/view-router';
import { createNavigationController, navigationGroups } from './shell/navigation';

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
registerModule('costs', async () => (await import('./modules/costs')).default);
registerModule('approvals', async () => (await import('./modules/approvals')).default);

const runtime = createLegacyRuntime();
export const modernViewRouter = new ModernViewRouter(runtime);
export const modernNavigation = createNavigationController(modernViewRouter);

export async function openModernModule(id: ModernModuleId): Promise<void> {
  const mod = await loadModule(id);
  await mod.mount?.(document.body);
}

export const modernArchitecture = Object.freeze({
  status: 'isolated',
  version: 2,
  lazyModules: ['portfolio','occupancy','reputation','revenue','costs','approvals'] as const,
  navigationGroups: navigationGroups().map(group => ({
    name: group.name,
    views: group.items.map(item => item.id)
  }))
});
