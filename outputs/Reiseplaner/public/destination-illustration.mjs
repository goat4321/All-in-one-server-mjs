// Distinctive original decorative fallback artwork, NOT a photograph or
// evidence for the geographic shape of a destination.
export function destinationIllustration(id){
 const coast=/^(barcelona|sete|nice|genoa|venice|boccadasse|cannes|marseille|montpellier)$/i.test(id);
 const alpine=/^(appenzell|wasserauen|grindelwald|kandersteg|seealpsee|kloental|flims|bachalpsee|glarus)$/i.test(id);
 const type=alpine?'alpine':coast?'coast':'city';
 const sky=type==='alpine'?'#cee5e9':type==='coast'?'#c7e8e7':'#e3dbea';
 const ground=type==='alpine'?'#9bbfa2':type==='coast'?'#79bfc2':'#c5c5d7';
 const path=type==='alpine'
   ?'<path d="M0 75 33 30 51 49 77 18 118 65 146 35 170 65v35H0z" fill="#9bbdba"/><path d="m54 49 23-31 26 33-14-4-12-15-11 17z" fill="#fff" opacity=".85"/><path d="M0 80 57 64 113 83 170 64v36H0z" fill="#5c9b83"/>'
   :type==='coast'
   ?'<path d="M0 61 Q38 56 73 62T170 62 V100H0z" fill="#78bac7"/><path d="M0 75 Q30 69 60 74T118 74T170 72" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/><path d="M0 82 Q46 77 95 83T170 81" stroke="#e6f7fc" stroke-width="2" fill="none"/>'
   :'<path d="M0 76H18V43h15v33h9V30h21v46h9V51h16v25h10V34h20v42h9V45h18v31h17V100H0z" fill="#9c9db7"/><path d="M0 78h170v22H0z" fill="#7b9b92"/>';
 return '<svg class="destination-art" viewBox="0 0 170 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-art-type="'+type+'">'
   +'<rect width="170" height="100" fill="'+sky+'"/>'
   +'<circle cx="127" cy="24" r="15" fill="#fff2c8" opacity=".94"/>'
   +'<path d="M0 95h170v5H0z" fill="'+ground+'"/>'
   +path+'</svg>';
}
