import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDE_STEPS, guideStep, guideMarkup } from '../public/tutorial.mjs';
test('Seven-step tutorial covers trip planning, route, prices, votes and evidence',()=>{
  assert.deepEqual(GUIDE_STEPS.map(s=>s.page),
    ['plan','map','lodging','rail','budget','group','data']);
  assert.equal(guideStep(-1),null);
  assert.equal(guideStep(null),null);
  assert.equal(guideMarkup(null),'');
  for(const [index,step] of GUIDE_STEPS.entries()){
    assert.ok(step.focus.startsWith('.'));
    const html=guideMarkup(index);
    assert.match(html,/role="dialog" aria-modal="true"/);
    assert.match(html,/data-action="guide-close"/);
    assert.match(html,/data-action="guide-jump"/);
    assert.ok(html.includes(step.title));
    assert.match(html,/keine Änderung an deinen Reisedaten/);
  }
  assert.match(guideMarkup(0),/data-action="guide-next"/);
  assert.match(guideMarkup(6),/data-action="guide-finish"/);
});
