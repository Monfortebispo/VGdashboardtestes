import type { ModernModule } from '../core/module-registry';
import { financialsData } from '../data/financials-service';

declare global{
  interface Window{
    buildKPIs?:(targetId:string)=>void;
    updateContextPanel?:()=>void;
    buildChartsReceitas?:()=>void;
    buildRevTable?:()=>void;
    VG?:{market?:{syncMarketDataUi?:()=>void}}&Record<string,unknown>;
  }
}

let mountedRoot:HTMLElement|undefined;

async function render(force=false):Promise<void>{
  await financialsData(force);
  window.VG?.market?.syncMarketDataUi?.();
  window.buildKPIs?.('kpiGrid');
  window.updateContextPanel?.();
  window.buildChartsReceitas?.();
  window.buildRevTable?.();
  if(mountedRoot){mountedRoot.dataset.modernFinancialRevenue='ready';mountedRoot.dataset.modernFinancialRevenueRefresh=force?'forced':'cached';}
}

const financialRevenue:ModernModule={
  id:'financial-revenue',
  async mount(root){mountedRoot=root;await render(false);},
  unmount(){if(mountedRoot){delete mountedRoot.dataset.modernFinancialRevenue;delete mountedRoot.dataset.modernFinancialRevenueRefresh;}mountedRoot=undefined;}
};

export default financialRevenue;
