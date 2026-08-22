import type { ModernModule } from '../core/module-registry';
import { legacyView } from '../core/legacy-bridge';

const revenue: ModernModule = {
  id: 'revenue',
  mount() {
    legacyView('revenuehub');
  }
};

export default revenue;
