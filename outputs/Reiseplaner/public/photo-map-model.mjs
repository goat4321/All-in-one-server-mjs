// No unverified ratings or generic photographs are ever fabricated.
export const MAP_ZOOM={cluster:11,category:13.5,photo:14.2,maxPhotos:24};
const labels={lodging:'Unterkunft',food:'Essen',shop:'Supermarkt',
 activity:'Ausflug',transport:'Verkehr'};
const glyphs={lodging:'▣',food:'✦',shop:'▤',activity:'✧',transport:'↗'};
const escape=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export function validMapCoordinate(point){
 return Array.isArray(point)&&point.length===2&&point.every(Number.isFinite)
  &&Math.abs(point[0])<=90&&Math.abs(point[1])<=180
  &&(point[0]!==0||point[1]!==0);
}
export function markerTier(zoom,hasPhoto=false,photoRank=0){
 if(!Number.isFinite(zoom)||zoom<MAP_ZOOM.cluster)return 'dot';
 if(zoom<MAP_ZOOM.photo||!hasPhoto||photoRank>=MAP_ZOOM.maxPhotos)return 'category';
 return 'photo';
}
export function bubbleMarkup({id,name,category='activity',photoUrl=null,
  rating=null,saved=false,tier='category'}={}){
 const cat=Object.hasOwn(labels,category)?category:'activity';
 const cleanName=escape(name||'Unbenannter Ort');
 const star=typeof rating==='number'&&rating>0&&rating<=5
  ?'<span class="bubble-rated" aria-label="Bewertung '+rating.toFixed(1)+'">'
     +'★ '+rating.toFixed(1).replace('.',',')+'</span>':'';
 const badge='<span class="bubble-category-badge">'
    +escape(glyphs[cat])+' '+escape(labels[cat])+'</span>';
 const safePhoto=typeof photoUrl==='string'&&
   /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//.test(photoUrl)
   ?escape(photoUrl):null;
 if(tier==='dot')return '<span class="map-mini-dot group-'+cat+'"></span>';
 if(tier==='category')return '<span class="map-category-bubble group-'+cat
   +'" aria-hidden="true">'+escape(glyphs[cat])+(saved?'●':'')+'</span>';
 return '<div class="map-photo-bubble group-'+cat+'" data-poi="'+escape(id)+'">'
  +'<div class="map-photo-disc">'
  +'<span aria-hidden="true">'+escape(glyphs[cat])+'</span>'
  +(safePhoto?'<img src="'+safePhoto+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">':'')
  +'</div><div class="map-photo-meta">'+(star||badge)+'</div>'
  +'<span class="map-photo-name" title="'+cleanName+'">'+cleanName+'</span>'
  +'</div>';
}
