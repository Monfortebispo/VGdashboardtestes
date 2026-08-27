import { cachedData, ensureDataSource } from './data-registry';
import { normalizeApprovals, type ApprovalRecord } from './approvals-model';
export interface ApprovalsPrepared {records:ApprovalRecord[];available:boolean;}
export async function approvalsData(force=false):Promise<ApprovalsPrepared>{const raw=await ensureDataSource<unknown>('approvals',{force});const records=normalizeApprovals(raw);return{records,available:raw!=null};}
export function currentApprovalsData():ApprovalsPrepared{const raw=cachedData<unknown>('approvals');return{records:normalizeApprovals(raw),available:raw!=null};}
