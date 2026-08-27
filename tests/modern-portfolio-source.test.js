const fs=require('fs');
const path=require('path');

function read(p){return fs.readFileSync(path.join(__dirname,'..',p),'utf8');}

test('Portefólio moderno não depende da navegação legada',()=>{
  const module=read('src/modern/modules/portfolio.ts');
  expect(module).not.toMatch(/legacyView\s*\(/);
  expect(module).not.toMatch(/setView\s*\(/);
  expect(module).not.toMatch(/refreshAll\s*\(/);
  expect(module).toMatch(/portfolioState\.subscribe/);
  expect(module).toMatch(/portfolioController\.refresh/);
});

test('Portefólio moderno tem normalização e filtros próprios',()=>{
  const model=read('src/modern/data/portfolio-model.ts');
  const renderer=read('src/modern/portfolio/portfolio-renderer.ts');
  expect(model).toMatch(/normalizePortfolioRecords/);
  expect(renderer).toMatch(/Geografia/);
  expect(renderer).toMatch(/Hotel/);
  expect(renderer).toMatch(/Período/);
  expect(renderer).toMatch(/data-modern-portfolio-table|modernPortfolioTable/);
});
