import importlib.util, json, shutil, tempfile, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('vendor','scripts/check-vendor.py')
vendor=importlib.util.module_from_spec(spec);spec.loader.exec_module(vendor)
class Vendor(unittest.TestCase):
    def test_committed_bundle_identity(self):
        manifest=vendor.check()
        self.assertEqual(manifest['bundles']['motion-mini']['dependencies']['motion']['version'],'14.9.0')
        self.assertEqual(manifest['bundles']['embla-carousel']['dependencies']['embla-carousel']['version'],'8.6.0')
        for entry in manifest['bundles'].values():
            self.assertNotIn('react',entry['dependencies'])
        self.assertLess(sum(b['gzip_bytes'] for b in manifest['bundles'].values()),15*1024)
    def test_stale_code_and_lock_fail_closed(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name);target=root/'theme/codela-storefront/assets/vendor'
            shutil.copytree(vendor.ROOT/'theme/codela-storefront/assets/vendor',target)
            for file in ['package.json','package-lock.json']:shutil.copy(vendor.ROOT/file,root/file)
            vendor.check(root)
            original=(target/'motion-mini.js').read_bytes()
            (target/'motion-mini.js').write_bytes(original+b'\n// stale')
            with self.assertRaisesRegex(ValueError,'Stale vendor file'):vendor.check(root)
            (target/'motion-mini.js').write_bytes(original)
            (root/'package-lock.json').write_text('{}')
            with self.assertRaisesRegex(ValueError,'Stale vendor lock'):vendor.check(root)
    def test_notice_is_part_of_distribution(self):
        notice=(vendor.ROOT/'theme/codela-storefront/assets/vendor/THIRD-PARTY-NOTICES.txt').read_text()
        self.assertIn('David Jerleke',notice);self.assertIn('Motion',notice)
        self.assertIn('Permission is hereby granted',notice)
if __name__=='__main__':unittest.main()
