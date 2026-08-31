import type { ModernModule } from '../core/module-registry';
import { financialsData } from '../data/financials-service';
import { resolveFinancialViewContext } from '../revenue/financial-view-context';
import { ensureUsaliReconciliation } from './pl-usali-reconciliation-loader';

type LegacyPlWindow=Window&{plRender?:()=>unknown;plCurrentTab?:string};
let mountedRoot:HTMLElement|null=null;

async function renderLegacyUsali(root:HTMLElement):Promise<void>{
  const financials=await financialsData(false);
  const context=resolveFinancialViewContext(financials);
  await ensureUsaliReconciliation();
  const w=window as LegacyPlWindow;
  try{w.plRender?.();}catch(error){console.error('[VG Modern] P&L USALI',error);}
  root.dataset.vgModernUsali='ready';
  root.dataset.vgModernUsaliHotels=String(context.activeHotels.length);
  root.dataset.vgModernUsaliPreviousYear=context.previousYear;
  root.dataset.vgModernUsaliCurrentYear=context.currentYear;
}

const plUsali:ModernModule={
  id:'pl-usali',
  async mount(root){mountedRoot=root;await renderLegacyUsali(root);},
  unmount(){if(mountedRoot){delete mountedRoot.dataset.vgModernUsali;delete mountedRoot.dataset.vgModernUsaliHotels;delete mountedRoot.dataset.vgModernUsaliPreviousYear;delete mountedRoot.dataset.vgModernUsaliCurrentYear;mountedRoot=null;}}
};

export default plUsali;
