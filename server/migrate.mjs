import migrations from './migration-manifest.mjs';

const ledger='_academy_migrations';
export async function migrateDatabase(db,manifest=migrations) {
  const tx=await db.client.transaction('write');
  try {
    await tx.execute('CREATE TABLE IF NOT EXISTS '+ledger+' (name TEXT PRIMARY KEY NOT NULL, checksum TEXT NOT NULL, applied TEXT NOT NULL)');
    const applied=await tx.execute('SELECT name,checksum FROM '+ledger);
    for(const row of applied.rows) {
      const file=manifest.find(m=>m.name===row.name);
      if(!file||file.checksum!==row.checksum)throw Error('Migration history differs from this release: '+row.name);
    }
    const known=new Set(applied.rows.map(row=>row.name)),pending=manifest.filter(m=>!known.has(m.name));
    const statements=[];
    for(const m of pending) {
      statements.push(...m.statements);
      statements.push({sql:'INSERT INTO '+ledger+'(name,checksum,applied) VALUES(?,?,?)',args:[m.name,m.checksum,new Date().toISOString()]});
    }
    if(statements.length)await tx.batch(statements);
    await tx.commit();
    return {applied:pending.length,total:manifest.length};
  } catch(error) {
    await tx.rollback().catch(()=>{});
    throw error;
  } finally {tx.close();}
}
export async function checkDatabase(db) {
  const rows=(await db.prepare('SELECT name,checksum FROM '+ledger).all()).results;
  if(rows.length!==migrations.length||migrations.some(m=>!rows.some(r=>r.name===m.name&&r.checksum===m.checksum)))throw Error('Run npm run db:migrate using this release before starting the Academy.');
  return {migrations:rows.length};
}
