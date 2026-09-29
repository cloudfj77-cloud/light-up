import base64
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path('/Users/zhixuanchen/Library/Containers/com.tencent.WeWorkMac/Data/Documents/Profiles/4B43F1C0C2F7C366865AEFF620B42C3C/Caches/Files/2026-09/5fa53dfe1c45f8c38edb6ccdcdf554c4/光庭.html')
text=SOURCE.read_text()
tag='<script type="module">'
start=text.index(tag)
script=text[start+len(tag):text.rindex('</script>')]
(ROOT/'assets').mkdir(exist_ok=True)
manifest=[]
def unpack(match):
    mime=match[2];ext={'application/json':'json','model/gltf-binary':'glb','image/jpeg':'jpg','image/png':'png'}.get(mime,'fbx')
    name=f'assets/source-{len(manifest):02}.{ext}'
    raw=base64.b64decode(match[1],validate=True);(ROOT/name).write_bytes(raw)
    manifest.append({'path':name,'mime':mime,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    return json.dumps('./'+name)
script,count=re.subn(r'\(await __u\("([A-Za-z0-9+/=]+)","([^"]+)"\)\)',unpack,script)
assert count==12, count
marker='// public/court/main.js'
engine,main=script.split(marker,1)
(ROOT/'engine.js').write_text(engine)
(ROOT/'main.js').write_text(marker+main)
(ROOT/'shell.html').write_text(text[:start]+'<!-- GAME_SCRIPT -->'+text[text.rindex('</script>')+len('</script>'):])
(ROOT/'source-manifest.json').write_text(json.dumps({'source':str(SOURCE),'sha256':hashlib.sha256(text.encode()).hexdigest(),'assets':manifest},indent=2,ensure_ascii=False))
print(f'Unpacked {count} assets; source preserved; main {len(main)} characters')
