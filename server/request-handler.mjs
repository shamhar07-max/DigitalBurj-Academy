const MAX_BODY = 2000000;

// Shared Web Request transport. Identity always comes from the encrypted session.
export function createRequestHandler({worker, env, db}) {
  return async function dispatch(inputRequest, {clientIP = 'unknown'} = {}) {
    let request = inputRequest;
    try {
      const url = new URL(request.url);
      const canonical = new URL(url.pathname + url.search, env.ACADEMY_PUBLIC_URL);
      if (url.origin !== canonical.origin) {
        if (['GET', 'HEAD'].includes(request.method)) {
          return secure(new Response(null, {status: 308, headers: {location: canonical.href}}), env);
        }
        return secure(Response.json({error: 'Use the configured Academy address.'}, {status: 421}), env);
      }
      if (url.pathname === '/healthz' && ['GET', 'HEAD'].includes(request.method)) {
        await db.prepare('SELECT 1 AS ready').first();
        return secure(new Response(request.method === 'HEAD' ? null : JSON.stringify({status: 'ready'}), {
          headers: {'content-type': 'application/json'}
        }), env);
      }
      const headers = new Headers(request.headers);
      for (const name of ['oai-authenticated-user-id', 'oai-authenticated-user-email', 'cf-connecting-ip', 'x-forwarded-for', 'x-real-ip']) {
        headers.delete(name);
      }
      headers.set('cf-connecting-ip', clientIP);
      const body = await limitedBody(request);
      request = new Request(canonical, {method: request.method, headers, ...(body ? {body} : {})});
      return secure(await worker.fetch(request, env), env);
    } catch (error) {
      return secure(Response.json({
        error: error.status === 413 ? 'This request is too large.' : 'The Academy service is temporarily unavailable.'
      }, {status: error.status || 503}), env);
    }
  };
}

async function limitedBody(request) {
  if (['GET', 'HEAD'].includes(request.method) || !request.body) return null;
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw Object.assign(Error(), {status: 413});
  const reader = request.body.getReader(), chunks = [];
  let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY) {
        await reader.cancel();
        throw Object.assign(Error(), {status: 413});
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {body.set(chunk, offset); offset += chunk.byteLength;}
  return body;
}

export function secure(response, env = {}) {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'private, no-store');
  headers.set('cdn-cache-control', 'private, no-store');
  headers.set('vercel-cdn-cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'same-origin');
  headers.set('x-frame-options', 'DENY');
  if (env.ACADEMY_PUBLIC_URL?.startsWith('https:')) headers.set('strict-transport-security', 'max-age=31536000');
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}
