export interface Env {
  SUPABASE_URL:string;
  SUPABASE_SECRET_KEY?:string;
  SUPABASE_SERVICE_ROLE_KEY?:string;
  BITCOTASKS_API_KEY:string;
  BITCOTASKS_BEARER_TOKEN:string;
  BITCOTASKS_SECRET_KEY:string;
  BITCOTASKS_POSTBACK_IP?:string;
}

export function requireEnv(env:Env,key:keyof Env){
  const value=env[key];
  if(!value) throw new Error(`Missing required environment secret: ${String(key)}`);
  return value as string;
}
