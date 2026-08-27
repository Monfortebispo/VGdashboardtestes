const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

const registry=read('src/modern/data/data-registry.ts');
const plan=read('src/modern/data/view-data-plan.ts');
const legacy=read('src/modern/data/legacy-data-sources.ts');
const router=read('src/modern/core/view-router.ts');
const main=read('src/modern/main.ts');
const html=read('index.html');

assert(/const\s+inflight\s*=\s*new\s+Map/.test(registry)&&registry.includes('isFresh')&&registry.includes('invalidateData'),'data registry deve ter cache, deduplicação e invalidação');
assert(/Promise\.all\s*\(\s*ids\.map/.test(registry),'fontes independentes devem poder carregar em paralelo');
assert(/resumo\s*:\s*\['core','portfolio'\]/.test(plan),'Portefólio deve declarar apenas core e a fonte portfolio dedicada');
assert(/revenuehub\s*:\s*\['core','revenue','occupancy'\]/.test(plan),'Revenue deve ter plano de dados próprio');
assert(/reputacao\s*:\s*\['core','reputation'\]/.test(plan),'Reputação não deve depender do pacote financeiro');
assert(/ocupacao\s*:\s*\['core','occupancy'\]/.test(plan),'Ocupação deve ter fonte dedicada');
assert(!/\bfetch\s*\(/.test(legacy),'adaptadores legados desta fase não podem criar tráfego de rede');
assert(legacy.includes('registerLegacyDataSources')&&legacy.includes('TTL'),'adaptadores devem declarar cache temporal por fonte');
assert(router.includes('prepareViewData')&&/Promise\.all\s*\(\s*\[/.test(router),'router deve preparar chunk e dados em paralelo');
assert(/await\s+this\.runtime\.refresh\?\.\(\)/.test(router),'refresh legado deve permanecer temporariamente para paridade funcional');
assert(main.includes('registerLegacyDataSources()')&&/dataPlan\s*:\s*viewDataPlan\(\)/.test(main),'runtime moderno isolado deve expor o plano seletivo');
assert(!html.includes('src/modern/main.ts')&&!html.includes('dist-modern'),'arquitetura moderna continua desligada da aplicação atual');

console.log('✓ arquitetura moderna: dados seletivos, cache, deduplicação e isolamento validados');
