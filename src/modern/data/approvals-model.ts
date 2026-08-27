export interface ApprovalRecord {
  id:string;
  hotel:string;
  type:string;
  status:string;
  author:string;
  createdAt:string;
  amount:number|null;
  raw:unknown;
}

export interface ApprovalsSourceSnapshot {data:unknown;stats:{available:boolean;records:number};}
const text=(v:unknown)=>String(v??'').trim();
const num=(v:unknown):number|null=>{if(typeof v==='number'&&Number.isFinite(v))return v;const n=Number(String(v??'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:null;};
function pick(o:Record<string,unknown>,keys:string[]):unknown{for(const k of keys)if(o[k]!=null&&o[k]!=='')return o[k];return undefined;}
function flatten(value:unknown):unknown[]{if(Array.isArray(value))return value;if(!value||typeof value!=='object')return[];const o=value as Record<string,unknown>;for(const k of ['records','items','approvals','processes','data'])if(Array.isArray(o[k]))return o[k] as unknown[];return Object.values(o).flatMap(v=>Array.isArray(v)?v:[]);}
export function normalizeApprovals(value:unknown):ApprovalRecord[]{return flatten(value).map((item,i)=>{const o=(item&&typeof item==='object'?item:{}) as Record<string,unknown>;return{id:text(pick(o,['id','processId','numero','number','ref']))||String(i+1),hotel:text(pick(o,['hotel','hotelName','unidade','unit']))||'—',type:text(pick(o,['type','tipo','category','natureza']))||'—',status:text(pick(o,['status','estado','state']))||'—',author:text(pick(o,['author','autor','createdBy','user']))||'—',createdAt:text(pick(o,['createdAt','created_at','date','data','timestamp']))||'—',amount:num(pick(o,['amount','valor','value','total'])),raw:item};});}
