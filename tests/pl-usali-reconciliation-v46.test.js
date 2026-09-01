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
assert(patch.includes('gopSemSedeTotal'),'USALI deve obter GOP sem sede por hotel/seleção');
assert(patch.includes('gopComSedeTotal'),'USALI deve obter GOP com sede por hotel/seleção');
assert(patch.includes('(-) Imputações / Custos de Sede'),'USALI deve apresentar explicitamente as imputações de sede');
assert(patch.includes('GOP COM SEDE'),'USALI deve apresentar explicitamente o GOP com sede');
assert(patch.includes("data-vg-head-office")||patch.includes("dataset.vgHeadOffice"),'linhas de sede devem ser identificáveis no DOM');
assert(main.includes('ensureUsaliReconciliation'),'preview moderno deve ativar a reconciliação');

const base={A:{ALOJAMENTO:60,ALIMENTACAO:20,DIVERSOS:5},B:{ALOJAMENTO:25,ALIMENTACAO:10,DIVERSOS:5}};
const ops={
  A:{'Receita Total':100,'Receita Alojamento':60,'Receita FB':20,'GOP sem sede':40,'GOP com sede':35},
  B:{'Receita Total':50,'Receita Alojamento':25,'Receita FB':10,'GOP sem sede':20,'GOP com sede':17}
};
let active=['A','B'];
const ctx={console,CustomEvent:function(){},getActiveHotels:()=>active.slice()};
ctx.window=ctx;ctx.dispatchEvent=()=>{};
ctx.RAW={hotels_ops:{
  A:{'Receita Total':{'2026':100},'Receita Alojamento':{'2026':60},'Receita FB':{'2026':20},'GOP sem sede':{'2026':40},'GOP com sede':{'2026':35}},
  B:{'Receita Total':{'2026':50},'Receita Alojamento':{'2026':25},'Receita FB':{'2026':10},'GOP sem sede':{'2026':20},'GOP com sede':{'2026':17}}
}};
ctx.VG={modernFinancials:{context:()=>({activeHotels:['B']}),officialRevenue:()=>999,sum:()=>999}};
ctx.plSumRev=(field,year,hotels)=>(hotels||ctx.getActiveHotels()).reduce((s,h)=>s+(base[h]?.[field]||0),0);
ctx.plSumOps=(field,year,hotels)=>(hotels||ctx.getActiveHotels()).reduce((s,h)=>s+(ops[h]?.[field]||0),0);
ctx.plSum=(field,year,hotels)=>0;
ctx.getNopValue=()=>999;
vm.createContext(ctx);vm.runInContext(patch,ctx);
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026'),85,'Alojamento deve usar dados vivos do filtro atual');
assert.strictEqual(ctx.plSumRev('ALIMENTACAO','2026'),30,'F&B deve usar dados vivos do filtro atual');
assert.strictEqual(ctx.plSumRev('DIVERSOS','2026'),35,'Outros deve reconciliar com Receita Total viva');
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026')+ctx.plSumRev('ALIMENTACAO','2026')+ctx.plSumRev('DIVERSOS','2026'),150,'Total USALI deve coincidir com Receita Total do mesmo filtro');
assert.strictEqual(ctx.getNopValue('A','2026'),5,'hotel A deve usar apenas a sua imputação de sede');
assert.strictEqual(ctx.getNopValue('B','2026'),3,'hotel B deve usar apenas a sua imputação de sede');
active=['A'];
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026'),60,'mudança de filtro deve refletir-se sem cache');
assert.strictEqual(ctx.plSumRev('ALIMENTACAO','2026'),20,'mudança de filtro deve refletir-se no F&B');
assert.strictEqual(ctx.plSumRev('DIVERSOS','2026'),20,'Outros deve reconciliar após mudança de filtro');
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026')+ctx.plSumRev('ALIMENTACAO','2026')+ctx.plSumRev('DIVERSOS','2026'),100,'Total USALI deve acompanhar imediatamente o filtro ativo');
assert.strictEqual(ctx.getNopValue('A','2026'),5,'seleção de um hotel preserva o custo de sede real desse hotel');
console.log('✓ USALI: Receita Total, filtros, imputações de sede e GOP com sede usam valores vivos por hotel');
