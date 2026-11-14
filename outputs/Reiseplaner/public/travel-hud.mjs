import {curatedPlacePhoto} from './curated-place-photos.mjs';
import {esc,icon,shortDay} from './ui.mjs';

// These are counts of attached records, NOT verified business offers or
// confirmed availability. In particular a coordinate is not an exact entrance.
const presentLink=url=>typeof url==='string'&&/^https:\/\/[^/\s]+\/\S*/i.test(url);
const hasPhoto=(row,state)=>{
  const saved=state?.placePhotos?.[row.id];
  const photos=Array.isArray(saved)?saved:saved?[saved]:[];
  return photos.some(p=>presentLink(p?.url)&&presentLink(p?.sourceUrl)
    &&typeof p.credit==='string'&&p.credit.trim().length>2)
    ||Boolean(curatedPlacePhoto(row));
};
const pointValid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)
  &&p[0]>=-90&&p[0]<=90&&p[1]>=-180&&p[1]<=180;
const sourced=(item,records)=>{
  if(item.guideV22?.sourceUrl&&presentLink(item.guideV22.sourceUrl))return true;
  if(presentLink(item.website)||presentLink(item.researchV20?.sourceUrl))return true;
  return (item.source??[]).some(id=>presentLink(records?.[id]?.url));
};
export function hudEvidence(rows=[],state={},sources={}){
  const known=[...new Map(rows.filter(x=>x&&x.id&&!x.removed&&!x.duplicateOf)
    .map(item=>[item.id,item])).values()];
  const result={total:known.length,withPhoto:0,withSource:0,
    withGuide:0,withPoint:0,withoutPoint:0};
  for(const item of known){
    if(hasPhoto(item,state))result.withPhoto++;
    if(sourced(item,sources))result.withSource++;
    if(item.guideV22)result.withGuide++;
    if(pointValid(item.point))result.withPoint++;
  }
  result.withoutPoint=result.total-result.withPoint;
  return result;
}
export function hudSnapshot(ctx){
  const dateIndex=Math.max(0,(ctx.dates??[]).indexOf(ctx.date));
  const days=(ctx.dates??[]).length;
  const day=ctx.day??[];
  const scheduled=day.filter(row=>/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time??'')).length;
  const flexible=day.length-scheduled;
  const cityRows=(ctx.all??[]).filter(x=>x.city===ctx.city);
  const area=hudEvidence(cityRows,ctx.state,ctx.catalog?.sources);
  const visible=ctx.explorer?hudEvidence(
    [...(ctx.explorer.placed??[]),...(ctx.explorer.unlocated??[])],ctx.state,ctx.catalog?.sources):area;
  return {dayIndex,days,scheduled,flexible,dayCount:day.length,
    percent:days?Math.round((dateIndex+1)/days*100):0,
    cityName:ctx.cities?.[ctx.city]?.name??ctx.city??'Reise',
    area,visible,
    placed:ctx.explorer?.placed?.length??area.withPoint,
    unlocated:ctx.explorer?.unlocated?.length??area.withoutPoint};
}
const action=(gap,text,extra='')=>'<button type="button" class="travel-hud-action"'
  +' data-action="hud-audit" data-value="'+esc(gap)+'" '+extra
  +' aria-label="'+esc(text)+'">'+esc(text)+'</button>';
