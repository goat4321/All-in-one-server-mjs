import {readFile} from 'node:fs/promises';
const file=new URL('../data/research-v28/field-notes.json',import.meta.url);
const fail=s=>{throw Error('Field notes V28: '+s)};
export async function loadFieldNotesV28(){
 const data=JSON.parse(await readFile(file,'utf8'));
 if(data.schema!=='field_notes_v28'||!Array.isArray(data.entries)
    ||new Set(data.entries.map(x=>x.id)).size!==data.entries.length)fail('metadata');
 for(const n of data.entries)if(!/^act-\d{3}$/.test(n.id)||!n.city||!n.label
   ||!['arrival','entry','onSite','check'].every(k=>typeof n[k]==='string'&&n[k].length>=25)
   ||!/^https:\/\/[^\s<>]+$/.test(n.sourceUrl)
   ||n.reviewedOn!==data.reviewedOn||n.bookingConfirmed!==false
   ||n.price2027CheckoutConfirmed!==false)fail('bad evidence '+n.id);
 return data;
}
export function applyFieldNotesV28(trips,data,originalActivities){
 const originals=new Map(originalActivities.map(x=>[x.id,x.destination_id]));
 for(const n of data.entries)if(originals.get(n.id)!==n.city)fail('wrong original '+n.id);
 const byId=new Map(data.entries.map(x=>['survey-v19:'+x.id,x])),seen=new Set();
 let assignments=0;
 for(const trip of trips)trip.items=trip.items.map(item=>{
   const note=byId.get(item.id);
   if(!note||item.kind!=='activity'||item.city!==note.city)return item;
   seen.add(note.id);assignments++;
   return {...item,fieldNoteV28:note,
     source:[...new Set([...(item.source??[]),'field-note-v28:'+note.id])]};
 });
 return {entries:data.entries,reviewedOn:data.reviewedOn,assignments,assignedUnique:seen.size,
   archiveOnly:data.entries.filter(x=>!seen.has(x.id)).map(x=>x.id),
   sources:data.entries.map(n=>({id:'field-note-v28:'+n.id,publisher:'Betreiberbesuchsinfo · '+n.label,
     url:n.sourceUrl,accessed_on:n.reviewedOn,validity:'Quellenreferenz, keine bestätigte Buchung'}))};
}
