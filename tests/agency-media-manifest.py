"""Verify the phase-one pinned asset manifest against the retained source tree."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "theme/codela-storefront"
manifest = json.loads((root / "config/agency-media.json").read_text())
assert manifest["schema"] == 1
for name, entry in manifest["files"].items():
    data = (root / "assets/media" / name).read_bytes()
    assert len(data) == entry["size"], name
    assert hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest() == entry["git_blob"], name
assert len(manifest["files"]) == 15
assert len({entry["git_blob"] for entry in manifest["files"].values()}) == 11
print("Agency media manifest verified")
