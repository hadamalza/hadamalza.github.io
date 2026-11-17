const $=s=>document.querySelector(s);let state={wish:'수능대박',seed:1};const WISH_RE=/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\u3040-\u30ff\u3400-\u9fff々〆〇〻 ]{1,12}$/;
const consonants={
'ㄱ':['8,12 88,12 86,90'],'ㄴ':['12,8 12,86 90,86'],'ㄷ':['90,12 12,12 12,86 92,86'],'ㄹ':['8,12 86,12 86,47 12,47 12,86 92,86'],'ㅁ':['12,12 88,12 88,86 12,86 12,12'],'ㅂ':['12,8 12,88 88,88 88,8','12,45 88,45'],'ㅅ':['50,8 42,49 8,88','46,37 90,88'],'ㅇ':['48,8 78,18 92,48 78,80 49,92 19,79 8,48 20,17 48,8'],'ㅈ':['7,12 93,12','50,14 43,49 8,89','45,42 91,89'],'ㅊ':['38,4 63,7','7,25 93,25','50,27 43,55 8,93','46,48 91,93'],'ㅋ':['8,12 88,12 86,90','10,47 86,47'],'ㅌ':['91,12 12,12 12,88 92,88','12,48 85,48'],'ㅍ':['6,12 94,12','22,13 22,86','77,13 77,86','6,88 94,88'],'ㅎ':['34,4 66,6','7,24 93,24','49,39 78,46 88,66 76,86 49,94 21,85 12,66 23,46 49,39']};
// Numerals use the same pressure-sensitive ink paths as Hangul, not SVG text.
const numerals={
 '0':['53,8 29,14 18,39 20,71 38,90 63,87 79,64 80,34 67,12 53,8'],
 '1':['26,28 49,11 53,8 48,88','30,90 72,88'],
 '2':['18,26 31,11 57,9 77,22 76,40 60,57 35,74 19,88 81,86'],
 '3':['20,17 46,9 72,15 79,31 67,43 44,49 66,52 81,65 76,81 55,92 28,87 17,77'],
 '4':['61,8 18,63 82,61','63,10 59,94'],
 '5':['79,11 28,13 23,47 47,42 70,49 79,66 70,86 46,93 22,81'],
 '6':['73,12 50,10 29,31 18,61 26,83 49,92 71,81 78,61 63,46 42,45 22,60'],
 '7':['17,15 80,11 62,38 48,65 41,92'],
 '8':['48,48 25,34 27,16 49,8 72,15 75,32 48,48 23,65 22,82 46,93 72,85 79,67 48,48'],
 '9':['76,43 58,54 34,51 21,36 29,16 50,9 71,18 78,40 72,66 56,86 35,94']
};
const vowels={'ㅏ':['28,4 28,96','28,48 90,48'],'ㅑ':['28,4 28,96','28,30 90,30','28,67 90,67'],'ㅓ':['72,4 72,96','8,48 72,48'],'ㅕ':['72,4 72,96','8,30 72,30','8,67 72,67'],'ㅗ':['50,5 50,72','5,76 95,76'],'ㅛ':['30,5 30,72','70,5 70,72','5,76 95,76'],'ㅜ':['5,24 95,24','50,25 50,96'],'ㅠ':['5,24 95,24','30,25 30,96','70,25 70,96'],'ㅡ':['5,50 95,50'],'ㅣ':['50,4 50,96']};
const first=[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'],middle=[...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'],last=['',...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const compounds={'ㄲ':'ㄱㄱ','ㄸ':'ㄷㄷ','ㅃ':'ㅂㅂ','ㅆ':'ㅅㅅ','ㅉ':'ㅈㅈ','ㄳ':'ㄱㅅ','ㄵ':'ㄴㅈ','ㄶ':'ㄴㅎ','ㄺ':'ㄹㄱ','ㄻ':'ㄹㅁ','ㄼ':'ㄹㅂ','ㄽ':'ㄹㅅ','ㄾ':'ㄹㅌ','ㄿ':'ㄹㅍ','ㅀ':'ㄹㅎ','ㅄ':'ㅂㅅ','ㅐ':'ㅏㅣ','ㅒ':'ㅑㅣ','ㅔ':'ㅓㅣ','ㅖ':'ㅕㅣ','ㅘ':'ㅗㅏ','ㅙ':'ㅗㅐ','ㅚ':'ㅗㅣ','ㅝ':'ㅜㅓ','ㅞ':'ㅜㅔ','ㅟ':'ㅜㅣ','ㅢ':'ㅡㅣ'};
let random;function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// A pressure-varying brush ribbon: all lettering and connective marks share this pen.
let activeContour=null;
function line(points,w=3){
 // Round corners within the original stroke's convex hull, without overshoot.
 for(let pass=0;pass<2;pass++){let rounded=[points[0]];for(let i=0;i<points.length-1;i++){let a=points[i],b=points[i+1];rounded.push([a[0]*.78+b[0]*.22,a[1]*.78+b[1]*.22],[a[0]*.22+b[0]*.78,a[1]*.22+b[1]*.78]);}rounded.push(points.at(-1));points=rounded;}

 const pts=[];for(let i=0;i<points.length-1;i++){let a=points[i],b=points[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(3,Math.ceil(length/5));for(let k=0;k<n;k++){let t=k/n;pts.push([a[0]+(b[0]-a[0])*t+Math.sin(t*Math.PI)*.6,a[1]+(b[1]-a[1])*t]);}}pts.push(points.at(-1));
 if(activeContour)for(let i=0;i<pts.length;i++)pts[i]=activeContour(pts[i]);
 const closed=Math.hypot(pts[0][0]-pts.at(-1)[0],pts[0][1]-pts.at(-1)[1])<2;
 const phase=random()*6, left=[],right=[];for(let i=0;i<pts.length;i++){const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)],dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1,t=i/(pts.length-1);const pressure=closed?1+.23*Math.sin(t*Math.PI*2+phase):.50+.86*Math.pow(Math.sin(Math.PI*t),.8);const tilt=.9+.14*Math.abs(dy)/len;const width=w*1.5*Math.max(.48,pressure*tilt)*(1+Math.sin(t*9+phase)*.055)/2;left.push([pts[i][0]-dy/len*width,pts[i][1]+dx/len*width]);right.push([pts[i][0]+dy/len*width,pts[i][1]-dx/len*width]);}
 return `<path d="M${left.map(p=>p.join(',')).join(' L')} L${right.reverse().map(p=>p.join(',')).join(' L')}Z" fill="currentColor"/>`;
}
function curve(points,w){let out=[];for(let i=0;i<points.length-1;i++){let a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];for(let k=0;k<12;k++){let t=k/12,t2=t*t,t3=t2*t;out.push([0,1].map(j=>.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3)));}}out.push(points.at(-1));return line(out,w);}
// Every component owns a separate region. Deformation stays inside that region.
function jamo(c,x,y,w,h){
 if(compounds[c]){const [a,b]=[...compounds[c]];return jamo(a,x,y,w*.43,h)+jamo(b,x+w*.55,y,w*.45,h)}
 const paths=consonants[c]||vowels[c]||numerals[c];if(!paths)return '';
 const weight=Math.max(2.8,Math.min(5.8,Math.max(w,h)*.065,Math.min(w,h)*.23));
 return paths.map(p=>{const pts=p.split(' ').map(s=>{const [px,py]=s.split(',').map(Number);return[x+px*w/100,y+py*h/100]});return (c==='ㅇ'||c==='ㅎ'&&pts.length>5||'03689'.includes(c)?curve:line)(pts,weight*(.9+random()*.2))}).join('');
}
function glyph(c,x,y,w,h){
 let n=c.charCodeAt(0)-44032;if(n<0||n>11171){if(numerals[c]){const nw=Math.min(w,h*.88),nh=Math.min(h,w*1.6);return jamo(c,x+(w-nw)/2,y+(h-nh)/2,nw,nh);}if(consonants[c]||vowels[c])return jamo(c,x,y,w,h);return outlineGlyph(c,x,y,w,h)}
 let a=first[Math.floor(n/588)],v=middle[Math.floor(n%588/28)],f=last[n%28],out='';
 // Stable Hangul anatomy: initials left/above, vowels right/below, finals at the bottom.
 // Cap extreme stretching, while leaving the brush pressure and layout variation intact.
 const fittedW=Math.min(w,h*2.1),fittedH=Math.min(h,w*2.25);
 x+=(w-fittedW)/2;y+=(h-fittedH)/2;w=fittedW;h=fittedH;
 const topH=f?h*.65:h;
 if('ㅗㅛㅜㅠㅡ'.includes(v)){
   out+=jamo(a,x+w*.06,y,w*.88,topH*.56);
   out+=jamo(v,x,y+topH*.65,w,topH*.35);
 }else if('ㅘㅙㅚㅝㅞㅟㅢ'.includes(v)){
   const [va,vb]=[...compounds[v]],complex='ㅙㅞ'.includes(v);
   const leftW=w*(complex?.49:.58),rightX=x+w*(complex?.60:.70);
   out+=jamo(a,x,y,leftW,topH*.52);
   out+=jamo(va,x,y+topH*.64,leftW,topH*.36);
   out+=jamo(vb,rightX,y,x+w-rightX,topH);
 }else{
   const split='ㅐㅒㅔㅖ'.includes(v)?.48:.57;
   out+=jamo(a,x,y,w*split,topH);
   out+=jamo(v,x+w*(split+.10),y,w*(.90-split),topH);
 }
 if(f)out+=jamo(f,x+w*.04,y+h*.76,w*.92,h*.24);
 return out;
}

