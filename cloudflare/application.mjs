import {createCloudflareDatabase} from './database.mjs';
import {readEnvironment} from '../server/environment.mjs';
import {checkDatabase} from '../server/migrate.mjs';
import {createRequestHandler} from '../server/request-handler.mjs';

export async function createCloudflareApplication(input, worker) {
  const env = readEnvironment({...input, NODE_ENV: 'production'});
  if (env.ACADEMY_AUTO_MIGRATE === 'true') {
    throw Error('Run database migrations explicitly before deploying Cloudflare.');
  }
  if (!input.ASSETS?.fetch) throw Error('Cloudflare ASSETS binding is required.');
  const db = createCloudflareDatabase({url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN});
  try {
    await checkDatabase(db);
    env.DB = db;
    env.RAZORPAY_VERIFIED = '';
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET) {
      try {
        const r = await fetch('https://api.razorpay.com/v1/orders?count=1', {
          headers: {Authorization: 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET)},
          signal: AbortSignal.timeout(15000)
        });
        if (r.ok) env.RAZORPAY_VERIFIED = new Date().toISOString();
        await r.body?.cancel();
      } catch { /* Invalid merchant settings leave checkout closed. */ }
    }
    return {env, db, fetch: createRequestHandler({worker, env, db}), close: () => db.close()};
  } catch (error) {db.close(); throw error;}
}
