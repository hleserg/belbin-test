from fontTools.ttLib import TTFont
from fontTools import subset
import io,json,base64
from pathlib import Path
font=TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
options=subset.Options();options.recalc_timestamp=False
sub=subset.Subsetter(options=options)
sub.populate(unicodes=list(range(0x530))+list(range(0x2000,0x2200))+list(range(0x1f300,0x1fb00)))
sub.subset(font)
stream=io.BytesIO();font.save(stream)
cmap=font.getBestCmap();units=font['head'].unitsPerEm
result={'base64':base64.b64encode(stream.getvalue()).decode(),'chars':{str(cp):[font.getGlyphID(g),round(font['hmtx'][g][0]*1000/units)] for cp,g in cmap.items()}}
Path('src/pdf-font.json').write_text(json.dumps(result,separators=(',',':')))

