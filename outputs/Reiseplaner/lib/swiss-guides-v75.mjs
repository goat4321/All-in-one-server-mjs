const fold=value=>String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de')
 .replace(/[^a-z0-9]+/g,' ').trim();
const allowed=new Set(['interrail_swiss','swiss_lakes']);
const safeUrl=value=>{try{
 const u=new URL(value);
 return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password;
}catch{return false}};
export function applySwissGuidesV75(trips,cities,archive){
 if(archive?.meta?.package!=='research-v75-swiss-entry-guides'
   ||archive.meta.checkedOn!=='2026-11-17'
   ||!Array.isArray(archive.rules)||archive.rules.length<25
   ||!archive.regions||typeof archive.regions!=='object')throw Error('V75 Swiss guide archive invalid');
 const keys=new Set();
 for(const rule of archive.rules){
   if(typeof rule.key!=='string'||keys.has(rule.key)||!safeUrl(rule.sourceUrl)
     ||!Array.isArray(rule.cities)||!rule.cities.length
     ||!Array.isArray(rule.match)||!rule.match.length
     ||!['activity','lodging','transport'].includes(rule.kind)
     ||!['summary','access','cost','caution','duration','check2027'].every(k=>
       typeof rule[k]==='string'&&rule[k].trim().length>8))throw Error('V75 invalid rule '+rule?.key);
   keys.add(rule.key);
 }
 for(const [city,r] of Object.entries(archive.regions)){
  if(cities[city]?.country!=='CH'||!safeUrl(r.sourceUrl))throw Error('V75 invalid regional source '+city);
 }
 let covered=0,specific=0,regional=0,missing=[],byVariant={};
 for(const trip of trips){
  if(!allowed.has(trip.id))continue;
  const variant={total:0,specific:0,regional:0,byKind:{}};
  for(const item of trip.items){
    if(cities[item.city]?.country!=='CH'||item.removed||item.duplicateOf)continue;
    const base=archive.regions[item.city];
    if(!base){missing.push(trip.id+':'+item.city+':'+item.id);continue;}
    const label=fold(item.name);
    const rule=archive.rules.find(r=>r.cities.includes(item.city)
      &&r.kind===item.kind&&r.match.some(x=>label.includes(fold(x))));
    const type=rule?'object':'region';
    const source=rule??base;
    item.swissGuideV75={
      checkedOn:archive.meta.checkedOn,
      sourceScope:type,
      title:rule?.key??item.city,
      summary:source.summary,
      access:source.access,
      duration:rule?.duration??null,
      cost:source.cost,
      caution:source.caution,
      check2027:rule?.check2027??
        (item.kind==='lodging'
          ?'Für die konkrete Unterkunft: Preis, Belegung, Storno, Steuer, Lage und Check-in September 2027 prüfen.'
          :'Saison-, Wetter-, Öffnungs- und Transferbedingungen 2027 vor Ort prüfen.'),
      sourceUrl:source.sourceUrl,
      sourceLabel:type==='object'
        ?'Betreiber-/Ortsquelle zum konkreten Angebot'
        :'Regionale Besucherinformation; KEIN Nachweis zum konkreten Anbieter',
      bookingConfirmed:false,livePriceConfirmed:false,
      geographyChanged:false,materiallyVerifiedFor2027:false
    };
    covered++;variant.total++;variant.byKind[item.kind]=(variant.byKind[item.kind]??0)+1;
    if(rule){specific++;variant.specific++}else{regional++;variant.regional++}
  }
  byVariant[trip.id]=variant;
 }
 if(missing.length)throw Error('V75 missing regional information for '+missing.join(','));
 return {covered,specific,regional,missing,byVariant,sourceRules:archive.rules.length,
   sourceScope:'specific rule or regional orientation only'};
}
