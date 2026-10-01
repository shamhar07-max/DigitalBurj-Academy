// Local Hrana v2 HTTP fixture backed by real SQLite. No remote merchant or account.
import {createDatabase} from '../../server/database.mjs';
import {migrateDatabase} from '../../server/migrate.mjs';

const empty = () => ({cols: [], rows: [], affected_row_count: 0, last_insert_rowid: null});
const decode = v => v.type === 'null' ? null : v.type === 'integer' ? Number(v.value)
  : v.type === 'blob' ? new Uint8Array(Buffer.from(v.base64, 'base64')) : v.value;
const encode = v => v === null || v === undefined ? {type: 'null'}
  : typeof v === 'bigint' || Number.isInteger(v) ? {type: 'integer', value: String(v)}
  : typeof v === 'number' ? {type: 'float', value: v}
  : typeof v === 'string' ? {type: 'text', value: v}
  : {type: 'blob', base64: Buffer.from(v).toString('base64')};
const wireResult = r => ({
  cols: r.columns.map(name => ({name, decltype: null})),
  rows: r.rows.map(row => r.columns.map((_, i) => encode(row[i]))),
  affected_row_count: r.rowsAffected, last_insert_rowid: String(r.lastInsertRowid || 0)
});

export async function hranaFixture(url) {
  const db = createDatabase({url});
  await migrateDatabase(db);
  let requests = 0;
  async function fetch(request) {
    requests++;
    if (!new URL(request.url).pathname.endsWith('/v2/pipeline')) return new Response(null, {status: 404});
    const body = await request.json(), sqlCache = new Map(), results = [];
    let tx;
    const execute = async stmt => {
      const sql = stmt.sql ?? sqlCache.get(stmt.sql_id);
      if (/^BEGIN\b/i.test(sql)) {tx = await db.client.transaction('write'); return empty();}
      if (/^COMMIT\b/i.test(sql)) {await tx.commit(); tx.close(); tx = undefined; return empty();}
      if (/^ROLLBACK\b/i.test(sql)) {await tx.rollback(); tx.close(); tx = undefined; return empty();}
      return wireResult(await (tx || db.client).execute({sql, args: stmt.args.map(decode)}));
    };
    try {
      for (const command of body.requests) {
        try {
          let response;
          if (command.type === 'execute') response = {type: 'execute', result: await execute(command.stmt)};
          else if (command.type === 'store_sql') {sqlCache.set(command.sql_id, command.sql); response = {type: 'store_sql'};}
          else if (command.type === 'close_sql') {sqlCache.delete(command.sql_id); response = {type: 'close_sql'};}
          else if (command.type === 'close') response = {type: 'close'};
          else if (command.type === 'batch') {
            const step_results = [], step_errors = [];
            const allowed = c => !c ? true : c.type === 'ok' ? step_results[c.step] !== null
              : c.type === 'error' ? step_errors[c.step] !== null : c.type === 'not' ? !allowed(c.cond)
              : c.type === 'and' ? c.conds.every(allowed) : c.type === 'or' ? c.conds.some(allowed) : !tx;
            for (const step of command.batch.steps) {
              if (!allowed(step.condition)) {step_results.push(null); step_errors.push(null); continue;}
              try {step_results.push(await execute(step.stmt)); step_errors.push(null);}
              catch (error) {step_results.push(null); step_errors.push({message: error.message, code: 'SQLITE_ERROR'});}
            }
            response = {type: 'batch', result: {step_results, step_errors}};
          } else throw Error('Unimplemented fixture operation: ' + command.type);
          results.push({type: 'ok', response});
        } catch (error) {results.push({type: 'error', error: {message: error.message, code: 'SQLITE_ERROR'}});}
      }
      return Response.json({baton: null, base_url: null, results});
    } finally {
      if (tx) {await tx.rollback().catch(() => {}); tx.close();}
    }
  }
  return {db, fetch, get requests() {return requests;}, close: () => db.close()};
}