// Each band has its own contour; side strokes occupy reserved gutters, never the lettering.
function band(c,x,y,w,h,mode){
 let out='',inset=mode===0?12:30;
 if(mode===1){
   out+=line([[x+8,y+h-5],[x+17,y+7],[x+w-17,y+7],[x+w-8,y+h-5]],5.3);
   out+=glyph(c,x+inset,y+19,w-inset*2,h-27);
 }else if(mode===2){
   out+=curve([[x+20,y+5],[x+9,y+h*.35],[x+16,y+h*.7],[x+4,y+h-3]],4.5);
   out+=curve([[x+w-20,y+5],[x+w-9,y+h*.35],[x+w-16,y+h*.7],[x+w-4,y+h-3]],4.5);
   out+=glyph(c,x+inset,y+4,w-inset*2,h-8);
 }else out+=glyph(c,x+inset,y+4,w-inset*2,h-8);
 return out;
}
// Motifs are drawn only inside dedicated layout slots; none are layered over characters.
function motif(kind,x,y,w,h){
 const path=d=>{let tokens=d.match(/[MLHVZ]|-?\d+(?:\.\d+)?/g),i=0,pen=[0,0],start,pts=[],out='';while(i<tokens.length){let cmd=tokens[i++];if(cmd==='M'){if(pts.length>1)out+=line(pts,2.4);pen=[+tokens[i++],+tokens[i++]];start=pen;pts=[pen];}else if(cmd==='L'){pen=[+tokens[i++],+tokens[i++]];pts.push(pen);}else if(cmd==='H'){pen=[+tokens[i++],pen[1]];pts.push(pen);}else if(cmd==='V'){pen=[pen[0],+tokens[i++]];pts.push(pen);}else if(cmd==='Z')pts.push(start);}if(pts.length>1)out+=line(pts,2.4);return out;};
 const ring=(cx,cy,r=4)=>{let p=Array.from({length:25},(_,i)=>[cx+Math.cos(i*Math.PI/12)*r,cy+Math.sin(i*Math.PI/12)*r]);return line(p,2);};
 let m='';
 if(kind%4===0){
  m+=path('M18 17H82 M18 31H82 M35 48L18 75 M35 48L40 77 M65 48L60 77 M65 48L82 75');
  for(let xx of [12,88])for(let yy of [15,30,45])m+=ring(xx,yy,5);
  for(let [xx,yy] of [[35,45],[65,45],[15,80],[40,82],[60,82],[85,80]])m+=ring(xx,yy,5);
 }else if(kind%4===1){
  m+=path('M10 12H35V25H12V40H35V53H12 M90 12H65V25H88V40H65V53H88 M18 65H82 M28 81H72');
  m+=path('M44 18L56 43 M56 18L44 43');for(let [xx,yy] of [[44,16],[56,16],[44,45],[56,45]])m+=ring(xx,yy,3);
 }else if(kind%4===2){
  m+=path('M12 16H88V32H12Z M50 7V47 M20 48H80 M28 62H72 M20 76H80');
  m+=ring(16,88,4)+ring(84,88,4)+path('M22 88H78');
 }else{
  m+=path('M12 33V12H38V24H24V40H10 M88 33V12H62V24H76V40H90 M34 50L50 34L66 50L50 66Z M14 80H86 M28 91H72');
 }
 return `<g transform="translate(${x} ${y}) scale(${w/100} ${h/100})">${m}</g>`;
}
function frame(kind){let d='';if(kind===1){
 d='M46 105H36V123H48V143H36V163H48V183H36V203H48V223H36V243H48V263H36V283H48V303H36V323H48V343H36V363H48V383H36V403H48V423H36V453L30 500';
 }else d='M48 108H32V129H49V148H32V167H49V186H36V458Q36 486 28 506';
 return `<g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"><path d="${d}"/><path d="${d}" transform="translate(300 0) scale(-1 1)"/></g>`;
}
function talismanSVG(wish,seed){random=rng([...wish].reduce((a,c,i)=>Math.imul(a,31)+c.codePointAt(0)+i,seed*9001));const chars=[...wish.replace(/\s/g,'')];let ink='';
 // Phrase selects the starting composition; remix still advances both families.
 const phraseHash=[...wish.normalize('NFC').replace(/\s/g,'')].reduce((hash,c)=>Math.imul(hash,31)+c.codePointAt(0)|0,2166136261);
 const phraseRandom=rng(phraseHash);
 const variant=(Math.floor(phraseRandom()*4)+seed)%4,framed=variant===1||variant===3;
 const ornament=(Math.floor(phraseRandom()*3)+seed-1)%3;
 const x=36,w=228;
 const top=101,bottom=514;
 ink+=motif(ornament===2?2:seed,69,28,162,54);
 
 
 // Split the composition structurally, alternating wide bands and unequal columns.
 function stack(items,bx,by,bw,bh,fillEmpty=false){
  const n=items.length;if(!n){ink+=motif(seed+2,bx+8,by+8,bw-16,Math.min(bh-16,100));return;}
  const weights=items.map(c=>{let z=c.charCodeAt(0)-44032;return (z>=0&&z%28?1.18:.9)*(.85+random()*.3)});
  let sum=weights.reduce((a,b)=>a+b,0),yy=by,gap=items.every(c=>/[\u3005-\u30ff\u3400-\u9fff]/u.test(c))?3:(n>4?9:10);
  for(let i=0;i<n;i++){let hh=(bh-gap*(n-1))*weights[i]/sum;
    // A slight lean belongs to this character, with no external enclosing outline.
    const inset=bw>150?7:2,shift=(random()-.5)*2;
    ink+=glyph(items[i],bx+inset+shift,yy,bw-inset*2,hh);yy+=hh+gap;
  }

 }
 function columns(items,bx,by,bw,bh){
  let rightCount=Math.ceil(items.length/2),leftCount=items.length-rightCount;
  let colGap=6,rw=(bw-colGap)*(.47+random()*.06),lw=bw-colGap-rw;
  stack(items.slice(0,rightCount),bx+lw+colGap,by,rw,bh);
  if(leftCount<rightCount){let reserve=Math.min(94,bh/(rightCount+1));
   stack(items.slice(rightCount),bx,by,lw,bh-reserve-14);
   ink+=motif(seed+1,bx+3,by+bh-reserve,lw-6,reserve);
  }else stack(items.slice(rightCount),bx,by,lw,bh);
 }
 const bh=bottom-top;
 if(chars.length===1){stack(chars,x,top,w,bh*.67);ink+=motif(seed+2,x+20,top+bh*.73,w-40,bh*.27);}
 else if(chars.length>=10){columns(chars,x,top,w,bh);}
 else if(variant===3&&chars.length>=3){let h=bh*.28;stack(chars.slice(0,1),x,top,w,h);columns(chars.slice(1),x,top+h+16,w,bh-h-16);}
 else if(variant===0&&chars.length>=4){let h=bh*.28;columns(chars.slice(0,-1),x,top,w,bh-h-16);stack(chars.slice(-1),x,bottom-h,w,h);}
 else if(chars.length>6||variant===2&&chars.length>3)columns(chars,x,top,w,bh);
 else stack(chars,x,top,w,bh);
 // Full-height, open brush flourishes follow the empty outer margins.
 // The text starts at x=36; side strokes stay at x<=29 (plus brush width).
 for(const side of [0,1]){
   const reflect=p=>side?[300-p[0],p[1]]:p;
   if(ornament===1){
     // One continuous folded stroke, followed by a freehand descending tail.
     const y0=43+random()*12,count=8+Math.floor(random()*3),step=(410-y0)/count;
     let folded=[[29,y0],[14,y0+1]];
     for(let k=0;k<count;k++){
       let yy=y0+k*step,l=13+random()*2,r=27+random()*2;
       folded.push([l,yy+step*.25],[r,yy+step*.27],[r,yy+step*.65],[l,yy+step*.67],[l,yy+step]);
     }
     folded.push([16,445],[14,493],[11,539],[5,579]);
     ink+=line(folded.map(reflect),3.1+random()*.4);
     for(let k=0;k<3;k++){let cy=446+k*17;let ring=Array.from({length:17},(_,i)=>[27+Math.cos(i*Math.PI/8)*2.6,cy+Math.sin(i*Math.PI/8)*3]);ink+=line(ring.map(reflect),1.4);}
     continue;
   }
   if(ornament===2){
     // Stacked open-ended square seals share a long outer backbone.
     const count=7+Math.floor(random()*3),step=420/count,start=45+random()*8;
     for(let k=0;k<count;k++){
       let yy=start+k*step,l=13+random()*2,r=28+random(),hh=step*.68;
       ink+=line([[l,yy],[r,yy+1],[r,yy+hh],[l,yy+hh-1],[l,yy]].map(reflect),2.9);
       if(k%3===1)ink+=line([[l+4,yy+hh*.49],[r-4,yy+hh*.49]].map(reflect),1.6);
     }
     ink+=line([[12,start],[11,474],[15,515],[10,551],[5,578]].map(reflect),3.3);
     continue;
   }
   const shoulderY=38+random()*15,steps=6+Math.floor(random()*3);
   const pts=[[48+random()*9,shoulderY],[25,shoulderY+4],[21,shoulderY+24]];
   const span=(503-shoulderY)/steps;
   for(let k=0;k<steps;k++){
     const yy=shoulderY+30+k*span;
     const inward=25+random()*4,outward=12+random()*6;
     if((k+seed+side)%3===0){
       pts.push([outward,yy],[outward,yy+span*.28],[inward,yy+span*.38],[inward,yy+span*.65]);
     }else{
       pts.push([inward,yy],[outward,yy+span*.48],[inward-3,yy+span*.82]);
     }
   }
   pts.push([22,548],[side?35:15,568],[side?48:6,581]);
   const mirror=p=>side?[300-p[0],p[1]]:p;
   ink+=line(pts.map(mirror),4.2+random()*.6);
 }
 ink+=motif(ornament===2?2:seed+2,78,523,144,53);
let flecks='';for(let i=0;i<1300;i++){let x=random()*300,y=random()*600;flecks+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.15+random()*random()*.9).toFixed(2)}" fill="#4a3214" opacity="${(.03+random()*.08).toFixed(3)}"/>`}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1800" viewBox="0 0 300 600"><defs><filter id="fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".55 .32" numOctaves="3" seed="${seed%97}"/><feColorMatrix values="0 0 0 0 .42 0 0 0 0 .28 0 0 0 0 .1 0 0 0 -1.5 .62"/></filter><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="4" seed="${seed%89+3}"/><feColorMatrix values="0 0 0 0 .55 0 0 0 0 .36 0 0 0 0 .12 0 0 0 1.1 -.5"/></filter><filter id="bleed" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="2" seed="${seed%71}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" result="d"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.9 1.4" result="m"/><feComposite in="d" in2="m" operator="in"/></filter><radialGradient id="age" cx=".5" cy=".46" r=".75"><stop offset=".55" stop-color="#7a4a14" stop-opacity="0"/><stop offset=".92" stop-color="#7a4a14" stop-opacity=".28"/><stop offset="1" stop-color="#4a2a08" stop-opacity=".55"/></radialGradient></defs><rect width="300" height="600" fill="#edcc59"/><rect width="300" height="600" filter="url(#grain)"/>${flecks}<rect width="300" height="600" filter="url(#fiber)"/><g color="#a82b1e" filter="url(#bleed)">${ink}</g><rect width="300" height="600" fill="url(#age)"/></svg>`;return svg}
const versions=[];let versionIndex=-1;
function syncExportButtons(){
 const hasInk=window.bujeokDrawing?.hasInk()||!!window.drawnTalisman;
 const hasText=!!state.wish&&WISH_RE.test(state.wish);
 for(const id of ['download','share-open'])$('#'+id).disabled=!(hasText||hasInk);
}
function syncHistory(){
 syncExportButtons();
 const drawing=window.bujeokDrawing;
 $('#history-back').disabled=!(drawing?.canUndo()||versionIndex>0);
 $('#history-forward').disabled=!(drawing?.canRedo()||versionIndex<versions.length-1);
}
window.syncBujeokHistory=syncHistory;
function remember(){
 const item={wish:state.wish,seed:state.seed,drawn:window.drawnTalisman?structuredClone(window.drawnTalisman):null,svg:$('#paper').innerHTML};
 const old=versions[versionIndex];
 if(old&&old.wish===item.wish&&old.seed===item.seed&&old.drawn?.code===item.drawn?.code)return;
 versions.splice(versionIndex+1);versions.push(item);
 if(versions.length>40)versions.shift();
 versionIndex=versions.length-1;syncHistory();
}
async function travel(delta){
 const drawing=window.bujeokDrawing;
 if(drawing){
   if(delta<0?drawing.canUndo():drawing.canRedo()){delta<0?drawing.undo():drawing.redo();return;}
   await window.finishBujeokDrawing?.();
 }
 const next=versionIndex+delta;if(next<0||next>=versions.length)return;
 versionIndex=next;const item=versions[next];state={wish:item.wish,seed:item.seed};
 window.drawnTalisman=item.drawn?structuredClone(item.drawn):null;
 $('#wish').value=item.wish;$('#count').textContent=[...item.wish].length+' / 12';$('#error').textContent='';
 $('#paper').innerHTML=item.svg;$('#paper').setAttribute('aria-label',item.wish+' 부적');
 for(const id of ['download','share-open','remix'])$('#'+id).disabled=!item.wish&&!item.drawn;
 
 syncHistory();
 if(drawing)await window.startBujeokDrawing?.();
}
$('#history-back').onclick=()=>travel(-1);$('#history-forward').onclick=()=>travel(1);
addEventListener('bujeok:drawn',()=>{remember();const valid=!!state.wish||!!window.drawnTalisman;$('#download').disabled=!valid;$('#share-open').disabled=!valid;});
function emptyPaper(){
 const doc=new DOMParser().parseFromString(talismanSVG('부',7),'image/svg+xml');
 doc.querySelector('g[color]')?.replaceChildren();
 return new XMLSerializer().serializeToString(doc.documentElement);
}
function render(){
 const requested={...state};
 const missing=[...state.wish].some(c=>/[a-zA-Z\u3005-\u30ff\u3400-\u9fff]/u.test(c)&&!window.BUJEOK_GLYPHS?.[c]);
 if(missing){
  $('#download').disabled=true;$('#share-open').disabled=true;
  window.ensureBrushGlyphs(state.wish).then(()=>{if(state.wish===requested.wish&&state.seed===requested.seed){$('#download').disabled=false;$('#share-open').disabled=false;render();}}).catch(()=>{if(state.wish===requested.wish){$('#error').textContent='이 글자는 아직 지원하지 않아요. 다른 글자로 입력해주세요.';}});
  return;
 }
 const svg=state.wish?talismanSVG(state.wish,state.seed):emptyPaper();if(window.bujeokDrawing){window.bujeokDrawing.updateBase(svg,{wish:state.wish,seed:state.seed});syncExportButtons();return;}window.drawnTalisman=null;$('#paper').innerHTML=svg;$('#paper').setAttribute('aria-label',state.wish?state.wish+' 부적':'빈 부적 종이'); remember(); }
