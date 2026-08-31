import { loadModule, registerModule, type ModernModuleId } from './core/module-registry';
import { createLegacyRuntime } from './core/legacy-runtime';
import { ModernViewRouter } from './core/view-router';
import { createNavigationController, navigationGroups } from './shell/navigation';
import { registerLegacyDataSources } from './data/legacy-data-sources';
import { dataRegistryStats, invalidateData } from './data/data-registry';
import { viewDataPlan } from './data/view-data-plan';
import { installFinancialsBridge } from './data/financials-bridge';
import { ensureUsaliReconciliation } from './modules/pl-usali-reconciliation-loader';

registerModule('shell',async()=>({id:'shell',mount(root){root.dataset.vgModernShell='ready';},unmount(){}}));
registerModule('portfolio',async()=>(await import('./modules/portfolio')).default);
registerModule('occupancy',async()=>(await import('./modules/occupancy')).default);
registerModule('reputation',async()=>(await import('./modules/reputation')).default);
registerModule('revenue',async()=>(await import('./modules/revenue')).default);
registerModule('financial-revenue',async()=>(await import('./modules/financial-revenue')).default);
registerModule('costs',async()=>(await import('./modules/costs')).default);
registerModule('pl-usali',async()=>(await import('./modules/pl-usali')).default);
registerModule('approvals',async()=>(await import('./modules/approvals')).default);
registerModule('city-ledger',async()=>(await import('./modules/city-ledger')).default);
registerModule('purchases',async()=>(await import('./modules/purchases')).default);
registerLegacyDataSources();
installFinancialsBridge();
void ensureUsaliReconciliation();
const runtime=createLegacyRuntime();export const modernViewRouter=new ModernViewRouter(runtime);export const modernNavigation=createNavigationController(modernViewRouter);
export async function openModernModule(id:ModernModuleId):Promise<void>{const mod=await loadModule(id);await mod.mount?.(document.body);}export function resetModernDataCache():void{invalidateData();}
export const modernArchitecture=Object.freeze({status:'isolated',version:10,lazyModules:['portfolio','occupancy','reputation','revenue','financial-revenue','costs','pl-usali','approvals','city-ledger','purchases'] as const,navigationGroups:navigationGroups().map(group=>({name:group.name,views:group.items.map(item=>item.id)})),dataPlan:viewDataPlan(),dataStats:dataRegistryStats,navigationMetrics:()=>modernViewRouter.navigationMetrics()});
type PreviewWindow=Window&{VG?:Record<string,unknown>&{modernPreview?:{router:ModernViewRouter;navigation:typeof modernNavigation;architecture:typeof modernArchitecture;resetDataCache:typeof resetModernDataCache;};};};
const previewWindow=window as PreviewWindow;previewWindow.VG=previewWindow.VG||{};previewWindow.VG.modernPreview={router:modernViewRouter,navigation:modernNavigation,architecture:modernArchitecture,resetDataCache:resetModernDataCache};window.dispatchEvent(new CustomEvent('vg-modern-preview-ready'));
