(() => {
 'use strict';
 let userId=null;
 const hide=()=>document.documentElement.setAttribute('data-academy-access','pending');
 function lock(message,next){hide();const box=document.getElementById('access-gate');if(box){box.querySelector('[data-access-message]').textContent=message;box.querySelector('[data-access-actions]')?.removeAttribute('hidden')}if(['/sign-in','/register','/reset-password','/dashboard'].includes(next))location.replace(next);return null}
 async function requireAccount(){
  try{
   const response=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw Error('Secure account access is unavailable. Please retry.');
   const account=await response.json();
   if(!account.signedIn)return lock('Sign in before accessing your Academy.','/sign-in');
   if(account.user?.purpose==='recovery')return lock('Set your new password before continuing.','/reset-password');
   if(account.profile?.status==='Suspended')return lock('This account is suspended. Contact the Academy owner.');
   if(!account.registered)return lock('Complete your registration before opening courses or tools.','/register');
   if(document.documentElement.dataset.academyRole==='owner'&&!account.admin)return lock('Use the Academy owner account to open administration.','/dashboard');
   if(userId&&userId!==account.user.id){hide();location.reload();return null}
   userId=account.user.id;
   return account;
  }catch(error){return lock(error.message)}
 }
 function grant(){document.documentElement.setAttribute('data-academy-access','granted')}
 window.AcademyAccess={require:requireAccount,grant,hide,lock};
 window.addEventListener('pagehide',hide);
 window.addEventListener('pageshow',async e=>{if(e.persisted){hide();if(await requireAccount())grant()}});
 window.addEventListener('focus',async()=>{if(userId){hide();if(await requireAccount())grant()}});
 document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'&&userId){hide();if(await requireAccount())grant()}});
 window.addEventListener('storage',e=>{if(e.key==='dba-auth-logout')lock('You signed out. Sign in to return to your Academy.','/sign-in')});
 // Start independently of protected application scripts so a stale page also locks.
 requireAccount();
})();
