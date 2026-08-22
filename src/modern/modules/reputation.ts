import type { ModernModule } from '../core/module-registry';
import { legacyView } from '../core/legacy-bridge';

const reputation: ModernModule = {
  id: 'reputation',
  mount() {
    legacyView('reputacao');
  }
};

export default reputation;
