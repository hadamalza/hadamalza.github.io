// Glyph outlines are local assets: rendering and PNG export need no installed font.
const brushChunks=new Map();
window.ensureBrushGlyphs=async function(wish){
 const missing=[...wish].filter(c=>/[\u3400-\u9fff]/u.test(c)&&!window.BUJEOK_GLYPHS[c]);
 await Promise.all([...new Set(missing.map(c=>Math.floor(c.codePointAt(0)/256)))].map(key=>{
  if(!brushChunks.has(key))brushChunks.set(key,fetch(`./vendor/brush-fonts/${key}.json`).then(r=>{if(!r.ok)throw Error('font');return r.json();}).then(data=>Object.assign(window.BUJEOK_GLYPHS,data)).catch(error=>{brushChunks.delete(key);throw error;}));
  return brushChunks.get(key);
 }));
 const unsupported=[...wish].find(c=>/[a-zA-Z\u3005-\u30ff\u3400-\u9fff]/u.test(c)&&!window.BUJEOK_GLYPHS[c]);
 if(unsupported)throw Error(`지원하지 않는 글자: ${unsupported}`);
};
function outlineGlyph(c,x,y,w,h,orient=true){
 if(c==='ー'&&orient)return `<g transform="rotate(90 ${x+w/2} ${y+h/2})">${outlineGlyph(c,x+(w-h)/2,y+(h-w)/2,h,w,false)}</g>`;
 const g=window.BUJEOK_GLYPHS?.[c];if(!g)return '';
 const [d,x0,y0,x1,y1]=g,bw=x1-x0,bh=y1-y0;
 const scale=Math.min(w*.94/bw,h*.94/bh);
 const japanese=c!=='ー'&&/[\u3005-\u30ff\u3400-\u9fff]/u.test(c);
 const sx=Math.min(w*.94/bw,scale*1.22),sy=japanese?h*.98/bh:Math.min(h*.94/bh,scale*1.35);
 const tx=x+(w-bw*sx)/2-x0*sx,ty=y+(h-bh*sy)/2+y1*sy;
 return `<path d="${d}" transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${sx.toFixed(5)} ${(-sy).toFixed(5)})" fill="currentColor"/>`;
}
