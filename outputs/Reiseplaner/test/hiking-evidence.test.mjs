import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {trailMetrics, hikingOptions, hikingPanel, hikingPreview, hikingMapPreview, hikingMapPanel} from '../public/hiking.mjs';
import {attachHikingEvidence} from '../lib/hiking.mjs';
import {loadCatalog} from '../lib/catalog.mjs';
import {dayPlanCandidates,dayPlanDraftEdits} from '../public/day-plans-logic.mjs';

const archive=JSON.parse(await readFile(new URL('../data/hiking-evidence.json',import.meta.url),'utf8'));
const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_swiss');
const context=(date='2027-09-11')=>({catalog,trip,date,all:trip.items,state:{},activeSet:new Set(),
 dayPlan:trip.dayPlansV32.find(day=>day.date===date)});

test('the primary Swiss Interrail keeps the requested 14-day city sequence and sparse long travel days',()=>{
 assert.equal(trip.from,'2027-09-01'); assert.equal(trip.to,'2027-09-14');
 assert.deepEqual(trip.dayPlansV32.map(d=>[d.date,d.city]),
  ['paris','paris','barcelona','barcelona','barcelona','sete','sete','nice','nice',
   'kandersteg','kandersteg','appenzell','appenzell','appenzell']
   .map((city,i)=>['2027-09-'+String(i+1).padStart(2,'0'),city]));
 for(const date of ['2027-09-10','2027-09-14']){
  const day=trip.dayPlansV32.find(d=>d.date===date);
  assert.equal(day.slots.length,0); assert.equal(day.rides.length,1);
  assert.equal(day.rides[0].confirmed2027,false);
 }
 const last=trip.dayPlansV32.at(-1).rides[0];
 assert.match(last.to,/München/);
 const transfer=catalog.research.interrailSwissFocusV82.days.find(d=>d.date==='2027-09-12');
 assert.match(transfer.plan,/essen und ausruhen/);assert.match(transfer.plan,/Sonntagsöffnung/);
});

