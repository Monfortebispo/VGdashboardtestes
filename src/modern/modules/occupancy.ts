import type { ModernModule } from '../core/module-registry';
import { OccupancyController, type OccupancyLegacyAdapter } from '../occupancy/occupancy-controller';
import type { OccupancySelection } from '../occupancy/occupancy-state';

type OccupancyBridge = {
  selection?:()=>Partial<OccupancySelection>;
  applySelection?:(selection:Readonly<OccupancySelection>)=>unknown;
  refresh?:()=>unknown;
};

type OccupancyWindow = Window & {
  VG?: { occupancyModernBridge?:OccupancyBridge };
};

function bridge():OccupancyBridge|undefined {
  return (window as OccupancyWindow).VG?.occupancyModernBridge;
}

const legacyAdapter:OccupancyLegacyAdapter = {
  readSelection(){
    return bridge()?.selection?.()||{};
  },
  applySelection(selection){
    bridge()?.applySelection?.(selection);
  },
  refreshView(){
    bridge()?.refresh?.();
  }
};

export const occupancyController = new OccupancyController(legacyAdapter);

const occupancy:ModernModule = {
  id:'occupancy',
  async mount(root){
    // Navegação/ativação do painel pertence ao router. Este módulo apenas prepara
    // os seus dados e atualiza a própria vista, evitando chamar setView/refreshAll.
    const prepared=await occupancyController.prepare();
    root.dataset.modernOccupancy='ready';
    root.dataset.modernOccupancySnapshots=String(prepared.diagnostics.snapshots);
    root.dataset.modernOccupancyHotels=String(prepared.diagnostics.hotels);
    bridge()?.refresh?.();
  },
  unmount(){
    // Não destrói o DOM legado: durante a migração ele continua a ser a camada visual.
  }
};

export default occupancy;
