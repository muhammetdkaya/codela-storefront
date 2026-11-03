"""Review-bundle safety tests. No network, WordPress, FTP or release mutation."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import stat
import tarfile
import tempfile
import unittest
import warnings
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('review_package', 'tools/build-review-candidate.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
SHA = 'f' * 40


def theme_zip(extra=None, version='0.1.195'):
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as archive:
        archive.writestr('codela-storefront/style.css', 'Theme Name: Codela Storefront\nVersion: ' + version + '\n')
        archive.writestr('codela-storefront/functions.php', '<?php // fixture')
        archive.writestr('codela-storefront/templates/index.html', '<!-- fixture -->')
        for name, data in extra or []:
            archive.writestr(name, data)
    return output.getvalue()


def source_tar(member='scripts/build-package.py'):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode='w') as archive:
        entry = tarfile.TarInfo(member)
        data = b'# Fixture builder is supplied by a subprocess mock.\n'
        entry.size = len(data)
        archive.addfile(entry, io.BytesIO(data))
    return output.getvalue()


class ReviewPackage(unittest.TestCase):
    def test_valid_theme_identity_and_internal_version(self):
        self.assertEqual(review.inspect_zip(theme_zip()), {'internal_theme_version': '0.1.195', 'file_count': 3})

    def test_rejects_path_escape_and_foreign_root(self):
        for path in ['../outside', '/absolute', 'different-theme/file', 'codela-storefront/../../outside']:
            with self.subTest(path=path), self.assertRaisesRegex(ValueError, 'Unexpected ZIP path'):
                review.inspect_zip(theme_zip([(path, 'bad')]))

    def test_rejects_duplicate_member(self):
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            data = theme_zip([('codela-storefront/functions.php', 'duplicate')])
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            review.inspect_zip(data)

    def test_rejects_symlink_member(self):
        output = io.BytesIO(theme_zip())
        with zipfile.ZipFile(output, 'a') as archive:
            entry = zipfile.ZipInfo('codela-storefront/link')
            entry.create_system = 3
            entry.external_attr = (stat.S_IFLNK | 0o777) << 16
            archive.writestr(entry, '/tmp/target')
        with self.assertRaisesRegex(ValueError, 'symlinks'):
            review.inspect_zip(output.getvalue())

    def test_rejects_missing_theme_files(self):
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w') as archive:
            archive.writestr('codela-storefront/style.css', 'Theme Name: Other\nVersion: 0.1.195\n')
        with self.assertRaisesRegex(ValueError, 'Incomplete'):
            review.inspect_zip(output.getvalue())

    def test_rejects_wrong_rollback_hash(self):
        with self.assertRaisesRegex(ValueError, 'verified, unchanged'):
            review.rollback_info(theme_zip())

    def test_rollback_requires_exact_bytes_and_version(self):
        data = theme_zip()
        with patch.object(review, 'BASELINE_BYTES', len(data)), patch.object(review, 'BASELINE_SHA256', hashlib.sha256(data).hexdigest()):
            self.assertEqual(review.rollback_info(data)['internal_theme_version'], '0.1.195')
            with self.assertRaises(ValueError):
                review.rollback_info(data + b'changed')

    def test_requires_immutable_full_sha_before_work(self):
        with patch.object(review.subprocess, 'check_output') as git:
            for source in ['main', 'f7e4b10', '../main', 'g' * 40]:
                with self.assertRaisesRegex(ValueError, '40-character'):
                    review.build_review(source, 'missing.zip', 'unused')
            git.assert_not_called()

    def test_safe_write_does_not_overwrite_different_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'review.zip'
            review.safe_write(target, b'one')
            review.safe_write(target, b'one')
            with self.assertRaisesRegex(ValueError, 'Refusing to overwrite'):
                review.safe_write(target, b'two')
            self.assertEqual(target.read_bytes(), b'one')

    def test_candidate_metadata_never_uses_stable_manifest(self):
        rollback, candidate = theme_zip(), theme_zip([('codela-storefront/assets/review.js', 'fixture')])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old = root / 'rollback.zip'
            old.write_bytes(rollback)
            def builder(command, cwd, env, check):
                self.assertTrue(check)
                self.assertEqual(command[1], 'scripts/build-package.py')
                self.assertFalse(any(key.startswith('FTP_') for key in env))
                dist = Path(cwd) / 'dist'
                dist.mkdir(exist_ok=True)
                (dist / 'codela-storefront-0.1.195.zip').write_bytes(candidate)
                (dist / 'manifest.json').write_text(json.dumps({'version': '0.1.195', 'source_sha': SHA, 'sha256': review.digest(candidate), 'package': 'https://wrong.example/stable-v0.1.195.zip'}))
            with patch.object(review, 'BASELINE_BYTES', len(rollback)), patch.object(review, 'BASELINE_SHA256', review.digest(rollback)), patch.object(review.subprocess, 'check_output', side_effect=[SHA + '\n', source_tar()]), patch.object(review.subprocess, 'run', side_effect=builder) as run:
                result = review.build_review(SHA, old, root / 'out', repository=root)
            self.assertEqual(run.call_count, 2)
            self.assertEqual(result['candidate']['internal_theme_version'], '0.1.195')
            self.assertEqual(result['publication_status'], 'not_published')
            self.assertFalse(result['updater_manifest'])
            self.assertNotIn('wrong.example', json.dumps(result))
            self.assertFalse((root / 'out/manifest.json').exists())
            self.assertTrue((root / 'out' / ('codela-storefront-review-' + SHA + '.zip')).exists())

    def test_source_archive_cannot_escape_temporary_tree(self):
        rollback = theme_zip()
        with tempfile.TemporaryDirectory() as directory:
            old = Path(directory) / 'rollback.zip'
            old.write_bytes(rollback)
            with patch.object(review, 'BASELINE_BYTES', len(rollback)), patch.object(review, 'BASELINE_SHA256', review.digest(rollback)), patch.object(review.subprocess, 'check_output', side_effect=[SHA + '\n', source_tar('../outside')]), patch.object(review.subprocess, 'run') as run:
                with self.assertRaisesRegex(ValueError, 'Unsafe source archive'):
                    review.build_review(SHA, old, Path(directory) / 'out')
                run.assert_not_called()


if __name__ == '__main__':
    unittest.main()
