import {esc,btn,urlLink} from './ui.mjs';

const radians=x=>x*Math.PI/180;
const distance=(a,b)=>{
 const dlat=radians(b[0]-a[0]),dlon=radians(b[1]-a[1]);
 const h=Math.sin(dlat/2)**2+Math.cos(radians(a[0]))*Math.cos(radians(b[0]))*Math.sin(dlon/2)**2;
 return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
};
/** Every profile sample refers to an actual point on its original GPX segment.
 * Segment gaps are never connected. Missing elevations disable vertical metrics.
 * No smoothing or invented interpolation is applied to ascent/descent totals.
 */
export function trailMetrics(segments,{elevationsUsable=true}={}){
 if(!Array.isArray(segments)||!segments.length||segments.some(s=>!Array.isArray(s)||s.length<2))
  throw Error('Wegsegmente fehlen');
 const points=segments.flat();
 if(points.some(p=>!Array.isArray(p)||p.length!==3||!Number.isFinite(p[0])||!Number.isFinite(p[1])
   ||Math.abs(p[0])>90||Math.abs(p[1])>180))throw Error('Ungültige GPX-Koordinate');
 if(points.some(p=>p[2]!==null&&(!Number.isFinite(p[2])||p[2]<-500||p[2]>9000)))throw Error('Ungültige GPX-Höhe');
 const hasElevation=elevationsUsable&&points.every(p=>p[2]!==null);
 let metres=0,ascent=0,descent=0,profile=[];
 segments.forEach((segment,index)=>segment.forEach((point,i)=>{
  if(i){metres+=distance(segment[i-1],point);
   if(hasElevation){const delta=point[2]-segment[i-1][2];ascent+=Math.max(0,delta);descent+=Math.max(0,-delta)}
  }
  profile.push({metres,elevation:point[2],segment:index,point:point.slice(0,2)});
 }));
 return {metres,ascent:hasElevation?ascent:null,descent:hasElevation?descent:null,
  min:hasElevation?Math.min(...points.map(p=>p[2])):null,max:hasElevation?Math.max(...points.map(p=>p[2])):null,
  profile:hasElevation?profile:null};
}

/** Distinguish operator claims from measured original GPX geometry.
 * Height data quality is source-scoped; 0m sea level is not universally NODATA.
 * This never interpolates or alters any original official GPX observations.
 */
export function hikingEvidenceQuality(trail){
 if(!trail?.segments?.length)
  return{state:'no_track',label:'Kein Original-GPX',metric:null,warnings:['Trackgeometrie nicht vorhanden.']};
 const metric=trailMetrics(trail.segments,{elevationsUsable:trail.elevationsUsable!==false});
 const points=trail.segments.flat(),zero=points.filter(p=>p[2]===0).length;
 const missing=points.filter(p=>p[2]===null).length;
 const usable=metric.profile!==null;
 const reasons=[];
 if(!usable){
  if(trail.elevationsUsable===false&&zero===points.length)
   reasons.push('Alle Höhenwerte sind 0-m-Platzhalter. Keine Auf-/Abstiege oder Höhenkurven berechenbar.');
  else reasons.push('Unvollständige bzw. von der Quelle als unbrauchbar markierte Höhenwerte.');
 }
 const official=trail.official??{};
 const gpKm=metric.metres/1000;
 const kmDeviation=Number.isFinite(official.km)&&official.km>0
   ?100*(gpKm-official.km)/official.km:null;
 const upDeviation=usable&&Number.isFinite(official.ascent)&&official.ascent>0
   ?100*(metric.ascent-official.ascent)/official.ascent:null;
 if(kmDeviation!==null&&Math.abs(kmDeviation)>5)
   reasons.push('GPX-Distanz weicht um '+Math.abs(kmDeviation).toFixed(1)+' % vom Betreiberwert ab.');
 if(upDeviation!==null&&Math.abs(upDeviation)>10)
   reasons.push('GPX-Aufstieg weicht um '+Math.abs(upDeviation).toFixed(1)+' % vom Betreiberwert ab.');
 if(reasons.length===0)reasons.push('Höhenwerte vollständig, aber GPS-/Höhenmessung nicht unabhängig kontrolliert.');
 return{state:usable?'gpx_elevation':'geometry_only',label:usable?'GPX-Profil verfügbar':'Nur GPX-Weglinie',
   metric,points:points.length,zero,missing,kmDeviation,upDeviation,warnings:reasons};
}

