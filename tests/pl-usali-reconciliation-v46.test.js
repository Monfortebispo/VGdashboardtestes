const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const patch=fs.readFileSync(path.join(root,'assets/js/modules/pl-usali-reconciliation-v46.js'),'utf8');
const parser=fs.readFileSync(path.join(root,'assets/js/core/01-data-import.js'),'utf8');
const usali=fs.readFileSync(path.join(root,'assets/js/modules/pl-usali.js'),'utf8');
const main=fs.readFileSync(path.join(root,'src/modern/main.ts'),'utf8');

assert(parser.includes("'DRHP'"),'parser deve preservar DRHP como receita');
assert(usali.includes("plSumRev('DIVERSOS'"),'USALI mantém a classificação Outros Departamentos');
assert(patch.includes("['Receita Total']"),'reconciliação deve usar Receita Total oficial');
assert(main.includes('ensureUsaliReconciliation'),'preview moderno deve ativar a reconciliação');

const ctx={console,CustomEvent:function(){},RAW:{hotels_ops:{A:{'Receita Total':{'2026':100}},B:{'Receita Total':{'2026':50}}}},getActiveHotels:()=>['A','B']};
ctx.window=ctx;ctx.dispatchEvent=()=>{};
const base={A:{ALOJAMENTO:60,ALIMENTACAO:20,DIVERSOS:5},B:{ALOJAMENTO:25,ALIMENTACAO:10,DIVERSOS:5}};
ctx.plSumRev=(field,year,hotels)=>(hotels||ctx.getActiveHotels()).reduce((s,h)=>s+(base[h]?.[field]||0),0);
vm.createContext(ctx);vm.runInContext(patch,ctx);
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026'),85,'Alojamento não deve ser alterado');
assert.strictEqual(ctx.plSumRev('ALIMENTACAO','2026'),30,'F&B não deve ser alterado');
assert.strictEqual(ctx.plSumRev('DIVERSOS','2026'),35,'Outros deve absorver receita operacional não classificada');
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026')+ctx.plSumRev('ALIMENTACAO','2026')+ctx.plSumRev('DIVERSOS','2026'),150,'Total USALI deve reconciliar com Receita Total oficial');
console.log('✓ USALI V46: Receita Total e classificação departamental reconciliadas');
