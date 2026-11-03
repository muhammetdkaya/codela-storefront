#!/usr/bin/env python3
"""Build an unpublished, SHA-labelled review bundle without changing the theme version.

This helper performs no network request, installation, tag, release, push or FTP
operation. A verified copy of the preceding stable ZIP is a required local input.
It exports the exact commit to a temporary directory and never packages a dirty
working tree. The builder's stable-shaped manifest is intentionally not exported.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import sys
import tarfile
import tempfile
import zipfile

BASELINE_SOURCE = "25f844d393ff8be55b6fae7c049f1eabc1842ebc"
BASELINE_VERSION = "0.1.195"
BASELINE_SHA256 = "bfddc47fccaebe2b56fc141b87756ab560206d3d09ed8b074dd1f15d9bd3c41f"
BASELINE_BYTES = 208367
ROOT = Path(__file__).resolve().parents[1]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inspect_zip(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Duplicate ZIP members")
        for entry in archive.infolist():
            path = PurePosixPath(entry.filename)
            if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] != "codela-storefront":
                raise ValueError("Unexpected ZIP path: " + entry.filename)
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError("ZIP symlinks are not supported")
        required = {"codela-storefront/style.css", "codela-storefront/functions.php", "codela-storefront/templates/index.html"}
        if not required.issubset(names):
            raise ValueError("Incomplete theme ZIP")
        style = archive.read("codela-storefront/style.css").decode("utf-8")
        if not re.search(r"^Theme Name:\s*Codela Storefront\s*$", style, re.M):
            raise ValueError("Wrong theme identity")
        version = re.search(r"^Version:\s*(\d+\.\d+\.\d+)\s*$", style, re.M)
        if not version:
            raise ValueError("Invalid internal theme version")
        bad = archive.testzip()
        if bad:
            raise ValueError("Corrupt ZIP member: " + bad)
        return {"internal_theme_version": version.group(1), "file_count": len(names)}


def rollback_info(data):
    if len(data) != BASELINE_BYTES or digest(data) != BASELINE_SHA256:
        raise ValueError("Rollback ZIP is not the verified, unchanged v0.1.195 release")
    info = inspect_zip(data)
    if info["internal_theme_version"] != BASELINE_VERSION:
        raise ValueError("Unexpected rollback version")
    return info


def safe_write(path, data):
    if path.exists():
        if path.read_bytes() != data:
            raise ValueError("Refusing to overwrite a different existing review artifact: " + path.name)
        return
    path.write_bytes(data)


def build_review(source_sha, rollback_zip, output, repository=ROOT):
    if not re.fullmatch(r"[0-9a-f]{40}", source_sha):
        raise ValueError("Provide the full immutable 40-character source commit SHA")
    resolved = subprocess.check_output(["git", "rev-parse", "--verify", source_sha + "^{commit}"], cwd=repository, text=True).strip()
    if resolved != source_sha:
        raise ValueError("Source must identify the exact commit")
    rollback = Path(rollback_zip).read_bytes()
    rollback_details = rollback_info(rollback)
    with tempfile.TemporaryDirectory(prefix="codela-review-") as directory:
        snapshot = Path(directory)
        archive_data = subprocess.check_output(["git", "archive", source_sha], cwd=repository)
        with tarfile.open(fileobj=io.BytesIO(archive_data)) as archive:
            for entry in archive.getmembers():
                path = PurePosixPath(entry.name)
                if path.is_absolute() or ".." in path.parts or entry.issym() or entry.islnk():
                    raise ValueError("Unsafe source archive member")
            archive.extractall(snapshot, filter="data")
        env = {key: value for key, value in os.environ.items() if not key.startswith("FTP_")}
        env["CODELA_SOURCE_SHA"] = source_sha
        command = [sys.executable, "scripts/build-package.py"]
        subprocess.run(command, cwd=snapshot, env=env, check=True)
        manifest = json.loads((snapshot / "dist/manifest.json").read_text())
        version = manifest["version"]
        package_path = snapshot / "dist" / ("codela-storefront-" + version + ".zip")
        candidate = package_path.read_bytes()
        details = inspect_zip(candidate)
        if manifest["source_sha"] != source_sha or manifest["sha256"] != digest(candidate):
            raise ValueError("Builder identity mismatch")
        subprocess.run(command, cwd=snapshot, env=env, check=True)
        if package_path.read_bytes() != candidate:
            raise ValueError("Candidate package is not deterministic")
        if candidate == rollback:
            raise ValueError("Candidate is byte-identical to the stable rollback; no new review package needed")
    candidate_name = "codela-storefront-review-" + source_sha + ".zip"
    rollback_name = "codela-storefront-0.1.195-rollback.zip"
    metadata_name = "review-" + source_sha + ".json"
    with zipfile.ZipFile(io.BytesIO(candidate)) as new_zip, zipfile.ZipFile(io.BytesIO(rollback)) as old_zip:
        new_names, old_names = set(new_zip.namelist()), set(old_zip.namelist())
        added_files = sorted(new_names - old_names)
        changed_files = sorted(name for name in new_names & old_names if new_zip.read(name) != old_zip.read(name))
    metadata = {
        "artifact_kind": "unpublished_review_bundle",
        "publication_status": "not_published",
        "live_installation_approved": False,
        "updater_manifest": False,
        "verification_scope": "Two identical local builds, source/vendor integrity guards and ZIP structure only; browser, WordPress/Woo, device and payment acceptance are separate.",
        "candidate": {"file": candidate_name, "source_sha": source_sha, "sha256": digest(candidate), "bytes": len(candidate), **details},
        "rollback": {"file": rollback_name, "release_source_sha": BASELINE_SOURCE, "sha256": BASELINE_SHA256, "bytes": BASELINE_BYTES, **rollback_details},
        "rollback_inventory": {"candidate_only_managed_files": added_files, "changed_managed_files": changed_files},
        "warnings": [
            "Internal theme version is unchanged; this file is not the public v0.1.195 release and must not replace it or its stable feed.",
            "Same-version CSS URLs can stay cached. Use an isolated test site and explicitly clear test caches; do not treat this as a live-installation package.",
            "Keep a complete pre-install backup of the actual theme directory, including custom files. The official rollback ZIP does not contain site-specific modifications.",
        ],
    }
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    # Never export the builder's dist/manifest.json: its public release URL and
    # inherited changelog would misrepresent this unpublished same-version ZIP.
    safe_write(output / candidate_name, candidate)
    safe_write(output / rollback_name, rollback)
    safe_write(output / metadata_name, (json.dumps(metadata, indent=2, ensure_ascii=False) + "\n").encode())
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--rollback-zip", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "qa/library-migration/review-packages")
    args = parser.parse_args()
    try:
        result = build_review(args.source_sha, args.rollback_zip, args.output_dir)
    except (ValueError, OSError, subprocess.CalledProcessError, zipfile.BadZipFile) as error:
        parser.exit(1, "Review package not created: " + str(error) + "\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))
