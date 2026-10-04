// Every course, every role: the same enrolment, evidence, review, verification and certificate workflow.
import assert from 'node:assert/strict';import fs from 'node:fs';import {createAcademy} from '../worker/academy.mjs';import {validateRecipe} from '../shared/recipe.mjs';import {database,seedProfile} from './helpers.mjs';
const atlas=JSON.parse(fs.readFileSync('content/atlas.json')),{DB,sql}=database(),env={DB,ACADEMY_OWNER_EMAIL:'owner@example.test'},academy=createAcademy(atlas);let checks=0;
for(const id of ['owner','learner','other','reviewer','verifier','outsider'])seedProfile(sql,id,id==='learner'?'Practice Learner':id);
const identity=id=>id?{id,email:id+'@example.test',verified:true}:null;
async function call(path,method='GET',body,user='learner'){const r=await academy(new Request('https://academy.test/api/academy/'+path,{method,headers:{origin:'https://academy.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,identity(user));return{status:r.status,body:await r.json()}}
const expect=(r,status)=>{assert.equal(r.status,status,JSON.stringify(r.body));checks++;return r.body};
const qualification='Verified training evidence, work samples, relevant subject expertise, independent calibration exercise and conflict-of-interest review are recorded for this assessor.';
const staff=(id,role,domains)=>call('staff','POST',{userId:id,name:id,role,domains,qualification,expires:'2035-01-01'},'owner');
const all=atlas.tracks.map(t=>t.id);
expect(await staff('reviewer','Reviewer',all),200);expect(await staff('verifier','Verifier',all),200);expect(await staff('outsider','Reviewer',['start']),200);
const text='This fictional project uses approved practice records. I recorded the source version, a repeatable test, the actual outcome and the limitation that real-world or supervised validation has not been performed.';
// Structure shared by every course, old or new.
const steps=['Understand','Explain in your own words','Build','Test & fix','Reflect','Submit evidence'],minutes=[25,30,40,45,55,60,75,80,90,120];
for(const t of atlas.tracks){assert.equal(t.missions.length,10,t.id);assert.equal(t.modules.length,5,t.id);assert.deepEqual(t.missions.map(m=>m.minutes),minutes,t.id);assert(t.missions.every(m=>JSON.stringify(m.steps.map(s=>s.title))===JSON.stringify(steps)&&m.criteria.length===3&&m.visual.nodes.length===4&&m.reviewRequired===true&&m.example.length>60&&m.recommendedTools.length>0),t.id);assert.equal(t.minutes,minutes.reduce((a,b)=>a+b),t.id);assert.equal(t.outcome,t.missions[9].title);checks+=6}
// Anonymous and unregistered callers see nothing.
expect(await call('course/'+all[20],'GET',null,null),401);expect(await call('catalogue','GET',null,null),401);
for(const t of atlas.tracks){
 const id=t.id,free=t.free;
 // Learner without access
 if(!free){expect(await call('course/'+id),403);expect(await call('work','PUT',{courseId:id,missionId:t.missions[0].id,draft:{},expectedRevision:0}),403)}
 // Owner grants one learner; a different learner is still denied.
 if(!free)expect(await call('grant','POST',{userId:'learner',courseId:id,reason:'Scholarship granted for this role test learner.'},'owner'),200);
 const course=expect(await call('course/'+id),200);assert.equal(course.missions.length,10);checks++;
 if(!free)expect(await call('course/'+id,'GET',null,'other'),403);
 for(const [i,m]of t.missions.entries()){
  const draft={objective:text,inspection:text,work:text,test:text,reflection:text,handover:text,criteria:m.criteria.map((_,k)=>k),consent:true};
  assert(validateRecipe(m,draft).pass);assert(!validateRecipe(m,{...draft,consent:false}).pass);assert(!validateRecipe(m,{...draft,criteria:[0]}).pass);checks+=3;
  expect(await call('work','PUT',{courseId:id,missionId:m.id,draft,expectedRevision:0}),200);
  expect(await call('work','PUT',{courseId:id,missionId:m.id,draft,expectedRevision:0}),409);
  expect(await call('submit','POST',{missionId:m.id,revision:1}),200);
  const row=sql.prepare('SELECT * FROM recipe_work WHERE mission_id=? AND user_id=?').get(m.id,'learner');
  // Review cannot be started by the learner or by staff outside the course; separation of duties holds.
  expect(await call('review','POST',{id:row.id,revision:2,action:'assign',reviewer:'reviewer',verifier:'verifier'}),403);
  if(id!=='start')expect(await call('review','POST',{id:row.id,revision:2,action:'assign',reviewer:'outsider',verifier:'verifier'},'owner'),400);
  expect(await call('review','POST',{id:row.id,revision:2,action:'assign',reviewer:'reviewer',verifier:'reviewer'},'owner'),400);
  expect(await call('review','POST',{id:row.id,revision:2,action:'assign',reviewer:'reviewer',verifier:'verifier'},'owner'),200);
  expect(await call('review','POST',{id:row.id,revision:3,action:'review',scores:[4,4,4,4,4],feedback:qualification,approve:true}),403);
  expect(await call('review','POST',{id:row.id,revision:3,action:'review',scores:[4,4,4,4,4],feedback:qualification,approve:true},'verifier'),403);
  expect(await call('review','POST',{id:row.id,revision:3,action:'review',scores:[4,4,4,4,4],feedback:qualification,approve:true},'reviewer'),200);
  expect(await call('review','POST',{id:row.id,revision:4,action:'verify',feedback:qualification,approve:true},'reviewer'),403);
  expect(await call('review','POST',{id:row.id,revision:4,action:'verify',feedback:qualification,approve:true},'verifier'),200);
 }
 // Certificate: needs consent, is issued once, verifies publicly without private data, and can be revoked by the owner only.
 expect(await call('awards','POST',{courseId:id,publicNameConsent:false}),400);
 const award=expect(await call('awards','POST',{courseId:id,publicNameConsent:true}),201);
 const pub=expect(await call('verify/'+award.verifyToken,'GET',null,null),200);assert.equal(pub.name,'Practice Learner');assert(!JSON.stringify(pub).includes('example.test'));assert(JSON.stringify(pub).includes(t.title));checks+=2;
 assert(expect(await call('awards','POST',{courseId:id,publicNameConsent:true}),200).duplicate);checks++;
 expect(await call('awards/revoke','POST',{id:award.id,reason:'An assessment evidence discrepancy was confirmed during a recorded appeal review.'}),403);
 expect(await call('awards/revoke','POST',{id:award.id,reason:'An assessment evidence discrepancy was confirmed during a recorded appeal review.'},'owner'),200);
 assert.equal(expect(await call('verify/'+award.verifyToken,'GET',null,null),200).status,'Revoked');checks++;
 // Refund-style withdrawal: expiring the grant removes access again.
 if(!free){sql.prepare("UPDATE entitlements SET status='Revoked' WHERE user_id='learner' AND course_id=?").run(id);expect(await call('course/'+id),403)}
}
fs.writeFileSync('docs/roles-validation.json',JSON.stringify({checkedAt:new Date().toISOString(),courses:atlas.tracks.length,projects:atlas.tracks.length*10,checks,scope:'Every course through learner, owner, reviewer, verifier and outsider roles on actual SQLite rules: access, evidence, review, verification, certificate, revocation and withdrawal. Not live payment or public launch verification.'},null,2));
console.log(`Role workflow checks passed: ${checks} across ${atlas.tracks.length} courses.`);
