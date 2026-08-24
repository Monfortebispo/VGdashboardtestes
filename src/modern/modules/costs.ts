import type { ModernModule } from '../core/module-registry';
import { legacyView } from '../core/legacy-bridge';

const costs: ModernModule = {
  id: 'costs',
  mount() {
    legacyView('custos');
  }
};

export default costs;
