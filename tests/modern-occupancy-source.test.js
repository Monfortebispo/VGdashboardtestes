const assert=require('assert');
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

const html=read('index.html');
const bridge=read('assets/js/modules/occupancy-modern-bridge-v40.js');
const source=read('src/modern/data/legacy-data-sources.ts');
const model=read('src/modern/data/occupancy-model.ts');
const service=read('src/modern/data/occupancy-service.ts');

assert(!html.includes('occupancy-modern-bridge-v40.js'),'bridge de Ocupação moderna deve permanecer desligado do index.html');
assert(!bridge.includes('fetch('),'bridge de Ocupação não pode criar tráfego de rede');
assert(bridge.includes("typeof OCC_SNAPSHOTS==='undefined'")&&bridge.includes('occupancyModernBridge'),'bridge deve ler snapshots legados sem alterar ocupacao.js');
assert(source.includes("case 'occupancy':")&&source.includes('return occupancySnapshot(w);'),'fonte occupancy deve usar contrato específico e não RAW');
assert(model.includes('occupancyPickup')&&model.includes('averageOccupancy'),'modelo deve calcular médias/pickup fora do módulo legado');
assert(service.includes("ensureDataSource<OccupancySourceSnapshot>('occupancy'")&&service.includes('occupancyDiagnostics'),'serviço deve consumir cache seletiva e expor diagnóstico');
cp.execFileSync(process.execPath,['--check',path.join(ROOT,'assets/js/modules/occupancy-modern-bridge-v40.js')],{stdio:'pipe'});
console.log('✓ modern occupancy: bridge read-only, fonte seletiva, modelo e diagnóstico isolados');
