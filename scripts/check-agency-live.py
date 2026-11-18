"""Post-FTP smoke check for the public test site's real WordPress agency pages.
No credentials, email submission, write requests, or plugin settings changes.
"""
from __future__ import annotations
import re
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

BASE = "https://codela.dev"


def release_version() -> str:
    """Use the validated Storefront tree, never a hard-coded old release."""
    stylesheet = (Path(__file__).resolve().parents[1] / 'theme' / 'codela-storefront' / 'style.css').read_text(encoding='utf-8')
    match = re.search(r'(?m)^Version:\s*(\S+)', stylesheet)
    assert match, 'Local Storefront style.css is missing its version'
    return match.group(1)

def fetch(path: str) -> str:
    sep = "&" if "?" in path else "?"
    req = urllib.request.Request(
        BASE + path + sep + "agency_smoke=" + uuid.uuid4().hex,
        headers={"Cache-Control": "no-cache", "Pragma": "no-cache", "User-Agent": "CodelaAgencySiteCheck/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"Unexpected HTTP {response.status} for {path}")
        return response.read().decode("utf-8", errors="replace")

def check() -> None:
    style = fetch("/wp-content/themes/codela-storefront/style.css")
    version = re.search(r"(?m)^Version:\s*(\S+)", style)
    expected_version = release_version()
    assert version and version.group(1) == expected_version, (
        f"FTP theme version {version.group(1) if version else 'missing'} is not {expected_version}"
    )
    agency_css = fetch("/wp-content/themes/codela-storefront/assets/styles/agency.css")
    assert "0.1.350 — Agency Editorial Light" in agency_css, "Published Agency CSS is not the approved Editorial Light design"
    assert "background:#f3f0e9" in agency_css, "Editorial Light warm background is absent"
    assert "min-height:100svh" in agency_css, "Mobile first-screen height rule is absent"
    assert "margin-top:-31px!important" in agency_css, "Mobile Services handoff has regressed"
    print("Editorial Light hero and mobile full-viewport CSS verified.", flush=True)
    expected = {
        "/": [],  # Dedicated native Agency starter checked separately below
        "/hizmetler/": ["sf-agency-service-page", "data-agency-module-grid", "data-agency-selected-cta"],
        "/hakkimizda/": ["sf-agency-about-page", "data-agency-step", "data-agency-process-stage"],
        "/iletisim/": ["sf-agency-contact-page", "admin-post.php", "agency_contact_nonce"],
    }
    for attempt in range(3):
        errors = []
        for path, markers in expected.items():
            try:
                html = fetch(path)
                if path == "/":
                    # This test site explicitly migrated from the old Agency
                    # theme switch. A generic valid Codela layout could be the
                    # old e-commerce product demo, so generic checks are unsafe.
                    # The live Agency homepage now uses the lightweight
                    # editor-managed Editorial Light welcome, not the legacy
                    # 3D Scroll model. Keep optional Card Swap compatibility.
                    valid_hero_variants = [
                        ("sf-agency-widget--minimal", "sf-agency-minimal-title", "sf-agency-minimal-cta"),
                        ("sf-agency-widget--cards", "data-agency-swap"),
                    ]
                    missing = [] if any(all(token in html for token in variant)
                                        for variant in valid_hero_variants) else [
                        "a complete Editorial Light or Card Swap welcome widget"
                    ]
                else:
                    missing = [marker for marker in markers if marker not in html]
                if missing:
                    errors.append(f"{path}: missing {', '.join(missing)}")
                else:
                    print(f"OK {path}: all {len(markers)} markers in live WordPress HTML", flush=True)
            except (urllib.error.URLError, RuntimeError) as err:
                errors.append(f"{path}: {type(err).__name__}")
        if not errors:
            print("Agency pages render correctly on the public site.")
            home = fetch("/")
            desktop = re.search(r'<ul\b[^>]*\bid="sf-desktop-menu"[^>]*>(.*?)</ul>', home, re.S)
            if not desktop:
                errors.append("Agency desktop nav not found")
            else:
                anchors = re.findall(r'<a\b[^>]*>(.*?)</a>', desktop.group(1), re.S)
                labels = [" ".join(re.sub(r"<[^>]+>", "", a).split()) for a in anchors]
                expected_labels = ["Ana Sayfa", "Hizmetler", "Hakkımızda", "İletişim"]
                if labels != expected_labels:
                    errors.append("Agency menu mismatch: " + repr(labels))
                elif "Shop" in labels:
                    errors.append("Old Shop link still visible in agency nav")
                else:
                    print("Agency desktop nav verified:", " / ".join(labels), flush=True)
            if not errors:
                print(f"Agency {expected_version}: homepage welcome, navigation, Services, About and Contact verified.")
                return
        print("Agency smoke attempt", attempt + 1, "; ".join(errors), flush=True)
        if attempt < 2:
            time.sleep(5)
    raise AssertionError("Published WordPress agency page missing. " + "; ".join(errors))

if __name__ == "__main__":
    check()
