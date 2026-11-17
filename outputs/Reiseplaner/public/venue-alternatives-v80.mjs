import {esc,urlLink} from './ui.mjs';

const mapsUrl=query=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
/** Display only: each option is a distinct venue, never a correction to the
 * imported restaurant's identity or an automatically planned stop. */
export function venueAlternativesHtml(item,{compact=false}={}){
 const data=item?.alternativeVenueReviewV80;
 if(!data)return '';
 const correlated=data.status==='corner_addresses_correlated';
 const count=data.alternatives?.length??0;
 const title=correlated
  ?'Adressprüfung · vermutlich derselbe Eckstandort'
  :count+' überprüfbare Alternativen · nicht automatisch eingeplant';
 const rows=data.alternatives??[];
 return '<details class="venue-alternatives-v80"'+(correlated?' open':'')+'>'
  +'<summary>'+esc(title)+'</summary>'
  +'<div class="venue-alt-v80-body">'
  +'<p class="venue-alt-v80-explain">'+esc(data.evidenceSummary)+'</p>'
  +'<p class="venue-alt-v80-caution">'+esc(data.caveat)+'</p>'
  +(data.contextPhotos?.length
    ?'<div class="venue-alt-v80-context" aria-label="Lizenzierte regionale Kontextfotos, keine Betriebsbilder">'
      +data.contextPhotos.map(p=>
        '<figure><img loading="lazy" decoding="async" referrerpolicy="no-referrer"'
        +' src="'+esc(p.url)+'" alt="'+esc(p.description)+'">'
        +'<figcaption><strong>Kontextbild · kein konkreter Anbieter:</strong> '
        +esc(p.description)+' · '+esc(p.author)+' · '+esc(p.license)
        +' · '+esc(String(p.picturedYear))+' · '+esc(p.processed)
        +' · '+urlLink(p.sourceUrl,'Bildquelle')
        +' · '+urlLink(p.licenseUrl,'Lizenz')+'</figcaption></figure>').join('')
      +'</div>'
    :'')
  +(correlated?'<p class="venue-alt-v80-corner">Ecklage laut Sekundärquellen nachvollziehbar; '
     +'exakte Eingangstür, Koordinate und Öffnungszeiten 2027 nicht bestätigt.</p>'
     +'<div class="venue-alt-v80-links">'
     +urlLink(mapsUrl(data.mapQuery),'Bo de B · Ecklage in Google Maps suchen')
     +data.evidenceLinks.slice(0,2).map((u,i)=>
        urlLink(u,i===0?'Adressangabe und Restaurantbeschreibung':'Weiterer Adressbeleg')).join('')
     +'</div>'
    :'<ul class="venue-alt-v80-list">'+rows.map(a=>
       '<li class="venue-alt-v80-option">'
       +'<div class="venue-alt-v80-option-top"><strong>'+esc(a.name)+'</strong>'
       +'<small>'+esc(a.category)+'</small></div>'
       +'<p>'+esc(a.summary)+'</p>'
       +'<p class="venue-alt-v80-address">'+esc(a.address)+'</p>'
       +(compact?'':'<div class="venue-alt-v80-facts"><p><b>Zeiten:</b> '
         +esc(a.hours)+'</p><p><b>Kosten:</b> '+esc(a.price)+'</p></div>')
       +'<div class="venue-alt-v80-links">'
       +urlLink(a.officialUrl,a.sourceType==='operator'?'Originalanbieter':'Offizielles Tourismusamt')
       +urlLink(mapsUrl(a.mapQuery),'In Google Maps suchen')
       +'</div>'
       +'</li>').join('')+'</ul>'
   )
  +'<p class="venue-alt-v80-disclaimer">Nur recherchierte Optionen. Kein Ort wurde '
   +'ausgewählt, geokodiert, reserviert oder dem Tagesplan hinzugefügt. '
   +'Öffnungszeiten und Preise für September 2027 erneut überprüfen.</p>'
  +'</div></details>';
}
