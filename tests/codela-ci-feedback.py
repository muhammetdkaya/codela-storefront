"""Failure feedback contracts; all GitHub writes are mocked."""
import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch

root = Path(__file__).resolve().parents[1]
os.environ.setdefault("GITHUB_REPOSITORY", "muhammetdkaya/codela-storefront" if (root/"theme").exists() else "muhammetdkaya/codela")
spec = importlib.util.spec_from_file_location("feedback", root/"scripts/codela-ci-feedback.py")
f = importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)

class FeedbackTests(unittest.TestCase):
    def run_data(self, **changes):
        r = {"id": 42, "name": "Test workflow", "repository": {"full_name": f.REPO},
             "head_repository": {"full_name": f.REPO}, "head_sha": "a"*40,
             "event":"pull_request", "status":"completed", "conclusion":"failure", "run_attempt":1}
        r.update(changes)
        return r

    def test_retry_is_bounded_and_only_setup(self):
        c = {"authorized":True}
        jobs = [{"conclusion":"failure","steps":[{"name":"Set up job","conclusion":"failure"}]}]
        self.assertTrue(f.may_retry(self.run_data(), c, jobs))
        self.assertFalse(f.may_retry(self.run_data(run_attempt=2), c, jobs))
        self.assertFalse(f.may_retry(self.run_data(event="push"), c, jobs))
        self.assertFalse(f.may_retry(self.run_data(), {"authorized":False}, jobs))
        jobs[0]["steps"][0]["name"]="Core browser smoke"
        self.assertFalse(f.may_retry(self.run_data(), c, jobs))

    def test_untrusted_and_cancelled_never_write(self):
        with patch.object(f.chain,"repo_api") as api, patch.object(f,"find_issue",return_value=None):
            f.handle(self.run_data(head_repository={"full_name":"external/fork"}))
            f.handle(self.run_data(conclusion="cancelled"))
            api.assert_not_called()

    def test_failure_creates_once_and_updates_existing(self):
        run=self.run_data()
        c={"authorized":False,"pr":12,"version":"1.2.3"}
        j={"jobs":[{"id":9,"name":"validate","conclusion":"failure",
                    "steps":[{"number":3,"name":"tests","conclusion":"failure"}]}]}
        with patch.object(f,"scope",return_value=c), patch.object(f,"find_issue",return_value=None), patch.object(f.chain,"repo_api",side_effect=[j,{"number":8}]) as api:
            f.handle(run)
            self.assertEqual(api.call_count,2)
            data=api.call_args.kwargs["data"]
            self.assertIn(f.marker(run),data["body"])
            self.assertIn("/job/9",data["body"])
        with patch.object(f,"scope",return_value=c), patch.object(f,"find_issue",return_value={"number":8,"state":"open"}), patch.object(f.chain,"repo_api",side_effect=[j,{}]) as api:
            f.handle(run)
            self.assertEqual(api.call_args.args[0],"issues/8")
            self.assertEqual(api.call_args.kwargs["method"],"PATCH")

    def test_success_closes_only_matching_run(self):
        with patch.object(f,"find_issue",return_value={"number":8,"state":"open"}), patch.object(f.chain,"repo_api") as api:
            f.handle(self.run_data(conclusion="success"))
            self.assertEqual(api.call_args.kwargs["data"]["state"],"closed")
        with patch.object(f,"find_issue",return_value=None), patch.object(f.chain,"repo_api") as api:
            f.handle(self.run_data(conclusion="success"))
            api.assert_not_called()

if __name__=="__main__":
    unittest.main()
