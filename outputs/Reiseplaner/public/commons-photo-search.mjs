// Wikimedia Commons discovery is opt-in. Search results are suggestions, not
// proof that a photo depicts a particular vendor, room or scheduled visit.
// Attribution is checked before a human can add a photo to a specific item.
const allowedMimes=new Set(['image/jpeg','image/png','image/webp']);
const licenseRE=/^(?:CC0(?:\s*1\.0)?|CC BY(?:-SA)?(?:\s*[234]\.0)?|Public domain|PD-old(?:-\d+)?|PD-US)$/i;
const cleanText=(html)=>String(html??'')
  .replace(/<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
  .replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'")
  .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)))
  .replace(/\s+/g,' ').trim();
const isHttps=url=>typeof url==='string'&&/^https:\/\/[^/\s]+\/\S+$/i.test(url)&&url.length<=1200;
export function commonsSearchUrl(query){
  const q=String(query??'').trim().slice(0,110);
  const u=new URL('https://commons.wikimedia.org/w/api.php');
  u.search=new URLSearchParams({
    action:'query',format:'json',formatversion:'2',generator:'search',
    gsrnamespace:'6',gsrlimit:'16',gsrsearch:q+' filetype:bitmap',
    prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'880',
    iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist|Attribution|Credit|Copyrighted|Restrictions',
    origin:'*',
  }).toString();
  return u.toString();
}
export function commonsWebSearchUrl(query){
  return 'https://commons.wikimedia.org/w/index.php?search='
    +encodeURIComponent(String(query??'').slice(0,120))+'&title=Special:MediaSearch&type=image';
}
export function commonsDefaultQuery(item,cities={}){
  const city=cities?.[item.city]?.name??item.city??'';
  const name=String(item.name??'').replace(/\s*[·–—]\s*(?:optional|als |mit |bei |wenn |alternative|nur |Kurzbesuch|Spaziergang).*$/i,'');
  return (name+' '+city).trim().slice(0,110);
}
export function commonsResults(data){
  const pages=Array.isArray(data?.query?.pages)?data.query.pages:[];
  const seen=new Set(),rows=[];
  for(const page of pages){
    const info=page.imageinfo?.[0],m=info?.extmetadata??{};
    const mime=info?.mime,license=cleanText(m.LicenseShortName?.value);
    const artist=cleanText(m.Attribution?.value??m.Artist?.value);
    const source=info?.descriptionurl,link=info?.thumburl;
    const licenseUrl=m.LicenseUrl?.value;
    if(!allowedMimes.has(mime)||!licenseRE.test(license)
      ||!artist||artist.length>128||!isHttps(link)||!isHttps(source)
      ||!isHttps(licenseUrl)||!(source.startsWith('https://commons.wikimedia.org/wiki/File:')
        ||source.startsWith('https://commons.wikimedia.org/wiki/Image:'))
      ||m.Restrictions?.value?.trim())continue;
    const credit=artist+' · '+license;
    if(credit.length>180||seen.has(source))continue;
    seen.add(source);
    rows.push({
      name:String(page.title??'').replace(/^File:/,''),
      url:link,sourceUrl:source,credit,
      license,licenseUrl,
      // The image must be reviewed by the person using the website.
      identityVerified:false,
    });
  }
  return rows;
}
