// Private, browser-local map shortlist scoped to the selected trip variant.
// This doesn't create or change reservations, costs or account data.
export const MAX_MAP_BOOKMARKS=120;
export const mapBookmarkKey=id=>'reiseplan-map-shortlist:'+encodeURIComponent(String(id??''));

export function readMapBookmarks(storage,variantId) {
  try {
    const raw=JSON.parse(storage?.getItem(mapBookmarkKey(variantId))??'[]');
    if(!Array.isArray(raw))return new Set();
    return new Set(raw.filter(x=>typeof x==='string'&&x.length>0&&x.length<=200)
      .slice(0,MAX_MAP_BOOKMARKS));
  } catch{return new Set();}
}
export function toggleMapBookmark(storage,variantId,id) {
  if(typeof id!=='string'||!id||id.length>200)throw new Error('Unzulässige Merkliste-ID.');
  const next=readMapBookmarks(storage,variantId);
  if(next.has(id))next.delete(id);
  else {
    if(next.size>=MAX_MAP_BOOKMARKS)throw new Error('Maximal 120 gemerkte Kartenorte pro Reisevariante.');
    next.add(id);
  }
  storage.setItem(mapBookmarkKey(variantId),JSON.stringify([...next]));
  return {saved:next.has(id),count:next.size,items:next};
}
