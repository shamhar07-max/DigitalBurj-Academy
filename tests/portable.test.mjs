import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createDatabase} from '../server/database.mjs';
import {migrateDatabase,checkDatabase} from '../server/migrate.mjs';
import manifest from '../server/migration-manifest.mjs';
import {readEnvironment} from '../server/environment.mjs';
import {createApplication} from '../server/application.mjs';
import {nodeHandler,clientIP} from '../server/http.mjs';
import {routedRequest} from '../api/academy-entry.mjs';
import {purchaseTerms} from '../worker/checkout.mjs';

let checks=0;
const check=(value,message)=>{assert(value,message);checks++;};
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'digitalburj-portable-')),url='file:'+path.join(temporary,'academy.db');
const config={NODE_ENV:'development',ACADEMY_PUBLIC_URL:'http://127.0.0.1:3000',ACADEMY_OWNER_EMAIL:'owner@example.test',ACADEMY_SESSION_KEY:'ab'.repeat(32),SUPABASE_URL:'https://fixture-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-publishable',TURSO_DATABASE_URL:url,ACADEMY_AUTO_MIGRATE:'true',ACADEMY_PAYMENT_PUBLIC:'true'};
const nativeFetch=globalThis.fetch;
let db=createDatabase({url}),app,server;
const users=new Map(),payments=new Map(),orders=new Map();
const user=email=>({id:email.split('@')[0],email,email_confirmed_at:'2026-01-01T00:00:00Z'});
for(const email of ['owner@example.test','learner@example.test','demo@example.test','teacher@example.test'])users.set(email,user(email));
const tokens=u=>({access_token:u.email,refresh_token:'refresh:'+u.email,expires_in:3600,user:u});
globalThis.fetch=async(input,options={})=>{
  const u=new URL(typeof input==='string'?input:input.url);
  if(u.origin===config.SUPABASE_URL){
    const body=options.body?JSON.parse(options.body):{};
    if(u.pathname==='/auth/v1/signup')return Response.json({user:users.get(body.email)});
    if(u.pathname==='/auth/v1/token')return Response.json(tokens(users.get(body.email||body.refresh_token?.slice(8))));
    if(u.pathname==='/auth/v1/verify')return Response.json(tokens(users.get(body.token_hash)));
    if(u.pathname==='/auth/v1/user')return Response.json(users.get(options.headers.Authorization?.slice(7))||{});
    if(u.pathname==='/auth/v1/logout')return Response.json({});
    if(u.pathname==='/auth/v1/recover')return Response.json({});
    throw Error('Unexpected identity fixture');
  }
  if(u.origin==='https://api.razorpay.com'){
    if(u.search)return Response.json({});
    if(u.pathname==='/v1/orders'&&options.method==='POST'){
      const b=JSON.parse(options.body),o={...b,id:'order_PortableFixture',status:'created',amount_paid:0,amount_due:b.amount};orders.set(o.id,o);return Response.json(o);
    }
    if(u.pathname.endsWith('/payments')&&u.pathname.startsWith('/v1/orders/'))return Response.json({items:[...payments.values()]});
    if(u.pathname.startsWith('/v1/orders/'))return Response.json(orders.get(u.pathname.split('/')[3])||{});
    if(u.pathname.startsWith('/v1/payments/'))return Response.json(payments.get(u.pathname.split('/')[3])||{});
    throw Error('Unexpected merchant fixture');
  }
  return nativeFetch(input,options);
};
async function status(response,expected){assert.equal(response.status,expected);checks++;return response.headers.get('content-type')?.includes('application/json')?response.json():response.text();}
let origin=config.ACADEMY_PUBLIC_URL;
async function call(route,{method='GET',body,cookie='',headers={},vercel=false}={}){
  const r=new Request(origin+(vercel?'/api/academy-entry?__academy_path='+encodeURIComponent(route.slice(1)):route),{method,headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  return app.fetch(vercel?routedRequest(r):r,{clientIP:'127.0.0.1'});
}
async function login(email){
  const r=await call('/api/auth/login',{method:'POST',body:{email,password:'fixture-passphrase-only'}});
  await status(r.clone(),200);
  const cookie=r.headers.get('set-cookie').split(';')[0];
  check(r.headers.get('set-cookie').includes('HttpOnly')&&r.headers.get('set-cookie').includes('Secure'),'Secure cookie flags');
  return cookie;
}
async function onboard(cookie,name){return status(await call('/api/account/profile',{method:'PUT',cookie,body:{name,country:'India',goal:'DB-00',hours:5,timezone:'Asia/Kolkata',consent:true}}),200);}
const signature=async(raw,secret)=>Buffer.from(await crypto.subtle.sign('HMAC',await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']),new TextEncoder().encode(raw))).toString('hex');
try {
  check((await migrateDatabase(db)).applied===8,'All migrations applied');
  check((await migrateDatabase(db)).applied===0,'Migrations idempotent');
  check((await checkDatabase(db)).migrations===8,'Migration checksums verified');
  check((await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name<>'_academy_migrations'").first()).n===26,'26 application tables');
  await assert.rejects(migrateDatabase(db,[{...manifest[0],checksum:'changed'},...manifest.slice(1)]));checks++;
  await assert.rejects(db.batch([db.prepare("INSERT INTO settings(key,value,updated) VALUES('atomic','one','now')"),db.prepare("INSERT INTO settings(key,value,updated) VALUES('atomic','two','now')")]));checks++;
  check(await db.prepare("SELECT * FROM settings WHERE key='atomic'").first()===null,'Failed write batch rolls back every statement');
  await db.prepare("INSERT INTO settings(key,value,updated) VALUES('persistent','yes','now')").run();
  db.close();db=createDatabase({url});
  check((await db.prepare("SELECT value FROM settings WHERE key='persistent'").first('value'))==='yes','Data survives independent connections');
  await assert.rejects(async()=>readEnvironment({...config,NODE_ENV:'production'}));checks++;
  await assert.rejects(async()=>readEnvironment({...config,ACADEMY_SESSION_KEY:'bad'}));checks++;
  check(readEnvironment({...config,ACADEMY_PLATFORM_AUTH:'sites'}).ACADEMY_PLATFORM_AUTH==='','Native header auth disabled on every portable host');
  check(clientIP({socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'198.51.100.1, 203.0.113.2'}},{ACADEMY_TRUST_PROXY:'1'})==='203.0.113.2','Proxy uses selected rightmost trusted hop');
  check(clientIP({socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'198.51.100.1'}},{})==='127.0.0.1','Forwarded IP ignored unless explicitly configured');
  app=await createApplication(config);
  const health=await status(await call('/healthz'),200);check(health.status==='ready','Actual database readiness');
  const auth=await status(await call('/api/auth/config'),200);check(auth.emailPassword&&!auth.chatgpt,'Independent email/password identity');
  check((await call('/dashboard')).headers.get('location').endsWith('/sign-in'),'Dashboard anonymous gate');
  for(const route of ['/workspace.html','/app.js','/curriculum.js','/academy-production.js','/api/academy/bootstrap','/api/academy/course/web','/api/admin/overview']){
    const r=await call(route,{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}});
    check([302,401,403].includes(r.status),'Forged platform headers cannot open '+route);
  }
  const register=await status(await call('/register'),200);check(!register.includes('id="sidebar"'),'No course sidebar on registration');
  await status(await call('/preview-data.js'),404);
  await status(await app.fetch(new Request('https://other.example.test/dashboard')),308);
  await status(await app.fetch(new Request('https://other.example.test/api/auth/login',{method:'POST'})),421);
  await status(await app.fetch(new Request(origin+'/api/auth/login',{method:'POST',body:'x'.repeat(2000001)})),413);
  await status(await call('/api/auth/signup',{method:'POST',body:{email:'learner@example.test',password:'fixture-12-characters',consent:true}}),202);
  const ownerCookie=await login('owner@example.test');
  check((await call('/dashboard',{cookie:ownerCookie})).headers.get('location').endsWith('/register'),'Login alone does not bypass profile registration');
  await onboard(ownerCookie,'Owner fixture');
  await status(await call('/api/academy/operations/initialize',{method:'POST',cookie:ownerCookie,body:{}}),200);
  let owner=await status(await call('/api/academy/bootstrap',{cookie:ownerCookie}),200);check(owner.user.role==='Owner','Verified owner email becomes administrator');
  const accounts=await status(await call('/api/academy/operations',{cookie:ownerCookie}),200);check(accounts.accounts.length===8,'Admin, demo and six teacher slots');
  const learnerCookie=await login('learner@example.test');await onboard(learnerCookie,'Learner fixture');
  await status(await call('/api/academy/operations',{cookie:learnerCookie}),403);
  await status(await call('/api/academy/course/web',{cookie:learnerCookie}),403);
  await status(await call('/api/academy/course/start',{cookie:learnerCookie}),200);
  await status(await call('/api/account/profile',{method:'PUT',cookie:learnerCookie,headers:{origin:'https://evil.example.test'},body:{}}),403);
  await status(await call('/api/academy/plan',{method:'PUT',cookie:learnerCookie,body:{mode:'Guided',courseId:'start',hours:6,days:[1,3,5],timezone:'Asia/Kolkata',expectedRevision:0}}),200);
  const saved=await status(await call('/api/academy/plan',{cookie:learnerCookie,vercel:true}),200);check(saved.plan.hours===6,'Vercel rewrite sees the same durable plan');
  const expires=new Date(Date.now()+180*86400000).toISOString().slice(0,10);
  await status(await call('/api/academy/operations/account',{method:'PUT',cookie:ownerCookie,body:{slotId:'demo',name:'Demo fixture',email:'demo@example.test',expires}}),200);
  await status(await call('/api/academy/operations/account',{method:'PUT',cookie:ownerCookie,body:{slotId:'teacher-1',name:'Teacher fixture',email:'teacher@example.test',expires,domains:['web'],qualification:'The owner has checked this teacher’s actual professional experience, subject qualifications, teaching demonstration and references. Controlled fixture only.',qualificationChecked:true}}),200);
  const demoCookie=await login('demo@example.test');await onboard(demoCookie,'Demo fixture');
  check((await status(await call('/api/academy/bootstrap',{cookie:demoCookie}),200)).entitlements.length===129,'Demo has complete guided scope');
  const demoContent=await status(await call('/curriculum.js',{cookie:demoCookie}),200);check(JSON.parse(demoContent.slice('window.ACADEMY_CONTENT='.length,-1)).programmes.length===48,'Demo has all professional programmes');
  const teacherCookie=await login('teacher@example.test');await onboard(teacherCookie,'Teacher fixture');
  check((await status(await call('/api/academy/bootstrap',{cookie:teacherCookie}),200)).user.role==='Mentor','Verified teacher appointment activates');
  await status(await call('/api/academy/course/ai',{cookie:teacherCookie}),403);
  const keySecret='fixture-secret-portable',webhookSecret='fixture-webhook-portable';
  await status(await call('/api/academy/operations/merchant',{method:'PUT',cookie:ownerCookie,body:{keyId:'rzp_live_1234567890123456',keySecret,webhookSecret}}),200);
  const encrypted=await db.prepare("SELECT value FROM settings WHERE key='merchant_razorpay'").first('value');check(!encrypted.includes(keySecret)&&!encrypted.includes(webhookSecret),'Merchant secrets encrypted through actual libSQL');
  const product={id:'web-course',title:'Web fixture course',status:'Live',amount:99900,currency:'INR',courseIds:['web'],durationDays:365,termsUrl:'https://example.test/terms',refundPolicy:'Controlled fixture policy only; no actual merchant charge.',approved:true};
  await status(await call('/api/academy/operations/products',{method:'PUT',cookie:ownerCookie,body:{products:[product]}}),200);
  const paymentConfig=await status(await call('/api/academy/payment/config',{cookie:learnerCookie}),200);
  check(paymentConfig.razorpay&&!JSON.stringify(paymentConfig).includes(keySecret),'Live readiness contains public values only');
  const order=await status(await call('/api/academy/payment/session',{method:'POST',cookie:learnerCookie,vercel:true,body:{productId:product.id,provider:'razorpay',requestKey:'portable-fixture-0001',acceptTerms:true,expectedTerms:purchaseTerms(paymentConfig.products[0])}}),200);
  const p={id:'pay_PortableFixture',order_id:order.providerOrderId,amount:99900,currency:'INR',status:'captured',captured:true,amount_refunded:0};payments.set(p.id,p);
  Object.assign(orders.get(order.providerOrderId),{status:'paid',amount_paid:99900,amount_due:0});
  const confirm={orderId:order.orderId,providerOrderId:order.providerOrderId,paymentId:p.id,signature:await signature(order.providerOrderId+'|'+p.id,keySecret)};
  await status(await call('/api/academy/payment/razorpay/confirm',{method:'POST',cookie:learnerCookie,body:confirm}),200);
  await status(await call('/api/academy/payment/razorpay/confirm',{method:'POST',cookie:learnerCookie,body:confirm}),200);
  check((await db.prepare('SELECT count(*) AS n FROM payment_receipts WHERE order_id=?').bind(order.orderId).first()).n===1,'Repeated confirmation preserves one receipt');
  await status(await call('/api/academy/course/web',{cookie:learnerCookie}),200);
  app.env.ACADEMY_PAYMENT_PUBLIC='false';
  app.env.STRIPE_SECRET_KEY='fixture-key';app.env.STRIPE_PUBLISHABLE_KEY='fixture-public';app.env.STRIPE_WEBHOOK_SECRET='fixture-signing';
  const paused=await status(await call('/api/academy/payment/config',{cookie:learnerCookie}),200);
  check(!paused.razorpay&&!paused.stripe&&!paused.gumroad&&!paused.binance&&!paused.crypto,'Explicit payment pause closes every provider');
  await status(await call('/api/checkout',{method:'POST',cookie:learnerCookie,body:{productId:product.id}}),409);
  const notification=' { "event":"payment.captured", "payload":{"payment":{"entity":'+JSON.stringify(p)+'}} } ';
  const hook=new Request(origin+'/api/academy-entry?__academy_path=api%2Fpayments%2Frazorpay',{method:'POST',headers:{'content-type':'application/json','x-razorpay-signature':await signature(notification,webhookSecret)},body:notification});
  await status(await app.fetch(routedRequest(hook)),200);
  check((await db.prepare('SELECT count(*) AS n FROM entitlements WHERE user_id=? AND course_id=? AND source_id=?').bind('sb:learner','web',order.orderId).first()).n===1,'Signed raw-body webhook is idempotent');
  server=http.createServer(nodeHandler(app));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const local='http://127.0.0.1:'+server.address().port;
  app.env.ACADEMY_PUBLIC_URL=local;origin=local;
  const liveHealth=await nativeFetch(local+'/healthz');await status(liveHealth,200);check(liveHealth.headers.get('cache-control').includes('no-store'),'Node health response is not cached');
  await status(await nativeFetch(local+'/register'),200);
  const liveCookie=await nativeFetch(local+'/api/auth/login',{method:'POST',headers:{origin:local,'content-type':'application/json'},body:JSON.stringify({email:'learner@example.test',password:'fixture-passphrase-only'})});await status(liveCookie.clone(),200);check(liveCookie.headers.get('set-cookie').startsWith('__Host-academy_session='),'Actual Node transport returns signed-in secure session');
  const rawPost=await nativeFetch(local+'/api/payments/razorpay',{method:'POST',headers:{'content-type':'application/json','x-razorpay-signature':await signature(notification,webhookSecret)},body:notification});await status(rawPost,200);
  check((await status(await nativeFetch(local+'/api/auth/session'),200)).signedIn===false,'No anonymous session is manufactured');
  check((await status(await nativeFetch(local+'/api/auth/session',{headers:{cookie:learnerCookie}}),200)).registered===true,'Sessions survive separate actual HTTP requests');
  await status(await call('/api/auth/logout',{method:'POST',cookie:learnerCookie,body:{}}),200);
  check((await status(await call('/api/auth/session',{cookie:learnerCookie}),200)).signedIn===false,'Logout removes the stored session');
  fs.mkdirSync('docs',{recursive:true});
  fs.writeFileSync('docs/portable-validation.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,errors:[],database:'Actual @libsql/client SQLite file with persistence, checksum migrations and atomic batches',scope:'Actual compiled Academy, email-session API, roles, purchases, signed notifications and Node HTTP; provider identity and merchant responses are controlled test fixtures. No remote deployment or live charge.'},null,2));
  console.log('Portable deployment checks passed: '+checks);
} finally {
  globalThis.fetch=nativeFetch;
  if(server)await new Promise(resolve=>server.close(resolve));
  app?.close();db.close();fs.rmSync(temporary,{recursive:true,force:true});
}
