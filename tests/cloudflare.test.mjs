import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {hranaFixture} from './fixtures/hrana.mjs';
import {createCloudflareDatabase} from '../cloudflare/database.mjs';
import {createCloudflareApplication} from '../cloudflare/application.mjs';
import {checkDatabase} from '../server/migrate.mjs';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-cloudflare-http-'));
const fixture = await hranaFixture('file:' + path.join(temporary, 'academy.db'));
let checks = 0;
const check = (v, message) => {assert(v, message); checks++;};
const db = createCloudflareDatabase({url: 'https://database.example.test', authToken: 'fixture', fetch: fixture.fetch});
try {
  check((await checkDatabase(db)).migrations === 8, 'HTTP transport reads immutable schema checksums');
  check((await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name<>'_academy_migrations'").first('n')) === 26, 'Original 26 tables preserved');
  await db.batch([db.prepare("INSERT INTO settings(key,value,updated) VALUES(?,?,?)").bind('http-one', 'one', 'now'),
    db.prepare("INSERT INTO settings(key,value,updated) VALUES(?,?,?)").bind('http-two', 'two', 'now')]);
  check(await db.prepare('SELECT value FROM settings WHERE key=?').bind('http-one').first('value') === 'one', 'Prepared parameter values survive real Hrana HTTP encoding');
  await assert.rejects(db.batch([db.prepare("INSERT INTO settings(key,value,updated) VALUES('http-atomic','one','now')"),
    db.prepare("INSERT INTO settings(key,value,updated) VALUES('http-atomic','two','now')")])); checks++;
  check(await db.prepare("SELECT value FROM settings WHERE key='http-atomic'").first() === null, 'Failed HTTP write batch rolls back');
  const foreign = createCloudflareDatabase({url: 'https://database.example.test', authToken: 'fixture', fetch: fixture.fetch});
  await assert.rejects(db.batch([foreign.prepare('SELECT 1')])); checks++; foreign.close();
  check((await db.batch([])).length === 0, 'Empty batch is safe');
  await db.prepare('INSERT INTO settings(key,value,updated) VALUES(?,?,?)').bind('http-binary', new Uint8Array([1, 2, 255]), 'now').run();
  check(new Uint8Array(await db.prepare("SELECT value FROM settings WHERE key='http-binary'").first('value'))[2] === 255, 'Binary values survive HTTP transport');
  const values = await Promise.all(Array.from({length: 6}, () => db.prepare('SELECT 1 AS ready').first('ready')));
  check(values.every(v => v === 1), 'Concurrent HTTP reads use independent streams');
  const input = {ACADEMY_PUBLIC_URL: 'https://academy.example.test', ACADEMY_OWNER_EMAIL: 'owner@example.test',
    ACADEMY_SESSION_KEY: 'ab'.repeat(32), SUPABASE_URL: 'https://fixture-project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'fixture', TURSO_DATABASE_URL: 'https://database.example.test', TURSO_AUTH_TOKEN: 'fixture'};
  await assert.rejects(createCloudflareApplication({...input, ACADEMY_AUTO_MIGRATE: 'true'}, {})); checks++;
  await assert.rejects(createCloudflareApplication(input, {})); checks++;
  await assert.rejects(createCloudflareApplication({...input, ACADEMY_SESSION_KEY: 'bad'}, {})); checks++;
  check(!fs.existsSync('.cloudflare/assets/curriculum.js') && !fs.existsSync('.cloudflare/assets/mentorship.js'), 'Unfiltered course dumps are excluded from static upload');
  check(fs.readFileSync('wrangler.toml', 'utf8').includes('run_worker_first = true'), 'No static dashboard bypass before sign-in');
  check(fixture.requests > 5, 'Production HTTP SDK exercised through actual protocol requests');
  fs.writeFileSync('docs/cloudflare-http-validation.json', JSON.stringify({checkedAt: new Date().toISOString(), checks,
    errors: [], scope: 'Actual HTTP libSQL SDK with SQLite-backed Hrana fixture, checksum and atomic batch checks; no remote credentials or deployment.'}, null, 2));
  console.log('Cloudflare HTTP checks passed: ' + checks);
} finally {db.close(); fixture.close(); fs.rmSync(temporary, {recursive: true, force: true});}
