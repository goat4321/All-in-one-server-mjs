import {validPoint} from './map-explorer.mjs';
import {esc,btn} from './ui.mjs';
import {mapCategoryIcon} from './map-marker-icons-v64.mjs';

/** Categories affect a self-authored marker only, not the underlying
 * activity type, an actual hotel booking, mode of travel or budget. */
export const PIN_CATEGORIES=Object.freeze({
 activity:'Aktivität',food:'Essen',lodging:'Unterkunft (Idee)',
 shop:'Einkaufen',transport:'Verkehrspunkt (Idee)'
});
export const validPinCategory=value=>Object.hasOwn(PIN_CATEGORIES,value);

export function mapPinPatch(ctx,item,fields,id){
 const original=item?ctx.state.manual.find(row=>row.id===item.id&&row.userPin):null;
 if(item&&(!original||item.booked||item.locked))throw Error('Nur eigene, ungesperrte Pins bearbeiten.');
 const name=String(fields.name??'').trim(),detail=String(fields.detail??'').trim();
 const point=[fields.lat,fields.lon].map(value=>value===''||value==null?NaN:Number(value));
 const duration=Number(fields.duration);
 const pinCategory=String(fields.pinCategory??item?.pinCategory??'activity');
 if(!name||name.length>240||detail.length>4000||!validPoint(point)
  ||!Number.isInteger(duration)||duration<1||duration>300||!validPinCategory(pinCategory))
   throw Error('Name, gültige Koordinaten, eine Kartenkategorie und 1–300 Minuten Besuchsdauer eingeben.');
 const city=item?.city??ctx.city,zone=ctx.cities[city]?.timezone;
 if(!ctx.trip.route.includes(city)||!zone)throw Error('Der Pin gehört zu keinem Reiseort dieser Variante.');
 const values={name,detail,point,duration,city,zone,pinCategory};
 if(!item){
  if(typeof id!=='string'||!id.startsWith('manual:')||ctx.all.some(row=>row.id===id))throw Error('Ungültige eigene Pin-ID.');
  return{...ctx.state,manual:[...ctx.state.manual,{...values,id,kind:'activity',category:'activity',
   userPin:true,origin:'manuell',verification:'ungeprüft',booking:'ungebucht',selected:false,
   start:null,end:null,date:null,price:null,locked:false,booked:false}]};
 }
 const moved=!Array.isArray(item.point)||item.point.some((value,index)=>value!==point[index]);
 const evidence=moved?{geoEvidence:null,locationReferenceV07:null,coordinatePrecision:'manual_unverified',verification:'ungeprüft'}:{};
 const previous={...ctx.state.edits[item.id]};
 for(const key of Object.keys(values))delete previous[key];
 return{...ctx.state,manual:ctx.state.manual.map(row=>row.id===item.id?{...row,...values,...evidence}:row),
  edits:{...ctx.state.edits,[item.id]:previous}};
}

export function mapPinsPanel(ctx){
 const pins=ctx.all.filter(item=>item.userPin&&!item.removed&&item.city===ctx.city);
 const saved=ctx.explorer?.saved??new Set();
 return '<details class="map-own-pins"'+(ctx.mapPinsOpen?' open':'')
  +'><summary>Eigene Kartenpunkte in '+esc(ctx.cities[ctx.city]?.name??ctx.city)
  +' ('+pins.length+')</summary>'
  +'<p>Manuell gewählte, ungeprüfte Punkte – Kategorien sind nur Symbole, keine Unterkunfts-/Ticketbestätigung. Noch kein Tagesplan oder Preis.</p>'
  +btn('map-pin-new','Eigenen Pin hinzufügen','pin')
  +(pins.length?'<label class="map-own-pins-search"><span>Eigene Pins durchsuchen</span>'
    +'<input type="search" id="own-pins-search" autocomplete="off" maxlength="100" placeholder="Name, Notiz oder Kategorie"></label>'
    +'<small id="own-pins-search-status" role="status">'+pins.length+' eigene Pins sichtbar</small>':'')
  +'<ul>'+pins.map(item=>{
    const category=validPinCategory(item.pinCategory)?item.pinCategory:'activity';
    const bookmarked=saved.has(item.id);
    const search=[item.name,item.detail??'',PIN_CATEGORIES[category]].join(' ').toLocaleLowerCase('de');
    return '<li data-own-pin="'+esc(item.id)+'" data-pin-search="'+esc(search)+'">'
      +'<div class="map-pin-entry"><span class="map-own-pin-category" aria-hidden="true">'
      +mapCategoryIcon(category)+'</span><span><strong>'+esc(item.name)
      +'</strong><small>'+esc(PIN_CATEGORIES[category])+' · '
      +esc(validPoint(item.point)?item.point.map(value=>value.toFixed(5)).join(', '):'Koordinaten offen')
      +' · manuell / ungeprüft</small></span></div>'
      +'<div class="row-actions">'
      +btn('map-pin-focus','Auf Karte','target',item.id)
      +btn('explorer-save',bookmarked?'Nicht mehr merken':'Merken','bookmark',item.id)
      +(!ctx.activeSet?.has(item.id)
        ?btn('day-route-add','Zur Tour','plus',item.id):'')
      +btn('edit','Bearbeiten','edit',item.id)
      +btn('remove','Pin löschen','x',item.id)
      +'</div></li>';
  }).join('')+'</ul></details>';
}
