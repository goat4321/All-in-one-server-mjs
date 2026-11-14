import {esc,icon,btn,shortDay} from './ui.mjs';
import {conflicts} from './model.mjs';
import {placeProfileModel,placeThumbnailHtml} from './place-profile.mjs';
import {planCostSignal,dayPeriod} from './visual-experience.mjs';
import {curatedPlacePhoto} from './curated-place-photos.mjs';
import {dayPlanCandidates} from './day-plans-logic.mjs';

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
  // Reuse the existing itinerary conflict engine. These are local draft
  // warnings, not verified carrier times or live official opening hours.
  const warnings=conflicts(day,ctx.conflictRoutes??[],ctx.fullDay??day);
  const warningPanel=warnings.length?'<aside class="reference-agenda-warnings"'
    +' aria-label="Planungshinweise für diesen Reisetag">'
    +'<div class="reference-agenda-warning-head">'+icon('alert')
    +'<strong>'+warnings.length+' '+(warnings.length===1?'Planungshinweis':'Planungshinweise')
    +'</strong>'+btn('page','Im Tagesplan prüfen','arrow','plan')+'</div>'
    +warnings.slice(0,2).map(row=>'<p>'+esc(row.text)+'</p>').join('')
    +(warnings.length>2?'<small>+'+(warnings.length-2)
      +' weitere Hinweise im vollständigen Tagesplan</small>':'')
    +'<small>Aus deinem Plan und hinterlegten Referenzdaten berechnet.'
    +' Keine Buchungs- oder Fahrplangarantie.</small></aside>':'';
  const days=ctx.dates??[];
  const currentIndex=days.indexOf(ctx.date);
  const prevDay=currentIndex>0?days[currentIndex-1]:null;
  const nextDay=currentIndex>=0&&currentIndex<days.length-1?days[currentIndex+1]:null;
  const dayNavigation=days.length?'<div class="reference-day-steps" role="group" aria-label="Zwischen Reisetagen wechseln">'
    +'<button type="button" data-action="day" '+(prevDay?'data-value="'+esc(prevDay)+'"':'disabled')
    +' aria-label="Vorheriger Reisetag" title="Vorheriger Reisetag">'+icon('arrow-left')+'</button>'
    +'<span>Tag '+(currentIndex+1)+' / '+days.length+'</span>'
    +'<button type="button" data-action="day" '+(nextDay?'data-value="'+esc(nextDay)+'"':'disabled')
    +' aria-label="Nächster Reisetag" title="Nächster Reisetag">'+icon('arrow-right')+'</button>'
    +'</div>':'';
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
  const draftSlots=day.some(item=>item.kind==='activity')?[]
    :((ctx.dayPlan?.date===ctx.date)?ctx.dayPlan.slots:[]);
  const draftCandidates=dayPlanCandidates(ctx);
  const itemIndex=new Map((ctx.all??[]).map(item=>[item.id,item]));
  const timeGroup={morning:['Morgen','sun'],noon:['Mittag','food'],
    afternoon:['Nachmittag','compass'],evening:['Abend','moon']};
  let lastPreviewPeriod=null;
  const previewHtml=draftSlots.length
   ?'<div class="reference-agenda-preview" aria-label="Unverbindlicher Tagesentwurf">'
      +'<div class="reference-agenda-preview-head"><strong>Tagesideen für '+esc(city)+'</strong>'
      +'<small>Vorschau · keine Buchungen oder festen Uhrzeiten</small></div>'
      +'<ol class="reference-agenda-preview-list">'
      +draftSlots.map((slot,i)=>{
       const item=itemIndex.get(slot.id);
       const [heading,sign]=timeGroup[slot.period]??['Flexibel','clock'];
       const marker=slot.period!==lastPreviewPeriod
         ?'<li class="reference-agenda-period reference-period-'+esc(slot.period)+'">'
          +icon(sign)+'<strong>'+esc(heading)+'</strong></li>':'';
       lastPreviewPeriod=slot.period;
       const planned=Boolean(ctx.activeSet?.has(slot.id));
       return marker+'<li class="reference-agenda-preview-item">'
        +'<span class="reference-preview-dot">'+(i+1)+'</span>'
        +'<span class="reference-preview-photo">'
        +(item?placeThumbnailHtml(item,ctx):icon('pin'))+'</span>'
        +'<span class="reference-preview-copy"><strong>'+esc(slot.name)
        +'</strong><small>'+slot.minutes+' Min. geplant'
        +(slot.optional?' · Alternative':' · frei einteilbar')+'</small></span>'
        +'<span class="reference-preview-actions">'
        +(planned?'<span class="reference-preview-done">'+icon('check')+'</span>'
        :btn('day-plan-add',slot.optional?'Optional hinzufügen':'Zum Tag','plus',slot.id,'subtle'))
        +'</span></li>';
       }).join('')+'</ol>'
       +'<div class="reference-preview-footer">'
       +(draftCandidates.length?btn('day-plan-adopt',draftCandidates.length+' Ideen übernehmen','plus','','primary'):'')
       +'<small>Startzeiten und Wege werden nicht erfunden.</small></div></div>'
    :'';
  const examples=day.length||draftSlots.length?[]:(ctx.all??[])
    .filter(item=>item.city===ctx.city&&item.kind==='activity'
      &&!item.removed&&!item.duplicateOf&&!ctx.activeSet?.has(item.id)
      &&item.guideV22?.sourceUrl)
    .sort((a,b)=>Number(Boolean(curatedPlacePhoto(b)))
      -Number(Boolean(curatedPlacePhoto(a))))
    .slice(0,4);
  const examplesHtml=examples.length?'<div class="reference-agenda-suggestions">'
    +'<h3>Aus deiner Ortsrecherche</h3>'
    +'<p>Unverbindliche Ideen · nicht in den Tagesplan aufgenommen</p>'
    +examples.map(item=>{
      const tier=planCostSignal(item,people);
      return '<button type="button" class="reference-agenda-suggestion"'
        +' data-action="details" data-value="'+esc(item.id)+'"'
        +' aria-label="'+esc(item.name)+' als unverbindliche Option öffnen">'
        +'<span class="reference-agenda-thumb">'+placeThumbnailHtml(item,ctx)+'</span>'
        +'<span class="reference-agenda-text"><strong>'+esc(item.name)
        +'</strong><small>Quelleninfos und Details ansehen</small></span>'
        +'<span class="reference-agenda-price" title="'+esc(tier.note)+'">'
        +esc(tier.tier)+'</span><span aria-hidden="true">'+icon('chevron')+'</span>'
        +'</button>';
    }).join('')+'</div>':'';
  return '<section class="reference-agenda" aria-label="Tagesablauf neben der Karte">'
    +'<div class="reference-agenda-head"><div><small>DEIN PLANTAG</small>'
    +'<h2>'+esc(city)+' · '+esc(shortDay(ctx.date))+'</h2>'
    +'<p>'+(day.length?day.length+' '+(day.length===1?'Stopp':'Stopps')+' · '+planned
    +' mit Uhrzeit · '+flexible+' flexibel'
    :(ctx.dayPlan?.slots.length??0)+' Tagesideen verfügbar · noch nicht eingeplant')+'</p></div>'
    +dayNavigation+btn('page','Vollständiger Tagesplan','arrow','plan')+'</div>'
    +'<ol class="reference-agenda-list">'+(groups||(draftSlots.length?'':('<li class="reference-agenda-empty">')
      +'Für diesen Tag sind noch keine Stopps ausgewählt.'
      +(ctx.explorer.scope==='day'
        ?' Die Tageskarte zeigt deshalb keine noch nicht eingeplanten Orte.'
        :' Die Karte zeigt recherchierte Optionen.')
      +(ctx.explorer.scope==='day'
        ?'<button type="button" data-action="map-mode" data-value="city"'
          +' class="reference-empty-discover">Recherchierte Stadtorte anzeigen</button>'
        :'')+'</li>'))
    +'</ol>'
    +warningPanel
    +previewHtml
    +examplesHtml
    +(day.length>8?'<p class="reference-agenda-extra">+'+(day.length-8)
      +' weitere Stopps im vollständigen Tagesplan</p>':'')
    +'<div class="reference-agenda-foot"><small>'+icon('pin')
    +' Einträge im Tagesplan; Planzeiten sind keine geprüften Öffnungszeiten.</small>'
    +btn('page','Tag bearbeiten','edit','plan')+'</div></section>';
}

