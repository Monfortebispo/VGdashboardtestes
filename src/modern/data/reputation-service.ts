import { cachedData, ensureDataSource } from './data-registry';
import type { ReputationSourceSnapshot } from './reputation-model';

export interface ReputationDiagnostics {
  loadMs:number;
  records:number;
  available:boolean;
}

interface ReputationRegionContext {region:string;hotels:string[]}
interface ReputationBridge {context?:()=>ReputationRegionContext}

function canon(value:unknown):string{
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\bvila\s*gale\b/g,'').replace(/\bvg\b/g,'').replace(/\bhotel\b/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function regionContext():ReputationRegionContext{
  try{
    const bridge=(window as unknown as {VG?:{reputationModernBridge?:ReputationBridge}}).VG?.reputationModernBridge;
    const ctx=bridge?.context?.();
    if(ctx)return {region:String(ctx.region||'todos'),hotels:Array.isArray(ctx.hotels)?ctx.hotels.map(String):[]};
  }catch{}
  return {region:'todos',hotels:[]};
}
function matchesRegionHotel(storeKey:string,item:unknown,hotels:string[]):boolean{
  if(!hotels.length)return true;
  const row=item&&typeof item==='object'&&!Array.isArray(item)?item as Record<string,unknown>:null;
  const candidate=canon(row?.hotel??storeKey);
  return hotels.some(h=>{const target=canon(h);return !!target&&(candidate===target||candidate.includes(target)||target.includes(candidate));});
}
function scopedSnapshot(snapshot:ReputationSourceSnapshot):ReputationSourceSnapshot{
  const ctx=regionContext();
  if(ctx.region==='todos'||!ctx.hotels.length||!snapshot.data||typeof snapshot.data!=='object'||Array.isArray(snapshot.data))return snapshot;
  const source=snapshot.data as Record<string,unknown>;
  const data:Record<string,unknown>={};
  let records=0;
  Object.entries(source).forEach(([key,value])=>{
    const list=Array.isArray(value)?value:[value];
    const kept=list.filter(item=>matchesRegionHotel(key,item,ctx.hotels));
    if(!kept.length)return;
    data[key]=Array.isArray(value)?kept:kept[0];
    records+=kept.length;
  });
  return {data,stats:{records,available:records>0}};
}

export async function reputationData(force=false):Promise<ReputationSourceSnapshot>{
  const cached=cachedData<ReputationSourceSnapshot>('reputation');
  const mustRefresh=force||!cached||cached.stats.available===false||cached.stats.records===0;
  return ensureDataSource<ReputationSourceSnapshot>('reputation',{force:mustRefresh});
}

export function currentReputationData():ReputationSourceSnapshot|undefined {
  const snapshot=cachedData<ReputationSourceSnapshot>('reputation');
  return snapshot?scopedSnapshot(snapshot):undefined;
}

export async function reputationDiagnostics(force=false):Promise<ReputationDiagnostics>{
  const started=performance.now();
  const data=await reputationData(force);
  const scoped=scopedSnapshot(data);
  return {
    loadMs:Number((performance.now()-started).toFixed(2)),
    records:scoped.stats.records,
    available:scoped.stats.available
  };
}
