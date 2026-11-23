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
        ("Web Tasarım", "agency-light-web.jpg"),
        ("E-Ticaret", "agency-light-commerce.jpg"),
        ("Özel Yazılım", "agency-light-software.jpg"),
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
        if "cdl-service-detail__header" in html or "cdl-service-detail__back" in html:
            raise AssertionError("Duplicate service detail header remains; native theme header must own navigation")
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
    scene_css = fetch("/wp-content/themes/codela-storefront/assets/styles/agency-light-scene.css")
    assert ".codela-monolith__canvas" in scene_css and "prefers-reduced-motion" in scene_css, "Studio monolith canvas CSS is not published"
    scene_js = fetch("/wp-content/themes/codela-storefront/assets/scripts/agency-light-scene.js")
    assert "drawScene(timeSec)" in scene_js and "IntersectionObserver" in scene_js, "Studio monolith animation or visibility logic is not published"
    print("MONA Studio/Bento CSS and existing mobile safeguards verified.", flush=True)
    expected = {
        "/": [],  # Dedicated native Agency starter checked separately below
        "/hizmetler/": ["sf-agency-widget--bento", "cdl-bento__grid", "cdl-bento__card--web", "cdl-bento__card--commerce", "cdl-bento__card--software", "cdl-bento__card--support"],
        "/hakkimizda/": ["sf-agency-widget--about", "sf-about-hero", "sf-about-principles", "sf-about-principle", "sf-about-contact"],
        "/iletisim/": ["sf-agency-widget--contact-bento", "cdl-contact__grid", "cdl-contact__card--primary", "cdl-contact__form", "admin-post.php", "agency_contact_nonce", "agency_webpage", "agency_consent", "data-agency-contact-services"],
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
                if path == "/hizmetler/" and "sf-agency-module-grid" in html:
                    missing.append("legacy service module grid still present")
                if path == "/hakkimizda/" and ("sf-agency-about-intro" in html or "data-agency-widget-step=" in html):
                    missing.append("legacy About or process widget still present")
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
            # Verify real dynamic homepage content after FTP. Successful file
            # uploads alone do not prove the active MONA section has refreshed.
            if "sf-agency-widget--studio" in home and "sf-agency-widget--bento" in home:
                approved = (
                    "Markanıza özel", "web siteleri,", "e-ticaret ve yazılım.",
                    "İşinizi anlatan, satışınızı destekleyen",
                    "codela-studio-hero__contact", "Projenizi konuşalım",
                    "Mobil uyumlu, kolay yönetilen web siteleri.",
                    "Ödeme ve kargo akışı hazır online mağazalar.",
                    "Özel paneller, eklentiler ve entegrasyonlar.",
                    "Hız, güncelleme ve teknik destek.",
                    "Bakım ve geliştirme", "Keşif ve Planlama",
                    "WordPress · WooCommerce",
                    "class=\"codela-monolith\"", "codela-monolith__canvas",
                    "codela-monolith__control", "agency-light-web.jpg",
                    "agency-light-commerce.jpg", "agency-light-software.jpg",
                    "agency-light-process-discovery.jpg", "#sf-agency-services",
                )
                missing_copy = [marker for marker in approved if marker not in home]
                if missing_copy:
                    errors.append("Live MONA homepage not updated: " + ", ".join(missing_copy))
                else:
                    print("Live Studio/Bento: approved copy, architectural monolith and Bento photographs verified.", flush=True)
                match_title = re.search(r"<title[^>]*>(.*?)</title>", home, re.I | re.S)
                title = " ".join(unescape(match_title.group(1)).split()) if match_title else ""
                print("Live document title: " + repr(title), flush=True)
                if "WooCommerce" in title or "shipping and notifications" in title:
                    errors.append("Live agency browser tab still has old WooCommerce tagline")
            # Agency 0.1.372 uses a single linked C + wordmark and a native
            # Account/Menu capsule on all screen sizes. The old desktop
            # centered menu is intentionally absent; the same WP menu remains
            # available inside the established overlay for keyboard/mobile.
            for token in ("has-agency-header", "sf-agency-brand-link",
                          "/assets/icons/codela-brand-mark.svg", "sf-agency-header-tools",
                          "sf-agency-header-divider", "sf-account-link", "sf-menu-trigger"):
                if token not in home:
                    errors.append("New Agency header missing: " + token)
            if 'id="sf-desktop-menu"' in home:
                errors.append("Legacy centered desktop navigation still visible")
            menu = re.search(
                r'<section\b[^>]*\bid="sf-menu"[^>]*>.*?<nav\b[^>]*>(.*?)</nav>',
                home, re.S,
            )
            if not menu:
                errors.append("Native Agency Menu overlay navigation not found")
            else:
                anchors = re.findall(r'<a\b[^>]*>(.*?)</a>', menu.group(1), re.S)
                labels = [" ".join(re.sub(r"<[^>]+>", "", a).split()) for a in anchors]
                expected_labels = ["Ana Sayfa", "Hizmetler", "Hakkımızda", "İletişim"]
                if labels != expected_labels:
                    errors.append("Agency menu mismatch: " + repr(labels))
                else:
                    print("Agency Account/Menu capsule and overlay navigation verified:",
                          " / ".join(labels), flush=True)
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
