import {validPoint} from './map-explorer.mjs';
import {esc,btn} from './ui.mjs';

export function mapPinPatch(ctx,item,fields,id){
 const original=item?ctx.state.manual.find(row=>row.id===item.id&&row.userPin):null;
 if(item&&(!original||item.booked||item.locked))throw Error('Nur eigene, ungesperrte Pins bearbeiten.');
 const name=String(fields.name??'').trim(),detail=String(fields.detail??'').trim();
 const point=[fields.lat,fields.lon].map(value=>value===''||value==null?NaN:Number(value));
 const duration=Number(fields.duration);
 if(!name||name.length>240||detail.length>4000||!validPoint(point)
  ||!Number.isInteger(duration)||duration<1||duration>300)throw Error('Name, zwei gültige Koordinaten und 1–300 Minuten Besuchsdauer eingeben.');
 const city=item?.city??ctx.city,zone=ctx.cities[city]?.timezone;
 if(!ctx.trip.route.includes(city)||!zone)throw Error('Der Pin gehört zu keinem Reiseort dieser Variante.');
 const values={name,detail,point,duration,city,zone};
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
 return '<details class="map-own-pins"'+(ctx.mapPinsOpen?' open':'')+'><summary>Eigene Kartenpunkte in '+esc(ctx.cities[ctx.city]?.name??ctx.city)+' ('+pins.length+')</summary>'
  +'<p>Manuell gewählte Punkte, keine verifizierten Eingänge. Neue Pins bleiben ungeplant, bis du sie bewusst auswählst.</p>'
  +btn('map-pin-new','Eigenen Pin hinzufügen','pin')
  +'<ul>'+pins.map(item=>'<li data-own-pin="'+esc(item.id)+'"><div><strong>'+esc(item.name)+'</strong><small>'
   +esc(validPoint(item.point)?item.point.map(value=>value.toFixed(5)).join(', '):'Koordinaten offen')+' · manuell / ungeprüft</small></div><div class="row-actions">'
   +btn('map-pin-focus','Auf Karte','target',item.id)+btn('edit','Bearbeiten','edit',item.id)
   +btn('remove','Pin löschen','x',item.id)+'</div></li>').join('')+'</ul></details>';
}
