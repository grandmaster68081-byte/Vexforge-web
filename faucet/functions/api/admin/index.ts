export const onRequestGet = ({request,env}:{request:Request;env:any}) => Response.redirect(new URL('/admin',request.url),302);
