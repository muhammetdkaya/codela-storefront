#!/usr/bin/env python3
"""Classify a Git change for the small, safe Codela Storefront deploy lane.

Unknown, structural, authentication, checkout and deleted changes
always select full validation. Never use commit messages to choose safety.
"""
import re
import subprocess
import sys
from pathlib import PurePosixPath

STYLE = "theme/codela-storefront/style.css"
AGENCY_PATHS = {
    "theme/codela-storefront/assets/scripts/agency.js",
    "theme/codela-storefront/assets/scripts/agency-widgets.js",
    "theme/codela-storefront/assets/styles/agency.css",
    "theme/codela-storefront/inc/section-agency.php",
    "tests/menu-dismiss-browser.cjs",
}
AGENCY_PATTERNS = ("theme/codela-storefront/patterns/agency-*.php",
                   "tests/agency*.php", "tests/agency*.cjs")
VISUAL_PATTERNS = ("theme/codela-storefront/assets/icons/*.svg",
                   "theme/codela-storefront/assets/styles/footer.css",
                   "theme/codela-storefront/assets/styles/agency.css",
                   "theme/codela-storefront/assets/styles/agency-about.css",
                   "theme/codela-storefront/assets/styles/agency-project.css",
                   "theme/codela-storefront/assets/styles/agency-light-scene.css",
                   "theme/codela-storefront/assets/styles/agency-reference-light.css",
                   "theme/codela-storefront/assets/styles/journal.css",
                   "tests/journal-browser.cjs")
MAX_FILES = 16

def version_only(before, after):
    """Require an incrementing patch version and no other style.css change."""
    pattern = re.compile(r"(?m)^Version:\s*(\d+)\.(\d+)\.(\d+)\s*$")
    b, a = pattern.search(before), pattern.search(after)
    if not b or not a:
        return False
    old, new = tuple(map(int, b.groups())), tuple(map(int, a.groups()))
    if new != (old[0], old[1], old[2] + 1):
        return False
    return after[:a.start()] + b.group() + after[a.end():] == before

def classify(paths, previous_style=None, current_style=None, deleted=False):
    """Return (quick, scope); conservative defaults for all unfamiliar paths."""
    if deleted or not paths or len(paths) > MAX_FILES or len(paths) != len(set(paths)):
        return False, "full"
    other = [p for p in paths if p != STYLE]
    if STYLE in paths and not version_only(previous_style or "", current_style or ""):
        return False, "full"
    if not other:
        return True, "version-only"
    if all(p in AGENCY_PATHS or any(PurePosixPath(p).match(pat) for pat in AGENCY_PATTERNS) for p in other):
        return True, "agency"
    if all(any(PurePosixPath(p).match(pat) for pat in VISUAL_PATTERNS) for p in other):
        return True, "presentation"
    return False, "full"

def git(*args):
    return subprocess.check_output(["git", *args], text=True)

def main(before, after):
    changed = git("diff", "--name-only", "--no-renames", before, after).splitlines()
    # Deletions and renames are not eligible for the scoped lane.
    statuses = git("diff", "--name-status", before, after).splitlines()
    destructive = any(line[:1] not in ("A", "M") for line in statuses)
    old_style = new_style = None
    if STYLE in changed:
        try:
            old_style = git("show", before + ":" + STYLE)
            new_style = git("show", after + ":" + STYLE)
        except subprocess.CalledProcessError:
            destructive = True
    quick, scope = classify(changed, old_style, new_style, destructive)
    print("quick=" + str(quick).lower())
    print("scope=" + scope)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: classify-deploy.py BEFORE_SHA AFTER_SHA")
    main(sys.argv[1], sys.argv[2])
