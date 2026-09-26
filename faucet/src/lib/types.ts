export type User={id:string;publicId:string;username:string;email:string;role:'user'|'admin'};
export type Wallet={availablePoints:number;pendingPoints:number;lifetimeEarnedPoints:number;lifetimeWithdrawnPoints:number;debtPoints:number};
export type Withdrawal={id:string;amountPoints:number;asset:string;network:string;destination:string;status:string;txHash?:string;adminNote?:string;createdAt:string};
export type LedgerEntry={id:number;type:string;source:string;referenceId?:string;pointsDelta:number;status:string;createdAt:string};
export type EarnCategory='all'|'surveys'|'offers'|'ptc'|'video'|'faucet'|'shortlinks'|'tasks'|'article';
export type EarnItem={id:string|number;category:Exclude<EarnCategory,'all'>;title:string;description:string;image?:string;reward:number;currencyName:string;url:string;source:string;durationSeconds?:number;boosted?:boolean;requirements?:string;available?:number;earnUpTo?:number;claimed?:number;limit?:number;waitSeconds?:number;approvalRate?:number|null;blocked?:boolean;goals?:{name:string;description?:string;virtualCurrencyValue?:number}[];raw?:any};
export type PlatformConfig={currencyName:string;pointsPerUsdDisplay:number;withdrawalMinPoints:number;targetUserShareBps:number;supportedPayouts:{asset:string;network:string}[]};
