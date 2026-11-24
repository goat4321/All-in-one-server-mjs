import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog } from '../lib/catalog.mjs';
import { initialState,validateState } from '../lib/store.mjs';
import { placeProfileModel,placeGalleryHtml } from '../public/place-profile.mjs';
const catalog=await loadCatalog();
const trip=catalog.trips[0],item=trip.items.find(x=>x.kind==='activity');
const a={url:'https://example.org/a.jpg',sourceUrl:'https://example.org/license/a',credit:'Photographer A · CC BY'};
const b={url:'https://example.org/b.jpg',sourceUrl:'https://example.org/license/b',credit:'Photographer B · CC BY'};
test('Legacy single sourced photo is compatible with multiple credited photos',()=>{
 const state=initialState(trip);
 state.placePhotos[item.id]=a;
 assert.doesNotThrow(()=>validateState(state,trip,[]));
 const ctx={people:state.people,cities:catalog.cities,catalog,state};
 assert.equal(placeProfileModel(item,ctx).photos[0].url,a.url);
 state.placePhotos[item.id]=[a,b];
 assert.doesNotThrow(()=>validateState(state,trip,[]));
 assert.equal(placeProfileModel(item,ctx).ownPhotoCount,2);
 const html=placeGalleryHtml(item,ctx);
 assert.match(html,/Fotogalerie/);
 assert.match(html,/Photographer A/);
 assert.match(html,/Photographer B/);
 assert.match(html,/data-action="photo-remove-one"/);
});
test('Unsourced and oversized photo galleries fail server validation',()=>{
 const state=initialState(trip);
 state.placePhotos[item.id]=Array(6).fill(a);
 assert.throws(()=>validateState(state,trip,[]),/höchstens fünf/);
 state.placePhotos[item.id]=[a,{...b,url:'http://unsafe/image'}];
 assert.throws(()=>validateState(state,trip,[]),/HTTPS-Bildlink/);
 state.placePhotos[item.id]=[a,{...b,credit:''}];
 assert.throws(()=>validateState(state,trip,[]),/HTTPS-Bildlink/);
});

import {PHOTO_TOTAL_V118,ALL_PHOTO_GROUPS_V118,photoViewerEntriesV118,ALL_PHOTO_GROUPS_V117,PHOTO_GROUPS_V117,PHOTO_TOTAL_V117,renderPhotoLibraryV114,renderItemPhotoGroupV114,loadPhotoGroupV115} from '../public/photo-library-v114.mjs';
import {curatedLibraryV114} from '../public/curated-place-photos.mjs';
test('V117 exposes 2072 distinct file references, 43 groups, and preserves archive associations',()=>{
 const norm=s=>s.replaceAll('_',' ').normalize('NFC').toLowerCase();
 const files=[...curatedLibraryV114().map(p=>p.file),...ALL_PHOTO_GROUPS_V117.flatMap(g=>g.files)];
 assert.equal(PHOTO_GROUPS_V117.flatMap(g=>g.files).length,1000);
 assert.equal(PHOTO_TOTAL_V117(),2072);
 assert.equal(ALL_PHOTO_GROUPS_V117.length,43);
 assert.equal(new Set(files.map(norm)).size,files.length);
 assert.equal(new Set(ALL_PHOTO_GROUPS_V117.map(g=>g.key)).size,43);
 const html=renderPhotoLibraryV114({trip:{route:['paris','appenzell']}});
 assert.ok(html.includes(String(PHOTO_TOTAL_V118())));
 assert.ok(html.includes(ALL_PHOTO_GROUPS_V118.length+' Motivsammlungen'));
 assert.match(html,/Trocadéro · Gärten und Aussicht/);
 assert.doesNotMatch(html,/<img /);
 const day=renderPhotoLibraryV114({trip:{route:['appenzell']},dayPlan:{city:'appenzell'}},{day:true});
 assert.match(day,/Seealpsee · Seeufer/);
 assert.match(day,/Wasserauen · Tal und Berge/);
 assert.doesNotMatch(day,/Sagrada Família/);
 const activity=renderItemPhotoGroupV114({kind:'activity',city:'paris',id:'survey-v19:act-005'});
 assert.match(activity,/Louvre · Innenhof und Pyramide/);
 assert.equal(renderItemPhotoGroupV114({kind:'food',city:'paris',id:'act-005'}),'');
});
test('V117 licensed loader rejects missing metadata and stays within 20 titles per request',async()=>{
 const g=PHOTO_GROUPS_V117[0];const calls=[];
 const fetcher=async(url)=>{calls.push(new URL(url).searchParams.get('titles').split('|').length);return {ok:true,json:async()=>({query:{pages:[]}})};};
 const result=await loadPhotoGroupV115({...g,files:g.files.slice(0,21)},fetcher);
 assert.deepEqual(calls,[20,1]);
 assert.equal(result.photos.length,0);
 assert.equal(result.failedBatches,0);
});

test('V118 viewer stays within the active gallery and excludes unavailable images',()=>{
 const make=(hidden=false,unavailable=false)=>({querySelector:()=>({hidden,getAttribute:()=>'/photo.jpg'}),closest:()=>unavailable?{}:null});
 const a=make(),b=make(true),c=make(false,true),d=make();
 const source={closest:()=>({querySelectorAll:()=>[a,b,c,d]})};
 assert.deepEqual(photoViewerEntriesV118(source),[a,d]);
 assert.deepEqual(photoViewerEntriesV118({closest:()=>null}),[]);
});
