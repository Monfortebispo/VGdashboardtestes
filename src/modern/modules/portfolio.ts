import type { ModernModule } from '../core/module-registry';
import { legacyView } from '../core/legacy-bridge';

const portfolio: ModernModule = {
  id: 'portfolio',
  mount() {
    legacyView('resumo');
  }
};

export default portfolio;
