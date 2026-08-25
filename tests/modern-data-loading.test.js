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

assert(registry.includes('const inflight = new Map')&&registry.includes('isFresh')&&registry.includes('invalidateData'),'data registry deve ter cache, deduplicação e invalidação');
assert(registry.includes('Promise.all(ids.map'),'fontes independentes devem poder carregar em paralelo');
assert(plan.includes("resumo: ['core','portfolio']"),'Portefólio deve declarar apenas core e a fonte portfolio dedicada');
assert(plan.includes("revenuehub: ['core','revenue','occupancy']"),'Revenue deve ter plano de dados próprio');
assert(plan.includes("reputacao: ['core','reputation']"),'Reputação não deve depender do pacote financeiro');
assert(plan.includes("ocupacao: ['core','occupancy']"),'Ocupação deve ter fonte dedicada');
assert(!/\bfetch\s*\(/.test(legacy),'adaptadores legados desta fase não podem criar tráfego de rede');
assert(legacy.includes('registerLegacyDataSources')&&legacy.includes('TTL'),'adaptadores devem declarar cache temporal por fonte');
assert(router.includes('prepareViewData')&&router.includes('Promise.all(['),'router deve preparar chunk e dados em paralelo');
assert(router.includes('await this.runtime.refresh?.()'),'refresh legado deve permanecer temporariamente para paridade funcional');
assert(main.includes('registerLegacyDataSources()')&&main.includes('dataPlan: viewDataPlan()'),'runtime moderno isolado deve expor o plano seletivo');
assert(!html.includes('src/modern/main.ts')&&!html.includes('dist-modern'),'arquitetura moderna continua desligada da aplicação atual');

console.log('✓ arquitetura moderna: dados seletivos, cache, deduplicação e isolamento validados');
