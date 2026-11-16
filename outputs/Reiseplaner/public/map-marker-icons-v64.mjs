/**
 * Tiny bundled line icons for the actual trip-map categories. No icon font,
 * external image request or arbitrary user-provided SVG input is required.
 * Every path is static and rendered with currentColor.
 */
export const MAP_ICON_CATEGORIES=Object.freeze(['lodging','food','shop','activity','transport']);
const paths=Object.freeze({
 lodging:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/>',
 food:'<path d="M4 3v7a3 3 0 0 0 6 0V3"/><path d="M7 3v18"/><path d="M20 3c-3 2-4 6-4 10h4v8"/><path d="M20 3v10"/>',
 shop:'<path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
 activity:'<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.5 4.7-4.7 2.5 2.5-4.7 4.7-2.5Z"/>',
 transport:'<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 11h14M8 21l2-3m6 3-2-3M9 7h.01M15 7h.01M8 15h.01M16 15h.01"/>',
 park:'<path d="m12 3-7 8h4l-5 6h16l-5-6h4L12 3Z"/><path d="M12 17v5"/>',
 beach:'<path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 8 0"/><path d="M2 22c2-2 4-2 6 0s4 2 6 0 4-2 8 0"/><path d="M12 2v10M8 6l4-4 4 4"/>',
 museum:'<path d="m3 9 9-6 9 6M4 10h16M5 20h14M7 10v10m5-10v10m5-10v10"/>',
 nightlife:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
 viewpoint:'<path d="m2 20 7-11 4 6 3-4 6 9H2Z"/><path d="M16 4h.01M12 4h.01M20 4h.01"/>'
});
export const MAP_DETAIL_LABELS=Object.freeze({
 park:'Park',beach:'Strand',museum:'Museum',nightlife:'Club & Musik',
 viewpoint:'Aussicht'
});
/** Subtype labels come only from the recorded place description, never
 * from an invented business classification or an unverified map lookup. */
export function mapIconForPlace(item,category='activity'){
 if(category!=='activity')return category;
 const words=[item?.name,item?.category,...(item?.tags??[])]
   .filter(v=>typeof v==='string').join(' ').toLocaleLowerCase('de');
 if(/\bclub\b|disco|party|nachtleben|nightlife|nightclub|musikclub/.test(words))
   return 'nightlife';
 if(/museum|museo|mus[eé]e|kunsthalle|kunsthaus|galerie|galleria|pinakothek/.test(words))
   return 'museum';
 if(/\bstrand\b|\bbeach\b|\bplage\b|\bspiaggia\b|badestrand|sonnenbaden/.test(words))
   return 'beach';
 if(/\bparc\b|\bpark\b|\bparco\b|\bparchi\b|jardin|garden|garten|giardin|botanisch/.test(words))
   return 'park';
 if(/aussicht|viewpoint|mirador|belvedere|gipfel|panorama|wander|gletscher|glacier|schlucht/.test(words))
   return 'viewpoint';
 return 'activity';
}

export function mapCategoryIcon(category='activity'){
 const key=Object.hasOwn(paths,category)?category:'activity';
 return '<svg xmlns="http://www.w3.org/2000/svg" class="map-category-icon"'
  +' viewBox="0 0 24 24" width="21" height="21" fill="none"'
  +' stroke="currentColor" stroke-width="2" stroke-linecap="round"'
  +' stroke-linejoin="round" aria-hidden="true">'+paths[key]+'</svg>';
}
export function mapLegacyPinContent(number,style=''){
 const categories=MAP_ICON_CATEGORIES.find(category=>
  String(style).split(/\s+/).includes('place-'+category));
 // Preserve numbered day/route markers: numbers represent actual ordering.
 if(categories)return mapCategoryIcon(categories);
 if(number==='H')return mapCategoryIcon('lodging');
 if(number==='R')return mapCategoryIcon('food');
 if(number==='S')return mapCategoryIcon('shop');
 if(number==='A')return mapCategoryIcon('activity');
 if(number==='B')return mapCategoryIcon('transport');
 const clean=String(number??'•').replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 return '<span class="map-pin-number">'+clean+'</span>';
}
