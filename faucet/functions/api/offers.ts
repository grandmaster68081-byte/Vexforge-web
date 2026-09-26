import {allowRate,currentAccount,rateKey} from './_lib/auth';
import type {Env} from './_lib/env';
import {loadOffers} from './_lib/bitcotasks';
import {error,json} from './_lib/response';

export const onRequestGet=async({request,env}:{request:Request;env:Env})=>{
 const current=await currentAccount(request,env);
 if(!current)return error('Authentication required.',401);
 if(!(await allowRate(env,`offers:${current.account.id}:${await rateKey(request)}`,18,300)))return error('Opportunity refresh is temporarily rate-limited. Please wait a moment.',429);
 try{
  const offers=await loadOffers(env,request,current.account.public_id);
  const unique=new Map<string,any>();
  for(const o of offers){
   if(o.url&&/^https:\/\//i.test(o.url))unique.set(`${o.category}:${o.id}`,o);
  }
  const list=[...unique.values()].sort((a:any,b:any)=>(b.reward-a.reward)).slice(0,120);
  return json({offers:list,fetchedAt:new Date().toISOString()});
 }catch(e){return error(e instanceof Error?e.message:'Could not load provider inventory.',502)}
};
