import {handleTeaching} from './teaching.mjs';
import {handleCheckout,approvedProducts,publicProduct} from './checkout.mjs';
import {validateRecipe} from '../shared/recipe.mjs';
import {registrationState,gateResponse} from './gate.mjs';
import {handleOperations,claimLaunchAccount,recordActivity} from './operations.mjs';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
const deny=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const iso=()=>new Date().toISOString();
const hash=async str=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export function createAcademy(atlas,curriculum=null){
 const tracks=Object.fromEntries(atlas.tracks.map(t=>[t.id,t]));
 const catalogue={...atlas,tracks:atlas.tracks.map(({missions,...t})=>({...t,missionCount:missions.length,outline:missions.map(({id,title,level,minutes})=>({id,title,level,minutes}))}))};
 return async function academy(r,env,id){
 const url=new URL(r.url),path=url.pathname.replace('/api/academy/','');
 try{
 if(!env.DB)deny('Academy storage is not configured.',503);
 const db=env.DB,s=(q,...a)=>db.prepare(q).bind(...a),one=(q,...a)=>s(q,...a).first(),all=async(q,...a)=>(await s(q,...a).all()).results||[];
 const audit=(action,record,details={})=>s('INSERT INTO audit(id,actor,action,record,details,created) VALUES(?,?,?,?,?,?)',crypto.randomUUID(),id?.id||'public',action,record,JSON.stringify(details),iso());
 if(path.startsWith('verify/')&&r.method==='GET'){
  const token=path.slice(7);if(!/^[a-f0-9]{48}$/.test(token))deny('No credential was found.',404);
  const award=await one('SELECT * FROM academy_awards WHERE verify_token=?',token);if(!award)deny('No credential was found.',404);
  const body=JSON.parse(award.body);return reply({id:award.id,name:body.name,course:body.course,issuedAt:award.created,status:award.status,reason:award.reason,scope:body.scope,evidenceHash:award.evidence_hash,issuer:'DigitalBurj Academy'});
 }
 if(!id?.id||!id.verified)deny('Sign in to your Academy account.',401);
 if(id.purpose==='recovery')deny('Set your new password before continuing.',403);
 const profile=await one('SELECT * FROM profiles WHERE user_id=?',id.id);if(profile?.status==='Suspended')deny('This account is suspended. Contact Academy support.',403);
 const gate=registrationState({...id,profile});if(!gate.allowed)return gateResponse(gate);
 await claimLaunchAccount(env,{...id,profile});
 if(path==='catalogue')return reply(catalogue);
 const owner=!!env.ACADEMY_OWNER_EMAIL&&id.email?.toLowerCase()===env.ACADEMY_OWNER_EMAIL.toLowerCase();
 const staff=await one('SELECT * FROM staff WHERE user_id=? AND expires>=?',id.id,iso().slice(0,10));
 const role=owner?'Owner':staff?.role||'Learner';
 const qualified=(person,role,course)=>one('SELECT * FROM staff WHERE user_id=? AND role=? AND expires>=?',person,role,iso().slice(0,10)).then(row=>row&&JSON.parse(row.domains).includes(course));
 const access=async course=>owner||tracks[course]?.free||!!await one("SELECT id FROM entitlements WHERE user_id=? AND course_id=? AND status='Active' AND (expires IS NULL OR expires>?)",id.id,course,iso());
 const mustOwn=()=>{if(!owner)deny('Only the Academy owner can perform this action.',403)};
 let payload={};if(!['GET','HEAD'].includes(r.method)){
  if(r.headers.get('origin')!==url.origin||r.headers.get('sec-fetch-site')==='cross-site')deny('Use the Academy page to save this change.',403);
  if(!r.headers.get('content-type')?.startsWith('application/json'))deny('Send a JSON request.',415);
  const raw=await r.text();if(new TextEncoder().encode(raw).length>250000)deny('This request exceeds the 250 KB limit.',413);
  try{payload=JSON.parse(raw)}catch{deny('The request is not valid JSON.')}
 }
 if(path.startsWith('operations')||['plan','activity'].includes(path))return reply(await handleOperations(path,r.method,payload,{env,db,id,owner,staff,atlas,tracks,curriculum}));
 if(path.startsWith('teaching')){const result=await handleTeaching(path,r.method,payload,{db,id,owner,staff,tracks});if(r.method==='POST')await recordActivity(db,id.id,'class_'+path.slice(9).replaceAll('/','_'),payload.bookingId||payload.packageId||payload.slotId||'teaching').run();return reply(result)}
 if(path.startsWith('payment/'))return reply(await handleCheckout(path,r.method,{...payload,requestURL:r.url},{env,db,id,tracks}));
 if(path==='readiness'&&r.method==='GET'){mustOwn();const mentors=await all("SELECT name,domains,expires FROM staff WHERE role='Mentor' AND expires>=?",iso().slice(0,10));return reply({identity:env.ACADEMY_PLATFORM_AUTH==='sites'||!!((env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY||await one("SELECT value FROM settings WHERE key='identity_provider'"))&&/^[a-f0-9]{64}$/.test(env.ACADEMY_SESSION_KEY||'')),privatePreview:false,registrationRequired:true,products:approvedProducts(env,tracks).map(p=>publicProduct(p,env)),teachers:mentors});}
 if(path==='bootstrap'&&r.method==='GET'){
  const entitlements=await all("SELECT course_id,expires,source_id FROM entitlements WHERE user_id=? AND status='Active' AND (expires IS NULL OR expires>?)",id.id,iso());
  const products=approvedProducts(env,tracks);
  return reply({mode:'connected',user:{id:id.id,email:id.email,name:profile?.name||'',hours:profile?.hours||5,role},entitlements,catalogue,products:products.map(p=>publicProduct(p,env)),work:await all('SELECT mission_id,course_id,body,revision,status,feedback FROM recipe_work WHERE user_id=?',id.id),awards:await all('SELECT id,body,status,verify_token,created FROM academy_awards WHERE user_id=?',id.id)});
 }
 if(path.startsWith('course/')&&r.method==='GET'){
  const t=tracks[path.slice(7)];if(!t)deny('Pathway not found.',404);
  const teaching=staff&&JSON.parse(staff.domains).includes(t.id);if(!teaching&&!await access(t.id))deny('This pathway requires an active purchase or assigned access.',403);return reply(t);
 }
 if(path==='work'&&r.method==='PUT'){
  const {courseId,missionId,draft,expectedRevision}=payload,t=tracks[courseId],m=t?.missions.find(x=>x.id===missionId);
  if(!m||!draft||!Number.isInteger(expectedRevision)||expectedRevision<0)deny('Choose a valid recipe and draft revision.');if(!await access(courseId))deny('Your access to this pathway is inactive.',403);
  const old=await one('SELECT * FROM recipe_work WHERE user_id=? AND mission_id=?',id.id,missionId);if((old?.revision||0)!==expectedRevision)deny('A newer draft exists. Reload before saving.',409);
  if(old&&['Submitted','In Review','Pending Verification','Verified'].includes(old.status))deny('This submission is locked for assessment. A reviewer must request changes first.',409);
  const clean={};for(const k of ['objective','inspection','work','test','reflection','handover'])clean[k]=String(draft[k]||'').slice(0,25000);clean.criteria=Array.isArray(draft.criteria)?draft.criteria.filter(n=>Number.isInteger(n)&&n>=0&&n<m.criteria.length):[];clean.consent=draft.consent===true;
  const result=await s("INSERT INTO recipe_work(id,user_id,course_id,mission_id,body,revision,status,created,updated) VALUES(?,?,?,?,?,1,'Draft',?,?) ON CONFLICT(user_id,mission_id) DO UPDATE SET body=excluded.body,revision=recipe_work.revision+1,status='Draft',updated=excluded.updated WHERE recipe_work.revision=?",old?.id||crypto.randomUUID(),id.id,courseId,missionId,JSON.stringify(clean),iso(),iso(),expectedRevision).run();if(!result.meta.changes)deny('The draft changed. Reload before saving.',409);await recordActivity(db,id.id,'recipe_saved',missionId).run();return reply({saved:true,revision:expectedRevision+1});
 }
 if(path==='submit'&&r.method==='POST'){
  const row=await one('SELECT * FROM recipe_work WHERE user_id=? AND mission_id=?',id.id,payload.missionId);if(!row)deny('Save your draft before submitting.');if(!await access(row.course_id))deny('Pathway access is inactive.',403);
  const m=tracks[row.course_id].missions.find(m=>m.id===row.mission_id),result=validateRecipe(m,JSON.parse(row.body));if(!result.pass)return reply({error:'Complete the evidence requirements before submitting.',checks:result.checks},400);
  if(row.status!=='Draft'||row.revision!==payload.revision)deny('This draft is already submitted or has changed.',409);
  const out=await db.batch([s("UPDATE recipe_work SET status='Submitted',revision=revision+1,updated=? WHERE id=? AND revision=? AND status='Draft'",iso(),row.id,payload.revision),audit('recipe_submitted',row.id)]);if(!out[0].meta.changes)deny('This draft changed. Reload it.',409);return reply({status:'Submitted',revision:row.revision+1});
 }
 if(path==='queue'&&r.method==='GET'){
  if(!owner&&!['Reviewer','Verifier','Mentor'].includes(role))deny('A staff role is required.',403);
  const rows=await all(owner?'SELECT * FROM recipe_work WHERE status<>? ORDER BY updated DESC LIMIT 200':'SELECT * FROM recipe_work WHERE reviewer=? OR verifier=? ORDER BY updated DESC LIMIT 200',...(owner?['Draft']:[id.id,id.id]));return reply({items:rows});
 }
 if(path==='review'&&r.method==='POST'){
  const b=payload,row=await one('SELECT * FROM recipe_work WHERE id=?',b.id);if(!row)deny('Submission not found.',404);if(row.revision!==b.revision)deny('This submission changed. Reload it.',409);
  let query;
  if(b.action==='assign'){
   mustOwn();if(row.status!=='Submitted')deny('Assign only a waiting submission.',409);
   if(new Set([row.user_id,b.reviewer,b.verifier]).size!==3||!await qualified(b.reviewer,'Reviewer',row.course_id)||!await qualified(b.verifier,'Verifier',row.course_id))deny('Assign two different qualified staff members, neither of whom is the learner.');
   query=s("UPDATE recipe_work SET reviewer=?,verifier=?,status='In Review',revision=revision+1,updated=? WHERE id=? AND revision=?",b.reviewer,b.verifier,iso(),row.id,row.revision);
  }else{
   const verifying=b.action==='verify';if(!['review','verify'].includes(b.action))deny('Unknown review action.');
   if(row[verifying?'verifier':'reviewer']!==id.id||row.user_id===id.id||!await qualified(id.id,verifying?'Verifier':'Reviewer',row.course_id)||row.status!==(verifying?'Pending Verification':'In Review'))deny('You are not authorized to assess this submission.',403);
   if(typeof b.feedback!=='string'||b.feedback.trim().length<100||b.feedback.length>10000)deny('Explain the evidence behind your decision in 100–10,000 characters.');
   const scores=verifying?JSON.parse(row.scores):b.scores;if(!Array.isArray(scores)||scores.length!==5||scores.some(x=>!Number.isInteger(x)||x<0||x>4))deny('Score all five rubric criteria from 0 to 4.');
   const weighted=scores.reduce((sum,x,i)=>sum+x/4*[30,20,20,15,15][i],0),pass=b.approve===true&&weighted>=80&&scores.every(s=>s>=2);
   query=s('UPDATE recipe_work SET status=?,scores=?,feedback=?,revision=revision+1,updated=? WHERE id=? AND revision=?',pass?(verifying?'Verified':'Pending Verification'):'Request Changes',JSON.stringify(scores),(row.feedback||'')+'\n'+role+': '+b.feedback,iso(),row.id,row.revision);
  }
  const out=await db.batch([query,audit('recipe_'+b.action,row.id)]);if(!out[0].meta.changes)deny('This submission changed. Reload it.',409);return reply({saved:true});
 }
 if(path==='staff'&&r.method==='POST'){
  mustOwn();const b=payload;const target=await one('SELECT user_id FROM profiles WHERE user_id=?',b.userId);
  if(!target||b.userId===id.id||!['Reviewer','Verifier','Mentor'].includes(b.role)||!Array.isArray(b.domains)||!b.domains.length||b.domains.some(d=>!tracks[d])||String(b.qualification||'').length<100||!/^\d{4}-\d{2}-\d{2}$/.test(b.expires||'')||b.expires<iso().slice(0,10))deny('Choose a registered account, role, valid pathway scope, qualification evidence and future expiry.');
  await db.batch([s('INSERT INTO staff(user_id,name,role,domains,qualification,expires,approved_by,created) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,domains=excluded.domains,qualification=excluded.qualification,expires=excluded.expires',b.userId,String(b.name||b.userId).slice(0,120),b.role,JSON.stringify(b.domains),b.qualification,b.expires,id.id,iso()),audit('academy_staff_appointed',b.userId)]);return reply({saved:true});
 }
 if(path==='grant'&&r.method==='POST'){
  mustOwn();const b=payload;if(!tracks[b.courseId]||!await one('SELECT user_id FROM profiles WHERE user_id=?',b.userId)||typeof b.reason!=='string'||b.reason.length<20)deny('Select a registered user, pathway and recorded reason.');
  const expires=b.expires||null;if(expires&&(!Number.isFinite(Date.parse(expires))||Date.parse(expires)<=Date.now()))deny('Access expiry must be a future date.');
  await db.batch([s("INSERT INTO entitlements(id,user_id,course_id,source_id,status,expires,created) VALUES(?,?,?,?,'Active',?,?)",crypto.randomUUID(),b.userId,b.courseId,'grant:'+crypto.randomUUID(),expires,iso()),audit('access_granted',b.userId,{course:b.courseId,reason:b.reason})]);return reply({granted:true});
 }
 if(path==='awards'&&r.method==='POST'){
  const t=tracks[payload.courseId];if(!t)deny('Select a valid pathway.');const old=await one('SELECT * FROM academy_awards WHERE user_id=? AND course_id=?',id.id,t.id);if(old)return reply({id:old.id,status:old.status,verifyToken:old.verify_token,duplicate:true});
  if(!profile?.name||!payload.publicNameConsent)deny('Set your account name and consent to its inclusion in public certificate verification.');
  const work=await all("SELECT * FROM recipe_work WHERE user_id=? AND course_id=? AND status='Verified'",id.id,t.id);
  if(!t.missions.every(m=>work.some(w=>w.mission_id===m.id)))deny('All ten recipes need independent review and verification before issue.',409);
  for(const w of work)if(w.reviewer===w.verifier||w.reviewer===id.id||w.verifier===id.id||!await qualified(w.reviewer,'Reviewer',t.id)||!await qualified(w.verifier,'Verifier',t.id))deny('Assessment staff qualifications need renewal before issue.',409);
  const awardId='DBA-'+crypto.randomUUID(),token=Array.from(crypto.getRandomValues(new Uint8Array(24))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const digest=await hash(JSON.stringify(work.sort((a,b)=>a.mission_id.localeCompare(b.mission_id)).map(w=>({id:w.id,revision:w.revision,body:w.body,scores:w.scores,reviewer:w.reviewer,verifier:w.verifier}))));
  const record={id:awardId,name:profile.name,course:t.title,courseId:t.id,issuedAt:iso(),missionCount:t.missions.length,plannedMinutes:t.minutes,scope:'Assessed DigitalBurj Academy pathway achievement. Not a degree, professional licence, accreditation or guarantee of employment.',evidenceHash:digest};
  await db.batch([s("INSERT INTO academy_awards(id,user_id,course_id,body,evidence_hash,status,verify_token,created) VALUES(?,?,?,?,?,'Active',?,?)",awardId,id.id,t.id,JSON.stringify(record),digest,token,record.issuedAt),audit('pathway_certificate_issued',awardId)]);return reply({...record,verifyToken:token},201);
 }
 if(path==='awards/revoke'&&r.method==='POST'){
  mustOwn();if(String(payload.reason||'').trim().length<40)deny('Record a clear withdrawal reason.');if(!await one('SELECT id FROM academy_awards WHERE id=?',payload.id))deny('Award not found.',404);
  await db.batch([s("UPDATE academy_awards SET status='Revoked',reason=? WHERE id=?",payload.reason,payload.id),audit('pathway_certificate_revoked',payload.id)]);return reply({status:'Revoked'});
 }
 if(path==='notes'&&r.method==='GET'){const row=await one('SELECT * FROM academy_notes WHERE user_id=?',id.id);return reply(row?{body:JSON.parse(row.body),revision:row.revision}:{body:{},revision:0})}
 if(path==='notes'&&r.method==='PUT'){
  const old=await one('SELECT revision FROM academy_notes WHERE user_id=?',id.id);if(!Number.isInteger(payload.expectedRevision)||(old?.revision||0)!==payload.expectedRevision)deny('Your notebook has a newer version. Reload before saving.',409);
  const out=await s('INSERT INTO academy_notes(user_id,body,revision,updated) VALUES(?,?,1,?) ON CONFLICT(user_id) DO UPDATE SET body=excluded.body,revision=academy_notes.revision+1,updated=excluded.updated WHERE academy_notes.revision=?',id.id,JSON.stringify(payload.body),iso(),payload.expectedRevision).run();if(!out.meta.changes)deny('Notebook changed. Reload it.',409);await recordActivity(db,id.id,'notebook_saved',id.id).run();return reply({saved:true,revision:payload.expectedRevision+1});
 }
 return reply({error:'Academy action not found.'},404);
 }catch(e){return reply({error:e.status?e.message:'The service could not save this change. Please retry.'},e.status||503)}
 };
}
