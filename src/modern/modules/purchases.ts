import type { ModernModule } from '../core/module-registry';
import { invalidateData } from '../data/data-registry';

type PurchasesNative={mount?:(container:HTMLElement)=>unknown;reload?:()=>unknown;getRoot?:()=>ShadowRoot|null;};
type VGWindow=Window&{VG?:Record<string,unknown>&{comprasNative35?:PurchasesNative;events?:{on?:(name:string,handler:()=>void)=>unknown}};};

let mountedRoot:HTMLElement|null=null;
let cleanup:((()=>void)|null)=null;
let refreshTimer:number|undefined;

function scheduleNativeMount(root:HTMLElement):void{
  window.clearTimeout(refreshTimer);
  refreshTimer=window.setTimeout(async()=>{
    const w=window as VGWindow;
    const native=w.VG?.comprasNative35;
    const container=root.querySelector<HTMLElement>('#ab35NativeMount');
    const hub=root.querySelector<HTMLElement>('#abHubRoot');
    if(!container||!native?.mount)return;
    if(hub&&hub.dataset.tab&&hub.dataset.tab!=='exact')return;
    try{await native.mount(container);}catch(error){console.error('[VG Modern] A&B mount',error);}
  },40);
}

const purchasesModule:ModernModule={
  id:'purchases',
  async mount(root){
    mountedRoot=root;
    root.dataset.vgModernPurchases='ready';
    scheduleNativeMount(root);

    const onClick=(event:Event)=>{
      const target=event.target as Element|null;
      if(target?.closest?.('[data-abtab="exact"],#nav-ab'))scheduleNativeMount(root);
    };
    const onDataChanged=()=>{invalidateData('purchases');scheduleNativeMount(root);};
    root.addEventListener('click',onClick,false);
    window.addEventListener('vg-purchases-data-changed',onDataChanged);
    cleanup=()=>{
      root.removeEventListener('click',onClick,false);
      window.removeEventListener('vg-purchases-data-changed',onDataChanged);
    };
  },
  unmount(){
    window.clearTimeout(refreshTimer);
    cleanup?.();cleanup=null;
    if(mountedRoot){delete mountedRoot.dataset.vgModernPurchases;mountedRoot=null;}
  }
};

export default purchasesModule;
