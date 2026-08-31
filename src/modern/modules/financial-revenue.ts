import type { ModernModule } from '../core/module-registry';
import { financialsData } from '../data/financials-service';
import { renderFinancialRevenue } from '../revenue/financial-revenue-renderer';
import { renderFinancialKpis } from '../revenue/financial-kpi-renderer';

declare global{
  interface Window{
    updateContextPanel?:()=>void;
  }
}

type RevenueWindow=Window&{
  VG?:Window['VG']&{
    market?:{syncMarketDataUi?:()=>void};
  };
};

let mountedRoot:HTMLElement|undefined;

async function render(force=false):Promise<void>{
  const financials=await financialsData(force);
  const w=window as RevenueWindow;
  w.VG?.market?.syncMarketDataUi?.();
  renderFinancialKpis(financials,'kpiGrid');
  window.updateContextPanel?.();
  renderFinancialRevenue(financials);
  if(mountedRoot){mountedRoot.dataset.modernFinancialRevenue='ready';mountedRoot.dataset.modernFinancialRevenueRefresh=force?'forced':'cached';}
}

const financialRevenue:ModernModule={
  id:'financial-revenue',
  async mount(root){mountedRoot=root;await render(false);},
  unmount(){if(mountedRoot){delete mountedRoot.dataset.modernFinancialRevenue;delete mountedRoot.dataset.modernFinancialRevenueRefresh;}mountedRoot=undefined;}
};

export default financialRevenue;
