import {esc,icon,btn,shortDay} from './ui.mjs';
import {placeProfileModel,placeThumbnailHtml} from './place-profile.mjs';
import {planCostSignal,dayPeriod} from './visual-experience.mjs';
import {curatedPlacePhoto} from './curated-place-photos.mjs';

// Visual architecture adapts the supplied travel references: a readable
// itinerary alongside the map, images only with documented reuse rights,
// and action-oriented overlays. No made-up duration, rating or live price.
const kindIcon={activity:'compass',lodging:'bed',transport:'train',
  food:'food',shop:'wallet'};
const isValidTime=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(t??''));
const cardName=item=>item.role&&item.kind==='transport'
  ?item.role+' · '+item.name:item.name;
const stableRows=rows=>[...new Map(rows.filter(x=>x&&x.id&&!x.removed&&!x.duplicateOf)
  .map(x=>[x.id,x])).values()];

export function mapDayAgenda(ctx){
  if(!ctx?.explorer)return '';
  const day=ctx.day??[];
  const people=Math.max(1,ctx.people?.length??1);
  const city=ctx.cities?.[ctx.city]?.name??ctx.city;
  const planned=day.filter(x=>isValidTime(x.time)).length;
  const flexible=day.length-planned;
  const groups=day.slice(0,8).map((item,i)=>{
    const price=planCostSignal(item,people);
    const time=isValidTime(item.time)?item.time:'Flexibel';
    const period=dayPeriod(item.time);
    const cls=period?.key??'flex';
    const current=ctx.selected===item.entryKey;
    const hasPin=Array.isArray(item.point)&&item.point.length===2;
    const button='<button class="reference-agenda-select" type="button" data-action="select"'
      +' data-value="'+esc(item.entryKey??item.id)+'" aria-pressed="'+current+'"'
      +' aria-label="'+esc(cardName(item))+' in der Karte auswählen"'
      +(!hasPin?' title="Kein gesicherter individueller Kartenpunkt"':'')+'>'
      +'<span class="reference-agenda-time">'+esc(time)+'</span>'
      +'<span class="reference-agenda-thumb">'+placeThumbnailHtml(item,ctx)+'</span>'
      +'<span class="reference-agenda-text"><strong>'+esc(cardName(item))
      +'</strong><small>'+esc(item.kind==='transport'?'Bahn/Verkehr · Planentwurf':
          (period?.title??'Flexibel')+' · '+(item.duration?item.duration+' Min. geplant':'Planangabe'))
      +(hasPin?'':' · Ort ohne Pin')+'</small></span>'
      +'<span class="reference-agenda-price" title="'+esc(price.note)+'">'
      +esc(price.tier)+'</span>'
      +'<span class="reference-agenda-chevron" aria-hidden="true">'+icon('chevron')+'</span></button>';
    return '<li class="reference-agenda-item reference-'+cls+'" data-agenda-item="'+esc(item.entryKey??item.id)+'">'
      +'<span class="reference-agenda-index" aria-hidden="true">'+(i+1)+'</span>'
      +button+'</li>';
  }).join('');
  return '<section class="reference-agenda" aria-label="Tagesablauf neben der Karte">'
    +'<div class="reference-agenda-head"><div><small>DEIN PLANTAG</small>'
    +'<h2>'+esc(city)+' · '+esc(shortDay(ctx.date))+'</h2>'
    +'<p>'+day.length+' '+(day.length===1?'Stopp':'Stopps')+' · '+planned
    +' mit Uhrzeit · '+flexible+' flexibel</p></div>'
    +btn('page','Vollständiger Tagesplan','arrow','plan')+'</div>'
    +'<ol class="reference-agenda-list">'+(groups||'<li class="reference-agenda-empty">'
      +'Für diesen Tag sind noch keine Stopps ausgewählt. Die Karte zeigt recherchierte Optionen.</li>')
    +'</ol>'
    +(day.length>8?'<p class="reference-agenda-extra">+'+(day.length-8)
      +' weitere Stopps im vollständigen Tagesplan</p>':'')
    +'<div class="reference-agenda-foot"><small>'+icon('pin')
    +' Einträge im Tagesplan; Planzeiten sind keine geprüften Öffnungszeiten.</small>'
    +btn('page','Tag bearbeiten','edit','plan')+'</div></section>';
}

