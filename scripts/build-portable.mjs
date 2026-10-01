import fs from 'node:fs';
import {createHash} from 'node:crypto';
await import('./build.mjs');
const journal=JSON.parse(fs.readFileSync('drizzle/meta/_journal.json','utf8'));
const manifest=journal.entries.map(entry=> {
  const name=entry.tag+'.sql',sql=fs.readFileSync('drizzle/'+name,'utf8');
  return {name,checksum:createHash('sha256').update(sql).digest('hex'),statements:sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean)};
});
fs.mkdirSync('server',{recursive:true});
fs.writeFileSync('server/migration-manifest.mjs','// Generated from the immutable Drizzle migration journal.\nexport default '+JSON.stringify(manifest)+';\n');
fs.mkdirSync('public',{recursive:true});
console.log('Portable server migration manifest: '+manifest.length+' migrations. Protected assets are served by the application only.');
