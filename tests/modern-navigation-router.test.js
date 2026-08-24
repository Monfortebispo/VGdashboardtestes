const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const html = read('index.html');
const main = read('src/modern/main.ts');
const catalog = read('src/modern/core/view-catalog.ts');
const router = read('src/modern/core/view-router.ts');
const runtime = read('src/modern/core/legacy-runtime.ts');
const navigation = read('src/modern/shell/navigation.ts');
const legacyCore = read('assets/js/core/02-navigation-kpis.js');
const occupancyBridge = read('assets/js/modules/occupancy-modern-bridge-v40.js');
const ficha = read('assets/js/modules/ficha-hotel.js');

assert(!html.includes('src/modern/main.ts') && !html.includes('dist-modern/'), 'arquitetura moderna deve continuar desligada do index de produção');
assert(!html.includes('occupancy-modern-bridge-v40.js'), 'bridge de ocupação não pode ser ligado à produção nesta fase');
assert(main.includes("registerModule('portfolio'") && main.includes("registerModule('costs'") && main.includes("registerModule('approvals'"), 'módulos lazy essenciais devem estar registados');
assert(catalog.includes("id:'resumo'") && catalog.includes("id:'fichahotel'") && catalog.includes("access:'direction'"), 'catálogo deve cobrir vistas e políticas de acesso');
assert(router.includes('class ModernViewRouter') && router.includes('navigationToken') && router.includes('preloadViewModule'), 'router deve controlar concorrência e preload lazy');
assert(router.includes("reason:'forbidden'") && router.includes('firstAllowedModule'), 'router deve preservar fallback de autorização');
assert(router.includes('refreshView?.(requested.legacyViewId)') && router.includes('if (!targetedRefresh) await this.runtime.refresh?.()'), 'router deve preferir refresh seletivo e manter refreshAll apenas como fallback');
assert(runtime.includes("viewId === 'ocupacao'") && runtime.includes('occupancyModernBridge?.refresh'), 'ocupação deve usar refresh seletivo quando a bridge estiver disponível');
assert(occupancyBridge.includes("method:'occUpdateUI'") && occupancyBridge.includes('occRender'), 'bridge deve atualizar apenas a UI de ocupação');
assert(runtime.includes("document.querySelectorAll('.tab-content')") && runtime.includes('resizeVisibleCharts'), 'adaptador deve isolar DOM legado e resize');
assert(navigation.includes('navigationGroups') && navigation.includes('createNavigationController'), 'shell moderno deve ter navegação desacoplada do DOM');
assert(legacyCore.includes('function setView(v)') && legacyCore.includes('refreshAll();'), 'runtime legado deve permanecer disponível durante a migração');
assert(ficha.includes('ficha') || ficha.includes('Ficha'), 'Ficha Hotel deve continuar presente e intocada no runtime legado');

console.log('✓ arquitetura moderna: ocupação pode evitar refreshAll sem tocar na produção');
