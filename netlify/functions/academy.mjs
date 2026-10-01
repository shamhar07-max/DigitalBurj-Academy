import {isIP} from 'node:net';
import {application,secure} from '../../server/application.mjs';

// Netlify provides the original Web Request and a trusted client IP in context.
// Do not reconstruct JSON: merchant signatures require the original body bytes.
export function createNetlifyHandler(resolveApplication=application) {
  return async function academy(request,context={}) {
    try {
      const app=await resolveApplication();
      const supplied=typeof context.ip==='string'?context.ip:'';
      const response=await app.fetch(request,{clientIP:isIP(supplied)?supplied:'unknown'});
      const headers=new Headers(response.headers);
      headers.set('netlify-cdn-cache-control','private, no-store');
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    } catch {
      const response=secure(Response.json({error:'The Academy is awaiting its server configuration.'},{status:503}));
      response.headers.set('netlify-cdn-cache-control','private, no-store');
      return response;
    }
  };
}

export default createNetlifyHandler();

// Every page, asset, API and callback uses the same authenticated application.
export const config={path:'/*',preferStatic:false};
