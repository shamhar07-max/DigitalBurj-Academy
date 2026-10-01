(async()=>{
 const $=id=>document.getElementById(id),shell=window.AcademyShell;
 if(!await window.AcademyAccess.require())return;
 $('navigation').innerHTML=shell.navigation('professional',{prefix:'index.html'});shell.account();shell.bind();
 const labels={home:'Practice overview',catalog:'Explore programmes',paths:'Learning paths',workspace:'Mission workspace',tools:'Tool library',labs:'Simulation labs',evidence:'Evidence centre',failures:'Failure Passport',assessment:'Assessment centre',capability:'Capability record',plan:'Diagnostic & plan',support:'Support preparation',operations:'Curriculum & readiness',services:'Reviews, records & payments'};
 window.AcademyPractice={update({view,pid,mid,stage}){
  $('practice-section-label').textContent=labels[view]||'Practice overview';
  for(const b of $('nav').querySelectorAll('button')){if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')}
  $('practice-navigation').open=false;
  const params=new URLSearchParams({view});if(view==='workspace'){params.set('programme',pid);params.set('mission',mid);params.set('stage',stage)}history.replaceState(null,'','workspace.html?'+params);
  if(innerWidth<=900){const rail=document.querySelector('.rail'),active=rail?.querySelector('.active');if(active)rail.scrollLeft=Math.max(0,active.offsetLeft-rail.offsetLeft-(rail.clientWidth-active.clientWidth)/2)}
  window.ToolIcons.decorate($('main'));
  document.title=(view==='workspace'?pid+' · '+stage:labels[view])+' — Professional Practice · DigitalBurj Academy';
 }};
 try{
  if(window.ACADEMY_MODE==='connected'){
   const r=await fetch('/api/auth/session');const s=await r.json();if(!r.ok||!s.signedIn||!s.registered)throw Error('Sign in to open your Professional Practice Workspace.');window.ACADEMY_ACCOUNT_SCOPE=s.user.id;window.ACADEMY_PROFILE=s.profile;
   const accountResponse=await fetch('/api/academy/bootstrap');const academyAccount=accountResponse.ok?await accountResponse.json():null;const role=academyAccount?.user?.role||'Learner';$('navigation').innerHTML=shell.navigation('professional',{prefix:'index.html',role});shell.account({name:s.profile?.name||s.user.email,role,signedIn:true});
   $('mode-banner').innerHTML='<div class="mode-banner"><span>Your practice drafts save on this device. Use Reviews, records & payments to save a cloud snapshot.</span><a href="index.html#guide/saving">Saving guide</a></div>';
  }else $('mode-banner').innerHTML='<div class="mode-banner"><span>Practice preview · Your drafts are saved on this device. No live purchases or certificates.</span><a href="index.html#guide/professional">Workspace guide</a></div>';
  window.AcademyAccess.grant();const script=document.createElement('script');script.src='app.js';document.body.append(script);
 }catch(e){window.AcademyAccess.lock(e.message,'/sign-in')}
})();
