import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../lib/catalog.mjs';
import {initialState} from '../lib/store.mjs';
import {entryCoveragePanel} from '../public/entry-coverage-ui.mjs';
import {entryCompletenessReport} from '../public/entry-completeness.mjs';

const catalog=await loadCatalog();
const trip=catalog.trips.find(t=>t.id==='interrail_swiss');
const state=initialState(trip);
const ctx={catalog,trip,state,variant:{id:trip.id,logs:[]},all:trip.items,
 cities:catalog.cities,people:state.people,active:[],budget:{rows:[]},dataOpenSections:[]};

test('coverage rows retain filter metadata while deferring individual gap explanations',()=>{
 const html=entryCoveragePanel(ctx,{deferReasons:true});
 const report=entryCompletenessReport(ctx.all,ctx);
 assert.equal((html.match(/class="coverage-row"/g)??[]).length,report.incomplete.length);
 assert.ok(html.includes('data-coverage-gaps='));
 assert.ok(html.includes('data-coverage-reasons='));
 assert.doesNotMatch(html,/<b>Warum offen:<\/b>/);
 assert.match(entryCoveragePanel(ctx),/<b>Warum offen:<\/b>/,'Existing direct renderer remains complete by default');
});

test('data page starts with deadlines and empty on-demand groups rather than audit rows',async()=>{
 const {renderDataPage,renderDataSection,dataSections}=await import('../public/data-page.mjs');
 const html=renderDataPage(ctx);
 assert.ok(html.indexOf('Buchungen & Fristen')<html.indexOf('Fortschritt der Reisevorbereitung'));
 assert.equal((html.match(/data-data-section=/g)??[]).length,dataSections.length);
 assert.doesNotMatch(html,/class="coverage-row"|class="provider-location-item|coverage-reasons-body/);
 assert.ok(html.length<18000,'Initial data page excludes heavy detail strings');
 assert.match(html,/JSON sichern/);assert.match(html,/Kalender exportieren/);
 for(const {id} of dataSections)assert.ok(renderDataSection(ctx,id).length>0,id);
 assert.equal(renderDataSection(ctx,'__proto__'),'');
 assert.equal(renderDataSection(ctx,'unknown'),'');
 const reopened=renderDataPage({...ctx,dataOpenSections:['gaps']});
 assert.match(reopened,/data-data-section="gaps" open/);
 assert.match(reopened,/class="coverage-row"/);
 assert.doesNotMatch(reopened,/class="provider-location-item/);
});

test('on-demand sources and missing-field reasons preserve the full authoritative content',async()=>{
 const {renderDataSection,renderCoverageReasons}=await import('../public/data-page.mjs');
 const sources=renderDataSection(ctx,'sources');
 assert.equal((sources.match(/<li>/g)??[]).length,Object.values(catalog.sources).length);
 const row=entryCompletenessReport(ctx.all,ctx).incomplete[0];
 const reasons=renderCoverageReasons(ctx,row.id);
 assert.equal((reasons.match(/<article>/g)??[]).length,row.gaps.length);
 assert.match(reasons,/Warum offen/);assert.match(reasons,/Dein Beitrag/);assert.match(reasons,/Nächste Recherche/);
 assert.equal(renderCoverageReasons(ctx,'missing-id'),'');
 assert.ok(renderDataSection(ctx,'coverage').includes('Quellenstatus'));
 assert.ok(renderDataSection(ctx,'imports').includes('id="import-form"'));
});
