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

    def test_merge_source_tree_binding(self):
        merged={"parents":[{"sha":B}],"tree":{"sha":"tree"}}
        approved={"tree":{"sha":"tree"}}
        with patch.object(c,"repo_api",side_effect=[merged,approved]):
            c.verify_merge_source("c"*40,H,B)
        with patch.object(c,"repo_api",side_effect=[merged,{"tree":{"sha":"other"}}]):
            with self.assertRaises(RuntimeError): c.verify_merge_source("c"*40,H,B)

    def test_atomic_manifest_ref_update(self):
        from unittest.mock import call
        responses=[{"tree":{"sha":"oldtree"}},{"sha":"newtree"},{"sha":"c"*40},{}]
        with patch.object(c,"repo_api",side_effect=responses) as api, patch.object(c,"main_sha",side_effect=[B,"c"*40]):
            self.assertEqual(c.commit_manifest(B,"0.1.432","{}"),"c"*40)
            self.assertEqual(api.call_args_list[-1],call("git/refs/heads/main",method="PATCH",data={"sha":"c"*40,"force":False}))
        with patch.object(c,"repo_api",side_effect=responses[:3]) as api, patch.object(c,"main_sha",return_value=H):
            with self.assertRaises(RuntimeError): c.commit_manifest(B,"0.1.432","{}")
            self.assertEqual(api.call_count,3)

    def test_private_dependency_stable_baseline(self):
        import json
        source = "c"*40
        digest = "d"*64
        stable = {"theme":"codela-storefront","version":"0.1.432","source_sha":source,"sha256":digest,"requires":{"codela":"1.2.34"}}
        config = {"requires":{"codela":"1.2.34"}}
        release = {"tag_name":"v0.1.432","assets":[{"name":"codela-storefront-0.1.432.zip","digest":"sha256:"+digest}]}
        tag = {"object":{"type":"commit","sha":source}}
        def file_at(path, ref):
            return json.dumps(stable if path=="manifest.json" else config).encode(), "blob"
        with patch.object(c,"file_at",side_effect=file_at), patch.object(c,"repo_api",side_effect=[release,tag]):
            self.assertTrue(c.stable_dependency_verified("1.2.34"))
        with patch.object(c,"file_at",side_effect=file_at), patch.object(c,"repo_api",side_effect=[release,tag]):
            self.assertFalse(c.stable_dependency_verified("1.2.35"))
        with patch.object(c,"file_at",side_effect=file_at), patch.object(c,"repo_api",side_effect=[{**release,"assets":[]},tag]):
            with self.assertRaises(RuntimeError): c.stable_dependency_verified("1.2.34")
        with patch.object(c,"file_at",side_effect=file_at), patch.object(c,"repo_api",side_effect=[release,{"object":{"type":"commit","sha":H}}]):
            with self.assertRaises(RuntimeError): c.stable_dependency_verified("1.2.34")
        with patch.object(c,"THEME",True), patch.object(c,"file_at",return_value=(json.dumps(config).encode(),"blob")), patch.dict(os.environ,{"CODELA_DEPENDENCY_READ_TOKEN":""}), patch.object(c,"stable_dependency_verified",return_value=True) as baseline:
            c.check_dependency(H)
            baseline.assert_called_once_with("1.2.34")

    def test_no_release_downgrade(self):
        self.assertGreater(c.ver("0.1.432"),c.ver("0.1.430"))
        with self.assertRaises(RuntimeError): c.ver("latest")

if __name__ == "__main__":
    unittest.main()
