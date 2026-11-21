import test from 'node:test';
import assert from 'node:assert/strict';
import {curatedCityBackdrop,curatedPlacePhoto} from '../public/curated-place-photos.mjs';
import {placeImageHtml,placeProfileModel} from '../public/place-profile.mjs';
import {entryCompleteness} from '../public/entry-completeness.mjs';
const item={id:'test:hotel',kind:'lodging',city:'barcelona',name:'Test-Hotel ohne Foto'};
const ctx={people:[{id:'p1'}],state:{placePhotos:{},favorites:[]},cities:{barcelona:{name:'Barcelona'}}};
test('Unverified venue photos show a clearly labeled city backdrop',()=>{
 const backdrop=curatedCityBackdrop(item);
 assert.ok(backdrop?.contextualOnly);
 assert.deepEqual(backdrop,curatedCityBackdrop(item));
 assert.equal(curatedPlacePhoto(item),null);
 assert.match(placeImageHtml(item,ctx),/Stadtmotiv · kein Foto dieses Eintrags/);
});
test('Context-only photos are NOT counted as item-specific source photos',()=>{
 assert.equal(placeProfileModel(item,ctx).photo,null);
 assert.equal(entryCompleteness(item,ctx).hasPhoto,false);
});
