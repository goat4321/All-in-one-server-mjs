import {mealSlotLabels,currentMeals,mealAccommodation,shoppingCandidates} from './meal-planner.mjs';
import {money,localParts} from './model.mjs';
import {esc,btn,dateText,table,urlLink} from './ui.mjs';

export function mealDayOverview(ctx){
 const slot=ctx.mealSlot??'dinner',label=mealSlotLabels[slot],selected=currentMeals(ctx,slot)[0];
 const place=mealAccommodation({...ctx,city:selected?.city??ctx.city},slot,
  selected?localParts(selected.start,selected.zone).time:undefined,selected?.duration??0);
 const cards=Object.entries(mealSlotLabels).map(([key,title])=>{
  const meals=currentMeals(ctx,key);
  return '<article class="meal-day-slot" data-meal-slot="'+key+'"><h3>'+title+'</h3>'
   +(meals.length?meals.map(item=>{
     const receipt=ctx.state.expenses.find(e=>e.forItem===item.id);
     return '<p><strong>'+esc(item.name)+'</strong><small>'+esc(ctx.cities[item.city]?.name??item.city)+' · '
      +(item.start?'Mit eigener Zeit':'Flexibel ohne feste Uhrzeit')+'</small>'
      +(item.basketProducts&&!receipt?'<small>Zutaten im gemeinsamen Einkauf</small>':'')+'</p>'
      +btn('meal-cost',receipt?'Ausgabe bearbeiten':'Ausgabe erfassen','wallet',item.id);
   }).join(''):'<p>Noch keine Mahlzeit ausgewählt.</p>')
   +'<div>'+btn('meal-slot',key===slot?'Auswahl geöffnet':'Auswahl öffnen','food',key,key===slot?'primary':'subtle')+'</div></article>';
 }).join('');
 return '<section class="section meal-day-overview" aria-label="Drei Mahlzeiten am Tag"><h2>'+label+' am '+dateText(ctx.date)+'</h2>'
  +'<div class="meal-slot-tabs" role="group" aria-label="Mahlzeit auswählen">'
  +Object.entries(mealSlotLabels).map(([key,title])=>'<button type="button" class="button'+(key===slot?' primary':'')
   +'" data-action="meal-slot" data-value="'+key+'" aria-pressed="'+(key===slot)+'">'+title+'</button>').join('')+'</div>'
  +'<div class="meal-day-grid">'+cards+'</div><p class="meal-accommodation"><strong>'
  +esc(place.hotel?.name??(slot==='breakfast'?'Unterkunft der vorherigen Nacht offen':'Unterkunft offen'))+'</strong><br>'
  +esc(place.notice)+'</p></section>';
}

export function stapleComparison(ctx){
 const research=ctx.catalog?.research?.mealResearch;if(!research)return '';
 const references=research.stapleReferences;
 const cell=(region,key)=>{
  const row=references.find(r=>r.id==='meal-'+region+'-'+key);
  if(!row)return 'Preis offen';
  const unit=row.unit==='ml'?'l':'kg';
  return '<strong>'+money(row.cents,row.currency)+'</strong> · '+row.pack+' '+row.unit
   +'<br><small>'+money(Math.round(row.cents*1000/row.pack),row.currency)+' / '+unit+'</small><br>'
   +urlLink(row.url,'Produktquelle')+(row.note?'<small>'+esc(row.note)+'</small>':'');
 };
 const rows=[['Haferflocken','oats'],['Milch','milk'],['Reis','rice']].map(([name,key])=>[name,...['fr','es','ch'].map(region=>cell(region,key))]);
 rows.push(['Je eine Packung',...['fr','es','ch'].map(region=>{
  const products=references.filter(r=>r.id.startsWith('meal-'+region+'-'));
  return money(products.reduce((sum,p)=>sum+p.cents,0),products[0].currency);
 })]);
 return '<details class="meal-staple-comparison"><summary>Ähnlicher Basiskorb · Frankreich, Spanien und Schweiz</summary>'
  +'<p>'+esc(research.note)+'</p><p>Stand '+dateText(research.checkedOn)
  +'. Nationale Online-Referenzen; lokale Filialpreise, Bestand und 2027 offen. Paris/Sète/Nizza: Frankreich; Barcelona: Spanien; Kandersteg/Appenzell: Schweiz.</p>'
  +table(['Produkt','Frankreich · EUR','Spanien · EUR','Schweiz · CHF'],rows)+'</details>';
}
export function shoppingStopButton(ctx){
 return shoppingCandidates(ctx).length?btn('shopping-stop','Einkaufsstopp planen','calendar')
  :'<small>Für einen Einkaufsstopp zuerst einen Ort dieser Stadt erfassen oder laden.</small>';
}


