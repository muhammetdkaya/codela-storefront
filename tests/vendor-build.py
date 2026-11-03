import importlib.util, json, shutil, tempfile, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('vendor','scripts/check-vendor.py')
vendor=importlib.util.module_from_spec(spec);spec.loader.exec_module(vendor)
class Vendor(unittest.TestCase):
    def test_committed_bundle_identity_and_scope(self):
        runtime=vendor.check();research=vendor.check(scope='research')
        self.assertEqual(set(runtime['bundles']),{'embla-carousel'})
        self.assertEqual(research['bundles']['motion-mini']['dependencies']['motion']['version'],'14.9.0')
        self.assertEqual(runtime['bundles']['embla-carousel']['dependencies']['embla-carousel']['version'],'8.6.0')
        for manifest in [runtime,research]:
            for entry in manifest['bundles'].values():self.assertNotIn('react',entry['dependencies'])
        self.assertLess(sum(b['gzip_bytes'] for b in runtime['bundles'].values()),15000)
    def test_stale_code_and_lock_fail_closed(self):
        for scope in vendor.PATHS:
            with self.subTest(scope=scope),tempfile.TemporaryDirectory() as name:
                root=Path(name);target=root/vendor.PATHS[scope]
                shutil.copytree(vendor.ROOT/vendor.PATHS[scope],target)
                for file in ['package.json','package-lock.json']:shutil.copy(vendor.ROOT/file,root/file)
                manifest=vendor.check(root,scope);file=next(iter(manifest['bundles'].values()))['file'];original=(target/file).read_bytes()
                (target/file).write_bytes(original+b'\n// stale')
                with self.assertRaisesRegex(ValueError,'Stale vendor file'):vendor.check(root,scope)
                (target/file).write_bytes(original);(root/'package-lock.json').write_text('{}')
                with self.assertRaisesRegex(ValueError,'Stale vendor lock'):vendor.check(root,scope)
    def test_notices_match_distribution(self):
        runtime=(vendor.ROOT/vendor.PATHS['runtime']/'THIRD-PARTY-NOTICES.txt').read_text()
        research=(vendor.ROOT/vendor.PATHS['research']/'THIRD-PARTY-NOTICES.txt').read_text()
        self.assertIn('David Jerleke',runtime);self.assertNotIn('Motion',runtime);self.assertIn('Motion',research)
        for notice in [runtime,research]:self.assertIn('Permission is hereby granted',notice)
    def test_research_bundle_cannot_leak_into_theme(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name);target=root/vendor.PATHS['runtime'];shutil.copytree(vendor.ROOT/vendor.PATHS['runtime'],target)
            for file in ['package.json','package-lock.json']:shutil.copy(vendor.ROOT/file,root/file)
            (target/'motion-mini.js').write_text('research only')
            with self.assertRaisesRegex(ValueError,'research vendor'):vendor.check(root)
if __name__=='__main__':unittest.main()
