import { logout } from '../_lib/auth';
import type { Env } from '../_lib/env';
export const onRequestPost = ({request,env}:{request:Request;env:Env}) => logout(env,request);
