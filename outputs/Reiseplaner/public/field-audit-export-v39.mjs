import {entryCompletenessReport} from './entry-completeness.mjs';

// Offline-only report for the currently selected variant. A missing fact is not
// silently replaced by a search snippet, a price guess or a city midpoint.
export function buildFieldAudit(ctx){
 const report=entryCompletenessReport(ctx.all??[],ctx);
 return {schema:'reiseplaner-field-audit-v1',generatedAt:new Date().toISOString(),
  variantId:ctx.trip?.id??'unknown',summary:report.counters,
  missingByType:report.missingByType,
  entries:report.incomplete.map(row=>({
   id:row.id,name:row.name,city:row.city,kind:row.kind,
   gaps:row.gaps.map(g=>({field:g.key,label:g.label,reason:g.reason,
    next:g.next,manualContribution:g.manual,priority:g.priority,category:g.category}))
  }))
 };
}
const cell=value=>{
 const raw=String(value??'').replace(/[\r\n\t]+/g,' ').trim();
 // Spreadsheet programs may execute malicious source names as formulas.
 const protectedValue=/^[=+\-@]/.test(raw)?"'"+raw:raw;
 return '"'+protectedValue.replace(/"/g,'""')+'"';
};
export function fieldAuditAsCsv(report,cities={}){
 const header=['Reisevariante','Stadt','Eintrag-ID','Eintrag','Typ','Fehlendes Feld',
   'Grund','Nächste Prüfung','Dein möglicher Beitrag','Priorität','Kategorie'];
 const lines=[header.map(cell).join(';')];
 for(const item of report?.entries??[]){
  for(const gap of item.gaps??[]){
   lines.push([report.variantId,cities[item.city]?.name??item.city,item.id,
    item.name,item.kind,gap.label??gap.field,gap.reason,gap.next,
    gap.manualContribution,gap.priority,gap.category].map(cell).join(';'));
  }
 }
 // Excel on German Windows understands semicolons; BOM preserves umlauts.
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
