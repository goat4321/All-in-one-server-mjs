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
