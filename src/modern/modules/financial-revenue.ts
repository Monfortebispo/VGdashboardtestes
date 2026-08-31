import type { ModernModule } from '../core/module-registry';
import { financialsData } from '../data/financials-service';
import { renderFinancialRevenue } from '../revenue/financial-revenue-renderer';
import { renderFinancialKpis } from '../revenue/financial-kpi-renderer';
import { renderFinancialContextPanel } from '../revenue/financial-context-renderer';

type RevenueWindow=Window&{
  VG?:Window['VG']&{
    market?:{syncMarketDataUi?:()=>void};
  };
};

let mountedRoot:HTMLElement|undefined;
let contextPanel:HTMLElement|undefined;
let lastFinancials:Awaited<ReturnType<typeof financialsData>>|undefined;
let contextClickHandler:((event:Event)=>void)|undefined;

function bindContextPanel():void{
  const panel=document.getElementById('contextPanel');
  if(!panel||panel===contextPanel)return;
  if(contextPanel&&contextClickHandler)contextPanel.removeEventListener('click',contextClickHandler,true);
  contextPanel=panel;
  contextClickHandler=()=>{if(!lastFinancials)return;setTimeout(()=>renderFinancialContextPanel(lastFinancials!),0);};
  contextPanel.addEventListener('click',contextClickHandler,true);
}

async function render(force=false):Promise<void>{
  const financials=await financialsData(force);
  lastFinancials=financials;
  const w=window as RevenueWindow;
  w.VG?.market?.syncMarketDataUi?.();
  renderFinancialKpis(financials,'kpiGrid');
  renderFinancialContextPanel(financials);
  bindContextPanel();
  renderFinancialRevenue(financials);
  if(mountedRoot){mountedRoot.dataset.modernFinancialRevenue='ready';mountedRoot.dataset.modernFinancialRevenueRefresh=force?'forced':'cached';}
}

const financialRevenue:ModernModule={
  id:'financial-revenue',
  async mount(root){mountedRoot=root;await render(false);},
  unmount(){
    if(mountedRoot){delete mountedRoot.dataset.modernFinancialRevenue;delete mountedRoot.dataset.modernFinancialRevenueRefresh;}
    if(contextPanel&&contextClickHandler)contextPanel.removeEventListener('click',contextClickHandler,true);
    contextPanel=undefined;contextClickHandler=undefined;lastFinancials=undefined;mountedRoot=undefined;
  }
};

export default financialRevenue;
