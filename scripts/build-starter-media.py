"""Build isolated, non-published starter media candidates (data only)."""
import argparse
import hashlib
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
THEME = REPO / "theme/codela-storefront"
REGISTRY = REPO / "demos/starter-sources.json"
ID = r"[a-z0-9][a-z0-9-]{0,63}"
VERSION = r"[0-9]+\.[0-9]+\.[0-9]+"
MEDIA = r"[a-z0-9][a-z0-9-]{0,100}\.(?:jpg|jpeg|png|webp|avif)"

def safe_path(root, relative):
    if not isinstance(relative, str) or not re.fullmatch(r"[a-zA-Z0-9_.-]+(?:/[a-zA-Z0-9_.-]+)*", relative):
        raise ValueError("Invalid relative path")
    parts = relative.split("/")
    if any(p in (".", "..") for p in parts):
        raise ValueError("Path traversal")
    path = root
    for part in parts:
        path = path / part
        if path.is_symlink():
            raise ValueError("Symlink rejected")
    return path

def registry(path=REGISTRY):
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != 1 or not isinstance(data.get("starters"), list):
        raise ValueError("Unsupported registry")
    result = {}
    for entry in data["starters"]:
        sid, version = entry["id"], entry["version"]
        if not re.fullmatch(ID, sid) or not re.fullmatch(VERSION, version) or sid in result:
            raise ValueError("Invalid or duplicate starter")
        if ("files" in entry) == ("legacy_manifest" in entry):
            raise ValueError("Exactly one media source is required")
        result[sid] = entry
    return result

def media_names(entry, theme=THEME):
    legacy = {}
    if "legacy_manifest" in entry:
        data = json.loads(safe_path(theme, entry["legacy_manifest"]).read_text(encoding="utf-8"))
        if data.get("schema") != 1 or not isinstance(data.get("files"), dict):
            raise ValueError("Invalid legacy manifest")
        legacy = data["files"]
        names = list(legacy)
    else:
        names = entry["files"]
    if not isinstance(names, list) or not names or len(names) > 1000:
        raise ValueError("Invalid media list")
    if any(not isinstance(n, str) or not re.fullmatch(MEDIA, n) for n in names) or len(set(names)) != len(names):
        raise ValueError("Invalid or duplicate media filename")
    return sorted(names), legacy

def optional_theme_paths(theme=THEME, registry_path=REGISTRY):
    excluded = set()
    for entry in registry(registry_path).values():
        prefix = "theme/codela-storefront/"
        source = entry["source_dir"]
        if not source.startswith(prefix):
            continue
        directory = source[len(prefix):]
        safe_path(theme, directory)
        names, _ = media_names(entry, theme)
        excluded.update(directory + "/" + name for name in names)
    return excluded

def immutable_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        raise ValueError("Symlink rejected")
    if path.exists():
        if path.read_bytes() != data:
            raise ValueError("Immutable artifact already exists with different bytes")
        return
    with path.open("xb") as stream:
        stream.write(data)

def build_media(starter_id, output, *, repo=REPO, theme=THEME, registry_path=REGISTRY):
    entry = registry(registry_path)[starter_id]
    directory = safe_path(repo, entry["source_dir"])
    names, legacy = media_names(entry, theme)
    files = {}
    objects = {}
    for name in names:
        path = safe_path(directory, name)
        if not path.is_file() or not 0 < path.stat().st_size <= 25 * 1024 * 1024:
            raise ValueError("Missing or oversized media: " + name)
        data = path.read_bytes()
        if name in legacy:
            original = legacy[name]
            blob = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
            if len(data) != original["size"] or blob != original["git_blob"]:
                raise ValueError("Legacy media mismatch: " + name)
        digest = hashlib.sha256(data).hexdigest()
        object_name = "objects/" + digest + path.suffix
        files[name] = {"sha256": digest, "bytes": len(data), "object": object_name}
        objects[object_name] = data
    manifest = {"schema": 1, "kind": "starter-media-candidate", "id": starter_id,
                "version": entry["version"], "files": files}
    encoded = (json.dumps(manifest, sort_keys=True, separators=(",", ":")) + "\n").encode()
    target = safe_path(output, f"{starter_id}/{entry['version']}/media.json")
    if target.exists() and target.read_bytes() != encoded:
        raise ValueError("Bump starter version before changing existing media")
    for name, data in objects.items():
        immutable_write(safe_path(output, name), data)
    immutable_write(target, encoded)
    return manifest

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("starter", choices=sorted(registry()))
    parser.add_argument("--output", type=Path, default=REPO / "dist/starter-candidates")
    args = parser.parse_args()
    manifest = build_media(args.starter, args.output)
    print(f"{manifest['id']} {manifest['version']}: {len(manifest['files'])} media references")
