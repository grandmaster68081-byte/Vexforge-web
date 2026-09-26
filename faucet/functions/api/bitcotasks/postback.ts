import MD5 from 'crypto-js/md5';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error } from '../_lib/response';

export const onRequestPost = async ({request,env}:{request:Request;env:Env}) => handle(request,env);
export const onRequestGet = async ({request,env}:{request:Request;env:Env}) => handle(request,env);

async function handle(request:Request,env:Env){
  const sourceIp=request.headers.get('CF-Connecting-IP')??request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'';
  const allowedIp=env.BITCOTASKS_POSTBACK_IP??'45.14.135.48';
  if(sourceIp!==allowedIp) return error('Unauthorized provider source.',403);

  const p=request.method==='POST'?await readBody(request):Object.fromEntries(new URL(request.url).searchParams.entries());
  const subId=String(p.subId??'').trim();
  const transId=String(p.transId??'').trim();
  const rewardRaw=String(p.reward??'').trim();
  const status=Number(p.status??0);
  const signature=String(p.signature??'').trim().toLowerCase();
  const reward=Number(rewardRaw);
  if(!subId||!transId||!rewardRaw||!signature||!Number.isFinite(reward)||reward<=0) return error('Missing or invalid required postback fields.',400);

  const expected=MD5(`${subId}${transId}${rewardRaw}${env.BITCOTASKS_SECRET_KEY}`).toString().toLowerCase();
  if(!timingSafeEqual(expected,signature)) return error("Signature doesn't match.",403);
  if(status!==1&&status!==2) return error('Unsupported postback status.',400);

  const accountResult=await db(env).from('accounts').select('id').eq('public_id',subId).maybeSingle();
  if(!accountResult.data) return error('Unknown user.',404);

  const {errorMessage}=await apply(accountResult.data.id,p,env);
  if(errorMessage) return error(errorMessage,422);

  // BitcoTasks expects a plain success acknowledgement.
  return new Response('ok',{status:200,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
}

async function apply(accountId:string,p:Record<string,unknown>,env:Env){
  const client=db(env);
  const {error:rpcError}=await client.rpc('apply_bitcotasks_postback',{
    p_account_id:accountId,
    p_trans_id:String(p.transId??''),
    p_offer_name:String(p.offer_name??''),
    p_offer_type:String(p.offer_type??''),
    p_reward:Number(p.reward??0),
    p_reward_name:String(p.reward_name??''),
    p_reward_value:Number(p.reward_value??0),
    p_payout_usd:Number(p.payout??0),
    p_user_ip:String(p.userIp??''),
    p_country:String(p.country??''),
    p_status:Number(p.status??0),
    p_debug:Number(p.debug??0),
    p_raw_payload:p
  });
  return {errorMessage:rpcError?.message};
}

function timingSafeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

async function readBody(request:Request){
  const ct=request.headers.get('content-type')??'';
  if(ct.includes('application/json'))return await request.json() as Record<string,unknown>;
  return Object.fromEntries(await request.formData());
}
