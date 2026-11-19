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
