import { dateText } from './ui.mjs';
import { localParts, money } from './model.mjs';

const defaults=Object.freeze({target:60,food:18,mobility:6,activities:12});
export { defaults as dailyBudgetDefaults };
const validEuro=(amount,min=0,max=1000)=>Number.isFinite(amount)&&amount>=min&&amount<=max;
const dateNumber=date=>/^\d{4}-\d{2}-\d{2}$/.test(date??'')?Date.parse(date+'T12:00:00Z'):NaN;

// A consumption projection, separate from the cash-flow budget. Accommodation
// is apportioned across nights exclusively inside this calculator.
export function dailyBudgetProjection(rows,people,date,values=defaults){
  if(!Array.isArray(rows)||!Number.isInteger(people)||people<1||people>30
    ||!Number.isFinite(dateNumber(date)))return null;
  const input={...defaults,...values};
  for(const key of Object.keys(defaults))
    if(!validEuro(input[key],key==='target'?5:0,1000))return null;
  let knownCents=0,unpriced=0,items=0,lodgingCents=0;
  const day=dateNumber(date);
  for(const item of rows){
    if(!item||typeof item!=='object')continue;
    let allocated=false,amount=item.euros;
    if(item.kind==='lodging'){
      const from=dateNumber(item.stayFrom),to=dateNumber(item.stayTo);
      const nights=Math.round((to-from)/86400000);
      if(Number.isFinite(from)&&Number.isFinite(to)&&Number.isInteger(nights)&&nights>=1&&nights<=60){
        const index=Math.round((day-from)/86400000);
        if(index<0||index>=nights)continue;
        allocated=true;
        if(amount!=null&&Number.isSafeInteger(amount)){
          // Remainder cents are assigned to earlier nights; the exact amount
          // sums back to the original lodging total for the whole stay.
          const sign=Math.sign(amount),abs=Math.abs(amount);
          amount=sign*(Math.floor(abs/nights)+(index<abs%nights?1:0));
        }
      }
    }
    if(!allocated){
      const itemDate=item.date ?? (item.start&&item.zone?localParts(item.start,item.zone).date:null)
        ?? (item.kind==='lodging'?item.stayFrom:null);
      if(itemDate!==date)continue;
    }
    items++;
    if(amount==null||!Number.isSafeInteger(amount))unpriced++;
    else {knownCents+=amount;if(item.kind==='lodging')lodgingCents+=amount;}
  }
  const additionalPerPersonCents=Math.round((input.food+input.mobility+input.activities)*100);
  const targetPerPersonCents=Math.round(input.target*100);
  const projectedGroupCents=knownCents+additionalPerPersonCents*people;
  const goalGroupCents=targetPerPersonCents*people;
  return {date,people,items,unpriced,knownCents,lodgingCents,
    additionalPerPersonCents,projectedGroupCents,goalGroupCents,
    remainderGroupCents:goalGroupCents-projectedGroupCents,
    within:goalGroupCents>=projectedGroupCents};
}

export function dailyBudgetHtml(ctx){
  const dates=ctx.dates??[];
  const date=dates.includes(ctx.dailyBudgetDate)?ctx.dailyBudgetDate:
    dates.includes(ctx.date)?ctx.date:dates[0];
  const input={...defaults,...ctx.dailyBudgetInputs};
  const p=dailyBudgetProjection(ctx.budget.rows,ctx.people.length,date,input);
  if(!p)return '';
  const select='<label>Reisetag <select id="daily-budget-date" aria-label="Simulierter Reisetag">'
    +dates.map(d=>'<option value="'+d+'"'+(d===date?' selected':'')+'>'+dateText(d)+'</option>').join('')
    +'</select></label>';
  const control=(id,title,min)=>'<label>'+title+' <span>€ pro Person</span><input type="number" inputmode="decimal" min="'+min
    +'" max="1000" step="1" data-budget-assumption="'+id+'" value="'+input[id]+'" aria-label="'+title+' in Euro pro Person"></label>';
  return '<section class="section panel panel-pad daily-budget" aria-label="Tagesbudget-Simulator">'
    +'<header class="daily-budget-title"><div><h2>Interaktiver Tagesbudget-Simulator</h2>'
    +'<p>Verändere deine Annahmen. Dieser Vergleich wird nicht ins aktive Reisebudget übernommen.</p></div>'
    +'<span class="daily-budget-tag">Unverbindliche Modellrechnung</span></header>'
    +'<div class="daily-budget-controls">'+select+control('target','Tagesziel',5)
    +control('food','Zusätzliches Essen',0)+control('mobility','Zusätzlicher Nahverkehr',0)
    +control('activities','Weitere Aktivitäten',0)+'</div>'
    +'<div class="daily-budget-results"><div><small>Bekannte Planbeträge am Tag, Gruppe</small>'
    +'<strong>'+money(p.knownCents)+'</strong><small>davon Unterkunft pro Nacht: '+money(p.lodgingCents)+'</small></div>'
    +'<div><small>Zusätzliche Annahmen, Gruppe</small><strong>'
    +money(p.additionalPerPersonCents*p.people)+'</strong><small>'+money(p.additionalPerPersonCents)+' je Person</small></div>'
    +'<div><small>Modellierte Tageskosten, Gruppe</small><strong>'+money(p.projectedGroupCents)
    +'</strong><small>Budgetziel: '+money(p.goalGroupCents)+'</small></div>'
    +'<div class="'+(p.within?'daily-budget-positive':'daily-budget-negative')+'"><small>'
    +(p.within?'Noch innerhalb des Tagesziels':'Über dem Tagesziel')+'</small><strong>'
    +money(Math.abs(p.remainderGroupCents))+'</strong><small>'+p.people+' Reisende</small></div></div>'
    +'<p class="daily-budget-note">'+p.items+' zugeordnete Planposten, '+p.unpriced
    +' davon ohne Preis. Unterkunftsbeträge werden **nur für diesen Simulator** rechnerisch auf Nächte verteilt.'
      .replaceAll('**','')
    +' Zusätzliche Annahmen sind keine tatsächlichen Ausgaben. Weitere unbekannte Posten können die Gesamtkosten erhöhen.</p>'
    +'</section>';
}
