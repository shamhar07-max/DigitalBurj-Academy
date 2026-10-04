// Writes Draft offers for the 111 subject-area courses into the owner's commercial_products setting.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/seed-offers.mjs [--replace]
// Offers stay Draft: the owner approves each one (and replaces the terms and refund text) before it can sell.
import fs from 'node:fs';import {createDatabase} from '../server/database.mjs';
const atlas=JSON.parse(fs.readFileSync(new URL('../content/atlas.json',import.meta.url))),prov=JSON.parse(fs.readFileSync(new URL('../content/source/iisdt-syllabi.json',import.meta.url))),by=Object.fromEntries(prov.map(p=>[p.id,p]));
// Prices in paise (INR). Three-month courses 449, six-month courses 699, advanced six-month courses 899.
const price=p=>/^Three|^Two/.test(p.reference.duration)?44900:/advanced/.test(p.reference.url)?89900:69900;
const offers=atlas.tracks.filter(t=>by[t.id]).map(t=>({id:t.id+'-course',title:t.title+' course',status:'Draft',amount:price(by[t.id]),currency:'inr',courseIds:[t.id],durationDays:365,providers:['razorpay'],termsUrl:'https://academy.digitalburj.com/terms',refundPolicy:'Owner to confirm the refund policy before this offer is approved.',reviewApproval:''}));
if(offers.length!==111)throw Error('Expected 111 subject-area offers.');
const db=createDatabase({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN||undefined});
try{
 const row=await db.prepare('SELECT value FROM settings WHERE key=?').bind('commercial_products').first();
 const existing=row?JSON.parse(row.value):[];
 if(existing.length&&!process.argv.includes('--replace'))throw Error('Offers already exist. Re-run with --replace to overwrite them.');
 await db.prepare('INSERT INTO settings(key,value,updated) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated=excluded.updated').bind('commercial_products',JSON.stringify(offers),new Date().toISOString()).run();
 console.log('Saved '+offers.length+' Draft offers from INR '+Math.min(...offers.map(o=>o.amount))/100+' to INR '+Math.max(...offers.map(o=>o.amount))/100+'.');
}catch(e){console.error(e.message);process.exitCode=1}finally{db.close?.()}
