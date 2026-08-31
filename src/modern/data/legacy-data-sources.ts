import { registerDataSource, type DataSourceId } from './data-registry';
import type { OccupancySourceSnapshot } from './occupancy-model';
import type { ReputationSourceSnapshot } from './reputation-model';
import type { RevenueSourceSnapshot } from './revenue-model';
import type { PortfolioSourceSnapshot } from './portfolio-model';
import type { CityLedgerSourceSnapshot } from './city-ledger-model';
import type { PurchasesSourceSnapshot } from './purchases-model';
import { financialsSnapshot } from './financials-model';

type OccupancyBridge={version:number;read:()=>unknown[];selection:()=>{hotel:string;snapshot:string};eligibleHotels?:()=>string[];stats:()=>OccupancySourceSnapshot['stats'];};
type ReputationBridge={version:number;read:()=>unknown;stats:()=>ReputationSourceSnapshot['stats'];};
type RevenueBridge={version:number;read:()=>unknown;stats:()=>RevenueSourceSnapshot['stats'];};
type PortfolioBridge={version:number;read:()=>unknown;stats:()=>PortfolioSourceSnapshot['stats'];};
type ApprovalsLegacy={all?:()=>unknown[];state?:{rows?:unknown[]};ensureLoaded?:(force?:boolean)=>unknown;};
type CityLedgerLegacy={state?:{rows?:unknown[];diligences?:unknown[];snapshots?:unknown[];snapshot?:unknown};ensureLoaded?:(force?:boolean)=>unknown;};
type PurchasesNative={version?:number;getRoot?:()=>ShadowRoot|null;};
type Domains33={theoreticalData?:()=>{matched?:unknown[];unmatched?:unknown[];ingredients?:unknown[]};};
type LegacyWindow=Window&{RAW?:unknown;STORE?:unknown;VG?:Record<string,unknown>&{occupancyModernBridge?:OccupancyBridge;reputationModernBridge?:ReputationBridge;revenueModernBridge?:RevenueBridge;portfolioModernBridge?:PortfolioBridge;approvals?:ApprovalsLegacy;cityLedger?:CityLedgerLegacy;comprasNative35?:PurchasesNative;domains33?:Domains33;market?:{id?:()=>string;def?:()=>{currency?:string}};};};
function occupancySnapshot(w:LegacyWindow):OccupancySourceSnapshot{const bridge=w.VG?.occupancyModernBridge;if(bridge)return{snapshots:bridge.read() as OccupancySourceSnapshot['snapshots'],selection:bridge.selection(),eligibleHotels:bridge.eligibleHotels?.()||[],stats:bridge.stats()};return{snapshots:[],selection:{hotel:'__all__',snapshot:'__latest__'},eligibleHotels:[],stats:{snapshots:0,hotels:0,latestId:null,latestLabel:null,latestTs:null}};}
function reputationSnapshot(w:LegacyWindow):ReputationSourceSnapshot{const bridge=w.VG?.reputationModernBridge;return bridge?{data:bridge.read(),stats:bridge.stats()}:{data:null,stats:{records:0,available:false}};}
function revenueSnapshot(w:LegacyWindow):RevenueSourceSnapshot{const bridge=w.VG?.revenueModernBridge;return bridge?{data:bridge.read(),stats:bridge.stats()}:{data:null,stats:{records:0,available:false}};}
function portfolioSnapshot(w:LegacyWindow):PortfolioSourceSnapshot{const bridge=w.VG?.portfolioModernBridge;return bridge?{data:bridge.read(),stats:bridge.stats()}:{data:null,stats:{available:false,sections:0,approxRecords:0}};}
function approvalsSnapshot(w:LegacyWindow):unknown[]{const a=w.VG?.approvals;if(!a)return[];try{if(typeof a.all==='function'){const rows=a.all();if(Array.isArray(rows))return rows;}}catch(e){}return Array.isArray(a.state?.rows)?a.state!.rows!.slice():[];}
async function cityLedgerSnapshot(w:LegacyWindow,force=false):Promise<CityLedgerSourceSnapshot>{const cl=w.VG?.cityLedger;if(!cl)return{rows:[],diligences:[],snapshots:[],snapshot:null,market:'',currency:'EUR',available:false};try{await cl.ensureLoaded?.(force);}catch(e){}const s=cl.state||{};let market='',currency='EUR';try{market=w.VG?.market?.id?.()||'';currency=w.VG?.market?.def?.()?.currency||'EUR';}catch(e){}return{rows:Array.isArray(s.rows)?s.rows.slice():[],diligences:Array.isArray(s.diligences)?s.diligences.slice():[],snapshots:Array.isArray(s.snapshots)?s.snapshots.slice():[],snapshot:s.snapshot||null,market,currency,available:true};}
function purchasesSnapshot(w:LegacyWindow):PurchasesSourceSnapshot{
  const native=w.VG?.comprasNative35;
  let theory:{matched?:unknown[];unmatched?:unknown[];ingredients?:unknown[]}|null=null;
  try{theory=w.VG?.domains33?.theoreticalData?.()||null;}catch(e){theory=null;}
  const matched=Array.isArray(theory?.matched)?theory!.matched!.slice():[];
  const unmatched=Array.isArray(theory?.unmatched)?theory!.unmatched!.slice():[];
  const ingredients=Array.isArray(theory?.ingredients)?theory!.ingredients!.slice():[];
  return{nativeAvailable:!!native,nativeVersion:Number.isFinite(Number(native?.version))?Number(native?.version):null,nativeMounted:!!native?.getRoot?.(),theoreticalAvailable:!!theory,theoretical:{matched:matched.length,unmatched:unmatched.length,ingredients:ingredients.length},theoreticalData:{matched,unmatched,ingredients},rawAvailable:!!w.RAW};
}
function snapshot(id:DataSourceId):unknown{const w=window as LegacyWindow;switch(id){case'core':return{RAW:w.RAW,STORE:w.STORE,VG:w.VG};case'financials':return financialsSnapshot(w.RAW,w.STORE);case'portfolio':return portfolioSnapshot(w);case'occupancy':return occupancySnapshot(w);case'reputation':return reputationSnapshot(w);case'revenue':return revenueSnapshot(w);case'approvals':return approvalsSnapshot(w);case'hotels':return{RAW:w.RAW,hotels:w.VG?.hotels};case'documents':return w.VG?.documents;case'purchases':return purchasesSnapshot(w);}}
const TTL:Readonly<Record<DataSourceId,number>>=Object.freeze({core:15_000,financials:60_000,portfolio:30_000,occupancy:30_000,reputation:120_000,revenue:30_000,approvals:5_000,cityledger:15_000,hotels:300_000,documents:60_000,purchases:15_000});
export function registerLegacyDataSources():void{(Object.keys(TTL) as DataSourceId[]).forEach(id=>registerDataSource({id,ttlMs:TTL[id],load:ctx=>id==='cityledger'?cityLedgerSnapshot(window as LegacyWindow,!!ctx.force):snapshot(id)}));}
