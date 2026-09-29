"""Portable repository checks; editor compilation/import is validated separately."""
import hashlib
import json
import re
from pathlib import Path
from import_delivery import ROOT, expected_assets


def require(condition, message):
    if not condition:
        raise SystemExit('FAIL: ' + message)


for name in ['Assets', 'Packages', 'ProjectSettings', 'WebPrototype']:
    require((ROOT / name).is_dir(), 'Missing project directory: ' + name)
version = (ROOT / 'ProjectSettings/ProjectVersion.txt').read_text()
require('m_EditorVersion: 2022.3.61t5' in version, 'Unexpected Tuanjie editor version')
require('m_TuanjieEditorVersion: 1.6.4' in version, 'Unexpected Tuanjie product version')
settings = (ROOT / 'ProjectSettings/ProjectSettings.asset').read_text()
require('productName: Light Up' in settings, 'Product name must be Light Up')
editor = (ROOT / 'ProjectSettings/EditorSettings.asset').read_text()
require('m_SerializationMode: 2' in editor, 'Force Text must remain enabled')
vcs = (ROOT / 'ProjectSettings/VersionControlSettings.asset').read_text()
require('Visible Meta Files' in vcs, 'Visible Meta Files must remain enabled')
manifest = json.loads((ROOT / 'Packages/manifest.json').read_text())['dependencies']
lock = json.loads((ROOT / 'Packages/packages-lock.json').read_text())['dependencies']
require(manifest['com.unity.cloud.gltfast'] == '6.10.1', 'Review glTFast upgrades explicitly')
for name, version in manifest.items():
    require(name in lock and lock[name]['version'] == version, 'Dependency lock mismatch: ' + name)

guids = {}
for path in (ROOT / 'Assets').rglob('*'):
    if path.name.startswith('.'):
        continue
    if path.suffix == '.meta':
        require(path.with_suffix('').exists(), 'Orphan meta: ' + str(path.relative_to(ROOT)))
        match = re.search(r'^guid:\s*(\S+)', path.read_text(), re.MULTILINE)
        require(match is not None, 'Missing GUID: ' + str(path))
        # Tuanjie may serialize opaque/encrypted GUIDs rather than 32 hex characters.
        guid = match.group(1)
        require(guid not in guids, 'Duplicate GUID: ' + str(path))
        guids[guid] = path
    else:
        require(Path(str(path) + '.meta').is_file(), 'Missing meta: ' + str(path.relative_to(ROOT)))

records = []
for name, expected, record in expected_assets():
    target = ROOT / record['target']
    require(target.is_file(), 'Missing imported asset: ' + name)
    require(hashlib.sha256(target.read_bytes()).hexdigest() == record['import_sha256'],
            'Imported delivery asset differs: ' + name)
    records.append(record)
require(json.loads((ROOT / 'docs/delivery-import-manifest.json').read_text()) == records,
        'Delivery import provenance manifest is stale')
for name in ['level_04_spec.json', 'level_05_spec.json']:
    require((ROOT / 'Assets/_LightUp/Design' / name).read_bytes() == (ROOT / 'WebPrototype' / name).read_bytes(),
            'Delivery design reference differs: ' + name)
scene = ROOT / 'Assets/_LightUp/Scenes/DeliveryAssetReview.unity'
require(scene.is_file(), 'Missing asset review scene')
require('Assets/_LightUp/Scenes/DeliveryAssetReview.unity' in
        (ROOT / 'ProjectSettings/EditorBuildSettings.asset').read_text(), 'Review scene is not in build settings')
print(f'PASS: Tuanjie 1.6.4 project, pinned dependencies, {len(guids)} unique meta files, 12 imported assets and design references.')
print('Scope: repository structure and import provenance; does not execute or validate C# gameplay.')
