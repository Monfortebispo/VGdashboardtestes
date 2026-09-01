const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const patch=fs.readFileSync(path.join(root,'assets/js/modules/pl-usali-reconciliation-v46.js'),'utf8');
const parser=fs.readFileSync(path.join(root,'assets/js/core/01-data-import.js'),'utf8');
const usali=fs.readFileSync(path.join(root,'assets/js/modules/pl-usali.js'),'utf8');
const main=fs.readFileSync(path.join(root,'src/modern/main.ts'),'utf8');

assert(parser.includes("'DRHP'"),'parser deve preservar DRHP como receita');
assert(usali.includes("plSumRev('DIVERSOS'"),'USALI mantém a classificação Outros Departamentos');
assert(patch.includes('getActiveHotels'),'USALI deve respeitar a seleção viva de hotéis');
assert(!patch.includes('modernFinancials'),'USALI não deve usar snapshot/cache financeira que possa estar fora do período ativo');
assert(main.includes('ensureUsaliReconciliation'),'preview moderno deve ativar a reconciliação');

const base={A:{ALOJAMENTO:60,ALIMENTACAO:20,DIVERSOS:5},B:{ALOJAMENTO:25,ALIMENTACAO:10,DIVERSOS:5}};
const ops={
  A:{'Receita Total':100,'Receita Alojamento':60,'Receita FB':20},
  B:{'Receita Total':50,'Receita Alojamento':25,'Receita FB':10}
};
let active=['A','B'];
const ctx={console,CustomEvent:function(){},getActiveHotels:()=>active.slice()};
ctx.window=ctx;ctx.dispatchEvent=()=>{};
// Snapshot moderna propositadamente errada/stale: o reconciliador deve ignorá-la.
ctx.VG={modernFinancials:{context:()=>({activeHotels:['B']}),officialRevenue:()=>999,sum:()=>999}};
ctx.plSumRev=(field,year,hotels)=>(hotels||ctx.getActiveHotels()).reduce((s,h)=>s+(base[h]?.[field]||0),0);
ctx.plSumOps=(field,year,hotels)=>(hotels||ctx.getActiveHotels()).reduce((s,h)=>s+(ops[h]?.[field]||0),0);
ctx.plSum=(field,year,hotels)=>0;
vm.createContext(ctx);vm.runInContext(patch,ctx);
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026'),85,'Alojamento deve usar dados vivos do filtro atual');
assert.strictEqual(ctx.plSumRev('ALIMENTACAO','2026'),30,'F&B deve usar dados vivos do filtro atual');
assert.strictEqual(ctx.plSumRev('DIVERSOS','2026'),35,'Outros deve reconciliar com Receita Total viva');
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026')+ctx.plSumRev('ALIMENTACAO','2026')+ctx.plSumRev('DIVERSOS','2026'),150,'Total USALI deve coincidir com Receita Total do mesmo filtro');
active=['A'];
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026'),60,'mudança de filtro deve refletir-se sem cache');
assert.strictEqual(ctx.plSumRev('ALIMENTACAO','2026'),20,'mudança de filtro deve refletir-se no F&B');
assert.strictEqual(ctx.plSumRev('DIVERSOS','2026'),20,'Outros deve reconciliar após mudança de filtro');
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026')+ctx.plSumRev('ALIMENTACAO','2026')+ctx.plSumRev('DIVERSOS','2026'),100,'Total USALI deve acompanhar imediatamente o filtro ativo');
console.log('✓ USALI: Receita Total, hotéis e período usam a fonte financeira viva, sem snapshot stale');
