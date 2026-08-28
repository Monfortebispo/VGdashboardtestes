const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const modelPath=path.join(ROOT,'src/modern/data/reputation-model.ts');
const rendererPath=path.join(ROOT,'src/modern/reputation/reputation-renderer.ts');
const modulePath=path.join(ROOT,'src/modern/modules/reputation.ts');
const model=fs.readFileSync(modelPath,'utf8');
const renderer=fs.readFileSync(rendererPath,'utf8');
const mod=fs.readFileSync(modulePath,'utf8');

// Paridade de dados: cada resumo ReviewPro mantém as dimensões que existem no legado.
[
  'reviewsDelta','griDelta','griGoal','managementResponse','cqi','rankVG',
  'departments','sources','negativeCategories','positiveCategories'
].forEach(field=>assert(model.includes(field),`campo de reputação em falta: ${field}`));

assert(model.includes('departmentMetrics(record.depts)'),'departamentos devem continuar dentro do resumo do hotel/período');
assert(model.includes('sourceMetrics(record.srcList)'),'origens devem continuar dentro do resumo do hotel/período');
assert(model.includes('categoryMetrics(record.negCats)')&&model.includes('categoryMetrics(record.posCats)'),'categorias positivas/negativas devem ser preservadas');
assert(model.includes('latestReputationRecordsByHotel'),'modo Mais recente deve ser calculável por hotel, não por uma única semana global');
assert(model.includes("const key=`${r.hotel}|${r.period}`"),'deduplicação deve continuar a ser hotel + período');

// Primeiros blocos visuais preparados, ainda sem substituir o legacy.
['Ranking GRI','Resultados por origem','Departamentos','Evolução temporal','GRI médio','Resposta da gestão'].forEach(label=>assert(renderer.includes(label),`bloco de paridade em falta: ${label}`));
assert(renderer.includes('latestReputationRecordsByHotel(hotelFiltered)'),'filtro Mais recente deve escolher o último período de cada hotel');

// Segurança de rollout: a modernização continua sem substituir a vista legacy até validação de paridade.
assert(mod.includes('hideLegacyView'),'módulo moderno mantém isolamento explícito e não deve ser ativado implicitamente');
console.log('✓ reputação moderna: modelo e primeiros blocos de paridade preparados sem substituir a vista legacy');
