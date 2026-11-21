import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_MAP_BOOKMARKS,mapBookmarkKey,readMapBookmarks,toggleMapBookmark} from '../public/map-shortlist.mjs';
import {explorerData} from '../public/map-explorer.mjs';

const memory=()=>{const d=new Map();return{
  getItem:k=>d.has(k)?d.get(k):null,
  setItem:(k,v)=>d.set(k,v),
  values:d,
}};
test('Map shortlist remains distinct by trip variant, separate from selected/booked places',()=>{
 const storage=memory();
 const item={id:'local:park',city:'paris',name:'Park',kind:'activity',point:[48.86,2.34]};
 const trip={route:['paris']};
 assert.equal(toggleMapBookmark(storage,'interrail_classic',item.id).saved,true);
 assert.deepEqual([...readMapBookmarks(storage,'interrail_classic')],[item.id]);
 assert.equal(readMapBookmarks(storage,'interrail_swiss').size,0);
 assert.notEqual(mapBookmarkKey('interrail_classic'),mapBookmarkKey('interrail_swiss'));
 assert.equal(explorerData([item],trip,{savedOnly:true,
   savedIds:readMapBookmarks(storage,'interrail_classic')}).placed.length,1);
 assert.equal(explorerData([item],trip,{savedOnly:true,
   savedIds:readMapBookmarks(storage,'interrail_swiss')}).total,0);
 assert.equal(item.selected,undefined);
 assert.equal(toggleMapBookmark(storage,'interrail_classic',item.id).saved,false);
});
test('Invalid storage, malformed IDs and quantity overflow are handled',()=>{
 const storage=memory();
 storage.setItem(mapBookmarkKey('a'),'{not json');
 assert.equal(readMapBookmarks(storage,'a').size,0);
 assert.throws(()=>toggleMapBookmark(storage,'a',''),/Merkliste-ID/);
 storage.setItem(mapBookmarkKey('a'),JSON.stringify(Array.from({length:MAX_MAP_BOOKMARKS},(_,i)=>'item:'+i)));
 assert.throws(()=>toggleMapBookmark(storage,'a','item:extra'),/Maximal 120/);
 assert.equal(toggleMapBookmark(storage,'a','item:0').count,MAX_MAP_BOOKMARKS-1);
 assert.ok(readMapBookmarks(storage,'a').size<=MAX_MAP_BOOKMARKS);
});
