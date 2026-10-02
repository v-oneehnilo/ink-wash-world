"""Build local OFL font subsets for the UI. Requires fonttools and brotli.
Usage: python scripts/build-fonts.py FONT_DIRECTORY [FONTTOOLS_DIRECTORY]
The source directory must contain NotoSansSC-VF.ttf and NotoSerifSC-VF.ttf.
"""
from pathlib import Path
import sys
if len(sys.argv) > 2:
    sys.path.insert(0, sys.argv[2])
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
root = Path(__file__).resolve().parent.parent
corpus = ''.join((root / path).read_text(encoding='utf-8-sig') for path in ['dist/index.html','dist/app.js'])
corpus += ''.join(chr(code) for code in range(32,127))
for source, output, family, weight, text in [
    ('NotoSansSC-VF.ttf','ink-ui.woff2','Ink UI',(400,650),corpus),
    ('NotoSerifSC-VF.ttf','ink-display.woff2','Ink Display',500,'山水无限自在'),
]:
    font = TTFont(Path(sys.argv[1]) / source)
    options = subset.Options()
    options.name_IDs = [0,1,2,3,4,5,6,13,14,16,17]
    options.name_languages = ['*']
    options.notdef_glyph = True
    sub = subset.Subsetter(options=options)
    sub.populate(text=text)
    sub.subset(font)
    font = instantiateVariableFont(font, {'wght':weight}, inplace=True)
    for record in font['name'].names:
        if record.nameID in [1,4,16]:
            record.string = family.encode(record.getEncoding())
        elif record.nameID == 6:
            record.string = family.replace(' ','').encode(record.getEncoding())
    font.flavor = 'woff2'
    target=root/'dist/fonts'/output
    font.save(target)
    print(f'{output}: {target.stat().st_size:,} bytes')
