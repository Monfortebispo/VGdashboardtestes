const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const modelPath=path.join(ROOT,'src/modern/data/reputation-model.ts');
const rendererPath=path.join(ROOT,'src/modern/reputation/reputation-renderer.ts');
const modulePath=path.join(ROOT,'src/modern/modules/reputation.ts');
const servicePath=path.join(ROOT,'src/modern/data/reputation-service.ts');
const bridgePath=path.join(ROOT,'assets/js/modules/reputation-modern-bridge-v40.js');
const model=fs.readFileSync(modelPath,'utf8');
const renderer=fs.readFileSync(rendererPath,'utf8');
const mod=fs.readFileSync(modulePath,'utf8');
const service=fs.readFileSync(servicePath,'utf8');
const bridge=fs.readFileSync(bridgePath,'utf8');

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

// Paridade regional: a vista moderna respeita a região global exatamente como o legacy.
assert(bridge.includes('context:context'),'bridge deve expor contexto regional');
assert(bridge.includes("typeof activeRegion!=='undefined'"),'bridge deve ler a região global ativa');
assert(bridge.includes('REGIOES[region]'),'bridge deve expor os hotéis da região ativa');
assert(service.includes('scopedSnapshot'),'serviço moderno deve aplicar o recorte regional');
assert(service.includes('matchesRegionHotel'),'serviço deve associar nomes de hotel de forma tolerante');
assert(service.includes("ctx.region==='todos'"),'Todos deve manter o conjunto completo');

// Paridade visual preparada sem substituir ainda a vista legacy.
[
  'Ranking GRI','Resultados por origem','Departamentos','Evolução temporal',
  'GRI médio','Resposta da gestão','Detalhe por unidade e semana',
  'Categorias negativas','Categorias positivas','Gráficos de reputação'
].forEach(label=>assert(renderer.includes(label),`bloco de paridade em falta: ${label}`));
assert(renderer.includes('latestReputationRecordsByHotel(hotelFiltered)'),'filtro Mais recente deve escolher o último período de cada hotel');
assert(renderer.includes("chartCard('GRI por hotel'"),'gráfico GRI deve existir');
assert(renderer.includes("chartCard('Resultados por origem'"),'gráfico por origem deve existir');
assert(renderer.includes("chartCard('Departamentos'"),'gráfico de departamentos deve existir');
assert(renderer.includes("chartCard('Evolução GRI'"),'gráfico de evolução deve existir');
assert(renderer.includes('r.negativeCategories.map')&&renderer.includes('r.positiveCategories.map'),'detalhe semanal deve mostrar categorias positivas e negativas');
assert(renderer.includes('r.sources.map')&&renderer.includes('r.departments.map'),'detalhe semanal deve mostrar origens e departamentos');

// Segurança de rollout: a modernização continua sem substituir a vista legacy até validação de paridade.
assert(mod.includes('hideLegacyView'),'módulo moderno mantém isolamento explícito e não deve ser ativado implicitamente');
console.log('✓ reputação moderna: dados, região, gráficos e detalhe semanal preparados sem substituir a vista legacy');
