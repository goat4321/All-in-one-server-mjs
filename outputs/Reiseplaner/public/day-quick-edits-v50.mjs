// Deliberate one-click, undoable local draft edits. No booking/rail changes.
const dateValid=(ctx,date)=>ctx.dates?.includes(date)&&Boolean(ctx.cityForDay(date));
const activeToday=(item,date)=>item?.selected&&!item?.removed
 &&(item.date===date||String(item.start??'').slice(0,10)===date);
const canModify=item=>item?.kind==='activity'&&!item.booked&&!item.locked
  &&!item.duplicateOf&&!item.readOnlyExternal;
export function quickDayTargetDates(ctx,item){
 if(!item||!ctx.trip?.route?.includes(item.city))return [];
 return (ctx.dates??[]).filter(date=>dateValid(ctx,date)
  &&(ctx.cityForDay(date)===item.city
    ||ctx.trip?.id==='swiss_lakes'&&ctx.trip?.route?.includes(item.city)));
}
export function quickDayEdit(ctx,id,date,mode='add'){
 const item=(ctx.all??[]).find(x=>x.id===id);
 if(!canModify(item))return {ok:false,reason:'Nur ungebuchte Aktivitäten lassen sich hier ändern.'};
 if(mode==='add'){
  if(!dateValid(ctx,date)||!quickDayTargetDates(ctx,item).includes(date))
   return {ok:false,reason:'Wähle einen Reisetag, der zu diesem Ort gehört.'};
  if(ctx.activeSet?.has(id))
   return {ok:false,reason:'Dieser Ort ist bereits eingeplant. Entferne ihn zuerst vom bisherigen Tag.'};
  const order=Math.max(100,...(ctx.active??[])
    .filter(x=>activeToday(x,date)).map(x=>Number(x.order)||100))+1;
  return {ok:true,edits:{...ctx.state.edits,[id]:{
   ...ctx.state.edits?.[id],selected:true,removed:false,date,
   start:null,end:null,order,duration:item.duration??null
  }},item,date};
 }
 if(mode==='move'){
  if(!ctx.activeSet?.has(id))
    return {ok:false,reason:'Die Aktivität muss zuerst im Reiseplan stehen.'};
  if(!dateValid(ctx,date)||!quickDayTargetDates(ctx,item).includes(date))
    return {ok:false,reason:'Dieser Ort lässt sich nur auf einen passenden Reisetag verschieben.'};
  const currentDate=String(item.start??'').slice(0,10)||item.date;
  if(currentDate===date)
    return {ok:false,reason:'Die Aktivität liegt bereits an diesem Reisetag.'};
  const nextOrder=Math.max(100,...(ctx.active??[])
    .filter(x=>x.id!==id&&activeToday(x,date)).map(x=>Number(x.order)||100))+1;
  return {ok:true,edits:{...ctx.state.edits,[id]:{
    ...ctx.state.edits?.[id],selected:true,removed:false,date,
    start:null,end:null,order:nextOrder,duration:item.duration??null
  }},item,date};
 }
 if(mode==='remove'){
  if(!ctx.activeSet?.has(id))
   return {ok:false,reason:'Die Aktivität ist derzeit nicht eingeplant.'};
  return {ok:true,edits:{...ctx.state.edits,[id]:{
   ...ctx.state.edits?.[id],selected:false,removed:false,
   start:null,end:null,date:null
  }},item,date:null};
 }
 return {ok:false,reason:'Unbekannte Tagesplanaktion.'};
}
