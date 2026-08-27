const fs=require('fs');
const path=require('path');
const assert=require('assert');

function read(p){return fs.readFileSync(path.join(__dirname,'..',p),'utf8');}

const moduleCode=read('src/modern/modules/portfolio.ts');
const modelCode=read('src/modern/data/portfolio-model.ts');
const rendererCode=read('src/modern/portfolio/portfolio-renderer.ts');

assert(!/legacyView\s*\(/.test(moduleCode),'Portefólio moderno não deve chamar legacyView');
assert(!/setView\s*\(/.test(moduleCode),'Portefólio moderno não deve chamar setView');
assert(!/refreshAll\s*\(/.test(moduleCode),'Portefólio moderno não deve chamar refreshAll');
assert(/portfolioState\.subscribe/.test(moduleCode),'Portefólio moderno deve reagir ao estado próprio');
assert(/portfolioController\.refresh/.test(moduleCode),'Portefólio moderno deve permitir refresh seletivo');
assert(/normalizePortfolioRecords/.test(modelCode),'Portefólio moderno deve normalizar os dados');
assert(/Geografia/.test(rendererCode),'Renderer deve disponibilizar filtro de geografia');
assert(/Hotel/.test(rendererCode),'Renderer deve disponibilizar filtro de hotel');
assert(/Período/.test(rendererCode),'Renderer deve disponibilizar filtro de período');
assert(/data-modern-portfolio-table|modernPortfolioTable/.test(rendererCode),'Renderer deve ter tabela moderna própria');

console.log('✓ modern portfolio source');
