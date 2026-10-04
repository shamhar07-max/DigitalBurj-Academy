// Writes the Draft offers from content/default-offers.json into the owner's commercial_products setting.
// Normally unnecessary: the Worker shows these drafts to the owner until offers are saved.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/seed-offers.mjs [--replace]
import fs from 'node:fs';import {createDatabase} from '../server/database.mjs';
const offers=JSON.parse(fs.readFileSync(new URL('../content/default-offers.json',import.meta.url)));
const db=createDatabase({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN||undefined});
try{
 const row=await db.prepare('SELECT value FROM settings WHERE key=?').bind('commercial_products').first();
 if(row&&JSON.parse(row.value).length&&!process.argv.includes('--replace'))throw Error('Offers already exist. Re-run with --replace to overwrite them.');
 await db.prepare('INSERT INTO settings(key,value,updated) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated=excluded.updated').bind('commercial_products',JSON.stringify(offers),new Date().toISOString()).run();
 console.log('Saved '+offers.length+' Draft offers.');
}catch(e){console.error(e.message);process.exitCode=1}finally{db.close?.()}
