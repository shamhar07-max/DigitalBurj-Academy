export async function professionalAccess(env,id,C,atlas){
 if(!id?.id||!id.verified||id.purpose==='recovery')return [];
 const profile=await env.DB.prepare('SELECT status FROM profiles WHERE user_id=?').bind(id.id).first();if(profile?.status==='Suspended')return [];
 if(env.ACADEMY_OWNER_EMAIL&&id.email?.toLowerCase()===env.ACADEMY_OWNER_EMAIL.toLowerCase())return C.programmes.map(p=>p.id);
 const demo=await env.DB.prepare("SELECT id FROM launch_accounts WHERE user_id=? AND kind='Demo' AND status='Active' AND expires>=?").bind(id.id,new Date().toISOString().slice(0,10)).first();if(demo)return C.programmes.map(p=>p.id);
 const entitlements=(await env.DB.prepare("SELECT course_id FROM entitlements WHERE user_id=? AND status='Active' AND (expires IS NULL OR expires>?)").bind(id.id,new Date().toISOString()).all()).results||[];
 const courses=new Set(entitlements.map(x=>x.course_id)),staff=await env.DB.prepare('SELECT domains FROM staff WHERE user_id=? AND expires>=?').bind(id.id,new Date().toISOString().slice(0,10)).first();if(staff)for(const d of JSON.parse(staff.domains))courses.add(d);
 return [...new Set(['DB-00',...C.programmes.filter(p=>courses.has(p.id)).map(p=>p.id),...atlas.tracks.filter(t=>t.free||courses.has(t.id)).flatMap(t=>t.legacyProgrammeIds||[t.legacy])])];
}
