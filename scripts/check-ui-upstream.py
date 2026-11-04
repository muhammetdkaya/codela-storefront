"""Verify pinned UI provenance and a conservative cumulative storefront budget."""
import gzip
import hashlib
import json
import runpy
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = 'theme/codela-storefront/'

def check():
    manifest = json.loads((ROOT / 'scripts/ui-upstream-manifest.json').read_text())
    notices = (ROOT / THEME / 'THIRD-PARTY-NOTICES.txt').read_text()
    for entry in manifest['sources']:
        source = (ROOT / entry['local_source']).read_bytes()
        assert hashlib.sha256(source).hexdigest() == entry['original_sha256'], entry['local_source']
        for target in entry['targets']:
            assert (ROOT / target).is_file(), target
            if target.endswith('.svg'):
                assert (ROOT / target).read_bytes() == source, 'Changed upstream SVG: ' + target
        if entry['source_path'] == 'LICENSE':
            assert source.decode().strip() in notices, 'Missing full license'
        assert entry['commit'] in notices, 'Missing source revision'
    bundles = runpy.run_path(str(ROOT / 'scripts/build-assets.py'))['BUNDLES']
    bundled_sources = {THEME + 'assets/' + p for inputs in bundles.values() for p in inputs}
    # A conservative union of packaged storefront CSS/JS/SVG across all routes.
    # Bundles replace their source files; admin-only assets are excluded.
    def included(p):
        return p.startswith(THEME + 'assets/') and Path(p).suffix in {'.css', '.js', '.svg'} and p not in bundled_sources and 'admin' not in p
    baseline = manifest['baseline']
    old_paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', baseline], cwd=ROOT, text=True).splitlines()
    old = {p: subprocess.check_output(['git', 'show', baseline + ':' + p], cwd=ROOT) for p in old_paths if included(p)}
    new = {p.relative_to(ROOT).as_posix(): p.read_bytes() for p in (ROOT / THEME / 'assets').rglob('*') if p.is_file() and included(p.relative_to(ROOT).as_posix())}
    size = lambda files: sum(len(gzip.compress(data, compresslevel=9, mtime=0)) for data in files.values())
    # The navigation bootstrap embeds one back arrow as well as loading the SVG.
    inline = THEME + 'assets/icons/arrow-left.svg'
    delta = size(new) - size(old) + len(gzip.compress(new[inline], mtime=0)) - len(gzip.compress(old[inline], mtime=0))
    result = {'baseline': baseline, 'method': 'All storefront routes union; per-file gzip9, bundled sources excluded; inline back arrow counted separately. Not live transfer or performance.', 'baseline_bytes': size(old), 'candidate_bytes': size(new), 'delta_including_inline_bytes': delta, 'budget_bytes': 15000, 'source_files_verified': len(manifest['sources'])}
    assert delta <= result['budget_bytes'], result
    assert not (ROOT / THEME / 'assets/vendor').exists()
    out = ROOT / 'qa/framework7'; out.mkdir(parents=True, exist_ok=True)
    (out / 'budget.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))

if __name__ == '__main__':
    check()
