import {isIP} from 'node:net';
import {secure} from './application.mjs';

export function clientIP(req,env) {
  const remote=req.socket?.remoteAddress||'unknown',hops=Number(env.ACADEMY_TRUST_PROXY||0);
  if(hops>0) {
    const chain=String(req.headers['x-forwarded-for']||'').split(',').map(s=>s.trim()).filter(Boolean);
    const candidate=chain[chain.length-hops];
    if(candidate&&isIP(candidate))return candidate;
  }
  return remote;
}
export function nodeHandler(app) {
  return async function handle(req,res) {
    try {
      if(!req.url||!req.url.startsWith('/')||req.url.startsWith('//'))throw Object.assign(Error(),{status:400});
      const origin=app.env.ACADEMY_PUBLIC_URL,url=new URL(req.url,origin);
      const host=String(req.headers.host||'').toLowerCase();
      if(host!==new URL(origin).host&&url.pathname!=='/healthz') {
        const response=['GET','HEAD'].includes(req.method)?new Response(null,{status:308,headers:{location:url.href}}):Response.json({error:'Use the configured Academy address.'},{status:421});
        return write(res,secure(response,app.env),req.method);
      }
      const headers=new Headers();
      for(const [key,value] of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(', '):value);
      let body=null;
      if(!['GET','HEAD'].includes(req.method)) {
        const chunks=[];let length=0;
        for await(const chunk of req) {
          length+=chunk.length;if(length>2000000)throw Object.assign(Error(),{status:413});
          chunks.push(chunk);
        }
        body=Buffer.concat(chunks);
      }
      const request=new Request(url,{method:req.method,headers,...(body?{body}:{})});
      return write(res,await app.fetch(request,{clientIP:clientIP(req,app.env)}),req.method);
    } catch(error) {
      const response=Response.json({error:error.status===413?'This request is too large.':'The request could not be handled.'},{status:error.status||503});
      if(!res.headersSent)await write(res,secure(response,app.env),req.method);
      else res.end();
    }
  };
}
async function write(res,response,method) {
  const headers=Object.fromEntries(response.headers);
  const cookies=response.headers.getSetCookie();
  if(cookies.length)headers['set-cookie']=cookies;
  res.writeHead(response.status,headers);
  res.end(method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
}