/** Read-only guide across the existing meal, shared pantry and budget modules.
 * Quantities are pooled by groceryBasket upstream. This component does not
 * write an expense merely because a meal or reference product was selected.
 */
export function mealFlowSummary(ctx,basket=[]){
 const meals=Object.entries(mealSlotLabels).map(([slot,label])=>({
  slot,label,items:currentMeals(ctx,slot).filter(item=>item.city===ctx.city&&!item.removed)
 }));
 const chosen=meals.reduce((sum,row)=>sum+row.items.length,0);
 const servings=ctx.people?.length??0;
 const groups=new Map();
 for(const row of basket){
  const result=groups.get(row.currency)??{currency:row.currency,known:0,unknown:0};
  if(row.total===null||row.excluded)result.unknown++;
  else result.known+=row.total;
  groups.set(row.currency,result);
 }
 const costs=[...groups.values()].map(row=>money(row.known,row.currency)
  +(row.unknown?' + '+row.unknown+' offene Position(en)':'')).join(' · ');
 const missing=basket.filter(row=>row.packs>0&&!row.checked).length;
 const stock=basket.filter(row=>row.stock>0).length;
 const confirmed=meals.flatMap(row=>row.items).filter(item=>
   ctx.state?.expenses?.some(expense=>expense.forItem===item.id)).length;
 const selected=ctx.mealSlot??'dinner';
 const active=meals.find(row=>row.slot===selected);
 const warnings=active?.items.filter(item=>item.requiresKitchen).map(item=>
  mealAccommodation({...ctx,city:item.city},selected,
   item.start?localParts(item.start,item.zone).time:undefined,item.duration??0)
 ).filter(info=>!info.kitchenReady)??[];
 return '<section class="meal-flow-summary" aria-label="Ablauf Mahlzeiten und Einkauf">'
  +'<h3>Vom Rezept zum Tagesbudget · '+servings+' Personen</h3>'
  +'<ol class="meal-flow-steps">'
  +'<li><strong>1 · Mahlzeit wählen</strong><small>'+chosen+' Auswahl(en) heute · '
     +meals.map(row=>row.label+': '+row.items.length).join(', ')+'</small></li>'
  +'<li><strong>2 · Mengen berechnen</strong><small>Rezeptkarten für '+servings
     +' Personen; kochfrei oder mit tatsächlich bestätigter Küche.</small>'
     +'<a href="#meal-recipe-choices">Zu den Rezepten</a></li>'
  +'<li><strong>3 · Vorräte abziehen</strong><small>'+stock
     +' Artikel mit hinterlegtem Vorrat · Bedarf und Verbrauch bleiben vom Einkauf getrennt.</small></li>'
  +'<li><strong>4 · Ganze Packungen einkaufen</strong><small>'
     +missing+' offene Einkaufsposition(en) · Extras und zusätzliche Packungen ausdrücklich möglich.</small>'
     +'<a href="#meal-grocery-basket">Zum Warenkorb</a></li>'
  +'<li><strong>5 · Kosten bewusst bestätigen</strong><small>'
     +(costs||'Noch kein Produktbetrag')+' · '+confirmed
     +' Mahlzeit(en) mit erfasster Ausgabe. Schätzungen sind keine Zahlungen.</small>'
     +'</li></ol>'
  +(warnings.length?'<p class="meal-flow-warning"><strong>Küchenzugang nicht bestätigt:</strong> '
     +esc(warnings[0].notice)+'</p>':'')
  +'<p class="muted">EUR und CHF bleiben getrennt. Leere Produktpreise bleiben offen; ein Einkauf wird nicht automatisch als bezahlt verbucht.</p>'
  +'</section>';
}
