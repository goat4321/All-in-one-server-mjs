// Run inside Chrome via Runtime.evaluate. Limited to flat CSS text backgrounds;
// this is a contrast measurement, not a full accessibility conformance audit.
export function measureFlatContrast(selector){
 const rgb=color=>{const values=color.match(/[\d.]+/g)?.map(Number);return values?.length>=3?[...values.slice(0,3),values[3]??1]:null;};
 const over=(front,back)=>front.slice(0,3).map((value,i)=>value*front[3]+back[i]*(1-front[3]));
 const luminance=color=>color.map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4)
  .reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const light=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(light[0]+.05)/(light[1]+.05);};
 const background=element=>{
  const chain=[];for(let node=element;node;node=node.parentElement)chain.unshift(node);
  let result=[255,255,255];
  for(const node of chain){
   const style=getComputedStyle(node);
   if(style.backgroundImage!=='none'||Number(style.opacity)!==1)return null;
   const color=rgb(style.backgroundColor);if(!color)return null;
   result=over(color,result);
  }
  return result;
 };
 const nodes=[...document.querySelectorAll(selector)].flatMap(root=>[root,...root.querySelectorAll('*')]);
 const rows=[],skipped=[];
 for(const node of new Set(nodes)){
  if(!node.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})
   ||![...node.childNodes].some(child=>child.nodeType===3&&child.textContent.trim()))continue;
  const style=getComputedStyle(node),back=background(node),front=rgb(style.color);
  if(!back||!front){skipped.push(node.textContent.trim().slice(0,80));continue;}
  const size=parseFloat(style.fontSize),weight=Number(style.fontWeight);
  rows.push({text:node.textContent.trim().slice(0,80),ratio:ratio(over(front,back),back),
   threshold:size>=24||size>=18.6666666667&&weight>=700?3:4.5,color:style.color,background:back});
 }
 const active=document.activeElement;
 const outline=active&&rgb(getComputedStyle(active).outlineColor),adjacent=active&&background(active.parentElement);
 return{checked:rows.length,minRatio:Math.min(...rows.map(row=>row.ratio)),
  failures:rows.filter(row=>row.ratio<row.threshold),skipped,
  focus:active?.tagName==='SUMMARY'&&outline&&adjacent?{ratio:ratio(over(outline,adjacent),adjacent),width:parseFloat(getComputedStyle(active).outlineWidth)}:null};
}
