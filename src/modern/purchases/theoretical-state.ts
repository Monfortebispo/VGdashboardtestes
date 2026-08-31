export class TheoreticalConsumptionState {
  private hotel='__all';
  selectedHotel():string{return this.hotel;}
  selectHotel(hotel:string):void{this.hotel=hotel||'__all';}
  reset():void{this.hotel='__all';}
}
