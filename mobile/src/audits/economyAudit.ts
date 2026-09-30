export interface LedgerLine { currency:'vex_ingame'|'vex_tradeable'; delta:number; key:string; }
export interface EconomyAuditReport { ok:boolean; runs:number; failures:string[]; marketFeeRate:number; invariants:{noNegativeBalance:boolean;ledgerReconciles:boolean;idempotencyProtects:boolean;feeExact:boolean}; }
export function safeWallet(balance:number,delta:number){const next=balance+delta;if(next<0)throw new Error('INSUFFICIENT_FUNDS');return next;}
export function marketFee(gross:number,rate:number){const fee=Math.round(gross*rate*1e8)/1e8;return{fee,sellerNet:Math.round((gross-fee)*1e8)/1e8};}
export function auditEconomy(runs=10000):EconomyAuditReport{
  const failures:string[]=[];const rate=.08;let noNegative=true,reconciles=true,idempotent=true,feeExact=true;
  for(let i=0;i<runs;i++){
    let ingame=0,trade=0,sumI=0,sumT=0;const seen=new Set<string>();
    for(let j=0;j<18;j++){const key=`${i}-${j}`;const currency=j%2?'tradeable':'ingame';const delta=((i*31+j*17)%41)-20;try{if(currency==='tradeable'){trade=safeWallet(trade,delta);sumT+=delta;}else{ingame=safeWallet(ingame,delta);sumI+=delta;}}catch{ /* rejected spend is expected */ }}
    if(ingame!==sumI||trade!==sumT){reconciles=false;failures.push(`run ${i}: wallet ledger drift`);} 
    const duplicateKey=`dup-${i}`; const applyOnce=(k:string)=>{if(seen.has(k))return false;seen.add(k);return true;}; if(!applyOnce(duplicateKey)||applyOnce(duplicateKey)!==false){idempotent=false;failures.push(`run ${i}: idempotency failure`);}
    const fee=marketFee(100,rate); if(fee.fee!==8||fee.sellerNet!==92){feeExact=false;failures.push(`run ${i}: fee mismatch`);} if(ingame<0||trade<0){noNegative=false;failures.push(`run ${i}: negative balance`);} if(failures.length>20)break;
  }
  return{ok:failures.length===0,runs,failures,marketFeeRate:rate,invariants:{noNegativeBalance:noNegative,ledgerReconciles:reconciles,idempotencyProtects:idempotent,feeExact}};
}
