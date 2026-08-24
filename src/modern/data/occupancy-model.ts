export type OccupancyMonthValue = number | null;
export type OccupancyYear = Record<string, OccupancyMonthValue[]>;
export type OccupancyHotelData = Record<string, OccupancyYear>;

export interface OccupancySnapshot {
  id: number | string;
  label?: string;
  loadedAt?: string;
  ts?: number;
  data: OccupancyHotelData;
}

export interface OccupancySourceSnapshot {
  snapshots: OccupancySnapshot[];
  selection: { hotel:string; snapshot:string };
  stats: {
    snapshots:number;
    hotels:number;
    latestId:number|string|null;
    latestLabel:string|null;
    latestTs:number|null;
  };
}

export function yearValues(snapshot: OccupancySnapshot | undefined, hotel:string, year:string|number): OccupancyMonthValue[] {
  const values=snapshot?.data?.[hotel]?.[String(year)];
  return Array.isArray(values)?values.slice(0,12):Array(12).fill(null);
}

export function averageOccupancy(values: OccupancyMonthValue[]): number | null {
  const valid=values.filter((v):v is number=>typeof v==='number'&&Number.isFinite(v));
  return valid.length?valid.reduce((sum,v)=>sum+v,0)/valid.length:null;
}

export function latestSnapshot(list: OccupancySnapshot[]): OccupancySnapshot | null {
  return list.length?list[list.length-1]:null;
}

export function previousSnapshot(list: OccupancySnapshot[]): OccupancySnapshot | null {
  return list.length>1?list[list.length-2]:null;
}

export function pickupPoints(before:number|null, after:number|null): number|null {
  if(before==null||after==null)return null;
  return Number((after-before).toFixed(2));
}

export function occupancyPickup(list:OccupancySnapshot[],hotel:string,year:string|number): {before:number|null;after:number|null;delta:number|null} {
  const before=averageOccupancy(yearValues(previousSnapshot(list)||undefined,hotel,year));
  const after=averageOccupancy(yearValues(latestSnapshot(list)||undefined,hotel,year));
  return {before,after,delta:pickupPoints(before,after)};
}
