import type { ModernModule } from '../core/module-registry';
import { invalidateData } from '../data/data-registry';
import { TheoreticalConsumptionController } from '../purchases/theoretical-controller';

type PurchasesNative={mount?:(container:HTMLElement)=>unknown;reload?:()=>unknown;getRoot?:()=>ShadowRoot|null;};
type Domains33={renderAB?:()=>unknown;};
type VGWindow=Window&{VG?:Record<string,unknown>&{comprasNative35?:PurchasesNative;domains33?:Domains33;events?:{on?:(name:string,handler:()=>void)=>unknown}};};

let mountedRoot:HTMLElement|null=null;
let cleanup:((()=>void)|null)=null;
let refreshTimer:number|undefined;
let theoryController:TheoreticalConsumptionController|null=null;
let domainEventsBound=false;

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
function scheduleActive(root:HTMLElement):void{
  const hub=root.querySelector<HTMLElement>('#abHubRoot');
  if(hub?.dataset.tab==='theoretical')theoryController?.schedule(35);
  else if(!hub?.dataset.tab||hub.dataset.tab==='exact')scheduleNativeMount(root);
}
function bindDomainEvents():void{
  if(domainEventsBound)return;domainEventsBound=true;
  const w=window as VGWindow;
  w.VG?.events?.on?.('revenue-detail:changed',()=>{invalidateData('purchases');theoryController?.schedule(60);});
  w.VG?.events?.on?.('market:changed',()=>{invalidateData('purchases');theoryController?.reset();});
}

const purchasesModule:ModernModule={
  id:'purchases',
  async mount(root){
    mountedRoot=root;
    root.dataset.vgModernPurchases='ready';
    theoryController?.dispose();
    theoryController=new TheoreticalConsumptionController(root);
    bindDomainEvents();
    scheduleActive(root);

    const onClick=(event:Event)=>{
      const target=event.target as Element|null;
      if(target?.closest?.('[data-abtab="exact"],#nav-ab'))scheduleNativeMount(root);
      if(target?.closest?.('[data-abtab="theoretical"]'))theoryController?.schedule(45);
    };
    const onDataChanged=()=>{
      invalidateData('purchases');
      const hub=root.querySelector<HTMLElement>('#abHubRoot');
      if(hub?.dataset.tab==='theoretical'){
        try{(window as VGWindow).VG?.domains33?.renderAB?.();}catch(error){console.warn('[VG Modern] refresh A&B',error);}
        theoryController?.schedule(60);
      }else scheduleNativeMount(root);
    };
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
    theoryController?.dispose();theoryController=null;
    if(mountedRoot){delete mountedRoot.dataset.vgModernPurchases;mountedRoot=null;}
  }
};

export default purchasesModule;
