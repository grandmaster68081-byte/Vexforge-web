import {currentAccount,requireCsrf,allowRate,rateKey} from './_lib/auth';import type {Env} from './_lib/env';import {db} from './_lib/supabase';import {error,json} from './_lib/response';

export const onRequestPost=async({request,env}:{request:Request;env:Env})=>{
 const current=await currentAccount(request,env);if(!current)return error('Authentication required.',401);
 if(!(await requireCsrf(request,current.session)))return error('Security check failed. Refresh the page and try again.',403);
 if(!(await allowRate(env,`withdraw:${current.account.id}:${await rateKey(request)}`,5,3600)))return error('Too many withdrawal requests. Please try again later.',429);
 const body=await request.json().catch(()=>null) as any;
 const amount=Number(body?.amountPoints),asset=String(body?.asset??'').trim().toUpperCase(),network=String(body?.network??'').trim(),destination=String(body?.destination??'').trim();
 if(!Number.isFinite(amount)||amount<=0||amount>100000000)return error('Enter a valid withdrawal amount.');
 if(!asset||!network||destination.length<12||destination.length>256)return error('Complete the payout fields.');
 if(!validAddress(network,destination))return error(`The ${network} destination format is not valid.`);
 const client=db(env);
 const {data:settings,error:settingsError}=await client.from('settings').select('value').eq('key','supported_payouts').maybeSingle();
 if(settingsError)return error('Could not verify supported payout destinations.',500);
 const supported=Array.isArray(settings?.value)?settings.value:[];
 const supportedPair=supported.some((x:any)=>String(x?.asset??'').toUpperCase()===asset&&String(x?.network??'')===network);
 if(!supportedPair)return error('That asset/network combination is not currently supported.',422);
 const {data:rpcData,error:rpcError}=await client.rpc('request_withdrawal',{p_account_id:current.account.id,p_amount_points:amount,p_asset:asset,p_network:network,p_destination:destination});
 if(rpcError)return error(rpcError.message.includes('minimum')||rpcError.message.includes('insufficient')||rpcError.message.includes('debt')||rpcError.message.includes('supported')?rpcError.message:'Could not create withdrawal.',422);
 return json({withdrawal:mapWithdrawal(rpcData)},201);
};

function validAddress(network:string,v:string){if(network==='Base')return /^0x[a-fA-F0-9]{40}$/.test(v);if(network==='Solana')return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);if(network==='Bitcoin')return /^(bc1|[13])[a-z0-9]{20,90}$/i.test(v);if(network==='Litecoin')return /^(ltc1|[LM3])[a-z0-9]{20,90}$/i.test(v);return false}
function mapWithdrawal(x:any){return {id:x.id,amountPoints:Number(x.amount_points),asset:x.asset,network:x.network,destination:x.destination,status:x.status,txHash:x.tx_hash,adminNote:x.admin_note,createdAt:x.created_at}}
