"""Verify research fixtures and reject third-party runtimes in the shipped theme."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATHS = {
    'motion-research': 'tests/fixtures/motion-pilot',
    'embla-research': 'tests/fixtures/embla-pilot',
}
EXPECTED = {'motion-research': {'motion-mini'}, 'embla-research': {'embla-carousel'}}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_theme(root=ROOT):
    theme = root / 'theme/codela-storefront'
    for path in theme.rglob('*'):
        if path.is_dir() and path.name in {'vendor', 'node_modules'}:
            raise ValueError('Research vendor runtime directory in shipped theme: ' + str(path.relative_to(root)))
        if path.is_file() and path.suffix in {'.php', '.js', '.json', '.html', '.css'}:
            source = path.read_text()
            if re.search(r'''codelaSfVendors|embla-carousel|motion/mini|["'`/]vendor/''', source):
                raise ValueError('Research vendor registration/import in shipped theme: ' + str(path.relative_to(root)))


def check_scope(root, scope):
    vendor = root / PATHS[scope]
    manifest = json.loads((vendor / 'manifest.json').read_text())
    if manifest['schema'] != 1 or manifest.get('scope') != scope:
        raise ValueError('Unsupported vendor manifest scope')
    for name, expected in [('package-lock.json', 'lock_sha256'), ('package.json', 'package_sha256')]:
        if digest(root / name) != manifest[expected]:
            raise ValueError('Stale vendor lock/package; run npm ci and npm run build:vendor')
    if set(manifest['bundles']) != EXPECTED[scope]:
        raise ValueError('Unexpected vendor bundle set')
    for entry in [*manifest['bundles'].values(), manifest['notices']]:
        name = entry['file']
        if Path(name).name != name or digest(vendor / name) != entry['sha256']:
            raise ValueError('Stale vendor file: ' + name)
    return manifest


def check(root=ROOT, scope=None):
    if scope is not None:
        return check_scope(root, scope)
    check_theme(root)
    package = json.loads((root / 'package.json').read_text())
    lock = json.loads((root / 'package-lock.json').read_text())
    if package.get('dependencies') or lock['packages'][''].get('dependencies'):
        raise ValueError('Production dependencies must stay empty; libraries are research only')
    if (package['devDependencies'].get('embla-carousel') != '8.6.0'
            or lock['packages']['']['devDependencies'].get('embla-carousel') != '8.6.0'
            or not lock['packages']['node_modules/embla-carousel'].get('dev')):
        raise ValueError('Embla must remain pinned to 8.6.0 as a development-only dependency')
    if any('wheel' in name.lower() for name in lock['packages']):
        raise ValueError('Wheel dependencies are outside the retained research scope')
    return {name: check_scope(root, name) for name in PATHS}


if __name__ == '__main__':
    check()
    print('Vendor-free production graph and separate Motion/Embla research hashes verified.')
