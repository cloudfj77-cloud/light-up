"""Copy the immutable web delivery into Tuanjie, normalizing empty GLB scenes.

Run intentionally when changing the delivery baseline. Existing .meta files remain intact.
"""
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def normalize_glb(data):
    magic, version, length = struct.unpack_from('<4sII', data)
    if magic != b'glTF' or version != 2 or length != len(data):
        raise ValueError('Expected a valid GLB 2.0 container')
    size, kind = struct.unpack_from('<II', data, 12)
    if kind != 0x4E4F534A:
        raise ValueError('GLB first chunk is not JSON')
    model = json.loads(data[20:20 + size])
    scenes = model.get('scenes', [])
    keep = [i for i, scene in enumerate(scenes) if scene.get('nodes')]
    if len(keep) == len(scenes):
        return data, []
    if 'scene' in model and model['scene'] not in keep:
        raise ValueError('The default scene is empty; manual review is required')
    if not keep:
        raise ValueError('No nonempty scene available')
    model['scenes'] = [scenes[i] for i in keep]
    if 'scene' in model:
        model['scene'] = keep.index(model['scene'])
    chunk = json.dumps(model, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    chunk += b' ' * (-len(chunk) % 4)
    remaining = data[20 + size:]
    output = struct.pack('<4sII', b'glTF', 2, 20 + len(chunk) + len(remaining))
    output += struct.pack('<II', len(chunk), kind) + chunk + remaining
    removed = [i for i in range(len(scenes)) if i not in keep]
    return output, ['Removed empty scene indices: ' + ', '.join(map(str, removed))]


def expected_assets():
    manifest = json.loads((ROOT / 'WebPrototype/source-manifest.json').read_text(encoding='utf-8'))
    for item in manifest['assets']:
        source = ROOT / 'WebPrototype' / item['path']
        raw = source.read_bytes()
        if hashlib.sha256(raw).hexdigest() != item['sha256']:
            raise ValueError('Web delivery differs from manifest: ' + item['path'])
        content, changes = normalize_glb(raw) if source.suffix == '.glb' else (raw, [])
        yield source.name, content, {
            'source': 'WebPrototype/' + item['path'],
            'target': 'Assets/_LightUp/Art/Delivery/' + source.name,
            'source_sha256': item['sha256'],
            'import_sha256': hashlib.sha256(content).hexdigest(),
            'adjustments': changes,
        }


if __name__ == '__main__':
    records = []
    for name, content, record in expected_assets():
        target = ROOT / record['target']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        records.append(record)
    (ROOT / 'docs/delivery-import-manifest.json').write_text(
        json.dumps(records, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('Imported 12 assets; original GLBs remain unchanged in WebPrototype/assets.')
