import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Miniflare, Log, LogLevel, convertV4MiniflareOptions} from 'miniflare';
import {hranaFixture} from './fixtures/hrana.mjs';
import {purchaseTerms} from '../worker/checkout.mjs';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-cloudflare-runtime-'));
const fixture = await hranaFixture('file:' + path.join(temporary, 'academy.db'));
const origin = 'https://academy.example.test', supabase = 'https://fixture-project.supabase.co';
const users = new Map(['owner', 'learner', 'demo', 'teacher'].map(name => [name + '@example.test', {
  id: name, email: name + '@example.test', email_confirmed_at: '2026-01-01T00:00:00Z'
}]));
const tokens = user => ({access_token: user.email, refresh_token: 'refresh:' + user.email, expires_in: 3600, user});
const orders = new Map(), payments = new Map();
const merchantSecret = 'fixture-merchant-cloudflare', webhookSecret = 'fixture-webhook-cloudflare';
let checks = 0, mf;
const check = (v, message) => {assert(v, message); checks++;};
const status = async (r, expected) => {assert.equal(r.status, expected, await r.clone().text()); checks++;
  return r.headers.get('content-type')?.includes('application/json') ? r.json() : r.text();};
const signature = async (raw, secret) => Buffer.from(await crypto.subtle.sign('HMAC',
  await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']),
  new TextEncoder().encode(raw))).toString('hex');

async function provider(request) {
  const u = new URL(request.url);
  if (u.origin === 'https://database.example.test') return fixture.fetch(request);
  if (u.origin === supabase) {
    const b = request.body ? await request.json() : {};
    if (u.pathname === '/auth/v1/signup') return Response.json({user: users.get(b.email)});
    if (u.pathname === '/auth/v1/token') return Response.json(tokens(users.get(b.email || b.refresh_token?.slice(8))));
    if (u.pathname === '/auth/v1/user') return Response.json(users.get(request.headers.get('authorization')?.slice(7)) || {});
    if (u.pathname === '/auth/v1/logout' || u.pathname === '/auth/v1/recover') return Response.json({});
  }
  if (u.origin === 'https://api.razorpay.com') {
    if (u.search) return Response.json({});
    if (u.pathname === '/v1/orders' && request.method === 'POST') {
      const b = await request.json(), o = {...b, id: 'order_CloudflareFixture', status: 'created', amount_paid: 0, amount_due: b.amount};
      orders.set(o.id, o); return Response.json(o);
    }
    if (u.pathname.endsWith('/payments') && u.pathname.startsWith('/v1/orders/')) return Response.json({items: [...payments.values()]});
    if (u.pathname.startsWith('/v1/orders/')) return Response.json(orders.get(u.pathname.split('/')[3]) || {});
    if (u.pathname.startsWith('/v1/payments/')) return Response.json(payments.get(u.pathname.split('/')[3]) || {});
  }
  throw Error('Unexpected outbound fixture URL: ' + u.origin + u.pathname);
}
async function call(route, {method = 'GET', body, cookie = '', headers = {}} = {}) {
  return mf.dispatchFetch(origin + route, {method, redirect: 'manual', headers: {
    origin, 'content-type': 'application/json', ...(cookie ? {cookie} : {}), ...headers
  }, ...(body ? {body: typeof body === 'string' ? body : JSON.stringify(body)} : {})});
}
async function login(name) {
  const r = await call('/api/auth/login', {method: 'POST', body: {email: name + '@example.test', password: 'fixture-passphrase-only'}});
  await status(r.clone(), 200);
  check(r.headers.get('set-cookie')?.includes('HttpOnly') && r.headers.get('set-cookie').includes('Secure'), 'Native Worker emits a secure session cookie');
  return r.headers.get('set-cookie').split(';')[0];
}
async function onboard(cookie, name) {
  return status(await call('/api/account/profile', {method: 'PUT', cookie, body: {
    name, country: 'India', goal: 'DB-00', hours: 5, timezone: 'Asia/Kolkata', consent: true
  }}), 200);
}

