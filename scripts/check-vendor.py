"""Verify shipped vendors separately from non-shipped research fixtures."""
import hashlib, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PATHS = {'runtime':'theme/codela-storefront/assets/vendor', 'research':'tests/fixtures/motion-pilot'}
EXPECTED = {'runtime':{'embla-carousel'}, 'research':{'motion-mini'}}
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def check(root=ROOT, scope='runtime'):
    vendor = root / PATHS[scope]
    manifest = json.loads((vendor / 'manifest.json').read_text())
    if manifest['schema'] != 1 or manifest.get('scope') != scope:
        raise ValueError('Unsupported vendor manifest scope')
    for name, expected in [('package-lock.json', 'lock_sha256'), ('package.json', 'package_sha256')]:
        if digest(root / name) != manifest[expected]:
            raise ValueError('Stale vendor lock/package; run npm ci and npm run build:vendor')
    if set(manifest['bundles']) != EXPECTED[scope]:
        raise ValueError('Unexpected vendor bundle set')
    entries = [*manifest['bundles'].values(), manifest['notices']]
    for entry in entries:
        name = entry['file']
        if Path(name).name != name or digest(vendor / name) != entry['sha256']:
            raise ValueError('Stale vendor file: ' + name)
    if scope == 'runtime' and {p.name for p in vendor.iterdir()} != {'manifest.json', *(e['file'] for e in entries)}:
        raise ValueError('Unregistered or research vendor in shipped theme')
    return manifest
if __name__ == '__main__':
    check()
    print('Shipped vendor lock, package, notices, scope and runtime hashes verified.')
