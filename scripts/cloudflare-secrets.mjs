import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readEnvironment} from '../server/environment.mjs';

readEnvironment(process.env);
if (process.env.ACADEMY_AUTO_MIGRATE === 'true') throw Error('Cloudflare requires explicit migrations before deployment.');
const keys = fs.readFileSync('.env.cloudflare.example', 'utf8').split(/\r?\n/)
  .filter(line => /^[A-Z][A-Z_]+=/u.test(line)).map(line => line.split('=')[0]);
const values = Object.fromEntries(keys.filter(key => process.env[key] !== undefined && process.env[key] !== '')
  .map(key => [key, process.env[key]]));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-cloudflare-secrets-'));
const file = path.join(temporary, 'secrets.json');
try {
  fs.writeFileSync(file, JSON.stringify(values), {mode: 0o600});
  const cli = path.resolve('node_modules/wrangler/bin/wrangler.js');
  const result = spawnSync(process.execPath, [cli, 'secret', 'bulk', file], {stdio: 'inherit'});
  if (result.error) throw result.error;
  process.exitCode = result.status || 0;
} finally {fs.rmSync(temporary, {recursive: true, force: true});}
