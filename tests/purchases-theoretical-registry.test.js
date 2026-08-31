const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const controller=fs.readFileSync(path.join(root,'src/modern/purchases/theoretical-controller.ts'),'utf8');
const source=fs.readFileSync(path.join(root,'src/modern/data/legacy-data-sources.ts'),'utf8');
const model=fs.readFileSync(path.join(root,'src/modern/data/purchases-model.ts'),'utf8');
const moduleCode=fs.readFileSync(path.join(root,'src/modern/modules/purchases.ts'),'utf8');

assert(controller.includes("ensureDataSource<PurchasesSourceSnapshot>('purchases'"),'Consumo Teórico deve carregar pela fonte tipada purchases.');
assert(!controller.includes('theoreticalData?.()'),'Controller moderno não deve ler diretamente theoreticalData legacy.');
assert(source.includes('theoreticalData:{matched,unmatched,ingredients}'),'Snapshot purchases deve transportar o payload teórico, não apenas contagens.');
assert(model.includes('theoreticalData:PurchasesTheoryPayload'),'Contrato tipado purchases deve expor o payload teórico.');
assert(!moduleCode.includes('domains33?.renderAB'),'Módulo purchases não deve forçar rerender legacy do A&B.');
assert(moduleCode.includes('refreshFromSource()'),'Alterações de dados devem invalidar e recarregar a fonte moderna.');

console.log('✓ purchases theoretical registry migration');
