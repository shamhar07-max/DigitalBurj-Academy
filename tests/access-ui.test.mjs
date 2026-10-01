import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {database} from './helpers.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const worker=(await import('../dist/server/index.js')).default,{DB,sql}=database();
const env={DB,ACADEMY_PLATFORM_AUTH:'sites',ACADEMY_MODE:'preview',ACADEMY_OWNER_EMAIL:'owner@example.test',ACADEMY_SESSION_KEY:'ab'.repeat(32),ACADEMY_LIVE_PRODUCTS:'[]'};
// Controlled native identity fixture, restricted to this loopback test server.
// All Academy requests run the actual compiled Worker and SQLite database.
const nativeCookie='fixture_native_session=controlled-test-session';
let nativeAccount={id:'native-browser-learner',email:'learner@example.test'};
const server=http.createServer(async(req,res)=>{
 try{
  const origin='http://127.0.0.1:'+server.address().port,url=new URL(req.url,origin);
  if(url.pathname==='/signin-with-chatgpt'){const next=url.searchParams.get('return_to');res.writeHead(302,{'set-cookie':nativeCookie+'; HttpOnly; SameSite=Lax; Path=/',location:['/register','/dashboard'].includes(next)?next:'/sign-in'});res.end();return}
  if(url.pathname==='/signout-with-chatgpt'){res.writeHead(302,{'set-cookie':'fixture_native_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',location:'/sign-in'});res.end();return}
  const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
  headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email');
  if(req.headers.cookie?.split(';').map(s=>s.trim()).includes(nativeCookie)){headers.set('oai-authenticated-user-id',nativeAccount.id);headers.set('oai-authenticated-user-email',nativeAccount.email)}
  let raw='';for await(const chunk of req)raw+=chunk;
  const response=await worker.fetch(new Request(url,{method:req.method,headers,...(raw?{body:raw}:{})}),env);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500);res.end(error.message)}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,out=path.resolve('docs/screenshots');
const browser=await chromium.launch({...(process.env.ACADEMY_CHROMIUM?{executablePath:process.env.ACADEMY_CHROMIUM}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}),context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await context.newPage();
let checks=0;const errors=[];p.on('pageerror',e=>errors.push(e.message));const check=(ok,label)=>{assert(ok,label);checks++};
const capture=async name=>p.screenshot({path:out+'/'+name+'.png',fullPage:true});
try{
 for(const route of ['/','/courses.html','/dashboard#tools','/index.html#guide','/workspace.html?view=tools','/preview#home','/practice-library.html','/admin']){await p.goto(origin+route);await p.locator('#account-content h1').waitFor();check(new URL(p.url()).pathname==='/sign-in','Anonymous URL returns to sign-in '+route);check(await p.locator('#sidebar,#navigation,#mobile-menu,.vendor-list,.course-grid,.protected-page').count()===0,'Anonymous page has no Academy navigation or content '+route)}
 const forged=await context.request.get(origin+'/api/academy/bootstrap',{headers:{'oai-authenticated-user-id':'fake-owner','oai-authenticated-user-email':'owner@example.test'}});check(forged.status()===401,'Dispatch fixture rejects caller-supplied identity headers');
 await p.goto(origin+'/register');await p.getByRole('link',{name:'Register with ChatGPT',exact:true}).waitFor();check(await p.locator('[data-chatgpt-signin] svg').count()===1,'Secure registration has a relevant icon');check(await p.locator('#sidebar,#navigation').count()===0,'Registration contains no sidebar');await capture('registration-gate-desktop');
 await p.getByRole('link',{name:'Register with ChatGPT',exact:true}).click();await p.locator('[name=name]').waitFor();check(sql.prepare('SELECT count(*) AS n FROM profiles').get().n===0,'Provider sign-in alone has not registered or admitted learner');
 await p.goto(origin+'/dashboard#tools');check(new URL(p.url()).pathname==='/register','Unregistered deep link returns to profile completion');await p.locator('[name=name]').waitFor();check(await p.locator('.vendor-list,#sidebar').count()===0,'Signed-in unregistered user still cannot open tools');
 await p.locator('[name=name]').fill('Browser registration fixture');await p.locator('[name=hours]').fill('4');await p.locator('.auth-submit').click();check(sql.prepare('SELECT count(*) AS n FROM profiles').get().n===0,'Missing consent blocks registration');
 await p.locator('[name=consent]').check();await p.locator('.auth-submit').click();await p.waitForURL('**/dashboard');await p.locator('.enrolled-courses .course-card').first().waitFor();
 const row=sql.prepare('SELECT * FROM profiles').get();check(row.user_id==='native-browser-learner'&&row.name==='Browser registration fixture'&&row.consent_at&&row.hours===4,'Profile persisted by actual registration API');check(await p.locator('.enrolled-courses .course-card').count()===2,'Registered unpaid learner sees only free foundation courses');check(await p.locator('#sidebar').isVisible(),'Sidebar appears only after verified completed registration');
 await p.goto(origin+'/courses.html');await p.locator('#course-grid .course-card').first().waitFor();check(new URL(p.url()).pathname==='/dashboard'&&new URL(p.url()).hash==='#paths'&&await p.locator('#navigation').count()===1,'Legacy course entry uses the dedicated dashboard catalogue');
 await p.goto(origin+'/practice-library.html?view=tools');await p.locator('#main h1').waitFor();check(new URL(p.url()).pathname==='/workspace.html'&&await p.locator('#navigation').count()===1,'Legacy practice entry uses the integrated Academy workspace');
 const deniedOwner=await context.request.get(origin+'/admin');check(deniedOwner.status()===403,'Registered learner cannot request owner console');
 await p.goto(origin+'/dashboard#lesson/web/web-01/0');await p.locator('#main h1').waitFor();check(await p.locator('#recipe-answer').count()===0,'Real server denies unpaid lesson body');
 await p.goto(origin+'/dashboard#tools');await p.locator('.vendor-list>article').first().waitFor();check(await p.locator('.vendor-list>article').count()===39,'All tool entries remain available to registered learner');check(await p.locator('.vendor-mark [data-tool-icon]').count()===39,'Every directory entry has a local tool icon');check(await p.locator('.vendor-mark [data-tool-icon=canva]').count()===1,'Canva has a relevant design pictogram');check(await p.locator('.vendor-mark [data-tool-icon=claude][data-icon-kind=brand]').count()===1,'Claude uses its packaged brand icon');await capture('tool-icons-desktop');
 await p.locator('#tool-search').fill('Canva');check(await p.locator('.vendor-list>article').count()===1&&await p.locator('.vendor-mark svg').count()===1,'Tool filtering retains the icon');
 await p.goto(origin+'/dashboard#path/start');await p.locator('.recommended-tools').waitFor();check(await p.locator('.recommended-tools .tool-chip svg').count()>0,'Course tool recommendations include icons');
 await p.goto(origin+'/dashboard#studio/design');await p.locator('#extra-form').waitFor();check(await p.locator('.workspace-tabs a').count()===11&&await p.locator('.workspace-tabs svg').count()===11,'All eleven workspace tabs have relevant icons');
 await p.goto(origin+'/dashboard#guide/tools');await p.locator('.guide-article h2').waitFor();check(await p.locator('.guide-article [data-tool-icon=canva]').count()>0,'Tool names in guide text have icons');
 await p.setViewportSize({width:390,height:844});await p.goto(origin+'/dashboard#tools');await p.locator('.vendor-list>article').first().waitFor();const overflow=await p.evaluate(()=>Array.from(document.querySelectorAll('#main *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.slice(0,70),right:el.getBoundingClientRect().right})).slice(0,16));check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Tool directory has no mobile overflow '+JSON.stringify(overflow));await p.locator('#tool-search').fill('Canva');await capture('tool-icons-mobile');
 await p.goto(origin+'/account');await p.locator('#logout').waitFor();check(await p.locator('#sidebar,#navigation').count()===0,'Account settings preserve account-only layout');await p.locator('#logout').click();await p.waitForURL('**/sign-in');await p.getByRole('link',{name:'Continue with ChatGPT',exact:true}).waitFor();check(await p.locator('#sidebar,#navigation').count()===0,'Signed-out page contains no Academy sidebar');check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sign-in has no mobile overflow');await capture('signin-gate-mobile');
 await p.goBack();await p.locator('#account-content h1').waitFor();check(await p.locator('#sidebar,#navigation,.vendor-list').count()===0,'Browser back cannot reveal protected workspace');
 await p.goto(origin+'/register');await p.getByRole('link',{name:'Register with ChatGPT',exact:true}).waitFor();check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Registration has no mobile overflow');await capture('registration-gate-mobile');
 await p.goto(origin+'/verify/'+'f'.repeat(48));await p.getByText('No credential was found.',{exact:true}).waitFor();check(await p.locator('#sidebar,#navigation').count()===0,'Public verification is isolated from Academy navigation');
 // Both original entry files remain locked when unpacked without a server session.
 const local=await context.newPage();local.on('pageerror',e=>errors.push(e.message));
 for(const name of ['courses.html','practice-library.html','admin.html']){await local.goto('file://'+path.resolve('dist',name));await local.locator('#access-gate [data-access-actions]').waitFor({state:'visible'});check(await local.locator('#sidebar,nav,.course-card').filter({visible:true}).count()===0&&await local.locator('.protected-page').isHidden(),'Unpacked entry cannot reveal learning or owner navigation '+name)}
 await local.close();
 // A second actual profile registration exercises the owner-only console.
 nativeAccount={id:'native-browser-owner',email:'owner@example.test'};await p.goto(origin+'/register');await p.getByRole('link',{name:'Register with ChatGPT',exact:true}).click();await p.locator('[name=name]').fill('Owner browser fixture');await p.locator('[name=consent]').check();await p.locator('.auth-submit').click();await p.waitForURL('**/dashboard');
 await p.goto(origin+'/admin');await p.locator('#provider').waitFor();check(await p.locator('.protected-page').isVisible()&&await p.locator('#staff [name=domains] option').count()===48,'Registered owner can open actual management console with all programme scopes');check(await p.locator('#account-content [data-tool-icon=supabase]').count()>0,'Owner console tool mentions use the same icons');check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Owner console fits mobile');
 nativeAccount={id:'native-browser-learner',email:'learner@example.test'};await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await p.waitForURL('**/dashboard');await p.locator('.enrolled-courses .course-card').first().waitFor();check(await p.locator('#provider,.protected-page').count()===0&&await p.locator('.enrolled-courses .course-card').count()===2,'Switching from owner to learner hides management and opens only learner access');
 nativeAccount={id:'native-browser-owner',email:'owner@example.test'};await p.goto(origin+'/admin');await p.locator('#provider').waitFor();const logoutPage=await context.newPage();await logoutPage.goto(origin+'/account');await logoutPage.locator('#logout').click();await logoutPage.waitForURL('**/sign-in');await p.waitForURL('**/sign-in');check(await p.locator('.protected-page,#sidebar,#navigation').filter({visible:true}).count()===0,'Cross-tab sign-out closes the owner console');await logoutPage.close();
 await p.goBack();await p.locator('#account-content h1').waitFor();check(await p.locator('.protected-page,#sidebar,#provider').count()===0,'Browser back cannot restore owner management after sign-out');
 check(errors.length===0,'No browser exceptions '+JSON.stringify(errors));
 fs.writeFileSync('docs/access-ui-validation.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,errors,viewports:[1440,390],scope:'Actual compiled Worker and SQLite in loopback browser. Controlled native identity ingress/OAuth fixture; no real learner seeded in deployment. Anonymous deep links, required registration, legacy entry redirects, unpacked file denial, unpaid course denial, tool icons, owner role switching, cross-tab sign-out, browser history and isolated credential lookup.'},null,2)+'\n');
 console.log('Registration, gate and tool icon browser checks passed: '+checks);
}finally{await browser.close();await new Promise(r=>server.close(r))}
