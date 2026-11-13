import { groupPrice, money } from './model.mjs';
import { esc } from './ui.mjs';

// This is a comparison to the traveller's own budget, NOT a claim about local
// market rates or a live 2027 checkout. No silent currency conversion.
const nightsBetween = (from,to) => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from??'')||!/^\d{4}-\d{2}-\d{2}$/.test(to??''))return null;
  const n=(Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000;
  return Number.isInteger(n)&&n>0&&n<=60?n:null;
};
export function lodgingPriceInsight(item, people=3, nightlyTargetEuro=35) {
  if(item?.kind!=='lodging'||!Number.isInteger(people)||people<1)return null;
  const target=Number.isFinite(nightlyTargetEuro)&&nightlyTargetEuro>=5&&nightlyTargetEuro<=1000
    ? Math.round(nightlyTargetEuro*100):null;
  const price=item.effectivePrice??item.price;
  const dates=price?.cents!=null
    ? [item.stayFrom,item.stayTo] : [item.quote?.sampleFrom,item.quote?.sampleTo];
  const nights=nightsBetween(...dates);
  const groupPriceCents=price?.currency==='EUR'&&Number.isSafeInteger(price.cents)
    &&(price.party==null||price.party===people)?groupPrice(price,people):null;
  const fallback=price==null&&item.quote?.sampleCurrency==='EUR'
    &&item.quote.sampleAdults===people&&Number.isSafeInteger(item.quote.sampleTotalCents)
    ? item.quote.sampleTotalCents:null;
  const total=groupPriceCents??fallback;
  const isSample=groupPriceCents==null&&fallback!=null;
  const eachNight=total!=null&&nights!=null?Math.round(total/(nights*people)):null;
  const difference=eachNight!=null&&target!=null?eachNight-target:null;
  const status=eachNight==null?'unavailable':target==null?'no-target'
    :difference<=0?'within-budget':'over-budget';
  const percentageExact=eachNight!=null&&target?Math.round(eachNight/target*100):null;
  const percentage=percentageExact==null?0:Math.min(100,percentageExact);
  const summary=eachNight==null?'Vergleich offen: Gesamtpreis, Belegung oder Nächte nicht belegt'
    :target==null?'Budgetziel noch nicht eingestellt'
    :money(Math.abs(difference))+' '+(difference<=0?'unter bzw. genau im Ziel':'über dem Ziel')+' je Person/Nacht';
  return {id:item.id,people,nights,groupTotalCents:total,personNightCents:eachNight,
    isSample,source:total==null?'keine vergleichbare EUR-Referenz':isSample
      ?'Airbnb-Wunschlistensuchwert (kein Checkout)':'Hotel-/Plan- oder Suchpreis (nicht automatisch bestätigt)',
    targetCents:target,differenceCents:difference,status,percentage,percentageExact,summary};
}
export function lodgingPriceMeter(item,people=3,target=35) {
  const p=lodgingPriceInsight(item,people,target);
  if(!p)return '';
  return '<div class="lodging-price-meter" data-price-state="'+p.status+'">'
    +'<div class="lodging-price-meter-head"><strong>'
    +(p.personNightCents==null?'Preis pro Person/Nacht offen':esc(money(p.personNightCents)))
    +'</strong><small>'+esc(p.summary)+'</small></div>'
    +(p.personNightCents!=null&&p.targetCents!=null
      ?'<div class="lodging-price-meter-track" role="meter" aria-label="Anteil des persönlichen Nachtbudgets" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'
        +p.percentage+'" aria-valuetext="'+p.percentageExact+' Prozent des persönlichen Nachtbudgets"><span style="width:'+p.percentage+'%"></span></div>':'')
    +'<small>'+esc(p.source)
    +(p.nights!=null?' · '+p.nights+' Nächte':' · Übernachtungen nicht eindeutig')+'</small>'
    +'</div>';
}
