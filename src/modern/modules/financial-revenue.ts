import type { ModernModule } from '../core/module-registry';
import { financialsData } from '../data/financials-service';
import { renderFinancialRevenue } from '../revenue/financial-revenue-renderer';

declare global{
  interface Window{
    buildKPIs?:(targetId:string)=>void;
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
  window.buildKPIs?.('kpiGrid');
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
