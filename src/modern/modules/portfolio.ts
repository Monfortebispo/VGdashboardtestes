import type { ModernModule } from '../core/module-registry';
import { portfolioController } from '../portfolio/portfolio-controller';
import { clearPortfolioReadOnly, renderPortfolioReadOnly } from '../portfolio/portfolio-renderer';

let mountedRoot:HTMLElement|undefined;

const portfolio:ModernModule = {
  id:'portfolio',
  async mount(root){
    mountedRoot=root;
    const prepared=await portfolioController.prepare();
    root.dataset.modernPortfolio='ready';
    root.dataset.modernPortfolioAvailable=String(prepared.diagnostics.available);
    root.dataset.modernPortfolioSections=String(prepared.diagnostics.sections);
    root.dataset.modernPortfolioRecords=String(prepared.diagnostics.approxRecords);
    renderPortfolioReadOnly(root,prepared.selection);
  },
  unmount(){
    if(mountedRoot)clearPortfolioReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default portfolio;
