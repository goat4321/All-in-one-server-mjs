import {trailMetrics} from '../public/hiking.mjs';
import {googleMapsSearchUrl,googleMapsDirectionsUrl,googleMapsLocationStatus} from '../public/google-maps.mjs';

export function attachHikingEvidence(trips,archive,cities={}){
 const trip=trips.find(t=>t.id==='interrail_swiss');
 if(!trip||archive?.tripId!==trip.id||!Array.isArray(archive.trails))throw Error('Falsche Wanderreise');
 const seen=new Set();
 for(const trail of archive.trails){
  if(seen.has(trail.id)||!/^https:\/\//.test(trail.sourceUrl)||trail.confirmed2027!==false)
   throw Error('Ungültige Wanderquelle');
  seen.add(trail.id);
  const day=trip.dayPlansV32.find(d=>d.date===trail.date&&d.city===trail.city);
  if(!day)throw Error('Wandertag passt nicht zur Route');
  if(trail.id==='heuberg')day.title='Oeschinensee: Heuberg oder leichter Seezugang';
  if(!trail.segments)continue;
  trailMetrics(trail.segments);
  if(!trip.items.some(i=>i.id===trail.itemId)){
   const item={
   id:trail.itemId,trip:trip.id,kind:'activity',category:'activity',city:trail.city,
   name:trail.title,date:trail.date,zone:'Europe/Zurich',start:null,end:null,
   duration:trail.official.minutes,point:trail.segments[0][0].slice(0,2),
   selected:false,booked:false,locked:false,price:null,
   source:['hiking:'+trail.id],website:trail.sourceUrl,
   tags:['Wandern',trail.category],detail:[trail.route,trail.exposure,trail.conditions,trail.costs].join('\n'),
   hikingEvidence:trail.id,positionStatus:'source_gpx_start',
   geoEvidence:{url:trail.gpxUrl,note:'Original-GPX-Startpunkt der Tour; Zugang und Wegöffnung separat prüfen.'},
   };
   trip.items.push({...item,googleMapsUrl:googleMapsSearchUrl(item,cities),
    googleTransitUrl:googleMapsDirectionsUrl(null,item,cities,'transit'),mapLocationQuality:googleMapsLocationStatus(item)});
  }
  if(!day.slots.some(s=>s.id===trail.itemId))day.slots.push({
   id:trail.itemId,name:trail.title,city:trail.city,period:'morning',optional:true,
   minutes:trail.official.minutes,order:day.slots.length+1,
  });
 }
 return {trails:seen.size,tracks:archive.trails.filter(t=>t.segments).length,
  profiles:archive.trails.filter(t=>t.segments&&trailMetrics(t.segments,{elevationsUsable:t.elevationsUsable!==false}).profile!==null).length};
}
