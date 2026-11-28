#!/usr/bin/env python3
"""CI-scoping security regression: fail closed on auth/commerce/workflow changes."""
import importlib.util
import unittest
from pathlib import Path

name = "classify_deploy"
spec = importlib.util.spec_from_file_location(name, Path("scripts/classify-deploy.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

OLD = "Theme Name: Codela Storefront\nVersion: 0.1.347\nDescription: Good\n"
NEW = "Theme Name: Codela Storefront\nVersion: 0.1.348\nDescription: Good\n"
S = mod.STYLE

class ClassifierTests(unittest.TestCase):
    def scoped(self, files, result, old=OLD, new=NEW, deleted=False):
        self.assertEqual(mod.classify(files, old, new, deleted), result)

    def test_agency_code_and_version_are_fast(self):
        self.scoped([
            "theme/codela-storefront/assets/scripts/agency-widgets.js",
            "theme/codela-storefront/assets/styles/agency.css",
            "theme/codela-storefront/inc/section-agency.php",
            "tests/agency-widgets-browser.cjs",
            "tests/menu-dismiss-browser.cjs", S], (True,"agency"))

    def test_unversioned_journal_and_agency_css_are_fast(self):
        self.scoped(["theme/codela-storefront/assets/styles/journal.css"], (True,"presentation"))
        self.scoped(["theme/codela-storefront/assets/styles/agency-project.css"], (True,"presentation"))
        self.scoped(["theme/codela-storefront/inc/agency-quote.php"], (False,"full"))
        self.scoped(["theme/codela-storefront/assets/styles/agency-auth.css"], (False,"full"))

    def test_version_only_increment_is_fast(self):
        self.scoped([S], (True, "version-only"))

    def test_visual_icon_only_is_fast(self):
        self.scoped(["theme/codela-storefront/assets/icons/bag.svg", S], (True,"presentation"))

    def test_versions_cannot_skip_patch_requirements(self):
        self.scoped([S], (False,"full"), new=NEW.replace("0.1.348","0.1.350"))
        self.scoped([S], (False,"full"), new=NEW+" /* unexpected */")
        self.scoped([S], (False,"full"), old=OLD, new=OLD)
        self.scoped([S], (False,"full"), old="", new=NEW)

    def test_sensitive_files_always_full(self):
        for p in (
            "theme/codela-storefront/inc/account.php",
            "theme/codela-storefront/inc/quick-login.php",
            "theme/codela-storefront/assets/scripts/auth-smart.js",
            "theme/codela-storefront/assets/scripts/checkout-steps.js",
            "theme/codela-storefront/assets/styles/account.css",
            "theme/codela-storefront/assets/styles/cart.css",
            "theme/codela-storefront/assets/styles/navigation.css",
            "theme/codela-storefront/assets/scripts/overlay-controller.js",
            "theme/codela-storefront/functions.php",
            "scripts/deploy.py",
            ".github/workflows/deploy.yml",
            "theme/codela-storefront/assets/storefront.js",
        ):
            with self.subTest(path=p):
                self.scoped([p,S], (False, "full"))

    def test_unsafe_edits_are_full(self):
        self.scoped([], (False, "full"))
        self.scoped(["theme/codela-storefront/assets/scripts/agency.js"], (False, "full"), deleted=True)
        self.scoped(["theme/codela-storefront/assets/scripts/agency.js"]*2, (False, "full"))
        self.scoped(["theme/codela-storefront/assets/scripts/agency.js"]*17, (False, "full"))

if __name__ == "__main__":
    unittest.main()
