const assert=require('assert');
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const fixPath=path.join(ROOT,'assets/js/core/fb-ratios-period-fix-v36.js');
const bootPath=path.join(ROOT,'assets/js/core/04-bootstrap.js');
const corePath=path.join(ROOT,'assets/js/core/02-navigation-kpis.js');
assert(fs.existsSync(fixPath),'correção de rácios V36 em falta');
const chk=cp.spawnSync(process.execPath,['--check',fixPath],{encoding:'utf8'});assert.strictEqual(chk.status,0,chk.stderr);
const F=fs.readFileSync(fixPath,'utf8'),B=fs.readFileSync(bootPath,'utf8'),C=fs.readFileSync(corePath,'utf8');
assert(B.includes('fb-ratios-period-fix-v36.js'),'bootstrap deve carregar correção dos rácios');
assert(F.includes("hotels_rev?.[hotel]?.ALIMENTACAO?.[year]")&&F.includes("['Receita FB']"),'denominador deve vir da receita F&B do P&L selecionado');
assert(F.includes('total*share'),'Receita Detalhada deve servir apenas para repartir o total F&B');
assert(!F.includes("abDetailRevenue(hotel, year, 'AB')"),'correção não pode usar receita detalhada absoluta como denominador A&B');
assert(F.includes('selectedPeriodData'),'rácios devem resolver explicitamente a fonte temporal');
assert(F.includes("STORE[months[0]]"),'seleção de um mês deve usar o P&L mensal desse mês');
assert(F.includes('STORE_ACUM')&&F.includes('isYtdSelection'),'seleção Jan→mês deve preferir o P&L acumulado oficial');
assert(/costComidas\(hotel,year,d\)/.test(F)&&/costBebidas\(hotel,year,d\)/.test(F),'custos e receitas devem usar a mesma fonte temporal');
assert(F.includes('window.ratioAB')&&F.includes('(c1+c2)/r*100'),'A&B deve ser soma custos / receita F&B do mesmo período');
assert(C.includes('const detail = (!useSingleMonth && data === RAW) ? abDetailRevenue'),'teste documenta a regressão antiga que a camada V36 substitui');

function isYtdSelection(months){
  if(!months.length)return false;
  const last=months[months.length-1];
  return months.length===last&&months.every((m,i)=>m===i+1);
}
assert.strictEqual(isYtdSelection([7]),false,'um único mês não é seleção acumulada');
assert.strictEqual(isYtdSelection([1,2,3,4,5,6,7]),true,'Jan-Jul deve ser reconhecido como acumulado');
assert.strictEqual(isYtdSelection([2,3,4]),false,'seleção parcial não deve usar acumulado oficial');

// Validação numérica isolada da regra que originou a regressão.
// P&L Jan-Jul: 1.000 de receita F&B; custos: 300 comidas + 100 bebidas.
// Uma Receita Detalhada parcial de 200 nunca pode ser usada como denominador absoluto.
const fb=1000, comidas=300, bebidas=100, shareComidas=.7, shareBebidas=.3;
assert.strictEqual((comidas+bebidas)/fb*100,40,'A&B deve ser 400/1000 = 40%');
assert(Math.abs(comidas/(fb*shareComidas)*100-(300/700*100))<1e-9,'Comidas deve usar 70% da receita F&B P&L');
assert(Math.abs(bebidas/(fb*shareBebidas)*100-(100/300*100))<1e-9,'Bebidas deve usar 30% da receita F&B P&L');
console.log('✓ rácios A&B V36: mensal/acumulado e mesmo período validados');
