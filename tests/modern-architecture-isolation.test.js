const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

const html=read('index.html');
const pkg=require('../package.json');
const modernMain=read('src/modern/main.ts');
const registry=read('src/modern/core/module-registry.ts');
const bridge=read('src/modern/core/legacy-bridge.ts');
const plan=read('MODERNIZATION.md');

assert(!html.includes('src/modern/main.ts'),'arquitetura moderna não pode estar ligada ao index.html nesta fase');
assert(!html.includes('dist-modern'),'bundle moderno não pode substituir o runtime atual nesta fase');
assert(pkg.scripts['modern:build'],'package deve disponibilizar build moderno separado');
assert(pkg.devDependencies?.typescript&&pkg.devDependencies?.vite,'TypeScript e Vite devem existir apenas como infraestrutura de desenvolvimento');
assert(modernMain.includes("status: 'isolated'"),'entrada moderna deve declarar estado isolado');
assert(registry.includes('loadModule')&&registry.includes('registerModule'),'registo lazy de módulos deve existir');
assert(bridge.includes('legacyRuntime')&&bridge.includes('legacyView'),'ponte para runtime legado deve existir');
assert(plan.includes('A Ficha Hotel não sofre alterações funcionais'),'plano deve preservar explicitamente a Ficha Hotel');

console.log('✓ arquitetura moderna isolada do runtime atual');
