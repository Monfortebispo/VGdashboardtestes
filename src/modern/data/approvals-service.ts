import { normalizeApprovals, type ApprovalRecord } from './approvals-model';
export interface ApprovalsPrepared {records:ApprovalRecord[];available:boolean;}
export type ApprovalDecision='approve'|'reject'|'clarify';
type AuthWindow=Window&{vgAuthToken?:()=>string;vgAuthHandleUnauthorized?:()=>void};
const API='/.netlify/functions/process-workflow-v36';
let cache:ApprovalsPrepared={records:[],available:false};
async function request(action:string,method:'GET'|'POST'='GET',payload?:Record<string,unknown>):Promise<unknown>{const w=window as AuthWindow;const token=w.vgAuthToken?.()||'';const headers:Record<string,string>={'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '+token;const r=await fetch(`${API}?action=${encodeURIComponent(action)}`,{method,headers,cache:'no-store',body:payload?JSON.stringify(payload):undefined});const d=await r.json().catch(()=>({}));if(r.status===401)w.vgAuthHandleUnauthorized?.();if(!r.ok)throw new Error(String((d as {error?:unknown}).error||`HTTP ${r.status}`));return (d as {data?:unknown}).data;}
export async function approvalsData(force=false):Promise<ApprovalsPrepared>{if(!force&&cache.available)return cache;const raw=await request('list');cache={records:normalizeApprovals(raw),available:Array.isArray(raw)};return cache;}
export function currentApprovalsData():ApprovalsPrepared{return cache;}
async function mutate(action:string,payload:Record<string,unknown>):Promise<ApprovalsPrepared>{await request(action,'POST',payload);return approvalsData(true);}
export const approvalsActions={message:(id:string,text:string)=>mutate('message',{id,text}),submit:(id:string,comment='')=>mutate('submit',{id,comment}),decision:(id:string,decision:ApprovalDecision,comment:string)=>mutate('decision',{id,decision,comment}),changeState:(id:string,status:string,comment:string)=>mutate('state',{id,status,comment}),archive:(id:string)=>mutate('archive',{id})};
