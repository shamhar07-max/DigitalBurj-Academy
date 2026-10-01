import worker from '../worker/entry.mjs';
import {createCloudflareApplication} from './application.mjs';
import {secure} from '../server/request-handler.mjs';

// Reuse only a completed application. Never share pending request-owned I/O.
const applications = new WeakMap();
export default {
  async fetch(request, bindings) {
    try {
      let app = applications.get(bindings);
      if (!app) {
        app = await createCloudflareApplication(bindings, worker);
        applications.set(bindings, app);
      }
      return await app.fetch(request, {clientIP: request.headers.get('cf-connecting-ip') || 'unknown'});
    } catch {
      return secure(Response.json({error: 'The Academy is awaiting its server configuration.'}, {status: 503}));
    }
  }
};
