const assert=require('assert');
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const vm=require('vm');
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
assert(F.includes('window.ratioAB')&&F.includes('(c1+c2)/r*100'),'A&B deve ser soma custos / receita F&B do mesmo período');
assert(C.includes('const detail = (!useSingleMonth && data === RAW) ? abDetailRevenue'),'teste documenta a regressão antiga que a camada V36 substitui');

// Teste numérico da regressão: P&L Jan-Jul tem €1.000 de receita F&B e €400 de custos.
// Uma Receita Detalhada parcial de apenas €200 NÃO pode tornar o rácio 200%.
const sandbox={console};sandbox.window=sandbox;
sandbox.RAW={hotels_rev:{ALBACORA:{ALIMENTACAO:{2026:1000},COMIDA:{2026:null},BEBIDA:{2026:null}}},hotels_ops:{ALBACORA:{'Receita FB':{2026:1000}}}};
sandbox.costComidas=()=>300;sandbox.costBebidas=()=>100;
sandbox.abBestRevenueShare=(h,y,k)=>k==='COMIDA'?0.7:0.3;
sandbox.abDetailRevenue=()=>200; // fonte parcial que não pode ser usada como denominador absoluto.
vm.createContext(sandbox);vm.runInContext(F,sandbox,{filename:'fb-ratios-period-fix-v36.js'});
assert.strictEqual(sandbox.ratioAB('ALBACORA',2026),40,'A&B deve ser 400/1000 = 40%');
assert(Math.abs(sandbox.ratioComidas('ALBACORA',2026)-(300/700*100))<1e-9,'Comidas deve usar 70% da receita F&B P&L');
assert(Math.abs(sandbox.ratioBebidas('ALBACORA',2026)-(100/300*100))<1e-9,'Bebidas deve usar 30% da receita F&B P&L');
console.log('✓ rácios A&B V36: mesmo período validado numericamente; detalhe apenas reparte a receita');