test('GPX profile uses cumulative route distance and the original elevation samples',()=>{
 const result=trailMetrics([[[46,7,1000],[46.001,7,1100],[46.001,7.001,1050]]]);
 assert.ok(result.metres>180&&result.metres<200);
 assert.equal(result.ascent,100); assert.equal(result.descent,50);
 assert.deepEqual(result.profile.map(p=>p.elevation),[1000,1100,1050]);
 assert.equal(result.profile.at(-1).metres,result.metres);
 assert.equal(trailMetrics([[[46,7,1000],[46.001,7,null]]]).profile,null);
 assert.equal(trailMetrics([[[46,7,1000],[46.001,7,null]]]).ascent,null);
 assert.throws(()=>trailMetrics([[[46,7,1000],[46,190,1000]]]),/Koordinate/);
 assert.throws(()=>trailMetrics([[[46,7,1000],[46,7,NaN]]]),/Höhe/);
 const flat=[[[46,7,0],[46.001,7,0]]];
 assert.equal(trailMetrics(flat).ascent,0,'Genuine sea-level samples remain valid without a source-specific missing flag');
 assert.equal(trailMetrics(flat,{elevationsUsable:false}).profile,null);
 assert.equal(trailMetrics(flat,{elevationsUsable:false}).ascent,null);
});
test('separate GPX segments never create an invented connecting path or climb',()=>{
 const result=trailMetrics([[[46,7,1000],[46.001,7,1010]],[[47,8,2000],[47.001,8,2010]]]);
 assert.ok(result.metres<230); assert.equal(result.ascent,20);
 assert.deepEqual(result.profile.map(p=>p.segment),[0,0,1,1]);
});
test('source tracks are consistent with published tour values without claiming a 2027 opening',()=>{
 assert.equal(archive.checkedOn,'2026-11-19');
 assert.equal(archive.trails.length,4);
 for(const trail of archive.trails.filter(t=>t.segments)){
  assert.match(trail.gpxSha256,/^[a-f0-9]{64}$/);
  assert.ok(trail.gpxUrl.startsWith('https://'));
  const metric=trailMetrics(trail.segments,{elevationsUsable:trail.elevationsUsable!==false});
  if(trail.id==='ebenalp')assert.equal(metric.profile,null);
  else assert.ok(metric.profile.length>20);
  assert.ok(Math.abs(trailMetrics(trail.segments).metres/1000-trail.official.km)<1);
  assert.equal(trail.confirmed2027,false);
 }
 const high=archive.trails.find(t=>t.id==='heuberg');
 assert.equal(high.official.ascent,453); assert.equal(high.official.km,9);
 assert.match(high.exposure,/ausgesetzt|schmal/);
 assert.equal(high.sac,null,'No precise SAC grade invented from a broad path category');
 assert.equal(archive.trails.find(t=>t.id==='seealpsee').sac,'T2');
 assert.equal(catalog.research.hikingEvidence.stats.profiles,2);
});
test('hiking evidence only augments the requested Swiss trip and keeps originals and selections',()=>{
 const trips=structuredClone(catalog.trips);
 const untouched=structuredClone(trips.filter(t=>t.id!=='interrail_swiss'));
 const originalIds=trips.find(t=>t.id==='interrail_swiss').items.map(i=>i.id);
 attachHikingEvidence(trips,archive);
 attachHikingEvidence(trips,archive);
 assert.deepEqual(trips.filter(t=>t.id!=='interrail_swiss'),untouched);
 const target=trips.find(t=>t.id==='interrail_swiss');
 assert.ok(originalIds.every(id=>target.items.some(i=>i.id===id)));
 assert.equal(target.items.filter(i=>i.hikingEvidence).length,3);
 assert.ok(target.items.filter(i=>i.hikingEvidence).every(i=>!i.selected&&!i.booked&&i.price===null));
 assert.equal(target.dayPlansV32.length,14);
 assert.equal(target.dayPlansV32.find(d=>d.date==='2027-09-10').slots.length,0);
 assert.equal(target.dayPlansV32.find(d=>d.date==='2027-09-14').slots.length,0);
 for(const item of target.items.filter(i=>i.hikingEvidence)){
  assert.ok(item.swissGuideV75); assert.ok(item.locationReferenceV07);
  assert.ok(item.googleMapsUrl); assert.ok(item.source.every(key=>catalog.sources[key]));
 }
});
test('hike alternatives stay optional during bulk adoption and can be adopted individually as untimed drafts',()=>{
 const ctx=context(); ctx.state.edits={};
 assert.ok(!dayPlanCandidates(ctx).some(s=>s.id==='hiking:heuberg'));
 const result=dayPlanDraftEdits(ctx,{activityId:'hiking:heuberg'});
 assert.equal(result.added.length,1);
 assert.equal(result.edits['hiking:heuberg'].date,'2027-09-11');
 assert.equal(result.edits['hiking:heuberg'].start,null);
 assert.equal(result.edits['hiking:heuberg'].selected,true);
});
test('daily tour panel distinguishes light access, higher Heuberg and separate Ebenalp alternative',()=>{
 const html=hikingPanel(context());
 assert.match(html,/Heuberg/); assert.match(html,/Leichter Seezugang/);
 assert.match(html,/GPX-Höhenprofil/); assert.match(html,/453/);
 assert.match(html,/Abweichende Quellwerte/);
 assert.match(html,/keine Wegöffnung für September 2027/i);
 assert.match(html,/data-action="hike-preview"/);
 assert.match(html,/data-action="day-plan-add"/);
 const seealp=hikingPanel(context('2027-09-13'));
 assert.match(seealp,/Hüttentobel/); assert.match(seealp,/Ebenalp/);
 assert.match(seealp,/kein Äscher–Seealpsee-Abstieg/i);
 assert.match(seealp,/unbrauchbare Platzhalter/);
 assert.equal((seealp.match(/<figure class="hike-profile"/g)||[]).length,1,'Ebenalp has geometry but no misleading flat elevation profile');
 assert.equal(hikingPanel(context('2027-09-10')),'');
 assert.equal(hikingOptions({...context(),trip:catalog.trips.find(t=>t.id==='swiss_lakes')}).length,0);
 assert.equal(hikingPreview(context(),'seealpsee'),null);
 assert.equal(hikingPreview(context(),'heuberg').id,'heuberg');
 assert.equal(hikingPreview(context(),'oesch-light'),null);
});
test('a tour preview is confined to its own date and the My Day map mode',()=>{
 const ctx={...context(),page:'map',total:false,explorer:{scope:'day'},hikePreviewId:'heuberg'};
 assert.equal(hikingMapPreview(ctx).id,'heuberg');
 for(const change of [{total:true},{explorer:{scope:'city'}},{explorer:{scope:'trip'}},
  {page:'plan'},{date:'2027-09-13'},{trip:{id:'interrail_classic'}}]){
  assert.equal(hikingMapPreview({...ctx,...change}),null);
  assert.equal(hikingMapPanel({...ctx,...change}),'');
 }
});
