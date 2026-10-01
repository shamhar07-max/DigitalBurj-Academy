import {createClient} from '@libsql/client';

// Implements the prepared statements and atomic write batches used by the Academy.
// Hosted Turso/libSQL keeps the original SQLite schema and exact query semantics.
function result(r) {
  return {
    success: true,
    results: r.rows.map(row => Object.fromEntries(r.columns.map((name,i) => [name,row[i]]))),
    meta: {changes:Number(r.rowsAffected),last_row_id:Number(r.lastInsertRowid||0)}
  };
}
export function createDatabase(options) {
  const client=createClient({...options,intMode:'number'});
  class Statement {
    constructor(query,args=[]) {this.query=query;this.args=args;this.database=client;}
    bind(...args) {return new Statement(this.query,args);}
    async all() {return result(await client.execute({sql:this.query,args:this.args}));}
    async first(column) {const row=(await this.all()).results[0]||null;return column&&row?row[column]:row;}
    async run() {return this.all();}
  }
  return {
    client,
    prepare:query=>new Statement(query),
    async batch(statements) {
      if(!Array.isArray(statements)||statements.some(s=>s.database!==client))throw Error('Invalid database batch');
      if(!statements.length)return [];
      return (await client.batch(statements.map(s=>({sql:s.query,args:s.args})),'write')).map(result);
    },
    close:()=>client.close()
  };
}
