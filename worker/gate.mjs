// Browser pages and learning APIs require both a verified identity and a
// completed Academy registration. No deployment mode exempts this check.
export function registrationState(id) {
  if (!id?.id || !id.verified) return {allowed:false,status:401,code:'SIGN_IN_REQUIRED',next:'/sign-in',error:'Sign in before accessing the Academy.'};
  if (id.purpose === 'recovery') return {allowed:false,status:403,code:'PASSWORD_RESET_REQUIRED',next:'/reset-password',error:'Set your new password before continuing.'};
  if (id.profile?.status === 'Suspended') return {allowed:false,status:403,code:'ACCOUNT_SUSPENDED',next:'/sign-in',error:'This Academy account is suspended. Contact the Academy owner.'};
  if (!id.profile || id.profile.status !== 'Active' || !id.profile.consent_at) return {allowed:false,status:403,code:'REGISTRATION_REQUIRED',next:'/register',error:'Complete your Academy registration before accessing courses or tools.'};
  return {allowed:true};
}

export function gateResponse(gate) {
  return Response.json({error:gate.error,code:gate.code,next:gate.next},{status:gate.status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
}
