import importlib.util,tempfile,unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('assets','scripts/build-assets.py')
assets=importlib.util.module_from_spec(spec);spec.loader.exec_module(assets)

class Assets(unittest.TestCase):
    def test_committed_outputs_match_sources(self):
        assets.build(check=True)

    def test_stale_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'styles').mkdir()
            (root/'styles/a.css').write_text(':root{--x:1;}')
            with patch.object(assets,'ROOT',root),patch.object(assets,'BUNDLES',{'styles/base.css':('styles/a.css',)}):
                assets.build();assets.build(check=True)
                (root/'styles/a.css').write_text(':root{--x:2;}')
                with self.assertRaisesRegex(ValueError,'Stale theme assets'):assets.build(check=True)
                assets.build();assets.build(check=True)

    def test_relative_urls_cannot_silently_move(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'a.css').write_text('.x{background:url(icons/test.svg)}')
            with patch.object(assets,'ROOT',root):
                with self.assertRaisesRegex(ValueError,'rebase relative URL'):assets.render('styles/base.css',('a.css',))

if __name__=='__main__':unittest.main()
