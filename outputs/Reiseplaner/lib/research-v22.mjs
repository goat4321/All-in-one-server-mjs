import {readFile} from 'node:fs/promises';
const url=new URL('../data/research-v22/operator-guides.json',import.meta.url);
const failure=message=>{throw new Error('Operator guides V22: '+message)};
const external=u=>typeof u==='string'&&/^https:\/\/[a-z0-9.-]+\//i.test(u);
export async function loadResearchV22(){
  const archive=JSON.parse(await readFile(url,'utf8'));
  if(archive.schema!=='operator_guides_v22'
    ||archive.total!==57||!Array.isArray(archive.entries)
    ||archive.entries.length!==archive.total
    ||!/^\d{4}-\d{2}-\d{2}$/.test(archive.reviewedOn)
    ||new Set(archive.entries.map(x=>x.id)).size!==archive.total)
    failure('archive metadata or uniqueness');
  for(const item of archive.entries){
    if(!/^act-\d{3}$/.test(item.id)||!item.city||!item.title
      ||typeof item.summary!=='string'||item.summary.length<65
      ||!Array.isArray(item.highlights)||item.highlights.length<2
      ||item.highlights.some(x=>typeof x!=='string'||!x.trim())
      ||typeof item.practical!=='string'||item.practical.length<35
      ||!external(item.sourceUrl)||item.bookingConfirmed!==false
      ||item.photoRightsProvided!==false
      ||item.price2027Confirmed!==(item.validity==='published_2027_tariff'))
      failure('bad provenance for '+item.id);
  }
  return archive;
}
export function applyResearchV22(trips,archive,originalActivities=null){
  // A surveyed alternative can exist in the archive without belonging to any
  // itinerary. Validate it against the original 57 records instead of
  // silently inserting it into a trip (e.g. Montpellier act-056).
  if(originalActivities){
    const originals=new Map(originalActivities.map(x=>[x.id,x]));
    for(const row of archive.entries){
      const candidate=originals.get(row.id);
      if(!candidate||candidate.destination_id!==row.city)
        failure('source activity mismatch '+row.id);
    }
  }
  const byId=new Map(archive.entries.map(row=>['survey-v19:'+row.id,row]));
  const matched=new Set();
  let assignments=0;
  for(const trip of trips){
    trip.items=trip.items.map(item=>{
      const row=byId.get(item.id);
      if(!row||item.kind!=='activity'||item.city!==row.city)return item;
      matched.add(row.id);assignments++;
      return {...item,guideV22:row,
        source:[...new Set([...(item.source??[]),'guide-v22:'+row.id])]};
    });
  }
  const archiveOnly=archive.entries.filter(x=>!matched.has(x.id)).map(x=>x.id);
  if(archiveOnly.length){
    if(!originalActivities)failure('unmatched archived IDs without archive validation: '+archiveOnly.join(', '));
    const originals=new Map(originalActivities.map(x=>[x.id,x]));
    if(archiveOnly.some(id=>(originals.get(id)?.trip_applicability??[]).length!==0))
      failure('unmatched active trip candidate: '+archiveOnly.join(', '));
  }
  return {
    version:archive.reviewedOn,entries:archive.entries,assignments,
    assignedUnique:matched.size,archiveOnly,
    sources:archive.entries.map(x=>({
      id:'guide-v22:'+x.id,publisher:'Offizieller Ortsinspektor · '+x.title,
      url:x.sourceUrl,accessed_on:x.reviewedOn,
      validity:x.validity+' · Betreiberinformationen sind keine 2027-Buchung',
    })),
  };
}
