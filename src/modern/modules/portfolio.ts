import type { ModernModule } from '../core/module-registry';
import { portfolioController } from '../portfolio/portfolio-controller';
import { clearPortfolioReadOnly, renderPortfolioReadOnly } from '../portfolio/portfolio-renderer';
import { portfolioState } from '../portfolio/portfolio-state';

let mountedRoot:HTMLElement|undefined;
let unsubscribe:(()=>void)|undefined;

function renderCurrent():void{
  if(!mountedRoot)return;
  renderPortfolioReadOnly(mountedRoot,portfolioState.current(),{
    onSelectionChange(next){portfolioController.setSelection(next);},
    async onRefresh(){await portfolioController.refresh();renderCurrent();}
  });
}

const portfolio:ModernModule = {
  id:'portfolio',
  async mount(root){
    mountedRoot=root;
    const prepared=await portfolioController.prepare();
    root.dataset.modernPortfolio='ready';
    root.dataset.modernPortfolioAvailable=String(prepared.diagnostics.available);
    root.dataset.modernPortfolioSections=String(prepared.diagnostics.sections);
    root.dataset.modernPortfolioRecords=String(prepared.diagnostics.approxRecords);
    unsubscribe?.();
    unsubscribe=portfolioState.subscribe(()=>renderCurrent());
    renderCurrent();
  },
  unmount(){
    unsubscribe?.();unsubscribe=undefined;
    if(mountedRoot)clearPortfolioReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default portfolio;
