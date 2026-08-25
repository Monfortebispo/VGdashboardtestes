import { portfolioData, portfolioDiagnostics, type PortfolioDiagnostics } from '../data/portfolio-service';
import { portfolioState, type PortfolioSelection } from './portfolio-state';

export interface PortfolioPreparation {
  selection:Readonly<PortfolioSelection>;
  diagnostics:PortfolioDiagnostics;
}

export class PortfolioController {
  setSelection(next:Partial<PortfolioSelection>):Readonly<PortfolioSelection>{
    return portfolioState.replace(next);
  }

  async prepare(force=false):Promise<PortfolioPreparation>{
    await portfolioData(force);
    const diagnostics=await portfolioDiagnostics(false);
    return {selection:portfolioState.current(),diagnostics};
  }

  async refresh():Promise<PortfolioPreparation>{
    return this.prepare(true);
  }
}

export const portfolioController=new PortfolioController();
