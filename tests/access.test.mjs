import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {database,seedProfile} from './helpers.mjs';
import {createAuth} from '../worker/auth.mjs';
const worker=(await import('../dist/server/index.js')).default;
const {DB,sql}=database(),env={DB,ACADEMY_OWNER_EMAIL:'owner@example.test',ACADEMY_SESSION_KEY:'ab'.repeat(32),ACADEMY_PLATFORM_AUTH:'sites',ACADEMY_MODE:'preview',ACADEMY_LIVE_PRODUCTS:'[]'};
let checks=0;
const assertCheck=(condition,label)=>{assert(condition,label);checks++};
const identities={new:{'oai-authenticated-user-id':'native-learner','oai-authenticated-user-email':'learner@example.test'},owner:{'oai-authenticated-user-id':'native-owner','oai-authenticated-user-email':'owner@example.test'}};
async function request(path,{identity,method='GET',body,origin='https://academy.test'}={}){return worker.fetch(new Request('https://academy.test'+path,{method,headers:{origin,'content-type':'application/json',...identities[identity]},...(body?{body:JSON.stringify(body)}:{})}),env)}
const pages=['/','/academy','/dashboard','/index.html','/learn','/preview','/workspace.html','/practice-library.html','/courses','/courses.html','/studio.js','/studio-extra.js','/app.js','/engines.js','/curriculum.js','/mentorship.js','/catalogue.json','/academy-standard.js','/storefront.js','/checkout.js','/admin','/admin.html','/admin.js'];
for(const path of pages){const r=await request(path);assertCheck(r.status===302&&new URL(r.headers.get('location')).pathname==='/sign-in','Anonymous page/asset denied '+path);assertCheck(r.headers.get('cache-control').includes('no-store'),'Protected response cannot be cached '+path)}
const APIs=['catalogue','bootstrap','course/start','course/web','payment/config','teaching','notes','queue'];
for(const path of APIs){let r=await request('/api/academy/'+path);assertCheck(r.status===401,'Anonymous API denied '+path);r=await request('/api/academy/'+path,{identity:'new'});const b=await r.json();assertCheck(r.status===403&&b.code==='REGISTRATION_REQUIRED'&&b.next==='/register','Unregistered identity denied '+path)}
for(const identity of ['new','owner'])for(const path of ['/dashboard','/workspace.html','/courses.html','/preview','/curriculum.js']){const r=await request(path,{identity});assertCheck(r.status===302&&new URL(r.headers.get('location')).pathname==='/register','Registration required even for signed-in owner '+path)}
let r=await request('/api/admin/overview',{identity:'owner'});assertCheck(r.status===403,'Unregistered owner cannot open administration');
r=await request('/runtime.js');assertCheck((await r.text()).includes("MODE='connected'"),'Preview setting cannot change hosted runtime');
for(const identity of [undefined,'new']){r=await request('/preview-data.js',{identity});assertCheck(r.status===404,'Full preview curriculum never served')}
for(const path of ['/sign-in','/register','/auth.html','/forgot-password','/reset-password']){r=await request(path);const html=await r.text(),{document}=parseHTML(html);assertCheck(r.status===200&&!document.querySelector('#sidebar,#navigation,#mobile-menu,.academy-sidebar'),'Entry page contains no sidebar '+path);assertCheck(!document.querySelector('script[src="/curriculum.js"]'),'Entry page loads no course content '+path)}
r=await request('/api/auth/config');const cfg=await r.json();assertCheck(cfg.configured&&cfg.chatgpt&&cfg.secureSessions,'Supported ChatGPT registration is available without email credentials');
r=await request('/api/auth/session',{identity:'new'});let session=await r.json();assertCheck(session.signedIn&&!session.registered&&!session.admin,'Identity alone grants no registration or staff role');
const profile={name:'Controlled learner fixture',country:'UAE',goal:'DB-00',hours:5,timezone:'Asia/Dubai',consent:true,role:'Owner',userId:'native-owner'};
r=await request('/api/account/profile',{identity:'new',method:'PUT',body:profile,origin:'https://evil.test'});assertCheck(r.status===403&&!sql.prepare('SELECT * FROM profiles').get(),'Cross-origin registration rejected');
r=await request('/api/account/profile',{identity:'new',method:'PUT',body:{...profile,consent:false}});assertCheck(r.status===400&&!sql.prepare('SELECT * FROM profiles').get(),'Registration requires consent');
r=await request('/api/account/profile',{identity:'new',method:'PUT',body:profile});assertCheck(r.status===200,'Real profile registration persisted');
assertCheck(sql.prepare('SELECT user_id FROM profiles').get().user_id==='native-learner'&&!sql.prepare('SELECT * FROM staff').get(),'Submitted account ID and role cannot change identity or permissions');
r=await request('/api/auth/session',{identity:'new'});session=await r.json();assertCheck(session.registered&&!session.admin&&session.user.provider==='chatgpt','Registered native learner is identified correctly');
r=await request('/dashboard',{identity:'new'});assertCheck(r.status===200&&(await r.text()).includes('data-academy-access="pending"'),'Authorized dashboard still hides shell until session check');
for(const path of ['/courses','/courses.html']){r=await request(path,{identity:'new'});assertCheck(r.status===302&&new URL(r.headers.get('location')).pathname==='/dashboard'&&new URL(r.headers.get('location')).hash==='#paths','Legacy course URL enters registered dashboard '+path)}
r=await request('/practice-library.html?programme=DB-00&view=tools&return_to=https://evil.test',{identity:'new'});const legacyLocation=new URL(r.headers.get('location'));assertCheck(r.status===302&&legacyLocation.origin==='https://academy.test'&&legacyLocation.pathname==='/workspace.html'&&legacyLocation.search==='?programme=DB-00&view=tools','Legacy practice URL enters integrated workspace with only supported parameters');
for(const name of ['courses.html','practice-library.html']){const {document}=parseHTML(fs.readFileSync('dist/'+name,'utf8'));assertCheck(document.documentElement.dataset.academyAccess==='pending'&&!document.querySelector('#sidebar,nav,.course-card,.shell')&&document.querySelector('script[src="access.js"]'),'Unpacked legacy entry has only a closed account gate '+name)}
r=await request('/admin',{identity:'new'});assertCheck(r.status===403,'Registered learner cannot open owner console');
r=await request('/api/academy/bootstrap',{identity:'new'});const bootstrap=await r.json();assertCheck(r.status===200&&bootstrap.user.role==='Learner'&&bootstrap.entitlements.length===0,'Registration grants learner role and no paid course');
r=await request('/api/academy/course/start',{identity:'new'});assertCheck(r.status===200,'Registered learner can open free foundation');
r=await request('/api/academy/course/web',{identity:'new'});assertCheck(r.status===403,'Registered learner cannot open unpaid course');
r=await request('/curriculum.js',{identity:'new'});const curriculum=await r.text();assertCheck(r.status===200&&curriculum.includes('"id":"DB-00"')&&!curriculum.includes('"id":"DB-02"'),'Original workspace has only entitled free programme bodies');
r=await request('/api/auth/logout',{identity:'new',method:'POST',body:{}});const logout=await r.json();assertCheck(r.status===200&&logout.next==='/signout-with-chatgpt?return_to=%2Fsign-in','Sign-out uses dispatch-owned session termination');
r=await request('/dashboard');assertCheck(r.status===302,'No identity after sign-out cannot reopen dashboard');
sql.prepare("UPDATE profiles SET status='Suspended' WHERE user_id='native-learner'").run();
r=await request('/api/academy/catalogue',{identity:'new'});assertCheck(r.status===403&&(await r.json()).code==='ACCOUNT_SUSPENDED','Suspended account denied');
r=await request('/api/account/profile',{identity:'new',method:'PUT',body:profile});assertCheck(r.status===403,'Suspended account cannot reactivate itself');
const standalone={...env,ACADEMY_PLATFORM_AUTH:''};
r=await worker.fetch(new Request('https://academy.test/dashboard',{headers:identities.owner}),standalone);assertCheck(r.status===302,'Untrusted headers outside Sites never authenticate');
seedProfile(sql,'native-owner','Controlled owner fixture');
r=await request('/api/admin/overview',{identity:'owner'});assertCheck(r.status===200,'Registered native owner can administer');
r=await request('/admin',{identity:'owner'});const ownerHTML=await r.text();assertCheck(r.status===200&&ownerHTML.includes('data-academy-role="owner"')&&ownerHTML.includes('data-academy-access="pending"')&&ownerHTML.includes('class="protected-page"'),'Owner console waits for verified role before showing its page');
r=await request('/content/legacy/practice-library.html',{identity:'owner'});assertCheck(r.status===404,'Archived prototype source is outside deployed assets');
r=await request('/verify/'+'f'.repeat(48));const verification=await r.text();assertCheck(r.status===200&&!verification.includes('id="sidebar"')&&!verification.includes('studio.js'),'Public credential lookup exposes no Academy interface');
r=await request('/api/academy/verify/'+'f'.repeat(48));assertCheck(r.status===404,'Unknown public credential cannot create access');
fs.writeFileSync('docs/access-validation.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,errors:[],scope:'Compiled Worker and SQLite: anonymous routes/assets/APIs, preview bypass denial, supported Sites ingress identity, registration consent and ownership, free/paid scope, suspension, sign-out, external header denial, isolated credential lookup. Native OAuth provider login itself is dispatch-owned.'},null,2)+'\n');
console.log('Access and registration checks passed: '+checks);
