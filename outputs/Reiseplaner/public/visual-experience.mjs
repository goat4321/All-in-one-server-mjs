import {groupPrice,money} from './model.mjs';

// A flexible/missing time remains unknown; no invented itinerary time.
export function dayPeriod(time) {
  const match=/^([01]\d|2[0-3]):[0-5]\d$/.exec(String(time??''));
  if(!match)return null;
  const hour=Number(match[1]);
  if(hour<11)return {key:'morning',title:'Morgen',icon:'sun'};
  if(hour<14)return {key:'lunch',title:'Mittag',icon:'food'};
  if(hour<18)return {key:'afternoon',title:'Nachmittag',icon:'compass'};
  return {key:'evening',title:'Abend',icon:'moon'};
}

// Relative price symbol based only on an existing EUR plan amount.
// Never represents a validated checkout, published tariff or provider rating.
export function planCostSignal(item,count) {
  const price=item?.effectivePrice??item?.price;
  const people=Number.isInteger(count)&&count>0?count:1;
  const total=price?.currency==='EUR'?groupPrice(price,people):null;
  if(!Number.isSafeInteger(total)||total<0)
    return {tier:'€?',amount:'Preis offen',known:false,note:'Kein umrechenbarer EUR-Planpreis'};
  const amount=money(total,'EUR');
  if(item.kind==='lodging')
    return {tier:'€?',amount,known:true,note:amount+' im Plan für die Gruppe · kein bestätigter Endpreis; Nachtpreis-Einstufung offen'};
  const thresholds=item.category==='food'?[15,35]:item.kind==='transport'?[20,70]:[10,40];
  const euro=total/people/100;
  const tier=euro===0?'0 €':euro<thresholds[0]?'€':euro<thresholds[1]?'€€':'€€€';
  return {tier,amount,known:true,
    note:amount+' als Gruppen-Planwert · relative €-Stufe aus '+euro.toLocaleString('de-DE',{maximumFractionDigits:2})
      +' € pro Person; keine bestätigte Ausgabe'};
}
