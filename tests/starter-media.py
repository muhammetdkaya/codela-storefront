import hashlib
import json
import runpy
import tempfile
import unittest
from pathlib import Path

builder = runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts/build-starter-media.py"))

class MediaTests(unittest.TestCase):
    def test_real_starters_and_dedup(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            agency = builder["build_media"]("agency", out)
            self.assertEqual(len(agency["files"]), 15)
            self.assertEqual(len(list((out / "objects").iterdir())), 11)
            self.assertFalse((out / "commerce").exists())
            commerce = builder["build_media"]("commerce", out)
            self.assertEqual(len(commerce["files"]), 10)
            for manifest in (agency, commerce):
                for entry in manifest["files"].values():
                    data = (out / entry["object"]).read_bytes()
                    self.assertEqual(hashlib.sha256(data).hexdigest(), entry["sha256"])
                    self.assertEqual(len(data), entry["bytes"])
            self.assertEqual(agency, builder["build_media"]("agency", out))
            self.assertEqual(len(builder["optional_theme_paths"]()), 15)
    def test_future_starter_and_immutable_revision(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            media = repo / "demo"
            media.mkdir()
            (media / "sample.webp").write_bytes(b"fixture")
            registry = repo / "registry.json"
            registry.write_text(json.dumps({"schema":1,"starters":[{"id":"future","version":"1.0.0","source_dir":"demo","files":["sample.webp"]}]}))
            out = repo / "out"
            kwargs = {"repo":repo,"theme":repo,"registry_path":registry}
            builder["build_media"]("future", out, **kwargs)
            (media / "sample.webp").write_bytes(b"changed")
            with self.assertRaises(ValueError):
                builder["build_media"]("future", out, **kwargs)
    def test_paths(self):
        for name in ("../x", "/x", "a/../x", "a\\x"):
            with self.assertRaises(ValueError):
                builder["safe_path"](Path("."), name)

if __name__ == "__main__":
    unittest.main()
