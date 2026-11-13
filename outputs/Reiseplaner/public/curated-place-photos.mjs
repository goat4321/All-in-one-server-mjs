// Images were manually matched to these specific landmark names and checked
// against their Wikimedia Commons file-description pages on 13 Nov 2026.
// These are NOT provider photos, hotels, Airbnbs, or property-location evidence.
const images=[
 {city:'barcelona',name:/sagrada fam[ií]lia/i,
  file:'Exterior_of_the_Sagrada_Família.jpg',
  sourceUrl:'https://commons.wikimedia.org/wiki/File:Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg',
  credit:'Reda Kerbouche · CC BY-SA 4.0 · CSS-Bildausschnitt'},
 {city:'barcelona',name:/^(?:park|parc) g[uü]ell/i,
  file:'Parc_Güell,_Barcelona,_Spain.jpg',
  sourceUrl:'https://commons.wikimedia.org/wiki/File:Parc_G%C3%BCell,_Barcelona,_Spain.jpg',
  credit:'Jruizalvarez · CC BY-SA 4.0 · CSS-Bildausschnitt'},
 {city:'paris',name:/eiffelturm|eiffel tower/i,
  file:'Eiffel_Tower,_Paris,_2009-1.jpg',
  sourceUrl:'https://commons.wikimedia.org/wiki/File:Eiffel_Tower,_Paris,_2009-1.jpg',
  credit:'Mike Peel (www.mikepeel.net) · CC BY-SA 4.0 · CSS-Bildausschnitt'},
];
export function curatedPlacePhoto(item) {
  if (!item || item.kind!=='activity' || item.category==='food') return null;
  const candidate=images.find(row=>row.city===item.city&&row.name.test(item.name??''));
  return candidate?{
    url:'https://commons.wikimedia.org/wiki/Special:FilePath/'
      +encodeURIComponent(candidate.file)+'?width=960',
    sourceUrl:candidate.sourceUrl,credit:candidate.credit,licensedBy:'Wikimedia Commons',
    curated:true,
  }:null;
}
export const curatedPhotoCount=images.length;
