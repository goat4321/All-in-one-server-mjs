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

/** V105: reorder only untimed, editable activities in one contiguous city block.
 * The full day (including hidden cities) determines boundaries. No time/date edits. */
const freeV105=item=>Boolean(item?.kind==='activity'&&!item.start&&!item.end&&!item.instant
 &&!item.booked&&!item.locked&&!item.removed&&!item.duplicateOf&&!item.readOnlyExternal
 &&!item.mealSlot&&!item.role&&item.city);
const orderV105=item=>Number.isFinite(item?.order)?item.order:0;
function blockV105(ctx,id){
 const rows=ctx?.fullDay??ctx?.day??[];
 const index=rows.findIndex(row=>row.id===id);
 const item=rows[index];
 if(index<0||!freeV105(item)||!(ctx.day??rows).some(row=>row.id===id))return null;
 const same=row=>freeV105(row)&&row.city===item.city;
 let first=index,last=index;
 while(first>0&&same(rows[first-1]))first--;
 while(last+1<rows.length&&same(rows[last+1]))last++;
 if(first===last)return null;
 const lower=first>0&&!rows[first-1].instant&&!rows[first-1].start?orderV105(rows[first-1]):null;
 const upper=last+1<rows.length&&!rows[last+1].instant&&!rows[last+1].start?orderV105(rows[last+1]):null;
 const size=last-first+1;
 const start=lower??(upper===null?orderV105(rows[first])-1:upper-size-1);
 const step=upper===null?1:(upper-start)/(size+1);
 const orders=Array.from({length:size},(_,i)=>start+step*(i+1));
 if(!orders.every((order,i)=>Number.isFinite(order)&&order>(i?orders[i-1]:start)
    &&(upper===null||order<upper)))return null;
 return {rows:rows.slice(first,last+1),orders,index:index-first};
}
export function timelineMovesV105(ctx,id){
 const block=blockV105(ctx,id);
 if(!block)return {previous:null,next:null};
 return {previous:block.rows[block.index-1]?.id??null,next:block.rows[block.index+1]?.id??null};
}
export function timelineReorderV105(ctx,fromId,toId){
 const block=blockV105(ctx,fromId);
 const target=block?.rows.findIndex(row=>row.id===toId)??-1;
 if(!block||target<0||target===block.index||!(ctx.day??ctx.fullDay??[]).some(row=>row.id===toId))
  return {ok:false,reason:'Nur flexible Aktivitäten ohne Uhrzeit im selben Ortsabschnitt lassen sich verschieben.'};
 const next=block.rows.slice();
 const [item]=next.splice(block.index,1);next.splice(target,0,item);
 const edits={...ctx.state.edits};
 next.forEach((row,i)=>{edits[row.id]={...edits[row.id],order:block.orders[i]};});
 return {ok:true,edits,ids:next.map(row=>row.id)};
}
