import {currentAccount} from '../_lib/auth';
import type {Env} from '../_lib/env';
import {db} from '../_lib/supabase';
import {error,json} from '../_lib/response';

export const onRequestGet=async({request,env}:{request:Request;env:Env})=>{
  const current=await currentAccount(request,env);
  if(!current)return error('Authentication required.',401);
  await db(env).rpc('settle_due_rewards',{p_account_id:current.account.id});
  const client=db(env);
  const [{data:wallet},{data:withdrawals}]=await Promise.all([
    client.from('wallets').select('available_points,pending_points,lifetime_earned_points,lifetime_withdrawn_points,debt_points').eq('account_id',current.account.id).single(),
    client.from('withdrawals').select('id,amount_points,asset,network,destination,status,tx_hash,admin_note,created_at').eq('account_id',current.account.id).order('created_at',{ascending:false}).limit(30)
  ]);
  if(!wallet)return error('Wallet unavailable.',500);
  return json({
    wallet:{availablePoints:Number(wallet.available_points),pendingPoints:Number(wallet.pending_points),lifetimeEarnedPoints:Number(wallet.lifetime_earned_points),lifetimeWithdrawnPoints:Number(wallet.lifetime_withdrawn_points),debtPoints:Number(wallet.debt_points??0)},
    withdrawals:(withdrawals??[]).map(map)
  });
};

function map(x:any){
  return {id:x.id,amountPoints:Number(x.amount_points),asset:x.asset,network:x.network,destination:x.destination,status:x.status,txHash:x.tx_hash,adminNote:x.admin_note,createdAt:x.created_at};
}
