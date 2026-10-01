import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server/application.mjs';
import {createNetlifyHandler,config as routes} from '../netlify/functions/academy.mjs';

let checks=0;
function check(value,label){assert(value,label);checks++;}
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'digitalburj-netlify-'));
const origin='http://127.0.0.1:3000';
const environment={NODE_ENV:'development',ACADEMY_PUBLIC_URL:origin,ACADEMY_OWNER_EMAIL:'owner@example.test',ACADEMY_SESSION_KEY:'ab'.repeat(32),SUPABASE_URL:'https://netlify-fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-key',TURSO_DATABASE_URL:'file:'+path.join(temporary,'academy.db'),ACADEMY_AUTO_MIGRATE:'true',ACADEMY_PAYMENT_PUBLIC:'false'};
const nativeFetch=globalThis.fetch;
let app;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url);
  if(url.origin!==environment.SUPABASE_URL)return nativeFetch(input,options);
  const body=options.body?JSON.parse(options.body):{};
  const email=body.email||options.headers?.Authorization?.slice(7)||'learner@example.test';
  const user={id:email.split('@')[0],email,email_confirmed_at:'2026-01-01T00:00:00Z'};
  if(url.pathname==='/auth/v1/token')return Response.json({user,access_token:email,refresh_token:'fixture-refresh',expires_in:3600});
  if(url.pathname==='/auth/v1/user')return Response.json(user);
  throw Error('Unexpected fixture request');
};

try {
  check(routes.path==='/*'&&routes.preferStatic===false,'All routes use the protected handler');
  const raw=new Uint8Array([0,10,13,32,255,123,125]);
  let seen;
  const inspect=createNetlifyHandler(async()=>({async fetch(request,options){seen={url:request.url,body:new Uint8Array(await request.arrayBuffer()),options};return new Response('ok',{headers:{'set-cookie':'session=fixture; Secure; HttpOnly','cache-control':'private, no-store'}});}}));
  const url=origin+'/api/payments/razorpay?keep=a%2Bb';
  const response=await inspect(new Request(url,{method:'POST',headers:{'x-forwarded-for':'1.1.1.1','cf-connecting-ip':'2.2.2.2'},body:raw}),{ip:'203.0.113.10'});
  check(seen.url===url,'Original path and query preserved');
  check(Buffer.from(seen.body).equals(Buffer.from(raw)),'Webhook bytes preserved including binary and whitespace');
  check(seen.options.clientIP==='203.0.113.10','IP comes from platform context');
  check(response.headers.get('set-cookie').includes('HttpOnly'),'Secure session response retained');
  check(response.headers.get('netlify-cdn-cache-control')==='private, no-store','Netlify CDN cannot cache private responses');
  await inspect(new Request(origin,{headers:{'x-forwarded-for':'1.1.1.1'}}),{ip:'untrusted-value'});
  check(seen.options.clientIP==='unknown','Invalid platform IP does not fall back to client headers');
  const failed=await createNetlifyHandler(async()=>{throw Error('fixture-secret');})(new Request(origin));
  check(failed.status===503&&!((await failed.text()).includes('fixture-secret')),'Configuration failure does not expose secrets');
  check(failed.headers.get('netlify-cdn-cache-control')==='private, no-store','Error responses are private');

  app=await createApplication(environment);
  const handle=createNetlifyHandler(async()=>app);
  const request=(route,{method='GET',body,cookie='',headers={}}={})=>handle(new Request(origin+route,{method,headers:{origin,'content-type':'application/json',...headers,...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})}),{ip:'203.0.113.10'});
  const health=await request('/healthz');
  check(health.status===200&&(await health.json()).status==='ready','Handler reaches actual database readiness');
  const register=await request('/register');
  check(register.status===200&&!((await register.text()).includes('id="sidebar"')),'Registration has no Academy sidebar');
  for(const route of ['/dashboard','/workspace.html','/app.js','/curriculum.js','/api/academy/bootstrap','/api/admin/overview']) {
    const result=await request(route,{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}});
    check([302,401,403].includes(result.status),'Anonymous or forged identity cannot open '+route);
    check(result.headers.get('netlify-cdn-cache-control')==='private, no-store','Protected route bypasses Netlify cache '+route);
  }
  const login=await request('/api/auth/login',{method:'POST',body:{email:'learner@example.test',password:'fixture-passphrase'}});
  check(login.status===200,'Verified identity fixture can sign in');
  const cookie=login.headers.get('set-cookie').split(';')[0];
  check(login.headers.get('set-cookie').includes('Secure')&&login.headers.get('set-cookie').includes('HttpOnly'),'Real authentication cookie keeps its flags');
  check((await request('/dashboard',{cookie})).headers.get('location').endsWith('/register'),'Profile completion required after sign-in');
  const profile=await request('/api/account/profile',{method:'PUT',cookie,body:{name:'Netlify learner fixture',country:'India',goal:'DB-00',hours:5,timezone:'Asia/Kolkata',consent:true}});
  check(profile.status===200,'Profile saved to persistent database');
  check((await request('/api/academy/course/start',{cookie})).status===200,'Registered learner can open free learning');
  check((await request('/api/academy/course/web',{cookie})).status===403,'Unpurchased course stays locked');
  check((await request('/api/academy/operations',{cookie})).status===403,'Learner cannot use administrator operations');
  check((await request('/dashboard',{cookie})).status===200,'Registered dashboard opens through the handler');
  const spoof=await request('/api/account/profile',{method:'PUT',cookie,headers:{origin:'https://evil.example.test'},body:{}});
  check(spoof.status===403,'Cross-origin writes rejected');
  const alternate=await handle(new Request('https://alternate.example.test/api/auth/login',{method:'POST'}),{ip:'203.0.113.10'});
  check(alternate.status===421,'POST to a different origin rejected');
  const large=await handle(new Request(origin+'/api/auth/login',{method:'POST',body:'x'.repeat(2000001)}),{ip:'203.0.113.10'});
  check(large.status===413,'Request body size limit retained');
  console.log('Netlify handler: '+checks+' checks passed. Actual application and local libSQL; identity responses are fixtures.');
} finally {
  app?.close();globalThis.fetch=nativeFetch;fs.rmSync(temporary,{recursive:true,force:true});
}
