import type { ModernModule } from '../core/module-registry';
import { financialsData } from '../data/financials-service';
import { ensureUsaliReconciliation } from './pl-usali-reconciliation-loader';

type LegacyPlWindow=Window&{plRender?:()=>unknown;plCurrentTab?:string};
let mountedRoot:HTMLElement|null=null;

async function renderLegacyUsali(root:HTMLElement):Promise<void>{
  await financialsData(false);
  await ensureUsaliReconciliation();
  const w=window as LegacyPlWindow;
  try{w.plRender?.();}catch(error){console.error('[VG Modern] P&L USALI',error);}
  root.dataset.vgModernUsali='ready';
}

const plUsali:ModernModule={
  id:'pl-usali',
  async mount(root){mountedRoot=root;await renderLegacyUsali(root);},
  unmount(){if(mountedRoot){delete mountedRoot.dataset.vgModernUsali;mountedRoot=null;}}
};

export default plUsali;
