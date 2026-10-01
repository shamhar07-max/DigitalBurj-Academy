export function readEnvironment(input=process.env) {
  const env={...input,NODE_ENV:input.NODE_ENV||'production',ACADEMY_PLATFORM_AUTH:'',ACADEMY_MODE:'connected',ACADEMY_PAYMENT_PUBLIC:input.ACADEMY_PAYMENT_PUBLIC||'false'};
  const problems=[];
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ACADEMY_OWNER_EMAIL||''))problems.push('ACADEMY_OWNER_EMAIL');
  if(!/^[a-f0-9]{64}$/.test(env.ACADEMY_SESSION_KEY||''))problems.push('ACADEMY_SESSION_KEY (64 lowercase hex characters)');
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.SUPABASE_URL||''))problems.push('SUPABASE_URL');
  if(!env.SUPABASE_PUBLISHABLE_KEY)problems.push('SUPABASE_PUBLISHABLE_KEY');
  let origin;
  try {
    const url=new URL(env.ACADEMY_PUBLIC_URL);
    if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error();
    const local=env.NODE_ENV!=='production'&&!env.VERCEL&&url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    if(url.protocol!=='https:'&&!local)throw Error();
    origin=url.origin;
  } catch {problems.push('ACADEMY_PUBLIC_URL (the HTTPS origin, without a path)');}
  const databaseUrl=env.TURSO_DATABASE_URL;
  try {
    const url=new URL(databaseUrl);
    const remote=['libsql:','https:'].includes(url.protocol);
    const local=url.protocol==='file:'&&env.NODE_ENV!=='production'&&!env.VERCEL;
    if(!remote&&!local||url.username||url.password)throw Error();
    if(remote&&!env.TURSO_AUTH_TOKEN)problems.push('TURSO_AUTH_TOKEN');
  } catch {problems.push('TURSO_DATABASE_URL');}
  if(env.ACADEMY_AUTO_MIGRATE&&!['true','false'].includes(env.ACADEMY_AUTO_MIGRATE))problems.push('ACADEMY_AUTO_MIGRATE');
  if(env.ACADEMY_PAYMENT_PUBLIC&&!['true','false'].includes(env.ACADEMY_PAYMENT_PUBLIC))problems.push('ACADEMY_PAYMENT_PUBLIC');
  if(env.ACADEMY_TRUST_PROXY&&!/^\d$/.test(env.ACADEMY_TRUST_PROXY))problems.push('ACADEMY_TRUST_PROXY (0–9 proxy hops)');
  if(problems.length)throw Object.assign(Error('Set valid environment variables: '+problems.join(', ')),{code:'ACADEMY_CONFIG'});
  env.ACADEMY_PUBLIC_URL=origin;
  env.ACADEMY_OWNER_EMAIL=env.ACADEMY_OWNER_EMAIL.toLowerCase();
  return env;
}