export function hikingOptions(ctx){
 if(ctx?.trip?.id!=='interrail_swiss')return [];
 return (ctx.catalog?.research?.hikingEvidence?.trails??[]).filter(t=>t.date===ctx.date);
}
export function hikingPreview(ctx,id){
 const trail=hikingOptions(ctx).find(t=>t.id===id);
 return trail?.segments?.length?trail:null;
}
export function hikingMapPreview(ctx){
 return ctx?.page==='map'&&!ctx.total&&ctx.explorer?.scope==='day'
  ?hikingPreview(ctx,ctx.hikePreviewId):null;
}
const number=(value,digits=0)=>value===null?'offen':value.toLocaleString('de-DE',{maximumFractionDigits:digits});
function profileHtml(trail){
 if(!trail.segments)return '<p class="hike-missing">Kein GPX mit Höhenpunkten vorhanden; Länge und Höhenprofil offen.</p>';
 const quality=hikingEvidenceQuality(trail),metric=quality.metric;
 if(!metric.profile)return '<p class="hike-missing">Datenqualität: '+esc(quality.label)+'. GPX-Weglinie: '+number(metric.metres/1000,2)
  +' km; Betreiber: '+number(trail.official.km,2)+' km. Abweichende Weglängen vor der Tour prüfen. '
  +esc(trail.elevationNote??'Höhenpunkte unvollständig.')+' Kein Höhenprofil und keine GPX-Höhenmeter berechnet.</p>';
 const x=value=>30+value/Math.max(1,metric.metres)*540;
 const y=value=>115-(value-metric.min)/Math.max(1,metric.max-metric.min)*90;
 const paths=trail.segments.map((segment,index)=>metric.profile.filter(p=>p.segment===index)
  .map((p,i)=>(i?'L':'M')+x(p.metres).toFixed(2)+','+y(p.elevation).toFixed(2)).join(' '));
 const differs=trail.official.km!==null&&Math.abs(metric.metres/1000-trail.official.km)>trail.official.km*.05
  ||trail.official.ascent!==null&&Math.abs(metric.ascent-trail.official.ascent)>trail.official.ascent*.1;
 return '<figure class="hike-profile"><svg viewBox="0 0 600 145" role="img" aria-label="'
  +esc(trail.title)+': GPX-Höhenprofil von '+number(metric.min)+' bis '+number(metric.max)+' Metern">'
  +'<path d="M30 20V115H570" fill="none" stroke="currentColor" opacity=".3"/>'
  +paths.map(path=>'<path d="'+path+'" fill="none" stroke="currentColor" stroke-width="3"/>').join('')
  +'<text x="30" y="14">'+number(metric.max)+' m</text><text x="30" y="138">0 km</text>'
  +'<text x="495" y="138">'+number(metric.metres/1000,2)+' km</text></svg>'
  +'<figcaption><strong>GPX-Höhenprofil</strong> · '+number(metric.metres/1000,2)+' km · ↑ '
  +number(Math.round(metric.ascent))+' m · ↓ '+number(Math.round(metric.descent))+' m'
  +'<small>Datenqualität: '+esc(quality.label)+' · '+metric.profile.length+' originale Koordinaten/Höhenpunkte ohne Glättung. Keine eigene Gelände-Höhenmodellierung; Höhenmessung nicht unabhängig geprüft.</small>'
  +'<small>Betreiber- und GPX-Werte können wegen unterschiedlicher Wegvarianten, GPS-Auflösung und Höhenmethoden abweichen. Diese Ursachen sind mögliche Erklärungen, keine belegte Ursache für den konkreten Track.</small>'
  +(differs?'<small><b>Abweichende Quellwerte:</b> Betreiber '+number(trail.official.km,2)+' km / ↑ '
    +number(trail.official.ascent)+' m; GPX '+number(metric.metres/1000,2)+' km / ↑ '
    +number(Math.round(metric.ascent))+' m. Vor der Tour die konkrete Wegvariante prüfen.</small>':'')
  +(quality.warnings.length?'<small class="hike-quality-note" role="note">'+esc(quality.warnings.join(' '))+'</small>':'')
  +'</figcaption></figure>';
}
export function hikingPanel(ctx){
 const trails=hikingOptions(ctx);if(!trails.length)return '';
 const selectedCount=trails.filter(t=>ctx.activeSet?.has(t.itemId)).length;
 return '<section class="hiking-options" aria-label="Wandertouren vergleichen"><header><h3>Wähle eure Wandertour</h3>'
  +'<p>Eine Tour als Tagesidee übernehmen. Gehzeiten gelten ohne Anfahrt und Pausen; keine Wegöffnung für September 2027 bestätigt.</p></header>'
  +(selectedCount>1?'<p role="status">Mehrere alternative Wandertouren sind eingeplant. Prüft den Tagesumfang und entfernt nicht benötigte Touren im Tagesplan.</p>':'')
  +'<div class="hiking-options-grid">'+trails.map(trail=>{
   const selected=ctx.activeSet?.has(trail.itemId),slot=ctx.dayPlan?.slots?.find(s=>s.id===trail.itemId);
   const official=trail.official;
   return '<article class="hike-option" data-hike-id="'+esc(trail.id)+'"><h4>'+esc(trail.title)+'</h4>'
    +'<p class="hike-facts">'+(official.km===null?'Länge offen':number(official.km,2)+' km')
    +' · ↑ '+number(official.ascent)+' m · ↓ '+number(official.descent)+' m · '
    +number(official.minutes)+' Min.'+(trail.id==='oesch-light'?' pro Richtung':' reine Gehzeit')+'</p>'
    +'<p>'+esc(trail.category)+'</p><p>'+esc(trail.exposure)+'</p>'
    +profileHtml(trail)
    +'<details><summary>Weg, Anfahrt und Bedingungen</summary><p>'+esc(trail.route)+'</p>'
    +'<p>'+esc(trail.access)+'</p><p>'+esc(trail.conditions)+'</p><p>'+esc(trail.costs)+'</p>'
    +'<p>Quellenprüfung '+esc(ctx.catalog.research.hikingEvidence.checkedOn)+' · SAC-Stufe '
    +esc(trail.sac??'nicht konkret belegt')+'</p><div class="swiss-focus-links">'
    +urlLink(trail.sourceUrl,'Offizielle Tourbeschreibung')+urlLink(trail.statusUrl,'Weg-/Betriebsstatus prüfen')
    +(trail.gpxUrl?urlLink(trail.gpxUrl,'Original-GPX'):'')+'</div></details>'
    +'<div class="hike-actions">'+(trail.segments?btn('hike-preview','Auf Karte ansehen','map',trail.id):'')
    +(selected?'<span>Im Tagesplan</span>':slot?btn('day-plan-add','Als Tagesidee hinzufügen','plus',trail.itemId):'')
    +'</div></article>';
  }).join('')+'</div></section>';
}
export function hikingMapPanel(ctx){
 const trail=hikingMapPreview(ctx);if(!trail)return '';
 return '<section class="hiking-map-preview" aria-label="Aktuelle Wander-Vorschau"><strong>'+esc(trail.title)+'</strong>'
  +'<p>Original-GPX als Kartenvorschau · Wegöffnung und Anfahrt separat prüfen.</p>'
  +profileHtml(trail)+'<div class="hike-actions">'+btn('hike-preview-close','Vorschau schließen','close')
  +btn('day-plan-go','Zum Wandertag','calendar',trail.date)+'</div></section>';
}
