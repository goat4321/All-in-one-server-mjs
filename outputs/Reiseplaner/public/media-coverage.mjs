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

const isPrivateStay=item=>item?.provider==='Airbnb'||String(item?.id??'').startsWith('wishlist:airbnb:');
function coverageItemHtml(row,ctx){
 const item=row.item;
 const commons=isPrivateStay(item)?'<small>Privates Airbnb: kein öffentlich belegtes Objektfoto</small>'
   :(urlLink(commonsWebSearchUrl(commonsDefaultQuery(item,ctx.cities)),
     'Commons-Bildsuche')||'');
 return '<div class="media-coverage-item"><div><strong>'+esc(item.name)+'</strong><small>'
   +esc(ctx.cities?.[item.city]?.name??item.city)
   +' · '+esc(label[row.category]??row.category)
   +(row.active?' · Bereits im Plan':'')+'</small></div>'
   +'<div class="row-actions">'+btn('details','Details & Quellen','folder',item.id)
   +btn('photo-edit','Quellenfoto ergänzen','plus',item.id)
   +commons
   +(urlLink(googleMapsSearchUrl(item,ctx.cities),'Google Maps')||'')
   +'</div></div>';
}
export function mediaCoveragePanel(ctx) {
 const m=mediaCoverage(ctx);
 const fraction=m.total?Math.round(m.illustrated/m.total*100):0;
 const priority=m.lacking.slice(0,25);
 const remaining=m.lacking.slice(25);
 const byCity=new Map();
 for(const row of remaining){
  const city=row.item.city;
  if(!byCity.has(city))byCity.set(city,[]);
  byCity.get(city).push(row);
 }
 const cityGroups=[...byCity].sort(([a],[b])=>
  (ctx.cities?.[a]?.name??a).localeCompare(ctx.cities?.[b]?.name??b,'de'));
 return '<section class="section panel panel-pad media-coverage" aria-label="Bildabdeckung und Quellenfotos">'
   +'<div class="media-coverage-heading"><div><h2>Bildabdeckung & offene Quellenfotos</h2>'
   +'<p>Nur individuell zugeordnete Fotos mit Commons-Lizenz oder selbst hinterlegter Bildquelle. Keine erfundenen Airbnb-Objektbilder.</p></div>'
   +'<strong>'+m.illustrated+' von '+m.total+' mit Foto · '+fraction+' %</strong></div>'
   +'<div class="media-coverage-grid">'+m.groups.map(g=>
     '<div class="media-coverage-stat"><strong>'+esc(g.title)+'</strong>'
     +'<span>'+g.illustrated+' / '+g.total+'</span><div class="media-coverage-track" aria-hidden="true"><span style="width:'
     +(g.total?Math.round(g.illustrated/g.total*100):0)+'%"></span></div>'
     +'<small>'+g.missing+' ohne Quellenfoto</small></div>').join('')+'</div>'
   +(m.lacking.length?'<details class="media-coverage-missing"><summary>Priorisierte offene Einträge anzeigen ('
     +priority.length+' von '+m.lacking.length+')</summary>'
     +'<div class="media-coverage-list">'+priority.map(row=>coverageItemHtml(row,ctx)).join('')+'</div>'
     +'</details>':'<p>Jeder sichtbare Eintrag hat bereits ein individuelles Quellenfoto.</p>')
   +(remaining.length?'<details class="media-coverage-missing media-coverage-all"><summary>Weitere '
     +remaining.length+' Einträge ohne Bild · alle Städte durchsuchen</summary>'
     +cityGroups.map(([city,rows])=>
       '<details class="media-coverage-city"><summary>'
       +esc(ctx.cities?.[city]?.name??city)+' · '+rows.length+' fehlende Fotos</summary>'
       +'<div class="media-coverage-list">'+rows.map(row=>coverageItemHtml(row,ctx)).join('')
       +'</div></details>').join('')+'</details>':'')
   +'<p class="muted">Alle Lückeneinträge sind über die Schnellliste und die Stadtgruppen erreichbar. Die Bildsuche ist nur ein Recherchelink: Vor Verwendung müssen Motiv, Lizenz und Urheber geprüft werden. Für private Airbnbs keine öffentliche Objektbildsuche.</p>'
   +'</section>';
}
