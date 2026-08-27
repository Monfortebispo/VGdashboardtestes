import { registerDataSource, type DataSourceId } from './data-registry';
import type { OccupancySourceSnapshot } from './occupancy-model';
import type { ReputationSourceSnapshot } from './reputation-model';
import type { RevenueSourceSnapshot } from './revenue-model';
import type { PortfolioSourceSnapshot } from './portfolio-model';

type OccupancyBridge = {version:number;read:()=>unknown[];selection:()=>{hotel:string;snapshot:string};eligibleHotels?:()=>string[];stats:()=>OccupancySourceSnapshot['stats'];};
type ReputationBridge = {version:number;read:()=>unknown;stats:()=>ReputationSourceSnapshot['stats'];};
type RevenueBridge = {version:number;read:()=>unknown;stats:()=>RevenueSourceSnapshot['stats'];};
type PortfolioBridge = {version:number;read:()=>unknown;stats:()=>PortfolioSourceSnapshot['stats'];};
type ApprovalsLegacy = {all?:()=>unknown[];state?:{rows?:unknown[]};ensureLoaded?:(force?:boolean)=>unknown;};
type LegacyWindow = Window & {RAW?: unknown;STORE?: unknown;VG?: Record<string, unknown> & {occupancyModernBridge?:OccupancyBridge;reputationModernBridge?:ReputationBridge;revenueModernBridge?:RevenueBridge;portfolioModernBridge?:PortfolioBridge;approvals?:ApprovalsLegacy;};};
function occupancySnapshot(w:LegacyWindow): OccupancySourceSnapshot {const bridge=w.VG?.occupancyModernBridge;if(bridge)return{snapshots:bridge.read() as OccupancySourceSnapshot['snapshots'],selection:bridge.selection(),eligibleHotels:bridge.eligibleHotels?.()||[],stats:bridge.stats()};return{snapshots:[],selection:{hotel:'__all__',snapshot:'__latest__'},eligibleHotels:[],stats:{snapshots:0,hotels:0,latestId:null,latestLabel:null,latestTs:null}};}
function reputationSnapshot(w:LegacyWindow):ReputationSourceSnapshot {const bridge=w.VG?.reputationModernBridge;return bridge?{data:bridge.read(),stats:bridge.stats()}:{data:null,stats:{records:0,available:false}};}
function revenueSnapshot(w:LegacyWindow):RevenueSourceSnapshot {const bridge=w.VG?.revenueModernBridge;return bridge?{data:bridge.read(),stats:bridge.stats()}:{data:null,stats:{records:0,available:false}};}
function portfolioSnapshot(w:LegacyWindow):PortfolioSourceSnapshot {const bridge=w.VG?.portfolioModernBridge;return bridge?{data:bridge.read(),stats:bridge.stats()}:{data:null,stats:{available:false,sections:0,approxRecords:0}};}
function approvalsSnapshot(w:LegacyWindow):unknown[]{const a=w.VG?.approvals;if(!a)return[];try{if(typeof a.all==='function'){const rows=a.all();if(Array.isArray(rows))return rows;}}catch(e){}return Array.isArray(a.state?.rows)?a.state!.rows!.slice():[];}
function snapshot(id: DataSourceId): unknown {const w=window as LegacyWindow;switch(id){case'core':return{RAW:w.RAW,STORE:w.STORE,VG:w.VG};case'financials':return w.RAW;case'portfolio':return portfolioSnapshot(w);case'occupancy':return occupancySnapshot(w);case'reputation':return reputationSnapshot(w);case'revenue':return revenueSnapshot(w);case'approvals':return approvalsSnapshot(w);case'hotels':return{RAW:w.RAW,hotels:w.VG?.hotels};case'documents':return w.VG?.documents;case'purchases':return{RAW:w.RAW,purchases:w.VG?.purchases};}}
const TTL: Readonly<Record<DataSourceId, number>>=Object.freeze({core:15_000,financials:60_000,portfolio:30_000,occupancy:30_000,reputation:120_000,revenue:30_000,approvals:5_000,hotels:300_000,documents:60_000,purchases:60_000});
export function registerLegacyDataSources():void{(Object.keys(TTL) as DataSourceId[]).forEach(id=>registerDataSource({id,ttlMs:TTL[id],load:()=>snapshot(id)}));}
