const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const model=fs.readFileSync(path.join(ROOT,'src/modern/data/reputation-model.ts'),'utf8');
const renderer=fs.readFileSync(path.join(ROOT,'src/modern/reputation/reputation-renderer.ts'),'utf8');
const mod=fs.readFileSync(path.join(ROOT,'src/modern/modules/reputation.ts'),'utf8');
const service=fs.readFileSync(path.join(ROOT,'src/modern/data/reputation-service.ts'),'utf8');
const bridge=fs.readFileSync(path.join(ROOT,'assets/js/modules/reputation-modern-bridge-v40.js'),'utf8');

[
  'reviewsDelta','griDelta','griGoal','managementResponse','cqi','rankVG',
  'departments','sources','negativeCategories','positiveCategories'
].forEach(field=>assert(model.includes(field),`campo de reputação em falta: ${field}`));
assert(model.includes('departmentMetrics(record.depts)'),'departamentos devem continuar dentro do resumo do hotel/período');
assert(model.includes('sourceMetrics(record.srcList)'),'origens devem continuar dentro do resumo do hotel/período');
assert(model.includes('categoryMetrics(record.negCats)')&&model.includes('categoryMetrics(record.posCats)'),'categorias devem ser preservadas');
assert(model.includes('latestReputationRecordsByHotel'),'Mais recente deve ser calculado por hotel');
assert(model.includes("const key=`${r.hotel}|${r.period}`"),'deduplicação deve continuar hotel + período');

assert(bridge.includes('context:context'),'bridge deve expor contexto regional');
assert(bridge.includes("typeof activeRegion!=='undefined'"),'bridge deve ler região global');
assert(bridge.includes('REGIOES[region]'),'bridge deve expor hotéis da região ativa');
assert(service.includes('scopedSnapshot')&&service.includes('matchesRegionHotel'),'serviço moderno deve aplicar recorte regional');

[
  'Reputação & Guest Experience','Ranking GRI','GRI por hotel','Evolução GRI',
  'GRI médio','Resposta gestão','Na meta','Detalhe por hotel',
  'Origens','Departamentos','Categorias negativas','Categorias positivas'
].forEach(label=>assert(renderer.includes(label),`bloco da nova reputação em falta: ${label}`));
assert(renderer.includes('latestReputationRecordsByHotel(records)')||renderer.includes('latestReputationRecordsByHotel('),'filtro Mais recente deve manter semântica por hotel');
assert(renderer.includes("id:'repChartRanking'")||renderer.includes("'repChartRanking'"),'gráfico de ranking deve existir');
assert(renderer.includes("'repChartEvolution'"),'gráfico de evolução deve existir');
assert(renderer.includes("indexAxis:'y'"),'ranking deve usar barras horizontais para legibilidade');
assert(renderer.includes("selection.hotel==='__all__'?'GRI médio':'GRI'"),'evolução global deve usar média e hotel específico deve usar GRI próprio');
assert(renderer.includes('record.sources.map')&&renderer.includes('record.departments.map'),'detalhe deve manter origens e departamentos');
assert(renderer.includes('record.negativeCategories.map')&&renderer.includes('record.positiveCategories.map'),'detalhe deve manter categorias');
assert(mod.includes('hideLegacyView'),'módulo moderno mantém isolamento explícito');
console.log('✓ reputação moderna reconstruída: dados, região, dashboard executiva e detalhe preservados');
