import { loadModule } from './module-registry';
import { defaultView, viewDefinition, type ViewDefinition } from './view-catalog';
import { ensureDataSources } from '../data/data-registry';
import { dataSourcesForView } from '../data/view-data-plan';

export interface AuthSnapshot {
  role?: string;
}

export interface ViewRuntime {
  currentView(): string;
  auth(): AuthSnapshot | null;
  canAccessModule?(viewId: string): boolean;
  firstAllowedModule?(): string;
  canUpload?(): boolean;
  activateLegacyView(viewId: string): void;
  setHash(viewId: string): void;
  closeDrawer?(): void;
  refresh?(): void | Promise<void>;
  resizeVisibleCharts?(): void;
  showToast?(message: string, error?: boolean): void;
}

export type NavigateResult =
  | { ok:true; view:ViewDefinition; lazyModuleLoaded:boolean; dataSourcesPrepared:number }
  | { ok:false; requested:string; redirectedTo?:string; reason:'unknown'|'forbidden' };

function roleOf(auth: AuthSnapshot | null): string {
  return String(auth?.role || '').toLowerCase();
}

function canAccess(view: ViewDefinition, runtime: ViewRuntime): boolean {
  const auth = runtime.auth();
  if (!auth) return false;
  if (runtime.canAccessModule && !runtime.canAccessModule(view.id)) return false;
  if (view.access === 'direction' && !['direcao','admin'].includes(roleOf(auth))) return false;
  if (view.access === 'upload' && runtime.canUpload && !runtime.canUpload()) return false;
  return true;
}

async function preloadViewModule(view: ViewDefinition): Promise<boolean> {
  if (!view.moduleId) return false;
  await loadModule(view.moduleId);
  return true;
}

async function prepareViewData(view: ViewDefinition): Promise<number> {
  const sources = dataSourcesForView(view.id);
  await ensureDataSources(sources);
  return sources.length;
}

export class ModernViewRouter {
  private navigationToken = 0;

  constructor(private readonly runtime: ViewRuntime) {}

  async navigate(requestedId: string): Promise<NavigateResult> {
    const token = ++this.navigationToken;
    const requested = viewDefinition(requestedId);
    if (!requested) {
      const fallback = defaultView();
      this.runtime.setHash(fallback.id);
      return { ok:false, requested:requestedId, redirectedTo:fallback.id, reason:'unknown' };
    }

    if (!canAccess(requested, this.runtime)) {
      const fallbackId = this.runtime.firstAllowedModule?.() || defaultView().id;
      const fallback = viewDefinition(fallbackId) || defaultView();
      this.runtime.showToast?.('Este módulo não está autorizado para o seu perfil.', true);
      this.runtime.setHash(fallback.id);
      return { ok:false, requested:requestedId, redirectedTo:fallback.id, reason:'forbidden' };
    }

    // Chunk e dados são preparados em paralelo. Quando as fontes deixarem de ser
    // snapshots do legado, cada vista poderá pedir só a sua API sem alterar o router.
    const [lazyModuleLoaded, dataSourcesPrepared] = await Promise.all([
      preloadViewModule(requested),
      prepareViewData(requested)
    ]);

    // O chunk/dados podem chegar depois de outro clique. O token impede que uma
    // navegação antiga volte a ganhar prioridade visual.
    if (token !== this.navigationToken) {
      return { ok:true, view:requested, lazyModuleLoaded, dataSourcesPrepared };
    }

    this.runtime.activateLegacyView(requested.legacyViewId);
    this.runtime.setHash(requested.id);
    this.runtime.closeDrawer?.();

    // Compatibilidade temporária: enquanto os módulos ainda renderizam pela camada
    // antiga, mantém-se refreshAll através do adaptador. Esta chamada será removida
    // módulo a módulo à medida que cada vista consumir diretamente o data registry.
    await this.runtime.refresh?.();
    requestAnimationFrame(() => this.runtime.resizeVisibleCharts?.());

    return { ok:true, view:requested, lazyModuleLoaded, dataSourcesPrepared };
  }

  cancelPendingNavigation(): void {
    this.navigationToken++;
  }
}
