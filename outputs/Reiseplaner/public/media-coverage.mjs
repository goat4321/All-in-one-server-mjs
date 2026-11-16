import { placeProfileModel } from './place-profile.mjs';
import { explorerCategory } from './map-explorer.mjs';
import { btn, esc, urlLink } from './ui.mjs';
import {googleMapsSearchUrl} from './google-maps.mjs';
import {commonsDefaultQuery,commonsWebSearchUrl} from './commons-photo-search.mjs';

const label={lodging:'Unterkünfte',food:'Restaurants & Cafés',shop:'Einkaufen',
  activity:'Sehenswürdigkeiten & Aktivitäten',transport:'Verkehr & Bahnhöfe'};

export function mediaCoverage(ctx) {
  const rows=(ctx.all??[]).filter(item=>item.id&&!item.duplicateOf&&!item.removed)
    .map(item=>{
      const p=placeProfileModel(item,ctx);
      return p?{item,category:explorerCategory(item),hasPhoto:!!p.photo,
        savedCount:p.ownPhotoCount??0,curated:p.photos?.some(photo=>photo.curated)??false,
        active:ctx.activeSet?.has(item.id)??false}:null;
    }).filter(Boolean);
  const groups=Object.entries(label).map(([key,title])=>{
    const group=rows.filter(x=>x.category===key);
    return {key,title,total:group.length,illustrated:group.filter(x=>x.hasPhoto).length,
      missing:group.filter(x=>!x.hasPhoto).length};
  });
  const lacking=rows.filter(x=>!x.hasPhoto).sort((a,b)=>
    Number(b.active)-Number(a.active)||a.category.localeCompare(b.category)
    ||a.item.name.localeCompare(b.item.name,'de'));
  return {total:rows.length,illustrated:rows.filter(x=>x.hasPhoto).length,
    curated:rows.filter(x=>x.curated).length,saved:rows.filter(x=>x.savedCount>0).length,
    groups,lacking};
}

export function mediaCoveragePanel(ctx) {
  const m=mediaCoverage(ctx);
  const fraction=m.total?Math.round(m.illustrated/m.total*100):0;
  return '<section class="section panel panel-pad media-coverage" aria-label="Bildabdeckung und Quellenfotos">'
    +'<div class="media-coverage-heading"><div><h2>Bildabdeckung & offene Quellenfotos</h2>'
    +'<p>Nur individuell zugeordnete Fotos mit Commons-Lizenz oder selbst hinterlegter Bildquelle. Keine erfundenen Airbnb-Objektbilder.</p></div>'
    +'<strong>'+m.illustrated+' von '+m.total+' mit Foto · '+fraction+' %</strong></div>'
    +'<div class="media-coverage-grid">'+m.groups.map(g=>
      '<div class="media-coverage-stat"><strong>'+esc(g.title)+'</strong>'
      +'<span>'+g.illustrated+' / '+g.total+'</span><div class="media-coverage-track" aria-hidden="true"><span style="width:'
      +(g.total?Math.round(g.illustrated/g.total*100):0)+'%"></span></div>'
      +'<small>'+g.missing+' ohne Quellenfoto</small></div>').join('')+'</div>'
    +'<details class="media-coverage-missing"><summary>Priorisierte offene Einträge anzeigen ('
    +Math.min(25,m.lacking.length)+' von '+m.lacking.length+')</summary>'
    +'<div class="media-coverage-list">'+m.lacking.slice(0,25).map(row=>
      '<div class="media-coverage-item"><div><strong>'+esc(row.item.name)+'</strong><small>'
      +esc(ctx.cities?.[row.item.city]?.name??row.item.city)
      +' · '+esc(label[row.category]??row.category)
      +(row.active?' · Bereits im Plan':'')+'</small></div>'
      +'<div class="row-actions">'+btn('details','Details & Quellen','folder',row.item.id)
      +btn('photo-edit','Quellenfoto ergänzen','plus',row.item.id)
      +(urlLink(commonsWebSearchUrl(commonsDefaultQuery(row.item,ctx.cities)),'Commons-Bildsuche')||'')
      +(urlLink(googleMapsSearchUrl(row.item,ctx.cities),'Google Maps')||'')+'</div></div>').join('')+'</div>'
    +'<p class="muted">Diese Liste ist eine Auswahl. Ohne zuordenbare, rechtlich nutzbare Datei bleibt ein gestalteter Platzhalter. Eigene Bilder sind lokal und variantenbezogen.</p>'
    +'</details></section>';
}
