import worker from '../dist/server/index.js';
import {createDatabase} from './database.mjs';
import {migrateDatabase,checkDatabase} from './migrate.mjs';
import {readEnvironment} from './environment.mjs';
import {createRequestHandler} from './request-handler.mjs';
export {secure} from './request-handler.mjs';

export async function createApplication(input=process.env) {
  const env=readEnvironment(input),db=createDatabase({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN||undefined});
  try {
    if(env.ACADEMY_AUTO_MIGRATE==='true')await migrateDatabase(db);
    else await checkDatabase(db);
  } catch(error) {db.close();throw error;}
  env.DB=db;
  // Environment-only Razorpay connections are checked without creating a charge.
  // Invalid or unreachable credentials keep checkout closed while learning continues.
  env.RAZORPAY_VERIFIED='';
  if(env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET&&env.RAZORPAY_WEBHOOK_SECRET) {
    try {
      const r=await fetch('https://api.razorpay.com/v1/orders?count=1',{headers:{Authorization:'Basic '+btoa(env.RAZORPAY_KEY_ID+':'+env.RAZORPAY_KEY_SECRET)},signal:AbortSignal.timeout(15000)});
      if(r.ok)env.RAZORPAY_VERIFIED=new Date().toISOString();
      await r.body?.cancel();
    } catch { /* Owner readiness shows an unverified connection; no access is granted. */ }
  }
  const dispatch=createRequestHandler({worker,env,db});
  return {env,db,fetch:dispatch,close:()=>db.close()};
}
let appPromise;
export async function application() {
  if(!appPromise)appPromise=createApplication().catch(error=>{appPromise=null;throw error;});
  return appPromise;
}
