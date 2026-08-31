const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const patch=fs.readFileSync(path.join(root,'assets/js/modules/pl-usali-reconciliation-v46.js'),'utf8');
const parser=fs.readFileSync(path.join(root,'assets/js/core/01-data-import.js'),'utf8');
const usali=fs.readFileSync(path.join(root,'assets/js/modules/pl-usali.js'),'utf8');
const main=fs.readFileSync(path.join(root,'src/modern/main.ts'),'utf8');

assert(parser.includes("'DRHP'"),'parser deve preservar DRHP como receita');
assert(usali.includes("plSumRev('DIVERSOS'"),'USALI mantém a classificação Outros Departamentos');
assert(patch.includes('modernFinancials'),'reconciliação deve usar a bridge financeira moderna');
assert(patch.includes('sharedContext'),'USALI deve usar o contexto financeiro partilhado');
assert(!patch.includes('RAW.hotels_ops'),'reconciliação moderna não deve voltar a ler Receita Total diretamente de RAW');
assert(main.includes('ensureUsaliReconciliation'),'preview moderno deve ativar a reconciliação');

const base={A:{ALOJAMENTO:60,ALIMENTACAO:20,DIVERSOS:5},B:{ALOJAMENTO:25,ALIMENTACAO:10,DIVERSOS:5}};
const ops={A:{'Receita Total':100},B:{'Receita Total':50}};
const ctx={console,CustomEvent:function(){},getActiveHotels:()=>['IGNORAR']};
ctx.window=ctx;ctx.dispatchEvent=()=>{};
ctx.VG={modernFinancials:{
  context:()=>({activeHotels:['A','B'],previousYear:'2025',currentYear:'2026'}),
  sum:(section,field,year,hotels)=>{
    if(section==='hotels_rev')return hotels.reduce((s,h)=>s+(base[h]?.[field]||0),0);
    if(section==='hotels_ops'&&field==='Receita Total')return hotels.reduce((s,h)=>s+(ops[h]?.[field]||0),0);
    return 0;
  },
  officialRevenue:(year,hotels)=>hotels.reduce((s,h)=>s+(ops[h]?.['Receita Total']||0),0)
}};
ctx.plSumRev=(field,year,hotels)=>(hotels||[]).reduce((s,h)=>s+(base[h]?.[field]||0),0);
ctx.plSumOps=(field,year,hotels)=>(hotels||[]).reduce((s,h)=>s+(ops[h]?.[field]||0),0);
vm.createContext(ctx);vm.runInContext(patch,ctx);
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026'),85,'Alojamento não deve ser alterado');
assert.strictEqual(ctx.plSumRev('ALIMENTACAO','2026'),30,'F&B não deve ser alterado');
assert.strictEqual(ctx.plSumRev('DIVERSOS','2026'),35,'Outros deve absorver receita operacional não classificada');
assert.strictEqual(ctx.plSumRev('ALOJAMENTO','2026')+ctx.plSumRev('ALIMENTACAO','2026')+ctx.plSumRev('DIVERSOS','2026'),150,'Total USALI deve reconciliar com Receita Total oficial');
console.log('✓ USALI: Receita Total e seleção de hotéis reconciliadas pelo contexto financeiro moderno');
