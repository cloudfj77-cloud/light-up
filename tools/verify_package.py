import base64
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'source-manifest.json').read_text())
original=Path(manifest['source']).read_bytes()
assert hashlib.sha256(original).hexdigest()==manifest['sha256'],'Source was modified'
class Scripts(HTMLParser):
    def __init__(self):super().__init__();self.active=False;self.scripts=[]
    def handle_starttag(self,tag,attrs):
        if tag=='script':
            assert not dict(attrs).get('src'),'Standalone has external script'
            self.active=True;self.scripts.append('')
    def handle_data(self,data):
        if self.active:self.scripts[-1]+=data
    def handle_endtag(self,tag):
        if tag=='script':self.active=False
parser=Scripts();parser.feed((ROOT/'光庭_五关完整版.html').read_text());assert len(parser.scripts)==1
script=parser.scripts[0]
embedded=re.findall(r'\(await __u\("([A-Za-z0-9+/=]+)",\s*"([^"]+)"\)\)',script)
assert len(embedded)==len(manifest['assets'])==12
for (encoded,mime),record in zip(embedded,manifest['assets']):
    assert mime==record['mime']
    assert hashlib.sha256(base64.b64decode(encoded)).hexdigest()==record['sha256']
    assert json.dumps('./'+record['path']) not in script
old=original.decode();engine=(ROOT/'engine.js').read_text()
# 第二章、第三章的机关已按玩家要求改成与后几关一致的矮烛台 + 目标色晶石，
# 因此不再与原始文件逐字节相同，只保留装饰模块不变，并确认它们仍使用统一构件。
for begin,end in [('// public/court/stylized-dressing.js?v=4','// public/court/gothic-scene.js?v=fusion4')]:
    source=old.split(begin,1)[1].split(end,1)[0].strip()
    destination=engine.split(begin,1)[1].split(end,1)[0].strip() if end in engine else engine.split(begin,1)[1].strip()
    assert source==destination,'Existing module changed: '+begin
assert 'buildMechanism(' in engine.split('// public/court/chapter-two.js?v=relay3',1)[1].split('// public/court/chapter-three.js?v=2',1)[0],'Second chapter lost the shared mechanism prop'
assert 'createChapterTwo(' in engine.split('// public/court/chapter-three.js?v=2',1)[1].split('// public/court/main.js',1)[0],'Third chapter lost its relay delegation'
(ROOT/'checked-standalone.mjs').write_text(script)
print('Original unchanged; 12 embedded assets byte-identical; dressing module preserved; chapters use the unified mechanism; single-file script extracted for syntax check.')