try {
  mf = new Miniflare(convertV4MiniflareOptions({name: 'academy-fixture', modules: true, scriptPath: '.cloudflare/worker.mjs',
    compatibilityDate: '2026-10-01', log: new Log(LogLevel.ERROR), outboundService: provider,
    assets: {directory: '.cloudflare/assets', binding: 'ASSETS', run_worker_first: true, routerConfig: {has_user_worker: true},
      assetConfig: {html_handling: 'none', not_found_handling: 'none'}},
    bindings: {NODE_ENV: 'production', ACADEMY_PUBLIC_URL: origin, ACADEMY_OWNER_EMAIL: 'owner@example.test',
      ACADEMY_SESSION_KEY: 'ab'.repeat(32), SUPABASE_URL: supabase, SUPABASE_PUBLISHABLE_KEY: 'fixture',
      TURSO_DATABASE_URL: 'https://database.example.test', TURSO_AUTH_TOKEN: 'fixture',
      ACADEMY_AUTO_MIGRATE: 'false', ACADEMY_PAYMENT_PUBLIC: 'true'}
  }));
  await mf.ready;
  check((await status(await call('/healthz'), 200)).status === 'ready', 'Actual workerd reaches SQLite over the HTTP SDK');
  const registration = await call('/register');
  check(registration.headers.get('cache-control') === 'private, no-store', 'Native Worker response cannot be publicly cached');
  const registrationHTML=await status(registration,200);
  check(registrationHTML.includes('/accounts.js') && !registrationHTML.includes('id="sidebar"'), 'Account shell is served through native ASSETS binding without dashboard navigation');
  check((await call('/dashboard')).headers.get('location') === origin + '/sign-in', 'Native static assets never bypass registration');
  for (const route of ['/workspace.html', '/app.js', '/curriculum.js', '/academy-production.js', '/admin.js']) {
    await status(await call(route, {headers: {'oai-authenticated-user-id': 'owner', 'oai-authenticated-user-email': 'owner@example.test'}}), 302);
  }
  await status(await call('/api/academy/bootstrap'), 401);
  await status(await call('/preview-data.js'), 404);
  const brandAsset=await call('/brand/academy-lockup.webp');
  assert.equal(brandAsset.status,200);checks++;
  check(Buffer.from(await brandAsset.arrayBuffer()).equals(fs.readFileSync('dist/brand/academy-lockup.webp')), 'Native asset delivery preserves exact original brand bytes');
  const config = await status(await call('/api/auth/config'), 200);
  check(config.emailPassword && !config.chatgpt, 'Independent sign-in is active on Cloudflare');
  await status(await mf.dispatchFetch('https://different.example.test/dashboard', {redirect: 'manual'}), 308);
  await status(await mf.dispatchFetch('https://different.example.test/api/auth/login', {method: 'POST', redirect: 'manual'}), 421);
  await status(await call('/api/auth/login', {method: 'POST', body: 'x'.repeat(2000001)}), 413);
  const owner = await login('owner');
  check((await call('/dashboard', {cookie: owner})).headers.get('location') === origin + '/register', 'Provider sign-in requires the Academy profile');
  await onboard(owner, 'Owner fixture');
  await status(await call('/api/academy/operations/initialize', {method: 'POST', cookie: owner, body: {}}), 200);
  const accounts = await status(await call('/api/academy/operations', {cookie: owner}), 200);
  check(accounts.accounts.length === 8, 'Owner, demo and six teacher slots survive the Cloudflare transport');
  const learner = await login('learner'); await onboard(learner, 'Learner fixture');
  await status(await call('/dashboard', {cookie: learner}), 200);
  await status(await call('/api/academy/course/start', {cookie: learner}), 200);
  await status(await call('/api/academy/course/web', {cookie: learner}), 403);
  await status(await call('/api/academy/operations', {cookie: learner}), 403);
  await status(await call('/api/account/profile', {method: 'PUT', cookie: learner, headers: {origin: 'https://evil.example.test'}, body: {}}), 403);
  await status(await call('/api/academy/plan', {method: 'PUT', cookie: learner, body: {
    mode: 'Guided', courseId: 'start', hours: 6, days: [1, 3, 5], timezone: 'Asia/Kolkata', expectedRevision: 0
  }}), 200);
  check((await status(await call('/api/academy/plan', {cookie: learner}), 200)).plan.hours === 6, 'Learning plan persists across native Worker requests');
  const expires = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
  await status(await call('/api/academy/operations/account', {method: 'PUT', cookie: owner, body: {
    slotId: 'demo', name: 'Demo fixture', email: 'demo@example.test', expires
  }}), 200);
  const demo = await login('demo'); await onboard(demo, 'Demo fixture');
  check((await status(await call('/api/academy/bootstrap', {cookie: demo}), 200)).entitlements.length === 18, 'Demo receives the full guided course scope');
  const professional = await status(await call('/curriculum.js', {cookie: demo}), 200);
  check(JSON.parse(professional.slice('window.ACADEMY_CONTENT='.length, -1)).programmes.length === 48, 'Professional workspace retains all programmes');
  await status(await call('/api/academy/operations/merchant', {method: 'PUT', cookie: owner, body: {
    keyId: 'rzp_live_1234567890123456', keySecret: merchantSecret, webhookSecret
  }}), 200);
  const stored = await fixture.db.prepare("SELECT value FROM settings WHERE key='merchant_razorpay'").first('value');
  check(!stored.includes(merchantSecret), 'Native Worker encrypts stored merchant secrets');
  const product = {id: 'web-course', title: 'Web fixture course', status: 'Live', amount: 99900, currency: 'INR',
    courseIds: ['web'], durationDays: 365, termsUrl: 'https://example.test/terms',
    refundPolicy: 'Controlled fixture only. No real merchant charge.', approved: true};
  await status(await call('/api/academy/operations/products', {method: 'PUT', cookie: owner, body: {products: [product]}}), 200);
  const paymentConfig = await status(await call('/api/academy/payment/config', {cookie: learner}), 200);
  check(paymentConfig.razorpay && !JSON.stringify(paymentConfig).includes(merchantSecret), 'Checkout exposes only public merchant settings');
  const order = await status(await call('/api/academy/payment/session', {method: 'POST', cookie: learner, body: {
    productId: product.id, provider: 'razorpay', requestKey: 'cloudflare-fixture-0001', acceptTerms: true,
    expectedTerms: purchaseTerms(paymentConfig.products[0])
  }}), 200);
  const payment = {id: 'pay_CloudflareFixture', order_id: order.providerOrderId, amount: 99900,
    currency: 'INR', status: 'captured', captured: true, amount_refunded: 0};
  payments.set(payment.id, payment); Object.assign(orders.get(order.providerOrderId), {status: 'paid', amount_paid: 99900, amount_due: 0});
  const notification = ' { "event":"payment.captured", "payload":{"payment":{"entity":' + JSON.stringify(payment) + '}} } ';
  const hook = {method: 'POST', body: notification, headers: {'x-razorpay-signature': await signature(notification, webhookSecret)}};
  await status(await call('/api/payments/razorpay', hook), 200);
  await status(await call('/api/payments/razorpay', hook), 200);
  check((await fixture.db.prepare('SELECT count(*) AS n FROM payment_receipts WHERE order_id=?').bind(order.orderId).first('n')) === 1,
    'Exact webhook bytes and atomic HTTP batches preserve one paid receipt');
  await status(await call('/api/academy/course/web', {cookie: learner}), 200);
  await status(await call('/api/academy/course/ai', {cookie: learner}), 403);
  await status(await call('/api/payments/razorpay', {...hook, body: notification + ' '}), 400);
  check((await Promise.all(Array.from({length: 4}, () => call('/healthz')))).every(r => r.status === 200), 'Concurrent native requests retain isolated I/O');
  await status(await call('/api/auth/logout', {method: 'POST', cookie: learner, body: {}}), 200);
  check(!(await status(await call('/api/auth/session', {cookie: learner}), 200)).signedIn, 'Logout revokes the durable session');
  fs.writeFileSync('docs/cloudflare-runtime-validation.json', JSON.stringify({checkedAt: new Date().toISOString(), checks,
    errors: [], runtime: 'Actual Cloudflare workerd via Miniflare ' + JSON.parse(fs.readFileSync('node_modules/miniflare/package.json')).version,
    scope: 'Production Cloudflare bundle, native ASSETS, HTTP SDK and SQLite-backed Hrana fixture; controlled identity/merchant fixtures. No remote deployment, live charge or claim that local runtime proves free-plan CPU compliance.'}, null, 2));
  console.log('Cloudflare runtime checks passed: ' + checks);
} finally {await mf?.dispose(); fixture.close(); fs.rmSync(temporary, {recursive: true, force: true});}
