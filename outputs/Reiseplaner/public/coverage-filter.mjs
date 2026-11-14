// Filtering is client-side, fast and read-only. All entries stay in the source
// HTML so a source/photo is never hidden or replaced with an invented result.
export const normalizeCoverageText=value=>String(value??'').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').trim();
export function coverageMatches(row,filters={}){
  const query=normalizeCoverageText(filters.query);
  if(query&&!normalizeCoverageText([row.name,row.city,row.kind].join(' ')).includes(query))return false;
  if(filters.city&&filters.city!=='all'&&row.city!==filters.city)return false;
  if(filters.kind&&filters.kind!=='all'&&row.kind!==filters.kind)return false;
  if(filters.gap&&filters.gap!=='all'){
    if(filters.gap==='no-guide')return row.hasGuide===false;
    if(!Array.isArray(row.gaps)||!row.gaps.some(x=>x.key===filters.gap))return false;
  }
  return true;
}
export function applyCoverageFilters(panel){
  if(!panel)return {shown:0,total:0};
  const query=panel.querySelector('#coverage-filter-query')?.value??'';
  const kind=panel.querySelector('#coverage-filter-kind')?.value??'all';
  const gap=panel.querySelector('#coverage-filter-gap')?.value??'all';
  const city=panel.querySelector('#coverage-filter-city')?.value??'all';
  const filtered={query,kind,gap,city};
  let shown=0,total=0;
  for(const group of panel.querySelectorAll('.coverage-city')){
    let matched=0;
    for(const element of group.querySelectorAll('.coverage-row')){
      total++;
      const value={
        name:element.dataset.coverageName??'',
        city:element.dataset.coverageCity??'',
        kind:element.dataset.coverageKind??'',
        hasGuide:element.dataset.coverageGuide==='true',
        gaps:(element.dataset.coverageGaps??'').split(' ').filter(Boolean).map(key=>({key})),
      };
      const show=coverageMatches(value,filtered);
      element.hidden=!show;
      if(show){shown++;matched++;}
    }
    group.hidden=matched===0;
    if(matched>0&&(gap!=='all'||kind!=='all'||query||city!=='all'))group.open=true;
    const count=group.querySelector('.coverage-visible-count');
    if(count)count.textContent=String(matched);
  }
  const status=panel.querySelector('#coverage-filter-result');
  if(status)status.textContent=shown+' von '+total+' offenen Einträgen passend';
  const clear=panel.querySelector('[data-action=coverage-filter-clear]');
  if(clear)clear.disabled=(!query&&kind==='all'&&gap==='all'&&city==='all');
  return {shown,total};
}
export function resetCoverageFilters(panel){
  if(!panel)return;
  const query=panel.querySelector('#coverage-filter-query');
  if(query)query.value='';
  for(const id of ['coverage-filter-kind','coverage-filter-gap','coverage-filter-city']){
    const input=panel.querySelector('#'+id);
    if(input)input.value='all';
  }
  applyCoverageFilters(panel);
}
