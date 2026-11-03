import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('vendor', 'scripts/check-vendor.py')
vendor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vendor)


class Vendor(unittest.TestCase):
    def copy_research(self, root):
        for scope, source in vendor.PATHS.items():
            shutil.copytree(vendor.ROOT / source, root / source)
        for file in ['package.json', 'package-lock.json']:
            shutil.copy(vendor.ROOT / file, root / file)

    def test_committed_bundle_identity_and_scope(self):
        manifests = vendor.check()
        motion, embla = manifests['motion-research'], manifests['embla-research']
        self.assertEqual(motion['bundles']['motion-mini']['dependencies']['motion']['version'], '14.9.0')
        self.assertEqual(embla['bundles']['embla-carousel']['dependencies']['embla-carousel']['version'], '8.6.0')
        for manifest in manifests.values():
            for entry in manifest['bundles'].values():
                self.assertNotIn('react', entry['dependencies'])
                self.assertNotIn('react-dom', entry['dependencies'])
        self.assertFalse((vendor.ROOT / 'theme/codela-storefront/assets/vendor').exists())

    def test_stale_code_package_lock_and_notices_fail_closed(self):
        for scope, source in vendor.PATHS.items():
            with self.subTest(scope=scope), tempfile.TemporaryDirectory() as name:
                root = Path(name)
                self.copy_research(root)
                target = root / source
                manifest = vendor.check(root, scope)
                bundle = next(iter(manifest['bundles'].values()))['file']
                for file in [bundle, 'THIRD-PARTY-NOTICES.txt']:
                    original = (target / file).read_bytes()
                    (target / file).write_bytes(original + b'\n// stale')
                    with self.assertRaisesRegex(ValueError, 'Stale vendor file'):
                        vendor.check(root, scope)
                    (target / file).write_bytes(original)
                for file in ['package.json', 'package-lock.json']:
                    original = (root / file).read_bytes()
                    (root / file).write_text('{}')
                    with self.assertRaisesRegex(ValueError, 'Stale vendor lock/package'):
                        vendor.check(root, scope)
                    (root / file).write_bytes(original)

    def test_notices_match_separate_research_distributions(self):
        motion = (vendor.ROOT / vendor.PATHS['motion-research'] / 'THIRD-PARTY-NOTICES.txt').read_text()
        embla = (vendor.ROOT / vendor.PATHS['embla-research'] / 'THIRD-PARTY-NOTICES.txt').read_text()
        self.assertIn('David Jerleke', embla)
        self.assertNotIn('Motion', embla)
        self.assertIn('Motion', motion)
        for notice in [motion, embla]:
            self.assertIn('Permission is hereby granted', notice)
            self.assertIn('Research-only fixtures, excluded from the production theme.', notice)

    def test_original_embla_rejection_evidence_is_unchanged(self):
        archive = vendor.ROOT / vendor.PATHS['embla-research'] / 'archive'
        manifest = json.loads((archive / 'manifest.json').read_text())
        self.assertEqual(manifest['scope'], 'runtime', 'Historical scope is evidence, not current runtime approval')
        for entry in [*manifest['bundles'].values(), manifest['notices']]:
            self.assertEqual(vendor.digest(archive / entry['file']), entry['sha256'])
        for file, key in [('package.json', 'package_sha256'), ('package-lock.json', 'lock_sha256')]:
            self.assertEqual(vendor.digest(archive / file), manifest[key])
        self.assertEqual((archive / 'embla-carousel.js').read_bytes(), (archive.parent / 'embla-carousel.js').read_bytes())

    def test_research_runtime_directories_cannot_leak_into_theme(self):
        for path in ['assets/vendor', 'assets/scripts/vendor', 'node_modules']:
            with self.subTest(path=path), tempfile.TemporaryDirectory() as name:
                root = Path(name)
                target = root / 'theme/codela-storefront' / path
                target.mkdir(parents=True)
                with self.assertRaisesRegex(ValueError, 'vendor runtime directory'):
                    vendor.check_theme(root)

    def test_research_configuration_and_imports_cannot_leak_into_theme(self):
        for source in ['window.codelaSfVendors={};', 'import Embla from "embla-carousel";',
                       'import {animate} from "motion/mini";', "wp_register_script_module('x', '/assets/vendor/motion.js');"]:
            with self.subTest(source=source), tempfile.TemporaryDirectory() as name:
                root = Path(name)
                target = root / 'theme/codela-storefront/functions.php'
                target.parent.mkdir(parents=True)
                target.write_text(source)
                with self.assertRaisesRegex(ValueError, 'vendor registration/import'):
                    vendor.check_theme(root)

    def test_production_and_wheel_dependencies_are_rejected(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            self.copy_research(root)
            package = json.loads((root / 'package.json').read_text())
            package['dependencies'] = {'embla-carousel': '8.6.0'}
            (root / 'package.json').write_text(json.dumps(package))
            with self.assertRaisesRegex(ValueError, 'Production dependencies'):
                vendor.check(root)
            shutil.copy(vendor.ROOT / 'package.json', root / 'package.json')
            lock = json.loads((root / 'package-lock.json').read_text())
            lock['packages']['node_modules/wheel-gestures'] = {'version': '1.0.0', 'dev': True}
            (root / 'package-lock.json').write_text(json.dumps(lock))
            with self.assertRaisesRegex(ValueError, 'Wheel dependencies'):
                vendor.check(root)


if __name__ == '__main__':
    unittest.main()
