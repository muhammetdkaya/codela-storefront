"""Report CI failures from trusted main. Never execute or paste PR logs."""
import importlib.util
import json
import os
from pathlib import Path
import re
from urllib.parse import quote

spec = importlib.util.spec_from_file_location("release_chain", Path(__file__).with_name("codela-release-chain.py"))
chain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chain)
REPO = chain.REPO
PREFIX = "[Codela CI]"
FAILURES = {"failure", "timed_out", "startup_failure", "action_required", "stale"}
# Canceled/superseded checks are not actionable failures. No production retry.
RETRY_SETUP_STEPS = {"Set up job", "Set up runner", "Run actions/checkout@v4"}


def marker(run):
    return "<!-- codela-ci-run:" + str(int(run["id"])) + " -->"


def trusted_run(run):
    return (run.get("repository", {}).get("full_name") == REPO
            and run.get("head_repository", {}).get("full_name") == REPO
            and chain.SHA.fullmatch(run.get("head_sha", "")) is not None)


def scope(run):
    """Return current owned PR or main-release context, never a fork or stale head."""
    if not trusted_run(run):
        return None
    head = run["head_sha"]
    if run["event"] == "pull_request":
        for linked in run.get("pull_requests", []):
            p = chain.repo_api("pulls/" + str(int(linked["number"])))
            if (p["state"] == "open" and not p["draft"] and
                p["user"]["login"].lower() == chain.OWNER.lower() and
                p["head"].get("repo", {}).get("full_name") == REPO and
                p["base"]["ref"] == "main" and p["head"]["sha"] == head and
                chain.exact_pr_run(run, p["number"], head, p["base"]["sha"])):
                approval = chain.approved_pr(p)
                authorized = bool(approval and approval[:2] == (head, p["base"]["sha"])
                                  and chain.main_sha() == p["base"]["sha"])
                return {"pr": p["number"], "version": approval[2] if authorized else None, "authorized": authorized}
        return None
    if run.get("head_branch") != "main" or run["event"] not in {"push", "workflow_dispatch", "workflow_run", "issue_comment"}:
        return None
    current = chain.main_sha()
    manifest = json.loads(chain.file_at(chain.MANIFEST, current)[0])
    if head != current and head != manifest.get("source_sha"):
        return None
    if head != current:
        # Only accept the exact release-source parent of a manifest-only commit.
        commit = chain.repo_api("commits/" + current)
        if (len(commit["parents"]) != 1 or commit["parents"][0]["sha"] != head or
            {x["filename"] for x in commit["files"]} != {chain.MANIFEST}):
            return None
    return {"pr": None, "version": manifest.get("version") if head == manifest.get("source_sha") else None,
            "authorized": False}


def may_retry(run, context, jobs):
    if run["event"] != "pull_request" or not context["authorized"] or run.get("run_attempt", 1) != 1:
        return False
    if run["conclusion"] == "startup_failure":
        return True
    failed = [j for j in jobs if j.get("conclusion") in FAILURES]
    if not failed:
        return False
    # Only infrastructure/setup failures, not failed tests or deployments.
    for job in failed:
        steps = [s for s in job.get("steps", []) if s.get("conclusion") in FAILURES]
        if not steps or any(s.get("name") not in RETRY_SETUP_STEPS for s in steps):
            return False
    return True


def safe_name(value):
    # Workflow/job labels are metadata, not raw logs. Strip line breaks, mentions,
    # markdown and suspicious long tokens; never publish arbitrary log excerpts.
    value = re.sub(r"[^A-Za-z0-9 ._()/:-]", " ", str(value))
    return re.sub(r"\S{40,}", "[redacted]", value)[:100]


def find_issue(run):
    # Use title prefix and immutable run marker. Search all states, not just open.
    # The workflow serializes events for the same run; API pagination avoids old duplicates.
    for issue in chain.pages("issues?state=all&per_page=100"):
        if ("pull_request" not in issue and issue.get("title", "").startswith(PREFIX)
                and marker(run) in (issue.get("body") or "") and
                issue.get("user", {}).get("login") == "github-actions[bot]"):
            return issue
    return None


def issue_body(run, context, jobs):
    rid = int(run["id"])
    lines = [marker(run), "Otomatik CI hata raporu. Yayın güvenlik kontrolleri atlanmadı.",
             "", "- Workflow: " + safe_name(run.get("name", "")),
             "- Sonuç: " + safe_name(run["conclusion"]),
             "- Commit: " + run["head_sha"],
             "- Deneme: " + str(int(run.get("run_attempt", 1))),
             "- Actions: https://github.com/" + REPO + "/actions/runs/" + str(rid)]
    if context["pr"]:
        lines.append("- PR: #" + str(int(context["pr"])))
    if context["version"]:
        lines.append("- Sürüm: " + safe_name(context["version"]))
    for j in jobs:
        if j.get("conclusion") not in FAILURES:
            continue
        jid = int(j["id"])
        steps = [str(int(s["number"])) for s in j.get("steps", []) if s.get("conclusion") in FAILURES]
        lines.append("- Başarısız iş: " + safe_name(j.get("name", "")) +
                     " (adım numarası: " + (", ".join(steps) or "belirsiz") +
                     "); https://github.com/" + REPO + "/actions/runs/" + str(rid) + "/job/" + str(jid))
    lines += ["", "Tam loglar Actions bağlantısındadır; gizli verileri korumak için Issue'ya kopyalanmaz.",
              "Otomatik yeniden deneme yalnızca yetkili PR'ın ilk kurulum/runner hatasında yapılabilir.",
              "FTP, paket bütünlüğü ve kod hataları otomatik olarak yeniden çalıştırılmaz."]
    return "\n".join(lines)


def handle(run):
    if run.get("status") != "completed" or not trusted_run(run):
        return
    existing = find_issue(run)
    if run["conclusion"] == "success":
        if existing and existing["state"] == "open":
            chain.repo_api("issues/" + str(existing["number"]), method="PATCH",
                           data={"state": "closed", "state_reason": "completed"})
            print("Resolved exact run", run["id"])
        return
    if run["conclusion"] not in FAILURES:
        return
    context = scope(run)
    if context is None:
        return
    jobs = chain.repo_api("actions/runs/" + str(int(run["id"])) + "/attempts/" +
                          str(int(run.get("run_attempt", 1))) + "/jobs?per_page=100")["jobs"]
    body = issue_body(run, context, jobs)
    retry = may_retry(run, context, jobs) and existing is None
    if retry:
        body += "\n\nİlk geçici runner/checkout hatası için bir yeniden deneme isteniyor."
    if existing:
        if existing["state"] == "open":
            chain.repo_api("issues/" + str(existing["number"]), method="PATCH", data={"body": body})
        # Respect manually closed issues; never reopen or retry a previously reported run.
        return
    issue = chain.repo_api("issues", method="POST", data={
        "title": PREFIX + " " + safe_name(run.get("name", "")) + " · " + run["head_sha"][:8] + " · " + str(int(run["id"])),
        "body": body, "assignees": [chain.OWNER]})
    print("Failure issue", issue["number"])
    if retry:
        chain.repo_api("actions/runs/" + str(int(run["id"])) + "/rerun-failed-jobs", method="POST")
        print("One bounded infrastructure retry requested")


def main():
    chain.require(REPO in {"muhammetdkaya/codela", "muhammetdkaya/codela-storefront"}, "Unexpected repository")
    payload = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    run_id = int(payload["workflow_run"]["id"])
    # Fetch the latest run rather than trusting an old completion payload.
    run = chain.repo_api("actions/runs/" + str(run_id))
    handle(run)


if __name__ == "__main__":
    main()
