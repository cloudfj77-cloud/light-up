import base64
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
script='\n'.join((ROOT/name).read_text() for name in ['mechanism.js','orbits.js','engine.js','chapter-four.js','chapter-five.js','verify-fourth.js','verify-fifth.js','main.js'])
(ROOT/'app.js').write_text(script)
shell=(ROOT/'shell.html').read_text()
version=hashlib.sha256(script.encode()).hexdigest()[:12]
(ROOT/'index.html').write_text(shell.replace('<!-- GAME_SCRIPT -->',f'<script type="module" src="./app.js?v={version}"></script>'))
manifest=json.loads((ROOT/'source-manifest.json').read_text())
for asset in manifest['assets']:
    needle=json.dumps('./'+asset['path']);assert needle in script,needle
    encoded=base64.b64encode((ROOT/asset['path']).read_bytes()).decode()
    script=script.replace(needle,'(await __u('+json.dumps(encoded)+','+json.dumps(asset['mime'])+'))')
standalone=shell.replace('<!-- GAME_SCRIPT -->','<script type="module">\n'+script.replace('</script','<\\/script')+'\n</script>')
(ROOT/'光庭_五关完整版.html').write_text(standalone)
print('Built local app and standalone HTML:',len(standalone.encode()),'bytes')
