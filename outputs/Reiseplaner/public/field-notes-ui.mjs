import {esc,urlLink} from './ui.mjs';
export function fieldNoteHtml(n){
 if(!n)return '';
 const facts=[['Anreise',n.arrival],['Einlass und Zeit',n.entry],['Vor Ort',n.onSite]];
 return '<section class="field-note-inspector" aria-label="Recherchierte Besuchsinformation">'
   +'<header><small>BETREIBER-RECHERCHE · '+esc(n.reviewedOn)
   +'</small><h4>Besuch konkret planen</h4></header>'
   +'<div class="field-note-facts">'+facts.map(([label,v],i)=>
     '<div class="field-note-fact"><span>0'+(i+1)+'</span><div><strong>'+esc(label)
     +'</strong><p>'+esc(v)+'</p></div></div>').join('')+'</div>'
   +'<div class="field-note-check"><strong>Vor Reiseantritt überprüfen</strong><p>'
   +esc(n.check)+'</p>'+urlLink(n.sourceUrl,'Offizielle Angaben öffnen')+'</div>'
   +'<small>Quellenstand '+esc(n.reviewedOn)
   +' · Kein Nachweis gebuchter Tickets oder live verfügbarer Angebote.</small></section>';
}
export function fieldNoteStrip(ctx){
 const seen=new Map(),planned=new Set((ctx.day??[]).map(x=>x.id));
 for(const x of ctx.all??[])if(x.city===ctx.city&&x.fieldNoteV28&&!seen.has(x.id))seen.set(x.id,x);
 const options=[...seen.values()].sort((a,b)=>
   Number(planned.has(b.id))-Number(planned.has(a.id))||a.name.localeCompare(b.name,'de'));
 if(!options.length)return '';
 return '<details class="field-note-strip"><summary><span class="field-note-dot">i</span><span>'
   +'<strong>Besuchstipps mit Betreiberquelle</strong><small>'
   +options.length+' Ortschecks · '+esc(ctx.cities?.[ctx.city]?.name??ctx.city)
   +'</small></span><em>Öffnen</em></summary><div class="field-note-strip-items">'
   +options.slice(0,5).map(x=>'<button type="button" data-action="details" data-value="'
      +esc(x.id)+'" class="field-note-strip-item"><strong>'+esc(x.fieldNoteV28.label)
      +'</strong><span>'+esc(x.fieldNoteV28.check)
      +'</span><span aria-hidden="true">›</span></button>').join('')
   +'</div><small>Stand 14.11.2026 · Besuch 2027 erneut prüfen.</small></details>';
}