export function mapImageIntro(ctx){
  const city=ctx.cities?.[ctx.city]?.name??ctx.city??'Reise';
  const matched=(ctx.all??[]).find(item=>item.city===ctx.city&&curatedPlacePhoto(item));
  const photo=matched?curatedPlacePhoto(matched):null;
  return '<header class="reference-map-intro '+(photo?'has-photo':'no-photo')+'">'
    +(photo?'<div class="reference-intro-photo"><img loading="lazy" decoding="async"'
      +' referrerpolicy="no-referrer" src="'+esc(photo.url)+'" alt="'
      +esc('Quellenfoto: '+matched.name)+'"><span>Bildmotiv: '
      +esc(matched.name)+' · Lizenz im Ortsprofil</span></div>':'')
    +'<div class="reference-map-intro-copy"><small class="reference-map-eyebrow">'
    +icon('map')+' REISEPLANUNG · KARTE & TAGESABLAUF</small>'
    +'<h1>Karten-Explorer</h1>'
    +'<p>'+esc(ctx.variant?.state?.title??ctx.trip.title)+' · '
    +esc(ctx.trip?.from??'')+' bis '+esc(ctx.trip?.to??'')+' · '
    +(ctx.people?.length??0)+' Reisende</p></div>'
    +'<div class="reference-map-intro-actions">'
    +btn('page','Tagesplan','calendar','plan')+'</div></header>';
}

export function mapFloatingControls(ctx){
  if(!ctx.explorer)return '';
  const total=Boolean(ctx.total);
  const saved=Boolean(ctx.explorer.savedOnly);
  return '<nav class="reference-map-floating" aria-label="Kartenansicht direkt umschalten">'
    +'<button type="button" data-action="map-mode" data-value="day" aria-pressed="'+(!total)+'">'
    +icon('calendar')+'<span>Mein Tag</span></button>'
    +'<button type="button" data-action="map-mode" data-value="total" aria-pressed="'+total+'">'
    +icon('map')+'<span>Gesamtroute</span></button>'
    +'<button type="button" data-action="explorer-saved-only"'
    +' aria-pressed="'+saved+'" title="Nur gemerkte Orte anzeigen">'
    +icon('bookmark')+'<span>Merkliste</span></button></nav>';
}

export function mapPhotoDiscovery(ctx){
  if(!ctx?.explorer)return '';
  const rows=stableRows([...(ctx.explorer.placed??[]),...(ctx.explorer.unlocated??[])]);
  const people=ctx.people?.length??1;
  const withPhoto=rows.map(item=>({item,photo:placeProfileModel(item,ctx)?.photo}))
    .filter(row=>row.photo&&/^https:\/\//.test(row.photo.url)
      &&/^https:\/\//.test(row.photo.sourceUrl)).slice(0,8);
  const cards=withPhoto.map(({item,photo})=>{
    const signal=planCostSignal(item,people);
    return '<article class="reference-discovery-card">'
      +'<div class="reference-discovery-image"><img loading="lazy" decoding="async"'
      +' referrerpolicy="no-referrer" src="'+esc(photo.url)+'" alt="'
      +esc('Foto von '+item.name)+'"'
      +' title="'+esc(photo.credit)+'"></div>'
      +'<div class="reference-discovery-body"><div class="reference-discovery-title">'
      +'<strong>'+esc(item.name)+'</strong><span class="reference-discovery-euro" title="'
      +esc(signal.note)+'">'+esc(signal.tier)+'</span></div>'
      +'<p>'+esc(ctx.cities?.[item.city]?.name??item.city)+' · '
      +esc(item.kind==='lodging'?'Unterkunft':
        item.kind==='transport'?'Verbindung':'Ort & Aktivität')+'</p>'
      +'<div class="reference-discovery-actions">'
      +btn('details','Details','arrow',item.explorerId??item.id,'subtle')
      +'<a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer"'
      +' title="'+esc(photo.credit)+'">Bildquelle</a></div></div></article>';
  }).join('');
  return '<section class="reference-discovery" aria-label="Bebilderte Orte und Aktivitäten entlang der Reise">'
    +'<div class="reference-discovery-head"><div><small>MIT QUELLENFOTOS</small>'
    +'<h2>Orte entlang deiner Route</h2>'
    +'<p>Nur Orte mit zugeordneten Fotos und dokumentierter Bildquelle. '
    +'Keine erfundenen Bewertungen oder Öffnungszeiten.</p></div>'
    +btn('page','Alle Orte entdecken','arrow','discover')+'</div>'
    +(cards?'<div class="reference-discovery-filmstrip" tabindex="0"'
      +' role="region" aria-label="Seitlich scrollbare Ortsfotos">'+cards+'</div>'
      :'<div class="reference-discovery-empty"><p>Für diesen Filter sind noch keine '
      +'zugeordneten Quellenfotos vorhanden.</p>'
      +btn('hud-audit','Fehlende Fotos prüfen','arrow','photo')+'</div>')
    +'</section>';
}
