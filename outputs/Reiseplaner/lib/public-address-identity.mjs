const name=value=>typeof value==='string'?value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de'):'';
/** Read-only source alias when an imported Tripsy lodging replaced its seed ID.
 * Similar names, changed original names and multiple candidates never match.
 */
export function resolvePublicAddressIdentity(item,records,cities={}){
 const direct=records.find(r=>r.id===item.id&&r.city===item.city);
 if(direct)return direct;
 const original=name(item.originalName),bare=name(item.name);
 const labelledOption=name('OPTION – '+(cities[item.city]?.name??item.city)+' '+item.name+' (NICHT gebucht)');
 if(item.kind!=='lodging'||!/^tripsy:lodging:\d+$/.test(item.id)
  ||!original||!bare||(original!==bare&&original!==labelledOption))return null;
 const matches=records.filter(r=>r.id.startsWith('tripsy:lodging:seed:')
  &&r.city===item.city&&name(r.name)===bare);
 return matches.length===1?matches[0]:null;
}
