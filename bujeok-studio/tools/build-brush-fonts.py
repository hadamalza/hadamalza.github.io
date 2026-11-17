"""Generate self-contained SVG glyph outlines. Requires fonttools."""
from pathlib import Path
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.roundingPen import RoundingPen
root=Path(__file__).resolve().parent.parent
result={}
for filename,accept in [('YujiBoku-Regular.ttf',lambda n:0x3040<=n<=0x30ff or 0x3400<=n<=0x9fff or n in (0x3005,0x3006,0x3007,0x303b)),('PermanentMarker-Regular.ttf',lambda n:65<=n<=90 or 97<=n<=122)]:
 font=TTFont(root/'tools/font-sources'/filename);glyphs=font.getGlyphSet()
 for cp,name in font.getBestCmap().items():
  if not accept(cp):continue
  glyph=glyphs[name];bounds=BoundsPen(glyphs);glyph.draw(bounds)
  if not bounds.bounds:continue
  pen=SVGPathPen(glyphs,ntos=lambda v:format(v,".1f").rstrip("0").rstrip(".") if v%1 else str(int(v)));glyph.draw(RoundingPen(pen,roundFunc=lambda v:round(v,1)))
  result[chr(cp)]=[pen.getCommands(),*[round(v,2) for v in bounds.bounds]]
out=root/'vendor/brush-fonts'
core={c:g for c,g in result.items() if ord(c)<0x3400}
(out/'core.js').write_text('/* Yuji Boku (OFL), Permanent Marker (Apache-2.0). */\nwindow.BUJEOK_GLYPHS='+json.dumps(core,ensure_ascii=False,separators=(',',':'))+';\n')
chunks={}
for c,g in result.items():
 if ord(c)>=0x3400:chunks.setdefault(str(ord(c)//256),{})[c]=g
for key,data in chunks.items():(out/(key+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
(out/'glyphs.js').unlink(missing_ok=True)
print(f'{len(result)} glyphs in {len(chunks)} on-demand chunks; core {len(core)} glyphs')
