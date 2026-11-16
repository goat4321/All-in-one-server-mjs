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
 transport:'<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 11h14M8 21l2-3m6 3-2-3M9 7h.01M15 7h.01M8 15h.01M16 15h.01"/>'
});
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
