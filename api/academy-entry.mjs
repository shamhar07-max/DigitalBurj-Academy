import {isIP} from 'node:net';
import {application,secure} from '../server/application.mjs';

// Web Request/Response keeps provider webhook bytes intact on Vercel.
export function routedRequest(request) {
  const url=new URL(request.url),paths=url.searchParams.getAll('__academy_path');
  if(paths.length>1)throw Object.assign(Error('Ambiguous route'),{status:400});
  if(paths.length) {
    const route=paths[0];
    if(route.startsWith('/')||/[\\?#\u0000-\u001f]/.test(route)||route.split('/').includes('..'))throw Object.assign(Error('Invalid route'),{status:400});
    url.pathname='/'+route;url.searchParams.delete('__academy_path');
    return new Request(url,request);
  }
  if(url.pathname==='/api/academy-entry')throw Object.assign(Error('No route'),{status:404});
  return request;
}
export default {
  async fetch(request) {
    try {
      const app=await application();
      const supplied=request.headers.get('x-vercel-forwarded-for')||'';
      const ip=process.env.VERCEL==='1'&&isIP(supplied)?supplied:'unknown';
      return await app.fetch(routedRequest(request),{clientIP:ip});
    } catch(error) {
      return secure(Response.json({error:error.status?'Invalid Academy route.':'The Academy is awaiting its server configuration.'},{status:error.status||503}));
    }
  }
};
