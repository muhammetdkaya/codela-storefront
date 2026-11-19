"""Post-FTP smoke check for the public test site's real WordPress agency pages.
No credentials, email submission, write requests, or plugin settings changes.
"""
from __future__ import annotations
import re
import time
import urllib.error
import urllib.request
from urllib.parse import urljoin, urlparse
from html import unescape
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


def check_service_detail_pages() -> None:
    """No writes. Follow the FOUR URLs rendered by live Bento, not assumed slugs."""
    home = fetch("/")
    hrefs = re.findall(
        r'<a\b[^>]*class="cdl-bento__card[^"]*"[^>]*href="([^"]+)"',
        home, flags=re.S,
    )
    expected = [
        ("Web Tasarım", "mona-bento-web.jpg"),
        ("E-Ticaret", "mona-bento-web.jpg"),
        ("Özel Yazılım", "mona-studio-hero.jpg"),
        ("Optimizasyon / Destek", "mona-studio-hero.jpg"),
    ]
    if len(hrefs) != 4:
        raise AssertionError(f"Live homepage has {len(hrefs)} Bento service links, expected 4")
    visited = set()
    for (title, image), raw_href in zip(expected, hrefs):
        full = urljoin(BASE, unescape(raw_href))
        parsed = urlparse(full)
        if parsed.netloc != urlparse(BASE).netloc or parsed.path in visited:
            raise AssertionError("Unpublished or duplicate Bento detail URL: " + title)
        visited.add(parsed.path)
        html = fetch(parsed.path)
        required = [
            "sf-agency-widget--detail", "cdl-service-detail__visual",
            "cdl-service-detail__scope", "cdl-service-detail__cta",
            image, "hizmetler=",
        ]
        missing = [marker for marker in required if marker not in html]
        heading = re.search(
            r'<h1\b[^>]*id="codela-detail-[^"]+"[^>]*>(.*?)</h1>', html, flags=re.S,
        )
        heading_text = " ".join(unescape(re.sub(r'<[^>]*>', '', heading.group(1))).split()) if heading else ""
        scope = re.search(
            r'class="cdl-service-detail__scope"[^>]*>.*?<ul\b[^>]*>(.*?)</ul>',
            html, flags=re.S,
        )
        scope_count = len(re.findall(r'<li\b', scope.group(1))) if scope else 0
        if missing or heading_text != title or scope_count != 4:
            raise AssertionError(
                f"Live detail {title}: heading={heading_text!r}, "
                f"scope={scope_count}, missing={missing}"
            )
        print(f"OK detail {title}: published page, correct image, 4 scope labels and CTA", flush=True)


def check() -> None:
    style = fetch("/wp-content/themes/codela-storefront/style.css")
    version = re.search(r"(?m)^Version:\s*(\S+)", style)
    expected_version = release_version()
    assert version and version.group(1) == expected_version, (
        f"FTP theme version {version.group(1) if version else 'missing'} is not {expected_version}"
    )
    agency_css = fetch("/wp-content/themes/codela-storefront/assets/styles/agency.css")
    assert "0.1.357 — MONA approved Services Bento" in agency_css, "Published Agency CSS is missing approved MONA Bento"
    assert ".sf-agency-widget--studio" in agency_css, "Published Agency Studio styling is missing"
    assert ".sf-agency-widget--bento" in agency_css, "Published Agency Bento styling is missing"
    assert "background:#f3f0e9" in agency_css, "Editorial Light warm background is absent"
    assert "min-height:100svh" in agency_css, "Mobile first-screen height rule is absent"
    assert "margin-top:-31px!important" in agency_css, "Mobile Services handoff has regressed"
    print("MONA Studio/Bento CSS and existing mobile safeguards verified.", flush=True)
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
                        ("sf-agency-widget--studio", "codela-studio-hero__title", "codela-studio-hero__visual"),
                    ]
                    missing = [] if any(all(token in html for token in variant)
                                        for variant in valid_hero_variants) else [
                        "a complete Studio, Editorial Light or Card Swap welcome widget"
                    ]
                else:
                    missing = [marker for marker in markers if marker not in html]
                if missing:
                    errors.append(f"{path}: missing {', '.join(missing)}")
                else:
                    if path == "/":
                        studio = "sf-agency-widget--studio" in html
                        bento = "sf-agency-widget--bento" in html
                        legacy_services = "sf-agency-widget--services" in html
                        print("OK /: Studio welcome" if studio else "OK /: supported legacy welcome", flush=True)
                        print("Home Services: approved MONA Bento" if bento else
                              "Home Services: legacy widget preserved during migration" if legacy_services else
                              "Home Services: no known services widget", flush=True)
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
                check_service_detail_pages()
                print(f"Agency {expected_version}: homepage welcome, navigation, Services, About and Contact verified.")
                return
        print("Agency smoke attempt", attempt + 1, "; ".join(errors), flush=True)
        if attempt < 2:
            time.sleep(5)
    raise AssertionError("Published WordPress agency page missing. " + "; ".join(errors))

if __name__ == "__main__":
    check()
