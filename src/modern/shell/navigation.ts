import { VIEW_CATALOG, type ViewDefinition } from '../core/view-catalog';
import type { ModernViewRouter } from '../core/view-router';

export interface NavigationGroup {
  name: string;
  items: ViewDefinition[];
}

export function navigationGroups(): NavigationGroup[] {
  const groups = new Map<string, ViewDefinition[]>();
  for (const view of VIEW_CATALOG) {
    const items = groups.get(view.group) || [];
    items.push(view);
    groups.set(view.group, items);
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
}

export interface NavigationController {
  go(viewId: string): Promise<void>;
  search(query: string): ViewDefinition[];
}

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function createNavigationController(router: ModernViewRouter): NavigationController {
  return {
    async go(viewId) {
      await router.navigate(viewId);
    },
    search(query) {
      const q = normalized(query);
      if (!q) return [...VIEW_CATALOG];
      return VIEW_CATALOG.filter(view => normalized(`${view.label} ${view.group} ${view.id}`).includes(q));
    }
  };
}
