"""Offline contracts: GitHub release publication and update-feed advancement are separate."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import textwrap
import unittest

WORKFLOW = Path('.github/workflows/release.yml').read_text()
REQUEST = textwrap.dedent(re.search(r"python3 - <<'PY'\n(.*?)\n          PY", WORKFLOW, re.S).group(1))

class ReleaseWorkflowTests(unittest.TestCase):
    def parse(self, changes):
        request = {'confirm': 'PUBLISH_STABLE', 'source_sha': 'a' * 40, 'version': '0.1.196'}
        request.update(changes)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / '.releases').mkdir()
            (root / '.releases/storefront.json').write_text(json.dumps(request))
            output = root / 'output'
            result = subprocess.run([sys.executable, '-c', REQUEST], cwd=tmp,
                                    env={**os.environ, 'GITHUB_OUTPUT': str(output)}, capture_output=True)
            return result.returncode, output.read_text() if output.exists() else ''

    def test_legacy_stable_request_remains_explicit_true(self):
        code, output = self.parse({})
        self.assertEqual(code, 0)
        self.assertIn('publish_feed=true\n', output)

    def test_download_only_request_does_not_offer_live_update(self):
        code, output = self.parse({'publish_feed': False})
        self.assertEqual(code, 0)
        self.assertIn('publish_feed=false\n', output)
        self.assertIn('source=' + 'a' * 40 + '\n', output)
        self.assertIn('version=0.1.196\n', output)

    def test_explicit_stable_request(self):
        code, output = self.parse({'publish_feed': True})
        self.assertEqual(code, 0)
        self.assertIn('publish_feed=true\n', output)

    def test_non_boolean_feed_flags_fail_closed(self):
        for value in ['false', 'true', 0, 1, None, {}, []]:
            with self.subTest(value=value):
                code, output = self.parse({'publish_feed': value})
                self.assertNotEqual(code, 0)
                self.assertEqual(output, '')

    def test_invalid_source_version_confirmation_fail_closed(self):
        for changes in [{'source_sha': 'main'}, {'version': '0.1.196\nextra'}, {'confirm': 'yes'}]:
            code, output = self.parse(changes)
            self.assertNotEqual(code, 0)
            self.assertEqual(output, '')

    def test_only_separately_guarded_step_can_advance_feed(self):
        publish, feed = WORKFLOW.split('      - name: Advance stable update feed only when requested\n')
        self.assertIn("        if: steps.request.outputs.publish_feed == 'true'\n", feed)
        self.assertIn('gh release create', publish)
        self.assertNotIn('git push', publish)
        self.assertNotIn('cp "$GITHUB_WORKSPACE/dist/manifest.json"', publish)
        self.assertIn('git push origin HEAD:stable', feed)
        self.assertNotIn('scripts/deploy.py', WORKFLOW)
        self.assertNotIn('FTP_PASSWORD', WORKFLOW)
        self.assertIn("paths: ['.releases/storefront.json']", WORKFLOW)
        self.assertIn("contents: write", WORKFLOW)
        self.assertEqual(WORKFLOW.count('git push'), 1)

if __name__ == '__main__':
    unittest.main()
