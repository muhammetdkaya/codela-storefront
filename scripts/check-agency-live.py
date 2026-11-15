"""Post-FTP smoke check for the public test site's real WordPress agency pages.
No credentials, email submission, write requests, or plugin settings changes.
"""
from __future__ import annotations
import re
import time
import urllib.error
import urllib.request
import uuid

BASE = "https://codela.dev"

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
    assert version and version.group(1) == "0.1.321", "FTP theme version is not 0.1.321"
    agency_css = fetch("/wp-content/themes/codela-storefront/assets/styles/agency.css")
    assert re.search(r"\.sf-agency-home\{[^}]*padding-top:0", agency_css), "Agency root still leaves the old white header band"
    assert re.search(r"\.sf-agency-hero\{[^}]*padding-top:76px", agency_css), "Hero text is not offset from the glass header"
    assert ".sf-agency-hero{min-height:100svh;padding-top:68px}" in agency_css, "Mobile hero no longer has header-safe content spacing"
    print("Agency hero/header underlay: live CSS verified.", flush=True)
    expected = {
        "/": [],  # Legacy reference pattern or a saved native Codela layout
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
                    legacy = all(marker in html for marker in ("sf-agency-swap-stage", "sf-agency-service-track", "sf-agency-process"))
                    managed = "codela-page-layout" in html and (
                        "sf-agency-widget" in html or "sf-section--" in html
                    )
                    missing = [] if legacy or managed else ["agency pattern or rendered managed sections"]
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
                print("Agency 0.1.321: navigation, legacy or managed homepage, Services, About and Contact verified.")
                return
        print("Agency smoke attempt", attempt + 1, "; ".join(errors), flush=True)
        if attempt < 2:
            time.sleep(5)
    raise AssertionError("Published WordPress agency page missing. " + "; ".join(errors))

if __name__ == "__main__":
    check()
