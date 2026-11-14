import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {coverageMatches,normalizeCoverageText} from '../public/coverage-filter.mjs';
import {entryCoveragePanel} from '../public/entry-coverage-ui.mjs';
import {entryCompletenessReport} from '../public/entry-completeness.mjs';

const catalog=await loadCatalog();
test('Accent-tolerant filtering respects city, kind, gap and own source guide',()=>{
  const row={name:'Plage de la Corniche – Sète',city:'sete',kind:'activity',
    hasGuide:true,gaps:[{key:'photo'},{key:'hours'}]};
  assert.equal(normalizeCoverageText('Èze'), 'eze');
  assert.equal(coverageMatches(row,{query:'sete',city:'all',kind:'activity',gap:'photo'}),true);
  assert.equal(coverageMatches(row,{query:'SÈTE'}),true);
  assert.equal(coverageMatches(row,{query:'PARIS'}),false);
  assert.equal(coverageMatches(row,{city:'paris'}),false);
  assert.equal(coverageMatches(row,{kind:'lodging'}),false);
  assert.equal(coverageMatches(row,{gap:'booking'}),false);
  assert.equal(coverageMatches(row,{gap:'hours'}),true);
  assert.equal(coverageMatches(row,{gap:'no-guide'}),false);
  assert.equal(coverageMatches({...row,hasGuide:false},{gap:'no-guide'}),true);
});
test('Work queue visibly maps every source item with its actual gap codes',()=>{
  for(const trip of catalog.trips){
    const ctx={catalog,trip,cities:catalog.cities,state:initialState(trip),
      people:Array.from({length:trip.travellers},()=>({})),all:trip.items};
    const report=entryCompletenessReport(trip.items,ctx);
    const html=entryCoveragePanel(ctx);
    assert.equal((html.match(/class="coverage-row"/g)||[]).length,report.incomplete.length);
    assert.match(html,/coverage-filter-query/);
    assert.match(html,/coverage-filter-gap/);
    assert.match(html,/coverage-filter-city/);
    assert.match(html,/coverage-filter-kind/);
    assert.match(html,/Alle offenen Angaben/);
    assert.match(html,/Ohne zusätzlichen Ortsguide/);
    assert.match(html,/zusätzliche recherchierte Alternative\(n\) außerhalb der aktuellen vier Routen/);
    assert.match(html,/Altstadt Montpellier/);
    assert.match(html,/keiner Reisevariante zugeteilt/);
    assert.match(html,/data-coverage-gaps="[^"]+"/);
    assert.match(html,/data-coverage-city="/);
    assert.match(html,/data-action="coverage-filter-clear"/);
    assert.doesNotMatch(html,/on(?:click|input|change)\s*=/i);
    const known=trip.items.find(x=>x.id==='survey-v19:act-001');
    if(known){
      assert.ok(known.guideV22,'All 57 source candidates must carry individual guide');
      assert.match(html,/Einzelguide/);
    }
  }
});
