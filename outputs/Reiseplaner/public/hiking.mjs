import {esc,btn,urlLink} from './ui.mjs';
import {placeImageHtml,placeProfileModel} from './place-profile.mjs';

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
 const metric=trailMetrics(trail.segments,{elevationsUsable:trail.elevationsUsable!==false});
 if(!metric.profile)return '<p class="hike-missing">GPX-Weglinie: '+number(metric.metres/1000,2)
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
  +'<small>Aus '+metric.profile.length+' Originalpunkten, ohne Glättung. Höhenmodell und Genauigkeit nicht unabhängig geprüft; '
  +'Betreiberwerte können abweichen.</small>'
  +(differs?'<small><b>Abweichende Quellwerte:</b> Betreiber '+number(trail.official.km,2)+' km / ↑ '
    +number(trail.official.ascent)+' m; GPX '+number(metric.metres/1000,2)+' km / ↑ '
    +number(Math.round(metric.ascent))+' m. Vor der Tour die konkrete Wegvariante prüfen.</small>':'')
  +'</figcaption></figure>';
}
/** Reuse an already sourced place image. A lake/region image is not evidence of a
 * particular mountain trail or its present condition. Never derive image URLs from GPX.
 */
function hikingContextPhoto(ctx,trail){
 const all=ctx.all??ctx.trip?.items??[];
 const hikeItem=all.find(item=>item.id===trail.itemId);
 const routePhoto=hikeItem&&placeProfileModel(hikeItem,ctx)?.photo?hikeItem:null;
 const scenicIds=trail.city==='kandersteg'?['act-054','act-053']:['act-046','act-045'];
 const specific=all.find(item=>item.kind==='activity'&&item.id!==trail.itemId
  &&(trail.id==='ebenalp'?/Ebenalp|Wildkirchli|Äscher/i.test(item.name):false));
 const item=routePhoto??specific??all.find(item=>item.kind==='activity'&&scenicIds.some(id=>item.id===id||item.id.endsWith(':'+id)));
 if(!item)return '';
 return '<div class="hike-context-photo">'+placeImageHtml(item,ctx,{small:true})
  +'<p class="hike-photo-context">Ortsmotiv: '+esc(item.name)
  +' · zeigt nicht zwingend den konkreten Wanderabschnitt oder den Wegzustand 2027.</p></div>';
}
export function hikingPanel(ctx){
 const trails=hikingOptions(ctx);if(!trails.length)return '';
 const selectedCount=trails.filter(t=>ctx.activeSet?.has(t.itemId)).length;
 return '<section class="hiking-options" aria-label="Wandertouren vergleichen"><header><h3>Wähle eure Wandertour</h3>'
  +'<p>Eine Tour als Tagesidee übernehmen. Gehzeiten gelten ohne Anfahrt und Pausen; keine Wegöffnung für September 2027 bestätigt.</p></header>'
  +(selectedCount>1?'<p role="status">Mehrere alternative Wandertouren sind eingeplant. Prüft den Tagesumfang und entfernt nicht benötigte Touren im Tagesplan.</p>':'')
  +(ctx.date==='2027-09-13'
   ?'<p class="hike-route-warning"><strong>Nicht verwechseln:</strong> Die kurze Ebenalp–Äscher-Runde ist NICHT der Abstieg zum Seealpsee. '
    +'Für die eigenständige Ebenalp–Wildkirchli–Seealpsee–Wasserauen-Traverse veröffentlicht der Seilbahnbetreiber '
    +'5,4 km, 2 Std. 15 Min., 794 Höhenmeter Abstieg und die Einstufung „schwer“. '
    +'Steile Hänge erfordern Trittsicherheit; diese Traverse ist hier nicht als einfache Tour buchbar oder automatisch eingeplant. '
    +urlLink('https://www.ebenalp.ch/sommer/wanderkarte/ebenalp-wildkirchli-seealpsee-wasserauen','Offizielle schwierige Traverse')
    +'</p>':'')
  +'<div class="hiking-options-grid">'+trails.map(trail=>{
   const selected=ctx.activeSet?.has(trail.itemId),slot=ctx.dayPlan?.slots?.find(s=>s.id===trail.itemId);
   const official=trail.official;
   return '<article class="hike-option" data-hike-id="'+esc(trail.id)+'">'
    +hikingContextPhoto(ctx,trail)
    +'<h4>'+esc(trail.title)+'</h4>'
    +'<p class="hike-facts">'+(official.km===null?'Länge offen':number(official.km,2)+' km')
    +' · ↑ '+number(official.ascent)+' m · ↓ '+number(official.descent)+' m · '
    +number(official.minutes)+' Min.'+(trail.id==='oesch-light'?' pro Richtung':' reine Gehzeit')+'</p>'
     +'<p class="hike-category"><strong>Wegtyp:</strong> '+esc(trail.category)+'</p>'
    +'<p class="hike-risk"><strong>Gelände & Anforderungen:</strong> '+esc(trail.exposure)+'</p>'
    +profileHtml(trail)
    +'<details><summary>Weg, Anfahrt und Bedingungen</summary><p>'+esc(trail.route)+'</p>'
    +'<p>'+esc(trail.access)+'</p><p>'+esc(trail.costs)+'</p>'
     +'<p><strong>Stand:</strong> '+esc(trail.conditions)+'</p>'
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
