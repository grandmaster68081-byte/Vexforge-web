import { requireAdmin } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error, json } from '../_lib/response';
export const onRequestGet=async({request,env}:{request:Request;env:Env})=>{const current=await requireAdmin(request,env);if('error'in current)return current.error;const {data,error:dbError}=await db(env).from('withdrawals').select('id,account_id,amount_points,asset,network,destination,status,tx_hash,admin_note,created_at').order('created_at',{ascending:false}).limit(100);if(dbError)return error(dbError.message,500);return json({withdrawals:(data??[]).map(mapWithdrawal)})};
function mapWithdrawal(x:any){return {id:x.id,accountId:x.account_id,amountPoints:Number(x.amount_points),asset:x.asset,network:x.network,destination:x.destination,status:x.status,txHash:x.tx_hash,adminNote:x.admin_note,createdAt:x.created_at}}
