"""Verify committed local vendor outputs without requiring Node on WordPress."""
import hashlib, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def check(root=ROOT):
    vendor = root / 'theme/codela-storefront/assets/vendor'
    manifest = json.loads((vendor / 'manifest.json').read_text())
    if manifest['schema'] != 1:
        raise ValueError('Unsupported vendor manifest')
    for name, expected in [('package-lock.json', 'lock_sha256'), ('package.json', 'package_sha256')]:
        if digest(root / name) != manifest[expected]:
            raise ValueError('Stale vendor lock/package; run npm ci and npm run build:vendor')
    if set(manifest['bundles']) != {'motion-mini', 'embla-carousel'}:
        raise ValueError('Unexpected vendor bundle set')
    for entry in [*manifest['bundles'].values(), manifest['notices']]:
        name = entry['file']
        if Path(name).name != name or digest(vendor / name) != entry['sha256']:
            raise ValueError('Stale vendor file: ' + name)
    return manifest
if __name__ == '__main__':
    manifest=check()
    print('Vendor lock, package, notices and runtime hashes verified.')
