import assert from 'node:assert/strict';import fs from 'node:fs';import {createAcademy} from '../worker/academy.mjs';import {createAPI} from '../worker/api.mjs';import {validateRecipe} from '../shared/recipe.mjs';import {database,seedProfile} from './helpers.mjs';
const atlas=JSON.parse(fs.readFileSync('content/atlas.json')),C=JSON.parse(fs.readFileSync('content/curriculum.json'));const {DB,sql}=database(),env={DB,ACADEMY_OWNER_EMAIL:'owner@example.test'},academy=createAcademy(atlas),oldAPI=createAPI(C);let checks=0;
for(const id of ['owner','learner','other','reviewer','verifier'])seedProfile(sql,id,id==='learner'?'Practice Learner':id);
const identity=id=>id?{id,email:id+'@example.test',verified:true}:null;
async function call(path,method='GET',body,user='learner',origin='https://academy.test'){const r=await academy(new Request('https://academy.test/api/academy/'+path,{method,headers:{origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,identity(user));return{status:r.status,body:await r.json()}}
const expect=(r,status)=>{assert.equal(r.status,status,JSON.stringify(r.body));checks++;return r.body};
assert.equal(atlas.tracks.length,18);assert.equal(atlas.tracks.flatMap(t=>t.missions).length,180);assert.equal(new Set(atlas.tracks.flatMap(t=>t.missions.map(m=>m.id))).size,180);checks+=3;
expect(await call('bootstrap','GET',null,null),401);expect(await call('catalogue','GET',null,null),401);expect(await call('course/start'),200);expect(await call('course/web'),403);expect(await call('course/web','GET',null,'owner'),200);
assert(!expect(await call('catalogue'),200).tracks.some(t=>'missions'in t));checks++;
expect(await call('grant','POST',{userId:'learner',courseId:'web',reason:'Scholarship granted for this test learner.'}),403);
expect(await call('grant','POST',{userId:'learner',courseId:'web',reason:'Scholarship granted for this test learner.'},'owner','https://evil.test'),403);
expect(await call('grant','POST',{userId:'learner',courseId:'web',reason:'Scholarship granted for this test learner.',expires:'bad'},'owner'),400);
expect(await call('grant','POST',{userId:'learner',courseId:'web',reason:'Scholarship granted for this test learner.'},'owner'),200);expect(await call('course/web'),200);expect(await call('course/web','GET',null,'other'),403);
sql.prepare("UPDATE entitlements SET expires='2000-01-01T00:00:00.000Z' WHERE user_id='learner'").run();expect(await call('course/web'),403);
expect(await call('queue'),403);expect(await call('awards','POST',{courseId:'start',publicNameConsent:true}),409);
const qualification='Verified training evidence, work samples, relevant subject expertise, independent calibration exercise and conflict-of-interest review are recorded for this assessor.';
for(const [id,role]of[['reviewer','Reviewer'],['verifier','Verifier']])expect(await call('staff','POST',{userId:id,name:id,role,domains:['start'],qualification,expires:'2035-01-01'},'owner'),200);
const text='This fictional project uses the approved café records. I recorded the source version, a repeatable test, the actual outcome and the limitation that physical or production validation has not been performed.';
const draft={objective:text,inspection:text,work:text,test:text,reflection:text,handover:text,criteria:[0,1,2],consent:true};assert(validateRecipe(atlas.tracks[0].missions[0],draft).pass);checks++;
expect(await call('work','PUT',{courseId:'start',missionId:'start-01',draft,expectedRevision:0}),200);
expect(await call('work','PUT',{courseId:'start',missionId:'start-01',draft,expectedRevision:0}),409);
expect(await call('work','PUT',{courseId:'web',missionId:'web-01',draft,expectedRevision:0}),403);
expect(await call('submit','POST',{missionId:'start-01',revision:0}),409);
expect(await call('submit','POST',{missionId:'start-01',revision:1}),200);
expect(await call('work','PUT',{courseId:'start',missionId:'start-01',draft,expectedRevision:2}),409);
assert.equal(expect(await call('bootstrap','GET',null,'other'),200).work.length,0);checks++;
for(const [i,m]of atlas.tracks[0].missions.entries()){
 if(i){expect(await call('work','PUT',{courseId:'start',missionId:m.id,draft,expectedRevision:0}),200);expect(await call('submit','POST',{missionId:m.id,revision:1}),200)}
 const row=sql.prepare('SELECT * FROM recipe_work WHERE mission_id=?').get(m.id);
 if(!i){expect(await call('review','POST',{id:row.id,revision:2,action:'assign',reviewer:'learner',verifier:'verifier'},'owner'),400);expect(await call('review','POST',{id:row.id,revision:2,action:'assign',reviewer:'reviewer',verifier:'reviewer'},'owner'),400)}
 expect(await call('review','POST',{id:row.id,revision:2,action:'assign',reviewer:'reviewer',verifier:'verifier'},'owner'),200);
 if(!i)expect(await call('review','POST',{id:row.id,revision:3,action:'review',scores:[4,4,4,4,4],feedback:qualification,approve:true}),403);
 expect(await call('review','POST',{id:row.id,revision:3,action:'review',scores:[4,4,4,4,4],feedback:qualification,approve:true},'reviewer'),200);
 if(!i)expect(await call('review','POST',{id:row.id,revision:4,action:'verify',feedback:qualification,approve:true},'reviewer'),403);
 expect(await call('review','POST',{id:row.id,revision:4,action:'verify',feedback:qualification,approve:true},'verifier'),200);
}
expect(await call('awards','POST',{courseId:'start',publicNameConsent:false}),400);
const award=expect(await call('awards','POST',{courseId:'start',publicNameConsent:true}),201);assert.match(award.verifyToken,/^[a-f0-9]{48}$/);checks++;
const publicRecord=expect(await call('verify/'+award.verifyToken,'GET',null,null),200);assert.equal(publicRecord.name,'Practice Learner');assert(!JSON.stringify(publicRecord).includes('example.test'));checks+=2;
assert(expect(await call('awards','POST',{courseId:'start',publicNameConsent:true}),200).duplicate);checks++;
expect(await call('verify/made-up','GET',null,null),404);expect(await call('awards/revoke','POST',{id:award.id,reason:qualification}),403);
expect(await call('awards/revoke','POST',{id:award.id,reason:'An assessment evidence discrepancy was confirmed during a recorded appeal review.'},'owner'),200);assert.equal(expect(await call('verify/'+award.verifyToken,'GET',null,null),200).status,'Revoked');checks++;
expect(await call('notes','PUT',{body:{note:text},expectedRevision:0}),200);expect(await call('notes','PUT',{body:{note:'overwrite'},expectedRevision:0}),409);assert.deepEqual(expect(await call('notes','GET',null,'other'),200).body,{});checks++;
// Verify checkout -> signed webhook -> immutable purchase scope -> refund revocation.
env.STRIPE_SECRET_KEY='sk_test_fixture';env.STRIPE_WEBHOOK_SECRET='test-fixture-webhook-secret';env.ACADEMY_LIVE_PRODUCTS=JSON.stringify([{id:'web-course',title:'Test course',status:'Live',priceId:'price_fixture',amount:1000,currency:'usd',courseIds:['web'],durationDays:30,reviewApproval:'test fixture',refundPolicy:'test policy',termsUrl:'https://example.test/terms'}]);
const realFetch=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({id:'cs_fixture',amount_total:1000,currency:'usd',url:'https://checkout.stripe.com/c/pay/cs_fixture'}),{status:200});
const request=(p,method,b)=>new Request('https://academy.test/api/'+p,{method,headers:{origin:'https://academy.test','content-type':'application/json','oai-authenticated-user-id':'learner','oai-authenticated-user-email':'learner@example.test'},body:JSON.stringify(b)});
let response=await oldAPI(request('checkout','POST',{productId:'web-course',requestKey:'fixture-request-0001'}),env);assert.equal(response.status,200);checks++;const order=await response.json();globalThis.fetch=realFetch;
async function event(type,obj,id='evt_'+crypto.randomUUID(),bad=false){const raw=JSON.stringify({id,type,data:{object:obj}}),t=Math.floor(Date.now()/1000).toString(),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+raw)))).map(x=>x.toString(16).padStart(2,'0')).join('');const r=await oldAPI(new Request('https://academy.test/api/payments/webhook',{method:'POST',headers:{'stripe-signature':'t='+t+',v1='+(bad?'invalid':signature)},body:raw}),env);return{status:r.status,body:await r.json()}}
const paid={id:'cs_fixture',payment_status:'paid',amount_total:1000,currency:'usd',client_reference_id:order.orderId,payment_intent:'pi_fixture'};
expect(await event('checkout.session.completed',paid,'evt_bad',true),400);expect(await event('checkout.session.completed',{...paid,amount_total:1}),409);expect(await call('course/web'),403);
expect(await event('checkout.session.completed',paid,'evt_paid'),200);expect(await call('course/web'),200);assert(expect(await event('checkout.session.completed',paid,'evt_paid'),200).duplicate);checks++;
expect(await event('charge.refunded',{id:'ch_fixture',payment_intent:'pi_fixture',amount:1000,amount_refunded:1000,refunded:true}),200);expect(await call('course/web'),403);
expect(await event('checkout.session.completed',paid,'evt_replay_different'),409);
expect(await event('charge.dispute.created',{id:'dp_pending',payment_intent:'pi_missing'}),409);
// Deployed entry strips attacker-provided identity headers, and never serves preview lessons.
const worker=(await import('../dist/server/index.js')).default;
let r=await worker.fetch(new Request('https://academy.test/api/academy/bootstrap',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}}),env);assert.equal(r.status,401);checks++;
r=await worker.fetch(new Request('https://academy.test/preview-data.js'),env);assert.equal(r.status,404);checks++;
r=await worker.fetch(new Request('https://academy.test/api/staff',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}}),env);assert.equal(r.status,401);checks++;
// A preview flag never bypasses registration on the hosted Worker.
const practiceEnv={...env,ACADEMY_MODE:'preview'};
r=await worker.fetch(new Request('https://academy.test/runtime.js'),practiceEnv);assert.match(await r.text(),/MODE='connected'/);checks++;
r=await worker.fetch(new Request('https://academy.test/preview-data.js'),practiceEnv);assert.equal(r.status,404);assert(! (await r.text()).includes('window.ACADEMY_ATLAS='));checks+=2;
r=await worker.fetch(new Request('https://academy.test/workspace.html'),practiceEnv);assert.equal(r.status,302);checks++;
r=await worker.fetch(new Request('https://academy.test/api/academy/bootstrap'),practiceEnv);assert.equal(r.status,401);checks++;
r=await worker.fetch(new Request('https://academy.test/admin'),practiceEnv);assert.equal(r.status,302);checks++;
console.log(`Academy checks passed: ${checks}. Entitlements, expiry, ownership, CSRF, revision conflicts, review separation, certificate issue/revocation, signed payments/refunds, and deployed identity spoofing covered.`);
