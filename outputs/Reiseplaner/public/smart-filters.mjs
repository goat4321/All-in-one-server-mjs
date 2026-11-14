import { groupPrice } from './model.mjs';
import { lodgingPriceInsight } from './price-insights.mjs';
import { kitchenAccess } from './stay-analysis.mjs';
import { reviewProgress } from './verification.mjs';
import { voteSummary } from './group-vote.mjs';

const textFor=(item)=>[item.name,item.detail,item.note,...(item.tags??[])]
  .filter(x=>typeof x==='string').join(' ').toLocaleLowerCase('de');

export const smartFilterHelp=Object.freeze({
  free:'0 € als Preisreferenz angegeben – nicht als kostenloser Eintritt für 2027 verifiziert.',
  station:'Nur Unterkünfte mit bereits berechnetem Bahnhof-Fußweg bis einschließlich 15 Minuten.',
  beds:'Nur Unterkünfte mit eigenständig dokumentierter Bettenprüfung für genau diese Gruppengröße.',
  water:'Das Angebot erwähnt Wasser, einen See oder Strand; Baden ist damit nicht als erlaubt bestätigt.',
  swimming:'Der Eintrag erwähnt Baden oder Schwimmen; Sicherheit und tatsächliche Möglichkeit separat prüfen.',
  consensus:'Mindestens zwei abgegebene Gruppenbewertungen mit einem Durchschnitt von 4/5 oder höher.',
});

export function optionMatchesFilter(item,key,ctx,lodging){
  if(!item)return false;
  const size=ctx.people?.length??0;
  const known=groupPrice(item.price,size);
  if(key==='all')return true;
  if(key==='saved')return ctx.browseSavedIds?.has(item.id)
    ??(ctx.state?.favorites??[]).includes(item.id);
  if(key==='known')return known!=null;
  if(key==='kitchen')return lodging && kitchenAccess(item)!=='unknown';
  if(key==='search')return lodging && Boolean(item.quote);
  if(key==='budget')return lodging && lodgingPriceInsight(item,size,ctx.nightlyTargetEuro)?.status==='within-budget';
  if(key==='self_reviewed')return lodging && reviewProgress('lodging',ctx.state?.verifications?.[item.id],size).complete;
  if(key==='station')return lodging && Number.isFinite(ctx.hotelWalks?.[item.id]?.minutes)
    && ctx.hotelWalks[item.id].minutes>=0 && ctx.hotelWalks[item.id].minutes<=15;
  if(key==='beds')return lodging && ctx.state?.verifications?.[item.id]?.checks?.beds===true
    && ctx.state.verifications[item.id].groupSize===size;
  if(key==='free')return !lodging && known===0;
  if(key==='water')return !lodging && /strand|beach|see\b|lake|meer|sea\b|ufer|wasser|fjord|lagune/.test(textFor(item));
  if(key==='swimming')return !lodging && /schwimm|baden|badestelle|badeplatz|swimming|swim\b|badebucht/.test(textFor(item));
  if(key==='consensus'){
    if(lodging)return false;
    const vote=voteSummary(item,ctx.people??[],ctx.state?.votes??{});
    return vote.count>=2&&vote.average>=4;
  }
  if(key==='evening')return !lodging && (Boolean(item.minAge) || (item.tags??[]).some(t=>/abend|nightlife|bar/i.test(t)));
  if(key==='food')return !lodging && item.category==='food';
  return false;
}
