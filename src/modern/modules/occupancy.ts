import type { ModernModule } from '../core/module-registry';
import { OccupancyController, type OccupancyLegacyAdapter } from '../occupancy/occupancy-controller';
import { clearOccupancyReadOnly, renderOccupancyReadOnly } from '../occupancy/occupancy-renderer';
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
let mountedRoot:HTMLElement|undefined;

const occupancy:ModernModule = {
  id:'occupancy',
  async mount(root){
    const prepared=await occupancyController.prepare();
    mountedRoot=root;
    root.dataset.modernOccupancy='ready';
    root.dataset.modernOccupancySnapshots=String(prepared.diagnostics.snapshots);
    root.dataset.modernOccupancyHotels=String(prepared.diagnostics.hotels);
    renderOccupancyReadOnly(root,prepared.selection);
  },
  unmount(){
    if(mountedRoot)clearOccupancyReadOnly(mountedRoot);
    mountedRoot=undefined;
  }
};

export default occupancy;
