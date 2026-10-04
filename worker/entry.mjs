import {createAPI} from './api.mjs';
import {createAuth} from './auth.mjs';
import {createAcademy} from './academy.mjs';
import {registrationState,gateResponse} from './gate.mjs';
import {professionalAccess} from './access.mjs';
import {alternativeWebhook} from './checkout.mjs';
import {commercialEnv} from './commercial.mjs';
import {claimLaunchAccount} from './operations.mjs';
import C from '../content/curriculum.json';
import mentorship from '../content/mentorship.json';
import atlas from '../content/atlas.json';
import defaultOffers from '../content/default-offers.json';
import assets from '../.generated/assets.mjs';
const api=createAPI(C,atlas),accounts=createAuth(C),academy=createAcademy(atlas,C);
const jsonError=(message,status)=>Response.json({error:message},{status,headers:{'cache-control':'private, no-store'}});
const redirect=(path,r)=>new Response(null,{status:302,headers:{location:new URL(path,r.url).href,'cache-control':'private, no-store'}});
const accountPages=new Set(['/sign-in','/register','/forgot-password','/reset-password','/auth/confirm','/onboarding','/account','/auth.html']);
const publicScripts=new Set(['/academy-luxe.js','/accounts.js','/academy-shell.js','/verify.js','/access.js','/tool-icons.js','/runtime.js']);
const securityHeaders={'x-content-type-options':'nosniff','referrer-policy':'same-origin','permissions-policy':'camera=(), microphone=(self), geolocation=()','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://api.stripe.com https://r.stripe.com https://m.stripe.network https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com; frame-src 'self' blob: https://js.stripe.com https://hooks.stripe.com https://api.razorpay.com https://checkout.razorpay.com; media-src 'self' https://sider-pub.s3.amazonaws.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"};
async function assetResponse(route,r,env){const a=assets[route];if(!a)return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});if(env.ASSETS){const response=await env.ASSETS.fetch(new Request(new URL(route,r.url),{method:r.method}));const h=new Headers(response.headers);for(const [key,value]of Object.entries(securityHeaders))h.set(key,value);h.set('content-type',a.type);h.set('cache-control','private, no-store');return new Response(r.method==='HEAD'?null:response.body,{status:response.status,headers:h})}return new Response(r.method==='HEAD'?null:Uint8Array.from(atob(a.body),c=>c.charCodeAt(0)),{headers:{...securityHeaders,'content-type':a.type,'cache-control':'private, no-store'}})}
const defaultOfferJson=JSON.stringify(defaultOffers);
export default {async fetch(input,env){
 env={...env,ACADEMY_DEFAULT_OFFERS:defaultOfferJson};
 const headers=new Headers(input.headers);
 // Only the native Sites ingress may supply platform identity. Other
 // deployments must resolve their encrypted, provider-verified session.
 if(env.ACADEMY_PLATFORM_AUTH!=='sites'){headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email')}
 const r=new Request(input,{headers}),url=new URL(r.url),p=url.pathname;
 try{
  if(p==='/api/payments/webhook'&&r.method==='POST')return api(r,await commercialEnv(env));
  if(['/api/payments/binance','/api/payments/crypto','/api/payments/gumroad','/api/payments/razorpay'].includes(p)&&r.method==='POST')return alternativeWebhook(r,await commercialEnv(env));
  if(/^\/api\/(auth|account|admin)\//.test(p))return accounts.handle(r,env);
  // Credential lookup contains only the issued public record and has no
  // Academy navigation. It cannot load lessons, tools or personal records.
  if(p.startsWith('/api/academy/verify/'))return academy(r,env,null);
  if(p.startsWith('/api/')){
   const id=await accounts.identity(r,env),gate=registrationState(id);
   if(!gate.allowed)return gateResponse(gate);
   if(p.startsWith('/api/academy/'))return academy(r,/^\/api\/academy\/(bootstrap|readiness|payment\/)/.test(p)?await commercialEnv(env):env,id);
   headers.set('oai-authenticated-user-id',id.id);headers.set('oai-authenticated-user-email',id.email);
   return api(new Request(r,{headers}),await commercialEnv(env));
  }
  if(!['GET','HEAD'].includes(r.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  if(p==='/preview-data.js')return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
  if(p==='/runtime.js')return new Response("window.ACADEMY_MODE='connected';",{headers:{...securityHeaders,'content-type':'text/javascript','cache-control':'no-store'}});
  if(accountPages.has(p))return assetResponse('/auth.html',r,env);
  if(p.startsWith('/verify/'))return assetResponse('/verify.html',r,env);
  const publicAsset=publicScripts.has(p)||p.endsWith('.css')||p.startsWith('/brand/')||p.startsWith('/fonts/');
  if(publicAsset)return assetResponse(p,r,env);
  const id=await accounts.identity(r,env),gate=registrationState(id);
  if(!gate.allowed){const target=new URL(gate.next,r.url);const course=url.searchParams.get('course');if(atlas.tracks.some(t=>t.id===course))target.searchParams.set('course',course);return redirect(target.pathname+target.search,r)}
  await claimLaunchAccount(env,id);
  if(p==='/academy'||p==='/'){const target=new URL('/dashboard',r.url);const course=url.searchParams.get('course');if(atlas.tracks.some(t=>t.id===course))target.searchParams.set('course',course);return redirect(target.pathname+target.search,r)}
  if(['/courses','/courses.html'].includes(p))return redirect('/dashboard#paths',r);
  if(p==='/practice-library.html'){
   const target=new URL('/workspace.html',r.url),programme=url.searchParams.get('programme'),view=url.searchParams.get('view');
   if(C.programmes.some(p=>p.id===programme))target.searchParams.set('programme',programme);
   if(['home','catalog','work','tools','evidence','review','desk','plan'].includes(view))target.searchParams.set('view',view);
   return redirect(target.pathname+target.search,r);
  }
  if(['/admin','/admin.html','/admin.js'].includes(p)&&id.email?.toLowerCase()!==env.ACADEMY_OWNER_EMAIL?.toLowerCase())return jsonError('Owner access required.',403);
  if(['/curriculum.js','/mentorship.js'].includes(p)){
   const ids=await professionalAccess(env,id,C,atlas),programmes=C.programmes.filter(p=>ids.includes(p.id));
   const content=p==='/curriculum.js'?'window.ACADEMY_CONTENT='+JSON.stringify({...C,programmes})+';':'window.ACADEMY_MENTORSHIP='+JSON.stringify(Object.fromEntries(Object.entries(mentorship).filter(([mid])=>programmes.some(p=>p.modules.some(mod=>mod.missions.some(m=>m.id===mid))))))+';';
   return new Response(content,{headers:{...securityHeaders,'content-type':'text/javascript','cache-control':'private, no-store'}});
  }
  if(p==='/preview')return redirect('/dashboard',r);
  const route=['/learn','/dashboard'].includes(p)?'/index.html':p==='/admin'?'/admin.html':p;
  return assetResponse(route,r,env);
 }catch(e){return jsonError(e.status?e.message:'The Academy service is unavailable. Please retry.',e.status||503)}
}};
