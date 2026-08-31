import { ensureDataSource } from '../data/data-registry';
import type { PurchasesSourceSnapshot } from '../data/purchases-model';
import { buildTheoryViewModel, type TheoryRawData } from './theoretical-model';
import { TheoreticalConsumptionState } from './theoretical-state';
import { renderTheoreticalConsumption } from './theoretical-renderer';

type Domains33={canonHotel?:(v:unknown)=>string;};
type Market={formatMoney?:(value:number,digits?:number,withSymbol?:boolean)=>string;};
type VGWindow=Window&{RAW?:{hotel_list?:unknown[]};VG?:Record<string,unknown>&{domains33?:Domains33;market?:Market};getActiveHotels?:()=>unknown[];};

export class TheoreticalConsumptionController {
  private readonly state=new TheoreticalConsumptionState();
  private timer:number|undefined;
  private renderGeneration=0;
  private disposed=false;
  constructor(private readonly root:HTMLElement){}
  schedule(delay=30):void{window.clearTimeout(this.timer);this.timer=window.setTimeout(()=>{void this.render();},delay);}
  async render(force=false):Promise<void>{
    const generation=++this.renderGeneration;
    const hub=this.root.querySelector<HTMLElement>('#abHubRoot');if(!hub||hub.dataset.tab!=='theoretical'||this.disposed)return;
    hub.dataset.vgModernTheoretical='loading';
    const w=window as VGWindow,domains=w.VG?.domains33;
    let source:PurchasesSourceSnapshot;
    try{source=await ensureDataSource<PurchasesSourceSnapshot>('purchases',{force});}
    catch(error){console.error('[VG Modern] consumo teórico',error);if(generation===this.renderGeneration&&!this.disposed)hub.dataset.vgModernTheoretical='error';return;}
    if(generation!==this.renderGeneration||this.disposed||hub.dataset.tab!=='theoretical')return;
    const raw:TheoryRawData={matched:source.theoreticalData.matched as TheoryRawData['matched'],unmatched:source.theoreticalData.unmatched as TheoryRawData['unmatched'],ingredients:source.theoreticalData.ingredients};
    const canonical=(v:unknown)=>{try{return domains?.canonHotel?.(v)||String(v??'').trim();}catch{return String(v??'').trim();}};
    const fallbackHotels:string[]=[];
    try{for(const h of w.getActiveHotels?.()||[]){const c=canonical(h);if(c)fallbackHotels.push(c);}}catch{}
    try{for(const h of w.RAW?.hotel_list||[]){const c=canonical(h);if(c)fallbackHotels.push(c);}}catch{}
    const model=buildTheoryViewModel(raw,this.state.selectedHotel(),canonical,[...new Set(fallbackHotels)]);
    if(model.selectedHotel!==this.state.selectedHotel())this.state.selectHotel(model.selectedHotel);
    const money=(value:number,digits=2)=>{try{return w.VG?.market?.formatMoney?.(value,digits,true)||`€ ${value.toLocaleString('pt-PT',{minimumFractionDigits:digits,maximumFractionDigits:digits})}`;}catch{return `€ ${value.toLocaleString('pt-PT',{minimumFractionDigits:digits,maximumFractionDigits:digits})}`;}};
    renderTheoreticalConsumption(hub,model,{money,onHotel:hotel=>{this.state.selectHotel(hotel);void this.render();}});
  }
  reset():void{this.state.reset();this.schedule(0);}
  refresh():void{this.schedule(0);}
  refreshFromSource():void{window.clearTimeout(this.timer);void this.render(true);}
  dispose():void{this.disposed=true;this.renderGeneration++;window.clearTimeout(this.timer);const hub=this.root.querySelector<HTMLElement>('#abHubRoot');if(hub)delete hub.dataset.vgModernTheoretical;}
}
