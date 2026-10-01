// Both browser and server use these structural checks. Only independent review assesses quality.
export const STEP_FIELDS=['objective','inspection','work','test','reflection','handover'];
export function validateRecipe(mission,draft){
 const minimums=[30,40,80,70,80,60];
 const checks=STEP_FIELDS.map((key,i)=>({key,label:mission.steps[i].title,pass:typeof draft?.[key]==='string'&&draft[key].trim().length>=minimums[i],detail:`Write at least ${minimums[i]} characters using specific evidence.`}));
 checks.push({key:'consent',label:'Evidence permission confirmed',pass:draft?.consent===true,detail:'Confirm that the work contains fictional or authorized information.'});
 checks.push({key:'criteria',label:'Every acceptance criterion checked',pass:Array.isArray(draft?.criteria)&&mission.criteria.every((_,i)=>draft.criteria.includes(i)),detail:'Check each criterion after inspecting your output.'});
 return {pass:checks.every(x=>x.pass),checks,scope:'Evidence structure only. These checks do not assess correctness or award a certificate.'};
}
