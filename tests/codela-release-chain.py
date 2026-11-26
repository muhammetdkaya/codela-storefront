"""Offline tests: approval binding, path gates, exact CI and real deploy contracts."""
import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch

root = Path(__file__).resolve().parents[1]
os.environ.setdefault("GITHUB_REPOSITORY", "muhammetdkaya/codela-storefront" if (root / "theme").exists() else "muhammetdkaya/codela")
spec = importlib.util.spec_from_file_location("chain", root / "scripts/codela-release-chain.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)

H, B = "a"*40, "b"*40

class ChainTests(unittest.TestCase):
    def comment(self, body, login="owner", id=1):
        return {"body": body, "user": {"login": login}, "id": id}

    def test_owner_and_exact_sha(self):
        cmd = "/codela-publish " + H + " " + B + " 1.2.3"
        self.assertEqual(c.authorization([self.comment(cmd)], "owner"), (H,B,"1.2.3"))
        self.assertIsNone(c.authorization([self.comment(cmd,"outsider")], "owner"))
        self.assertIsNone(c.authorization([self.comment(cmd),self.comment("/codela-cancel",id=2)],"owner"))
        self.assertIsNone(c.authorization([self.comment(cmd+" extra")],"owner"))

    def test_paths_and_required_workflow_names(self):
        self.assertTrue(c.matches(["theme/**/agency-*.php"], "theme/inc/agency-quote.php"))
        self.assertTrue(c.matches(["theme/**/agency-*.php"], "theme/agency-quote.php"))
        self.assertFalse(c.matches(["theme/*"], "theme/inc/file"))
        specs=c.pr_specs()
        self.assertIn(c.DEPLOY,specs)
        workflow=(root/".github/workflows/codela-release-chain.yml").read_text()
        for s in specs.values():
            self.assertIn("      - "+s["name"]+"\n", workflow)
        paths=[c.VERSION_FILE]
        required=c.expected_workflows(paths,specs)
        self.assertIn(c.DEPLOY,required)
        if not c.THEME:
            self.assertTrue({"validate-free-edition.yml","optional-commerce-acceptance.yml"} <= required)

    def test_exact_run(self):
        r={"head_sha":H,"event":"pull_request","pull_requests":[{"number":1,"head":{"sha":H},"base":{"sha":B}}]}
        self.assertTrue(c.exact_pr_run(r,1,H,B))
        self.assertFalse(c.exact_pr_run(r,1,H,"c"*40))
        self.assertFalse(c.exact_pr_run(r,2,H,B))
        self.assertFalse(c.exact_pr_run({**r,"pull_requests":[]},1,H,B))

    def test_failed_or_incomplete_checks(self):
        self.assertEqual(c.check_state([None]),"pending")
        self.assertEqual(c.check_state([{"status":"in_progress","conclusion":None}]),"pending")
        self.assertEqual(c.check_state([{"status":"completed","conclusion":"failure"}]),"failed")
        self.assertEqual(c.check_state([{"status":"completed","conclusion":"success"}]),"success")

    def test_skip_is_not_deploy(self):
        run={"status":"completed","conclusion":"success","id":1}
        steps=[{"name":c.DEPLOY_STEP,"conclusion":"skipped"}]
        if c.LIVE_STEP: steps.append({"name":c.LIVE_STEP,"conclusion":"success"})
        jobs={"jobs":[{"name":"deploy","conclusion":"success","steps":steps}]}
        with patch.object(c,"repo_api",return_value=jobs):
            self.assertFalse(c.deploy_passed(run))
            steps[0]["conclusion"]="success"
            self.assertTrue(c.deploy_passed(run))

    def test_no_release_downgrade(self):
        self.assertGreater(c.ver("0.1.432"),c.ver("0.1.430"))
        with self.assertRaises(RuntimeError): c.ver("latest")

if __name__ == "__main__":
    unittest.main()
