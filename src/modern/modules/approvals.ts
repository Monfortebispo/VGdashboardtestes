import type { ModernModule } from '../core/module-registry';
import { legacyView } from '../core/legacy-bridge';

const approvals: ModernModule = {
  id: 'approvals',
  mount() {
    legacyView('approvals');
  }
};

export default approvals;