export function renderHeaderHud(ctx){
  if(!ctx.dates?.length)return '';
  const x=hudSnapshot(ctx);
  return '<button type="button" class="journey-top-progress" data-action="page"'
    +' data-value="plan" aria-label="Tagesplan öffnen, ausgewählter Plankalendertag '
    +(x.dayIndex+1)+' von '+x.days+'">'
    +'<span>PLAN-TAG <strong>'+(x.dayIndex+1)+'/'+x.days+'</strong></span>'
    +'<span class="journey-progress-track"><span class="journey-progress-fill"'
    +' style="width:'+x.percent+'%"></span></span></button>';
}
export function renderDayHud(ctx,dayTotal=0){
  const x=hudSnapshot(ctx);
  const dayCost=Number.isFinite(dayTotal)&&dayTotal>0
    ?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(dayTotal)
      +' bisher erfasst'
    :'Kosten offen bzw. kostenlos';
  return '<div class="atlas-day-glance travel-day-hud" role="group"'
    +' aria-label="Quellenbasierter Tagesüberblick">'
    +'<div class="travel-day-identity"><strong>'+esc(x.cityName)+' · '
    +esc(shortDay(ctx.date))+'</strong><span>Plankalendertag '+(x.dayIndex+1)
    +' von '+x.days+'</span></div>'
    +'<div class="travel-day-track" aria-hidden="true"><span style="width:'
    +x.percent+'%"></span></div>'
    +'<span>'+icon('pin')+x.dayCount+' '+(x.dayCount===1?'Stopp':'Stopps')+'</span>'
    +'<span>'+icon('clock')+x.scheduled+' mit Planzeit · '+x.flexible+' flexibel</span>'
    +'<span>'+icon('wallet')+esc(dayCost)+'</span>'
    +'<span>'+icon('folder')+x.area.withSource+'/'+x.area.total
    +' mit Weblink in '+esc(x.cityName)+'</span>'
    +action('photo','Fotos prüfen')+'</div>';
}
export function renderMapHud(ctx){
  if(!ctx.explorer)return '';
  const x=hudSnapshot(ctx);
  const scope=ctx.total?'Gesamte Reise':shortDay(ctx.date)+' · '+x.cityName;
  const known=x.placed+x.unlocated;
  const coverage=known?Math.round(x.placed/known*100):0;
  return '<div class="map-atlas-hud travel-map-hud" role="group"'
    +' aria-label="Karten-HUD mit Quellen und Lageprüfung">'
    +'<div class="travel-map-hud-top"><span class="travel-hud-spark" aria-hidden="true"></span>'
    +'<div><strong>'+esc(scope)+'</strong><small>Recherche- und Kartenstatus</small>'
    +'</div></div>'
    +'<div class="travel-map-hud-line"><strong>'+x.placed+'</strong> Kartenpunkte'
    +'<span class="travel-map-hud-separator">·</span><strong>'+x.unlocated+'</strong> ohne Pin</div>'
    +'<div class="travel-map-hud-track" role="meter" aria-label="Anteil mit einem Kartenpunkt"'
    +' aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+coverage+'">'
    +'<span style="width:'+coverage+'%"></span></div>'
    +'<details class="travel-map-evidence"><summary>Quellen & Bilder'
    +'<span aria-hidden="true">+</span></summary>'
    +'<div><strong>'+x.visible.withPhoto+'</strong> von '+x.visible.total
    +' Einträgen mit Quellenbild</div>'
    +'<div><strong>'+x.visible.withSource+'</strong> mit Weblink'
    +' · <strong>'+x.visible.withGuide+'</strong> mit Zusatzguide</div>'
    +'<small>Zählwerte aus dem Katalog; kein Beleg für Öffnung, Preis oder exakte Eingänge.</small>'
    +'</details>'
    +'<div class="travel-map-hud-actions">'
    +action('photo','Fotos prüfen')
    +action('location','Punkte prüfen')+'</div></div>';
}
export function mapSelectionEvidence(item,ctx){
  if(!item||!ctx)return '';
  const evidence=hudEvidence([item],ctx.state,ctx.catalog?.sources);
  const labels=[];
  if(evidence.withGuide)labels.push('Eigener Ortsguide');
  else if(evidence.withSource)labels.push('Webquelle hinterlegt');
  else labels.push('Quellenprüfung offen');
  if(evidence.withPhoto)labels.push('Foto mit Herkunft');
  if(!evidence.withPoint)labels.push('Kein individueller Pin');
  return '<small class="map-selection-evidence">'+esc(labels.join(' · '))+'</small>';
}
