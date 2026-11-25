import test from 'node:test';
import assert from 'node:assert/strict';
import {itineraryPhotosV112} from '../public/place-profile.mjs';
import {explorerMediaHtmlV125} from '../public/route-explorer-v125.mjs';
const p={url:'https://commons.wikimedia.org/wiki/Special:FilePath/A.jpg?width=960',sourceUrl:'https://commons.wikimedia.org/wiki/File:A.jpg',credit:'A'};
const q={...p,url:p.url.replace('A.jpg','B.jpg'),sourceUrl:p.sourceUrl.replace('A.jpg','B.jpg'),credit:'B'};
const item={id:'test',name:'Museum',kind:'activity',city:'test'};
test('V138 source identity ignores different thumbnail sizes',()=>{
 assert.equal(itineraryPhotosV112(item,{state:{placePhotos:{test:[p,{...p,url:p.url.replace('960','640')}]}}},{context:false}).length,1);
});
test('V140 additional activity photos have source credit and lazy image markup',()=>{
 const ctx={all:[item],state:{placePhotos:{test:[p,q]}}};
 const html=explorerMediaHtmlV125(ctx,{stop:{id:'test',period:'Mittag',minutes:60}},null);
 assert.match(html,/Weitere Ortsbilder \(1\)/);assert.match(html,/loading="lazy"/);assert.ok(html.includes(q.sourceUrl));assert.match(html,/>B<\/small>/);
});

import {licensedGroupV114,photoMetadataUrlV114} from '../public/photo-library-v114.mjs';
import {commonsSearchUrl} from '../public/commons-photo-search.mjs';
import {explorerPhotoUrlV125} from '../public/route-explorer-v125.mjs';
import {previewPhotoUrlV124} from '../public/immersive-route-v123.mjs';
test('Wikimedia thumbnail migration: accept both legitimate hosts, keep license and source checks',()=>{
 const group={files:['A.jpg']};
 const fixture=host=>({query:{pages:[{title:'File:A.jpg',imageinfo:[{mime:'image/jpeg',descriptionurl:'https://commons.wikimedia.org/wiki/File:A.jpg',thumburl:'https://'+host+'/wikipedia/commons/thumb/a/ab/A.jpg/960px-A.jpg',extmetadata:{LicenseShortName:{value:'CC BY 4.0'},Artist:{value:'Example Author'},LicenseUrl:{value:'https://creativecommons.org/licenses/by/4.0/'}}}]}]}});
 for(const host of ['thumb.wikimedia.org','upload.wikimedia.org'])assert.equal(licensedGroupV114(group,fixture(host)).length,1);
 assert.equal(licensedGroupV114(group,fixture('example.org')).length,0);
 const bad=fixture('thumb.wikimedia.org');bad.query.pages[0].imageinfo[0].extmetadata.Artist.value='';
 assert.equal(licensedGroupV114(group,bad).length,0);
});
test('Wikimedia requests use supported thumbnail widths',()=>{
 assert.equal(new URL(photoMetadataUrlV114(['A.jpg'])).searchParams.get('iiurlwidth'),'960');
 assert.equal(new URL(commonsSearchUrl('Museum')).searchParams.get('iiurlwidth'),'960');
 assert.equal(new URL(explorerPhotoUrlV125(p,160)).searchParams.get('width'),'250');
 assert.equal(new URL(previewPhotoUrlV124(p)).searchParams.get('width'),'1280');
});

import {ALL_PHOTO_GROUPS_V118,ALL_PHOTO_GROUPS_V151,PHOTO_TOTAL_V118,PHOTO_TOTAL_V151,renderPhotoLibraryV114} from '../public/photo-library-v114.mjs';
import {PHOTO_GROUPS_V151,PHOTO_CANDIDATE_COUNT_V151} from '../public/photo-manifest-v151.mjs';
import {curatedLibraryV114} from '../public/curated-place-photos.mjs';
test('V151 additional photo candidates are distinct and included in the library',()=>{
 const key=s=>s.replaceAll('_',' ').normalize('NFC').trim().toLowerCase();
 const prior=new Set([...ALL_PHOTO_GROUPS_V118.flatMap(g=>g.files),...curatedLibraryV114().map(p=>p.file)].map(key));
 const added=PHOTO_GROUPS_V151.flatMap(g=>g.files);
 assert.equal(added.length,1000);
 assert.equal(PHOTO_CANDIDATE_COUNT_V151,1000);
 assert.equal(new Set(added.map(key)).size,added.length);
 assert.ok(added.every(f=>!prior.has(key(f))&&/\.(?:jpe?g|png|webp)$/i.test(f)));
 assert.equal(PHOTO_TOTAL_V151()-PHOTO_TOTAL_V118(),added.length);
 assert.equal(ALL_PHOTO_GROUPS_V151.length-ALL_PHOTO_GROUPS_V118.length,PHOTO_GROUPS_V151.length);
 const g=PHOTO_GROUPS_V151[0];
 assert.ok(renderPhotoLibraryV114({trip:{route:[g.city]}}).includes(g.key));
});
