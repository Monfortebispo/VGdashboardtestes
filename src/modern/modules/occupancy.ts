import type { ModernModule } from '../core/module-registry';
import { legacyView } from '../core/legacy-bridge';

const occupancy: ModernModule = {
  id: 'occupancy',
  mount() {
    legacyView('ocupacao');
  }
};

export default occupancy;
