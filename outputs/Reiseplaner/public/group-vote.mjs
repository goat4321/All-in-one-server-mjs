import { esc, btn } from './ui.mjs';

export function voteSummary(item,people=[],votes={}) {
  const ballot=votes?.[item?.id]??{};
  const individuals=people.map(person=>{
    const value=ballot[person.id];
    return {id:person.id,name:person.name||person.id,
      score:Number.isInteger(value)&&value>=1&&value<=5?value:null};
  });
  const scores=individuals.map(x=>x.score).filter(x=>x!=null);
  const average=scores.length
    ?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10:null;
  return {itemId:item.id,average,count:scores.length,total:people.length,
    complete:scores.length===people.length,individuals,
    difference:scores.length>=2?Math.max(...scores)-Math.min(...scores):null};
}

export function voteSnippet(item,ctx={}) {
  if(!item)return '';
  const vote=voteSummary(item,ctx.people??[],ctx.state?.votes??{});
  return '<div class="group-vote-snippet" aria-label="Reisegruppenbewertung">'
    +'<span class="group-vote-stars" aria-hidden="true">☆</span>'
    +'<div><strong>'+(vote.average==null?'Noch keine Gruppenstimmen':esc(vote.average.toFixed(1).replace('.',',')+'/5 Gruppenwertung'))
    +'</strong><small>'+vote.count+'/'+vote.total+' Stimmen · subjektive Reisendenmeinung, keine Anbieterbewertung</small></div>'
    +btn('vote-open','Bewerten','people',item.id)+'</div>';
}

export function groupVoteBoard(ctx) {
  const favored=new Set(ctx.state.favorites??[]);
  const cards=ctx.all.filter(item=>item.city===ctx.city
    && !item.duplicateOf&&!item.removed&&['lodging','activity'].includes(item.kind))
    .sort((a,b)=>{
      const va=voteSummary(a,ctx.people,ctx.state.votes).average;
      const vb=voteSummary(b,ctx.people,ctx.state.votes).average;
      return (vb??-1)-(va??-1)
        || Number(favored.has(b.id))-Number(favored.has(a.id))
        || Number(ctx.activeSet.has(b.id))-Number(ctx.activeSet.has(a.id))
        || a.name.localeCompare(b.name,'de');
    }).slice(0,15);
  return '<section class="section panel panel-pad group-vote-board">'
    +'<div class="subheading compact"><div><h2>Gemeinsam entscheiden</h2>'
    +'<p>Bewertet Unterkünfte und Aktivitäten unabhängig mit 1–5 Punkten. Jede Person wird separat gespeichert.</p></div></div>'
    +'<p class="muted">Lokale Abstimmung in dieser Reisevariante. Keine Konten, keine externen Benachrichtigungen, keine synchronisierten Live-Stimmen.</p>'
    +'<div class="group-vote-grid">'+cards.map(item=>{
      const summary=voteSummary(item,ctx.people,ctx.state.votes);
      const percent=summary.average==null?0:summary.average/5*100;
      return '<article class="group-vote-item"><div><strong>'+esc(item.name)+'</strong><small>'
        +esc(ctx.cities[item.city]?.name??item.city)
        +' · '+(item.kind==='lodging'?'Unterkunft':'Aktivität')+'</small></div>'
        +'<div class="group-vote-overview"><span>'
        +(summary.average==null?'Offen':esc(summary.average.toFixed(1).replace('.',',')+'/5'))
        +'</span><small>'+summary.count+'/'+summary.total+' Stimmen</small></div>'
        +'<div class="group-vote-bar" aria-hidden="true"><span style="width:'+percent+'%"></span></div>'
        +btn('vote-open','Stimmen bearbeiten','people',item.id)
        +'</article>';
    }).join('')+'</div></section>';
}
