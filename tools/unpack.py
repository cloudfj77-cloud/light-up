import argparse
import base64
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description="One-time extraction into this checkout. Overwrites engine.js, main.js, shell.html and assets.")
parser.add_argument('source', type=Path, help='Original standalone 光庭.html')
parser.add_argument('--force', action='store_true', help='Explicitly allow overwriting the current game sources')
args = parser.parse_args()
if not args.force:
    parser.error('Extraction overwrites existing game sources; use --force only in a disposable copy.')
SOURCE = args.source
text=SOURCE.read_text(encoding='utf-8')
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
(ROOT/'source-manifest.json').write_text(json.dumps({'source':SOURCE.name,'sha256':hashlib.sha256(text.encode()).hexdigest(),'assets':manifest},indent=2,ensure_ascii=False))
print(f'Unpacked {count} assets; source preserved; main {len(main)} characters')
