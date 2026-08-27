const fs=require('fs');
const assert=require('assert');

const moduleCode=fs.readFileSync('src/modern/modules/costs.ts','utf8');
const modelCode=fs.readFileSync('src/modern/data/costs-model.ts','utf8');
const rendererCode=fs.readFileSync('src/modern/costs/costs-renderer.ts','utf8');
const bootstrap=fs.readFileSync('assets/js/ui/modern-preview-bootstrap.js','utf8');

assert(!moduleCode.includes('legacyView('),'Custos moderno não deve chamar legacyView');
assert(!moduleCode.includes('setView('),'Custos moderno não deve chamar setView');
assert(moduleCode.includes('costsController.prepare'),'Custos deve usar controlador próprio');
assert(moduleCode.includes('costsState.subscribe'),'Custos deve reagir ao estado próprio');
assert(modelCode.includes('normalizeCosts'),'Custos deve normalizar a fonte financeira');
assert(rendererCode.includes("data-modern-costs-readonly")||rendererCode.includes("modernCostsReadonly"),'Custos deve ter renderer próprio');
assert(rendererCode.includes('Todos os hotéis'),'Renderer deve disponibilizar filtro de hotel');
assert(rendererCode.includes('Todas as rubricas'),'Renderer deve disponibilizar filtro de rubrica');
assert(bootstrap.includes("'custos'"),'Custos deve estar ativo no modo moderno seletivo');
console.log('✓ modern costs source');
