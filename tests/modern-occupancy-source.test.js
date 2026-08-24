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
const state=read('src/modern/occupancy/occupancy-state.ts');
const controller=read('src/modern/occupancy/occupancy-controller.ts');
const moduleCode=read('src/modern/modules/occupancy.ts');

assert(!html.includes('occupancy-modern-bridge-v40.js'),'bridge de Ocupação moderna deve permanecer desligado do index.html');
assert(!bridge.includes('fetch('),'bridge de Ocupação não pode criar tráfego de rede');
assert(bridge.includes("typeof OCC_SNAPSHOTS==='undefined'")&&bridge.includes('occupancyModernBridge'),'bridge deve ler snapshots legados sem alterar ocupacao.js');
assert(bridge.includes('applySelection')&&bridge.includes("setSelectValue('occHotelSel'")&&bridge.includes("setSelectValue('occSnapSel'"),'bridge deve sincronizar hotel/snapshot sem controlar navegação');
assert(source.includes("case 'occupancy':")&&source.includes('return occupancySnapshot(w);'),'fonte occupancy deve usar contrato específico e não RAW');
assert(model.includes('occupancyPickup')&&model.includes('averageOccupancy'),'modelo deve calcular médias/pickup fora do módulo legado');
assert(service.includes("ensureDataSource<OccupancySourceSnapshot>('occupancy'")&&service.includes('occupancyDiagnostics'),'serviço deve consumir cache seletiva e expor diagnóstico');
assert(state.includes('class OccupancyStateStore')&&state.includes('subscribe('),'estado de seleção deve estar desacoplado do DOM');
assert(controller.includes('class OccupancyController')&&controller.includes('syncFromLegacy')&&controller.includes('refresh()'),'controlador deve coordenar estado/dados sem navegar');
assert(!moduleCode.includes('legacyView(')&&!moduleCode.includes('setView(')&&!moduleCode.includes('refreshAll'),'módulo moderno de Ocupação não pode reintroduzir navegação/refresh global');
assert(moduleCode.includes('occupancyController.prepare()')&&moduleCode.includes('modernOccupancySnapshots'),'módulo deve preparar apenas a sua fonte e expor diagnóstico local');
cp.execFileSync(process.execPath,['--check',path.join(ROOT,'assets/js/modules/occupancy-modern-bridge-v40.js')],{stdio:'pipe'});
console.log('✓ modern occupancy: estado, controlador, bridge, fonte seletiva e módulo desacoplados do refresh global');