function message(s){const toast=$('#toast');toast.textContent=s;clearTimeout(message.timer);if(toast.showPopover){if(toast.hidePopover&&toast.matches(':popover-open'))toast.hidePopover();toast.showPopover()}else{(document.querySelector('dialog[open]')||document.body).append(toast)}toast.classList.add('show');message.timer=setTimeout(()=>{toast.classList.remove('show');if(toast.hidePopover&&toast.matches(':popover-open'))toast.hidePopover()},2400)}
function generate(){const wish=$('#wish').value.trim().normalize('NFC');if(!wish){$('#error').textContent='바라는 문구를 입력해주세요.';$('#wish').focus();return false}if(!WISH_RE.test(wish)){$('#error').textContent='한글, 영어, 일본어, 숫자로 12자까지 적어주세요.';return false}$('#error').textContent='';state.wish=wish;render();return true}
function updateWish(event){
 const input=$('#wish'),wish=input.value.trim().normalize('NFC');
 $('#count').textContent=[...input.value].length+' / 12';
 const composing=event?.isComposing,valid=!!wish&&WISH_RE.test(wish);
 $('#download').disabled=!valid;$('#share-open').disabled=!valid;$('#remix').disabled=!valid;
 $('#error').textContent=!composing&&wish&&!WISH_RE.test(wish)?'한글, 영어, 일본어, 숫자로 12자까지 적어주세요.':'';
 if(valid||!wish){state.wish=wish;render();}
}
$('#wish').addEventListener('input',updateWish);
$('#wish').addEventListener('compositionend',()=>updateWish());
$('#form').addEventListener('submit',e=>{e.preventDefault();updateWish();});
document.querySelectorAll('[data-wish]').forEach(b=>b.onclick=()=>{$('#wish').value=b.dataset.wish;updateWish();});
$('#remix').onclick=()=>{state.seed++;render();};
$('#clear-all').onclick=async()=>{
 const resume=!!window.bujeokDrawing;
 await window.finishBujeokDrawing?.();
 const {blankPaperSVG}=await import('./draw.js?v=19');
 state.wish='';window.drawnTalisman=null;
 $('#wish').value='';$('#count').textContent='0 / 12';$('#error').textContent='';
 $('#paper').innerHTML=blankPaperSVG();$('#paper').setAttribute('aria-label','빈 부적 종이');
 for(const id of ['download','share-open','remix'])$('#'+id).disabled=true;
 
 remember();
 if(resume)await window.startBujeokDrawing?.();
};
$('#download').onclick=async()=>{const b=$('#download');b.disabled=true;let url;try{const snapshot=await window.bujeokDrawing?.snapshot();const svg=snapshot?.svg||$('#paper svg').outerHTML,urlBlob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});url=URL.createObjectURL(urlBlob);const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1800;canvas.getContext('2d').drawImage(img,0,0,900,1800);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('image');const output=URL.createObjectURL(blob),a=document.createElement('a');a.href=output;a.download=`부적소_${state.wish.replace(/\s/g,'')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(output),30000);message('부적 이미지를 저장했어요.')}catch{message('저장에 실패했어요. 다시 시도해주세요.')}finally{if(url)URL.revokeObjectURL(url);b.disabled=false}};
const initialPresets=[...document.querySelectorAll('[data-wish]')].filter(b=>!b.hidden).map(b=>b.dataset.wish);
state.wish=initialPresets[Math.floor(Math.random()*initialPresets.length)];
try{localStorage.removeItem('bujeok')}catch{}
$('#wish').value=state.wish;$('#wish').dispatchEvent(new Event('input'));


// ---- 공유하기: 부적(문구+획 시드)과 연출을 URL 해시에 담습니다. 서버 없이 동작해요. ----
const EFFECTS={exorcism:'염원 붙이기',moneygun:'부적폭격',descent:'행운가득',hearts:'하트하트'};
function b64urlEncode(str){let bin='';new TextEncoder().encode(str).forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function b64urlDecode(s){s=s.replace(/-/g,'+').replace(/_/g,'/');return new TextDecoder().decode(Uint8Array.from(atob(s+'==='.slice((s.length+3)%4)),c=>c.charCodeAt(0)))}
function shareURL(p){const data={v:1,w:p.wish,s:p.seed,e:p.effect};if(p.from)data.n=p.from;if(p.drawn){data.d=p.drawn;if(!p.base){delete data.w;delete data.s}}return location.origin+location.pathname+'#b='+b64urlEncode(JSON.stringify(data))}
function readShare(){const m=location.hash.match(/^#b=([A-Za-z0-9_-]{1,24000})$/);if(!m)return null;try{const d=JSON.parse(b64urlDecode(m[1])),wish=String(d.w||'').normalize('NFC');if(typeof d.d==='string'&&/^[zr][A-Za-z0-9_-]{2,20000}$/.test(d.d))return{...(WISH_RE.test(wish)&&wish.trim()&&Number.isInteger(d.s)&&d.s>0&&d.s<=1e6?{wish,seed:d.s,base:true}:{wish:'직접 쓴 부적',seed:1}),drawn:d.d,effect:d.e in EFFECTS?d.e:'exorcism',from:typeof d.n==='string'?d.n.replace(/[\u0000-\u001f]/g,'').trim().slice(0,10):''};if(!WISH_RE.test(wish)||!wish.trim()||!Number.isInteger(d.s)||d.s<1||d.s>1e6)return null;return{wish,seed:d.s,effect:d.e in EFFECTS?d.e:'exorcism',from:typeof d.n==='string'?d.n.replace(/[\u0000-\u001f]/g,'').trim().slice(0,10):''}}catch{return null}}
function clearShareHash(){if(location.hash)history.replaceState(null,'',location.pathname+location.search)}
async function reveal(p,preview=false){try{await window.ensureBrushGlyphs(p.wish||'');const m=await import('./reveal.js?v=36');m.play({...p,svg:p.drawn?await(await import('./draw.js?v=19')).codeToSVG(p.drawn,p.base?{wish:p.wish,seed:p.seed}:null):talismanSVG(p.wish,p.seed),preview,onClose:preview?restoreShareDialog:clearShareHash})}catch(e){console.error(e);message('연출을 불러오지 못했어요.');if(preview)restoreShareDialog();else clearShareHash()}}
const shareDlg=$('#share');
let shareDrawingSnapshot=null;
function restoreShareDialog(){if(!shareDlg.open)shareDlg.showModal();$('#share-preview').focus()}
function currentShare(){const dr=shareDrawingSnapshot?shareDrawingSnapshot.drawn:window.drawnTalisman;return{wish:dr&&!dr.base?'직접 쓴 부적':state.wish,seed:state.seed,drawn:dr?dr.code:undefined,base:!!(dr&&dr.base),effect:shareDlg.querySelector('input[name=effect]:checked').value}}
$('#share-open').onclick=async()=>{try{shareDrawingSnapshot=await window.bujeokDrawing?.snapshot()||null;shareDlg.showModal()}catch(e){console.error(e);message('공유창을 열지 못했어요. 다시 시도해주세요.')}};
$('#share-close').onclick=()=>shareDlg.close();
shareDlg.addEventListener('click',e=>{if(e.target===shareDlg)shareDlg.close()});
$('#share-preview').onclick=()=>{const p=currentShare();shareDlg.close();reveal(p,true)};
$('#share-send').onclick=async()=>{const p=currentShare(),url=shareURL(p),text=window.bujeokLanguage?.()==='ja'?`${p.from?p.from+'さんから ':''}「${p.wish}」のお守りが届きました。`:window.bujeokLanguage?.()==='en'?`${p.from?p.from+' sent you':'You received'} a talisman: ${p.wish}`:`${p.from?p.from+'님이 ':''}「${p.wish}」 부적을 보냈어요. ${EFFECTS[p.effect]} 연출로 열어보세요!`;
 if(!navigator.share){message('기본 공유를 지원하지 않는 브라우저예요. 링크 복사를 이용해주세요.');return}
 try{await navigator.share({title:window.bujeokLanguage?.()==='ja'?'お守りが届きました':window.bujeokLanguage?.()==='en'?'A talisman for you':'부적이 도착했어요',text,url})}catch(e){if(e.name!=='AbortError')message('공유창을 열지 못했어요. 링크 복사를 이용해주세요.')}};
$('#share-copy').onclick=async()=>{try{await navigator.clipboard.writeText(shareURL(currentShare()));message('링크를 복사했습니다')}catch{message('링크를 복사하지 못했어요. 공유하기를 이용해주세요.')}};
function openIncoming(){const p=readShare();if(p)reveal(p)}
addEventListener('hashchange',openIncoming);openIncoming();

// 키보드가 열린 경우 하단 도구를 보이는 화면에 맞추고, 입력칸을 가리지 않게 합니다.
function fitKeyboard(event){
 const viewport=window.visualViewport;
 const editing=document.activeElement?.matches('input,textarea');
 const inset=viewport&&editing?Math.max(0,innerHeight-viewport.height-viewport.offsetTop):0;
 document.documentElement.style.setProperty('--keyboard-inset',inset+'px');
 if(event?.type!=='scroll'&&viewport&&matchMedia('(max-width:900px)').matches&&document.activeElement?.id==='wish'){
   const rect=document.activeElement.getBoundingClientRect();
   const bottom=viewport.offsetTop+viewport.height-82;
   if(rect.bottom>bottom)window.scrollBy({top:rect.bottom-bottom+12,behavior:'instant'});
 }
}
window.visualViewport?.addEventListener('resize',fitKeyboard);
window.visualViewport?.addEventListener('scroll',fitKeyboard);
addEventListener('focusin',fitKeyboard);addEventListener('focusout',()=>requestAnimationFrame(fitKeyboard));

const mobileEditorTools=matchMedia('(max-width:900px)');
function placeEditorTools(){
 const tools=document.querySelector('.workspace-top');
 const remix=document.querySelector('#remix'),clear=document.querySelector('#clear-all');
 let group=tools.querySelector('.composition-actions');if(!group){group=document.createElement('div');group.className='composition-actions';tools.append(group);group.append(clear);}
 if(mobileEditorTools.matches)group.prepend(remix);else document.querySelector('.remix-row').append(remix);
 if(mobileEditorTools.matches)document.querySelector('.order-tools').prepend(tools);
 else document.querySelector('.order form').append(tools);
}
mobileEditorTools.addEventListener('change',placeEditorTools);placeEditorTools();
