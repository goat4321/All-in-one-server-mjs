import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {commonsSearchUrl,commonsWebSearchUrl,commonsDefaultQuery,commonsResults}
  from '../public/commons-photo-search.mjs';
import {entryCompleteness,entryCompletenessReport}
  from '../public/entry-completeness.mjs';
import {entryCoveragePanel} from '../public/entry-coverage-ui.mjs';
import {curatedPhotoCount} from '../public/curated-place-photos.mjs';

const example=(lic='CC BY-SA 4.0',author='<a href="/wiki/User:Jane">Jane Smith</a>')=>({
  title:'File:Example.jpg',imageinfo:[{mime:'image/jpeg',
    thumburl:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/720px-Example.jpg',
    descriptionurl:'https://commons.wikimedia.org/wiki/File:Example.jpg',
    extmetadata:{LicenseShortName:{value:lic},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'},
      Artist:{value:author}}}]});
test('Commons requests use public API, file namespace, metadata and browser CORS',()=>{
  const x=new URL(commonsSearchUrl('Sagrada Família Barcelona'));
  assert.equal(x.hostname,'commons.wikimedia.org');
  assert.equal(x.searchParams.get('origin'),'*');
  assert.equal(x.searchParams.get('gsrnamespace'),'6');
  assert.match(x.searchParams.get('gsrsearch'),/Sagrada Fam/);
  assert.match(x.searchParams.get('iiprop'),/extmetadata/);
  assert.match(commonsWebSearchUrl('Èze'),/MediaSearch/);
  assert.match(commonsDefaultQuery({name:'Eiffelturm',city:'paris'},{paris:{name:'Paris'}}),/Paris/);
});
test('Only photo files with a clear eligible licence, source and artist can be offered',()=>{
  const okay=commonsResults({query:{pages:[example()]}});
  assert.equal(okay.length,1);
  assert.match(okay[0].credit,/Jane Smith.*CC BY-SA 4.0/);
  assert.equal(okay[0].identityVerified,false);
  const nc=example('CC BY-NC-SA 4.0');
  const noArtist=example('CC BY-SA 4.0','');
  const noSource=example();
  noSource.imageinfo[0].descriptionurl='https://random.example.com/file.jpg';
  const svg=example();
  svg.imageinfo[0].mime='image/svg+xml';
  const noLicense=example();
  delete noLicense.imageinfo[0].extmetadata.LicenseUrl;
  for(const row of [nc,noArtist,noSource,svg,noLicense]){
    assert.equal(commonsResults({query:{pages:[row]}}).length,0);
  }
  assert.equal(commonsResults({query:{pages:[example(),example()]}}).length,1);
  assert.deepEqual(commonsResults({}),[]);
});
test('Every trip record is audited, provenance gaps never fabricated away',async()=>{
  const catalog=await loadCatalog();
  assert.equal(catalog.trips.length,4);
  assert.equal(curatedPhotoCount,25);
  for(const trip of catalog.trips){
    const ctx={catalog,trip,cities:catalog.cities,
      people:Array.from({length:trip.travellers},()=>({})),state:initialState(trip),
      all:trip.items};
    const data=entryCompletenessReport(trip.items,ctx);
    console.info('ENTRY_COVERAGE_V21 '+JSON.stringify({trip:trip.id,...data.counters,gaps:data.missingByType}));
    assert.equal(data.counters.total,new Set(trip.items.map(x=>x.id)).size);
    assert.equal(data.entries.length,data.counters.total);
    assert.equal(data.counters.withPhoto>=0,true);
    assert.ok(data.counters.withPhoto<=data.counters.total);
    assert.ok(data.counters.complete<=data.counters.total);
    assert.equal(data.incomplete.length+data.counters.complete,data.counters.total);
    const content=entryCoveragePanel(ctx);
    assert.match(content,/Welche Einträge haben noch fehlende Angaben oder Bilder/);
    assert.match(content,/Wikimedia Commons/);
    if(data.missingByType.photo)assert.match(content,/Bild suchen/);
    const hotel=trip.items.find(x=>x.kind==='lodging');
    if(hotel){
      const inspected=entryCompleteness(hotel,ctx);
      assert.ok(inspected.gaps.some(x=>x.key==='booking'),
        'Provider list must never prove checkout and room configuration');
    }
    assert.ok(data.entries.every(row=>row.gaps.every(g=>g.label&&g.next)));
  }
});
