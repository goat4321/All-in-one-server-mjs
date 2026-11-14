// A selected daily suggestion is always an untimed draft.
export function dayPlanCandidates(ctx,{activityId=null,includeOptional=false}={}){
 const plan=ctx?.dayPlan;
 if(!plan||plan.tripId!==ctx.trip?.id||plan.date!==ctx.date)return [];
 const active=ctx.activeSet??new Set();
 const sources=new Map((ctx.all??[]).map(x=>[x.id,x]));
 const chosen=[],seen=new Set();
 for(const slot of plan.slots){
  if(activityId!==null&&slot.id!==activityId)continue;
  if(activityId===null&&slot.optional&&!includeOptional)continue;
  if(seen.has(slot.id)||active.has(slot.id))continue;
  const item=sources.get(slot.id);
  if(!item||item.kind!=='activity'||item.duplicateOf||item.removed||item.booked||item.locked)continue;
  seen.add(slot.id);chosen.push(slot);
 }
 return chosen;
}
export function dayPlanDraftEdits(ctx,options={}){
 const additions=dayPlanCandidates(ctx,options);
 if(!additions.length)return {edits:ctx.state.edits,added:[],skipped:true};
 const edits={...ctx.state.edits};
 for(const slot of additions){
  const item=ctx.all.find(x=>x.id===slot.id);
  edits[item.id]={...edits[item.id],selected:true,removed:false,
    date:ctx.date,start:null,end:null,order:100+slot.order,
    duration:item.duration};
 }
 return {edits,added:additions,skipped:false};
}
