import { loadModule, type ModernModule } from './module-registry';
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
  viewRoot?(viewId:string): HTMLElement | null;
  setHash(viewId: string): void;
  closeDrawer?(): void;
  refreshView?(viewId:string): boolean | Promise<boolean>;
  refresh?(): void | Promise<void>;
  resizeVisibleCharts?(): void;
  showToast?(message: string, error?: boolean): void;
}

export interface NavigationMetrics {
  view:string;
  elapsedMs:number;
  dataSourcesPrepared:number;
  lazyModuleLoaded:boolean;
  modernModuleMounted:boolean;
  targetedRefresh:boolean;
  globalRefreshAvoided:boolean;
}

export type NavigateResult =
  | { ok:true; view:ViewDefinition; lazyModuleLoaded:boolean; dataSourcesPrepared:number; targetedRefresh:boolean; metrics:NavigationMetrics }
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

async function preloadViewModule(view: ViewDefinition): Promise<ModernModule|null> {
  if (!view.moduleId) return null;
  return loadModule(view.moduleId);
}

async function prepareViewData(view: ViewDefinition): Promise<number> {
  const sources = dataSourcesForView(view.id);
  await ensureDataSources(sources);
  return sources.length;
}

export class ModernViewRouter {
  private navigationToken = 0;
  private mountedModule:ModernModule|null = null;
  private readonly metrics:NavigationMetrics[]=[];

  constructor(private readonly runtime: ViewRuntime) {}

  async navigate(requestedId: string): Promise<NavigateResult> {
    const started=performance.now();
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

    const [module, dataSourcesPrepared] = await Promise.all([
      preloadViewModule(requested),
      prepareViewData(requested)
    ]);
    const lazyModuleLoaded=Boolean(module);

    if (token !== this.navigationToken) {
      const metrics=this.recordMetrics(requested,lazyModuleLoaded,dataSourcesPrepared,false,false,false,started);
      return { ok:true, view:requested, lazyModuleLoaded, dataSourcesPrepared, targetedRefresh:false, metrics };
    }

    this.runtime.activateLegacyView(requested.legacyViewId);
    this.runtime.setHash(requested.id);
    this.runtime.closeDrawer?.();

    let modernModuleMounted=false;
    if(this.mountedModule&&this.mountedModule!==module)await this.mountedModule.unmount?.();
    if(module){
      const root=this.runtime.viewRoot?.(requested.legacyViewId)||document.body;
      await module.mount?.(root);
      this.mountedModule=module;
      modernModuleMounted=true;
    } else {
      this.mountedModule=null;
    }

    // Um módulo moderno montado já atualiza apenas o próprio domínio e não deve
    // disparar refreshAll. Vistas ainda legadas tentam refresh seletivo e só
    // recorrem ao refresh global quando não existe alternativa.
    let targetedRefresh=modernModuleMounted;
    if(!modernModuleMounted)targetedRefresh=await this.runtime.refreshView?.(requested.legacyViewId)===true;
    const globalRefreshAvoided=targetedRefresh;
    if (!targetedRefresh) await this.runtime.refresh?.();
    requestAnimationFrame(() => this.runtime.resizeVisibleCharts?.());

    const metrics=this.recordMetrics(requested,lazyModuleLoaded,dataSourcesPrepared,modernModuleMounted,targetedRefresh,globalRefreshAvoided,started);
    return { ok:true, view:requested, lazyModuleLoaded, dataSourcesPrepared, targetedRefresh, metrics };
  }

  navigationMetrics():readonly NavigationMetrics[]{
    return this.metrics.slice();
  }

  private recordMetrics(view:ViewDefinition,lazyModuleLoaded:boolean,dataSourcesPrepared:number,modernModuleMounted:boolean,targetedRefresh:boolean,globalRefreshAvoided:boolean,started:number):NavigationMetrics{
    const metric:NavigationMetrics={
      view:view.id,
      elapsedMs:Number((performance.now()-started).toFixed(2)),
      dataSourcesPrepared,
      lazyModuleLoaded,
      modernModuleMounted,
      targetedRefresh,
      globalRefreshAvoided
    };
    this.metrics.push(metric);
    if(this.metrics.length>100)this.metrics.shift();
    return metric;
  }

  cancelPendingNavigation(): void {
    this.navigationToken++;
  }
}
