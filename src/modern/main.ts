import { registerModule } from './core/module-registry';

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

export const modernArchitecture = Object.freeze({
  status: 'isolated',
  version: 1
});