export function mapImageIntro(ctx){
 const city=ctx.cities?.[ctx.city]?.name??ctx.city??'Reise';
 const imageCandidate=(ctx.all??[]).find(item=>item.city===ctx.city&&curatedPlacePhoto(item));
 const photo=imageCandidate?curatedPlacePhoto(imageCandidate):null;
 const title=ctx.variant?.state?.title??ctx.trip?.title??'Deine Reise';
 const from=ctx.trip?.from??'',to=ctx.trip?.to??'';
 const media=photo?
   '<a class="reference-hero-thumb" href="'+esc(photo.sourceUrl)
   +'" target="_blank" rel="noopener noreferrer" title="Lizenziertes Ortsmotiv – Bildquelle öffnen">'
   +'<img src="'+esc(photo.url)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"'
   +' alt="'+esc('Ortsmotiv: '+imageCandidate.name)+'"></a>'
   :'<div class="reference-hero-thumb reference-hero-fallback" aria-hidden="true">'+icon('map')+'</div>';
 return '<header class="reference-map-intro '+(photo?'has-photo':'no-photo')+'">'
   +(photo?'<div class="reference-intro-photo" aria-hidden="true"><img'
      +' src="'+esc(photo.url)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt=""></div>':'')
   +media
   +'<div class="reference-map-intro-copy"><small class="reference-map-eyebrow">'
   +esc(city)+' · DEINE REISE</small>'
   +'<h1>'+esc(title)+'</h1>'
   +'<p>'+esc(from)+' – '+esc(to)+' · '+(ctx.people?.length??0)+' Reisende'
   +' · Recherche und Entwurf, nicht gebucht</p>'
   +(ctx.mapSimple?'<small class="simple-hero-hint">1. Ort finden · 2. Merken oder zum Tag hinzufügen · 3. Route ansehen</small>':'')
   +'</div>'
   +'<div class="reference-map-intro-actions">'
   +(ctx.mapSimple
     ?'<nav class="simple-main-actions" aria-label="Die drei wichtigsten Reiseaktionen">'
       +'<button type="button" class="simple-main-button" data-action="simple-find">'
       +icon('search')+'<span>Orte finden</span></button>'
       +'<button type="button" class="simple-main-button" data-action="map-mode" data-value="day"'
       +' aria-pressed="'+(ctx.explorer?.scope==='day')+'">'
       +icon('calendar')+'<span>Mein Tag</span></button>'
       +'<button type="button" class="simple-main-button" data-action="map-mode" data-value="total"'
       +' aria-pressed="'+(ctx.explorer?.scope==='trip')+'">'
       +icon('map')+'<span>Route zeigen</span></button>'
       +'</nav>'
      :btn('page','Reise bearbeiten','edit','plan'))
   +'<button type="button" class="simple-mode-switch" data-action="map-simple-toggle"'
   +' aria-label="'+esc(ctx.mapSimple?'Alle Funktionen anzeigen':'Einfachen Modus aktivieren')+'">'
   +esc(ctx.mapSimple?'Alle Funktionen':'Einfacher Modus')+'</button>'
   +'</div></header>';
}

export function mapFloatingControls(ctx){
  if(!ctx.explorer)return '';
  const total=Boolean(ctx.total);
  const saved=Boolean(ctx.explorer.savedOnly);
  const scope=ctx.explorer.scope??(total?'trip':'city');
  return '<nav class="reference-map-floating" aria-label="Kartenansicht direkt umschalten">'
    +'<button type="button" data-action="map-mode" data-value="day"'
    +' aria-pressed="'+(scope==='day')+'" title="Nur für diesen Tag eingeplante Stopps">'
    +icon('calendar')+'<span>Mein Tag</span></button>'
    +'<button type="button" data-action="map-mode" data-value="city"'
    +' aria-pressed="'+(scope==='city')+'" title="Recherchierte Orte dieser Stadt">'
    +icon('pin')+'<span>Stadt</span></button>'
    +'<button type="button" data-action="map-mode" data-value="total"'
    +' aria-pressed="'+(scope==='trip')+'" title="Alle Städte entlang der Reise">'
    +icon('map')+'<span>Gesamtroute</span></button>'
    +'<button type="button" data-action="explorer-saved-only"'
    +' aria-pressed="'+saved+'" title="Nur gemerkte Orte anzeigen">'
    +icon('bookmark')+'<span>Merkliste</span></button></nav>';
}

/**
 * Choose at most eight sourced photos distributed across the actual trip route,
 * with the current city first.  Only render a source if both the picture URL
 * and original file page + a meaningful author/credit are present. Never
 * invent images or allow transient synthesized arrival markers into gallery.
 */
export function selectDiscoveryPhotos(ctx,limit=8){
  if(!ctx?.explorer)return [];
  const known=new Set((ctx.all??[]).filter(x=>!x.removed&&!x.duplicateOf).map(x=>x.id));
  const rows=stableRows([...(ctx.explorer.placed??[]),...(ctx.explorer.unlocated??[])])
    .filter(item=>known.has(item.id)&&!item.explorerParent);
  const groups=new Map();
  for(const item of rows){
    const photo=placeProfileModel(item,ctx)?.photo;
    if(!photo||!/^https:\/\//.test(photo.url??'')
      ||!/^https:\/\//.test(photo.sourceUrl??'')
      ||!photo.credit?.trim())continue;
    if(!groups.has(item.city))groups.set(item.city,[]);
    groups.get(item.city).push({item,photo});
  }
  const cities=[...new Set([ctx.city,...(ctx.trip?.route??[]),...groups.keys()])]
    .filter(city=>groups.has(city));
  const taken=new Set(),selected=[];
  const take=city=>{
    const remaining=groups.get(city)??[];
    while(remaining.length){
      const row=remaining.shift();
      const fileKey=row.photo.sourceUrl.split('#')[0].toLowerCase();
      if(taken.has(fileKey))continue;
      taken.add(fileKey);
      selected.push(row);
      return true;
    }
    return false;
  };
  if(groups.has(ctx.city))for(let i=0;i<4;i++)take(ctx.city);
  while(selected.length<Math.max(0,limit)){
    let advanced=false;
    for(const city of cities){
      if(selected.length>=limit)break;
      if(take(city))advanced=true;
    }
    if(!advanced)break;
  }
  return selected.slice(0,Math.max(0,limit));
}

export function mapPhotoDiscovery(ctx){
  if(!ctx?.explorer)return '';
  const people=ctx.people?.length??1;
  const withPhoto=selectDiscoveryPhotos(ctx,ctx.mapSimple?4:8);
  const title=withPhoto.length&&withPhoto.every(x=>x.item.city===ctx.city)
    ?'Heute entdecken':'Orte entlang deiner Route';
  const cards=withPhoto.map(({item,photo})=>{
    const signal=planCostSignal(item,people);
    const located=Array.isArray(item.point)&&item.point.length===2
      &&item.point.every(Number.isFinite);
    const planned=(ctx.day??[]).some(entry=>entry.id===item.id);
    const saved=ctx.explorer.saved?.has(item.id)??false;
    return '<article class="reference-discovery-card">'
      +'<div class="reference-discovery-image"><img loading="lazy" decoding="async"'
      +' referrerpolicy="no-referrer" src="'+esc(photo.url)+'" alt="'
      +esc('Foto von '+item.name)+'"'
      +' title="'+esc(photo.credit)+'">'
      +'<button type="button" class="reference-discovery-save"'
      +' data-action="explorer-save" data-value="'+esc(item.id)+'"'
      +' aria-pressed="'+saved+'" aria-label="'+esc(item.name)
      +(saved?' aus Merkliste entfernen':' für diese Reise merken')+'"'
      +' title="'+esc(saved?'Aus Merkliste entfernen':'Zur Merkliste hinzufügen')+'">'
      +icon('bookmark')+'</button></div>'
      +'<div class="reference-discovery-body"><div class="reference-discovery-title">'
      +'<strong>'+esc(item.name)+'</strong><span class="reference-discovery-euro" title="'
      +esc(signal.note)+'">'+esc(signal.tier)+'</span></div>'
      +'<p>'+esc(ctx.cities?.[item.city]?.name??item.city)+' · '
      +esc(item.kind==='lodging'?'Unterkunft':
        item.kind==='transport'?'Verbindung':'Ort & Aktivität')
      +(planned?' · Im heutigen Plan':'')+'</p>'
      +'<div class="reference-discovery-actions">'
      +btn('details','Details','arrow',item.id,'subtle')
      +(located?btn('explorer-focus','Auf Karte','pin',item.id,'subtle'):'')
      +'<a href="'+esc(photo.sourceUrl)+'" target="_blank" rel="noopener noreferrer"'
      +' title="'+esc(photo.credit)+'">Bildquelle</a></div></div></article>';
  }).join('');
  return '<section class="reference-discovery" aria-label="Bebilderte Orte und Aktivitäten entlang der Reise">'
    +'<div class="reference-discovery-head"><div><small>MIT QUELLENFOTOS</small>'
    +'<h2>'+esc(title)+'</h2>'
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
