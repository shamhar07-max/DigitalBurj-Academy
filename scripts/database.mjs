import {createDatabase} from '../server/database.mjs';
import {migrateDatabase,checkDatabase} from '../server/migrate.mjs';

let db;
try {
  const url=process.env.TURSO_DATABASE_URL;
  if(!url)throw Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN first.');
  db=createDatabase({url,authToken:process.env.TURSO_AUTH_TOKEN||undefined});
  const result=process.argv.includes('--check')?await checkDatabase(db):await migrateDatabase(db);
  console.log('Academy database ready: '+JSON.stringify(result));
} catch {console.error('Database setup failed. Check the connection, token and migration history. No login or merchant data was printed.');process.exitCode=1;}
finally {db?.close();}
