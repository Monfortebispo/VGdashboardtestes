import type { ViewRuntime } from './view-router';

declare global {
  interface Window {
    vgAuthCurrent?: () => { role?: string } | null;
    vgAuthCanAccessModule?: (viewId: string) => boolean;
    vgAuthFirstAllowedModule?: () => string;
    drawerClose?: () => void;
    refreshAll?: () => void;
    showToast?: (message: string, error?: boolean) => void;
    VG?: {
      performance?: { resizeVisibleCharts?: () => void };
      occupancyModernBridge?: {
        refresh?: () => { ok:boolean; method:string; elapsedMs:number; error?:string };
      };
    };
  }
}

function activateLegacyView(viewId: string): void {
  document.querySelectorAll('.sb-nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`nav-${viewId}`)?.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  const fallback = document.getElementById('view-resumo');
  (target || fallback)?.classList.add('active');

  const empty = document.getElementById('emptyState');
  if (empty) {
    const independent = new Set([
      'agenda','compras','receitasdet','ab','housekeeping','reputacao','datacenter',
      'governance','backup','automaticreports','analyticalassistant','documents',
      'approvals','scenariocompare','hoteis'
    ]);
    const hidden = independent.has(viewId);
    if (hidden) empty.style.display = 'none';
    empty.classList.toggle('agenda-hidden', hidden);
  }
}

export function createLegacyRuntime(): ViewRuntime {
  let localCurrent = location.hash.replace(/^#/, '') || 'resumo';

  return {
    currentView: () => localCurrent,
    auth: () => window.vgAuthCurrent?.() || null,
    canAccessModule: viewId => window.vgAuthCanAccessModule?.(viewId) ?? true,
    firstAllowedModule: () => window.vgAuthFirstAllowedModule?.() || 'resumo',
    canUpload: () => ['direcao','admin'].includes(String(window.vgAuthCurrent?.()?.role || '').toLowerCase()),
    activateLegacyView(viewId) {
      localCurrent = viewId;
      activateLegacyView(viewId);
    },
    setHash(viewId) {
      history.replaceState(null, '', `#${viewId}`);
    },
    closeDrawer() {
      if (window.innerWidth <= 960) window.drawerClose?.();
    },
    refreshView(viewId) {
      if (viewId === 'ocupacao') {
        const result = window.VG?.occupancyModernBridge?.refresh?.();
        if (result?.ok) return true;
      }
      return false;
    },
    refresh() {
      window.refreshAll?.();
    },
    resizeVisibleCharts() {
      window.VG?.performance?.resizeVisibleCharts?.();
    },
    showToast(message, error) {
      window.showToast?.(message, error);
    }
  };
}
