"""Event-driven, opt-in release controller. Only trusted main executes here."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

REPO = os.environ.get("GITHUB_REPOSITORY", "")
OWNER = REPO.split("/")[0]
THEME = REPO.endswith("/codela-storefront")
DEPLOY = "deploy.yml" if THEME else "deploy-codela-dev.yml"
RELEASE = "release.yml" if THEME else "github-release.yml"
MANIFEST = ".releases/storefront.json" if THEME else ".releases/github.json"
VERSION_FILE = "theme/codela-storefront/style.css" if THEME else "codela-commerce-toolkit/codela-commerce-toolkit.php"
SHA = re.compile(r"[0-9a-f]{40}")
VERSION = re.compile(r"\d+\.\d+\.\d+")
COMMAND = re.compile(r"/codela-publish ([0-9a-f]{40}) ([0-9a-f]{40}) (\d+\.\d+\.\d+)")
DEPLOY_STEP = "Deploy Storefront only" if THEME else "Verify public mapping, then deploy only the authorized Codela directory"
LIVE_STEP = "Verify live agency pages (no writes)" if THEME else None


def require(ok, message):
    if not ok:
        raise RuntimeError(message)


def api(endpoint, method="GET", data=None, paginate=False):
    args = ["gh", "api", "--method", method, endpoint]
    if paginate:
        args += ["--paginate", "--slurp"]
    if data is not None:
        args += ["--input", "-"]
    out = subprocess.check_output(args, input=json.dumps(data).encode() if data is not None else None)
    return json.loads(out) if out.strip() else None


def repo_api(path, **kw):
    return api("repos/" + REPO + "/" + path, **kw)


def pages(path):
    return [row for page in repo_api(path, paginate=True) for row in page]


def main_sha():
    return repo_api("git/ref/heads/main")["object"]["sha"]


def file_at(path, ref):
    data = repo_api("contents/" + path + "?ref=" + ref)
    return base64.b64decode(data["content"]), data["sha"]


def version_at(ref):
    header, _ = file_at(VERSION_FILE, ref)
    match = re.search(rb"(?m)^\s*\*?\s*Version:\s*(\d+\.\d+\.\d+)\s*$", header)
    require(match is not None, "Missing version header")
    version = match.group(1).decode()
    if not THEME:
        require(("define( 'CODELA_VERSION', '" + version + "' )").encode() in header,
                "Plugin runtime version differs from header")
        readme, _ = file_at("codela-commerce-toolkit/readme.txt", ref)
        require(re.search(rb"(?m)^Stable tag:\s*" + version.encode().replace(b".", b"\\.") + rb"\s*$", readme),
                "Plugin readme version differs from header")
    return version


def ver(value):
    require(VERSION.fullmatch(value or ""), "Invalid semantic version")
    return tuple(map(int, value.split(".")))


def authorization(comments, owner):
    # Only the actual repository owner can authorize or cancel. Head AND base are pinned.
    for c in sorted(comments, key=lambda c: c["id"], reverse=True):
        if c["user"]["login"].lower() != owner.lower():
            continue
        body = c["body"].strip()
        if body == "/codela-cancel":
            return None
        if body.startswith("/codela-publish"):
            match = COMMAND.fullmatch(body)
            return match.groups() if match else None
    return None


def glob_regex(pattern):
    # GitHub's positive path globs; unsupported syntax fails closed rather than skipping checks.
    require(not re.search(r"[!+\[\]\\]", pattern), "Unsupported workflow path filter: " + pattern)
    result = ""
    i = 0
    while i < len(pattern):
        if pattern[i:i+3] == "**/":
            result += "(?:.*/)?"
            i += 3
        elif pattern[i:i+2] == "**":
            result += ".*"
            i += 2
        elif pattern[i] == "*":
            result += "[^/]*"
            i += 1
        elif pattern[i] == "?":
            result += "[^/]"
            i += 1
        else:
            result += re.escape(pattern[i])
            i += 1
    return re.compile("^" + result + "$")


def matches(patterns, value):
    return any(glob_regex(p).fullmatch(value) for p in patterns)


def pr_specs():
    # Read only workflow definitions from trusted main. Ruby/Psych is on ubuntu-24.04.
    ruby = """
require 'yaml'
require 'json'
out = {}
Dir.glob('.github/workflows/*.{yml,yaml}').sort.each do |file|
  data = YAML.safe_load(File.read(file), aliases: true)
  events = data['on'] || data[true]
  if events.is_a?(Hash) && events.key?('pull_request')
    out[File.basename(file)] = {'name'=>data['name'], 'filters'=>events['pull_request'] || {}}
  elsif events == 'pull_request' || (events.is_a?(Array) && events.include?('pull_request'))
    out[File.basename(file)] = {'name'=>data['name'], 'filters'=>{}}
  end
end
puts JSON.generate(out)
"""
    return json.loads(subprocess.check_output(["ruby", "-e", ruby]))


def expected_workflows(files, specs):
    result = set()
    for name, spec in specs.items():
        filters = spec["filters"]
        require(set(filters) <= {"paths", "paths-ignore", "branches", "branches-ignore", "types"},
                "Unsupported pull_request filter in " + name)
        if "branches" in filters and not matches(filters["branches"], "main"):
            continue
        if "branches-ignore" in filters and matches(filters["branches-ignore"], "main"):
            continue
        if "paths" in filters and not any(matches(filters["paths"], p) for p in files):
            continue
        if "paths-ignore" in filters and all(matches(filters["paths-ignore"], p) for p in files):
            continue
        result.add(name)
    return result


def workflow_runs(workflow, head, event):
    out = repo_api("actions/workflows/" + workflow + "/runs?head_sha=" + head + "&event=" + event + "&per_page=100")
    return sorted(out["workflow_runs"], key=lambda x: (x["id"], x.get("run_attempt", 1)), reverse=True)


def exact_pr_run(run, number, head, base):
    return run.get("head_sha") == head and run.get("event") == "pull_request" and any(
        p["number"] == number and p["head"]["sha"] == head and p["base"]["sha"] == base
        for p in run.get("pull_requests", [])
    )


def check_state(runs):
    if not runs or any(r is None or r["status"] != "completed" for r in runs):
        return "pending"
    return "success" if all(r["conclusion"] == "success" for r in runs) else "failed"


def approved_pr(p):
    if p["base"]["ref"] != "main" or not p["head"].get("repo") or p["head"]["repo"]["full_name"] != REPO:
        return None
    return authorization(pages("issues/" + str(p["number"]) + "/comments?per_page=100"), OWNER)


def check_pr(p, approval):
    head, base, version = approval
    number = p["number"]
    if p["state"] != "open" or p["draft"] or p["head"]["sha"] != head or p["base"]["sha"] != base or main_sha() != base:
        print("PR", number, "has moved, is draft or no longer open; new explicit authorization required.")
        return False
    files = [x["filename"] for x in pages("pulls/" + str(number) + "/files?per_page=100")]
    require(len(files) == p["changed_files"], "PR file list incomplete")
    # Release policy and workflow changes require review outside this automatic path.
    require(not any(f.startswith(".github/workflows/") or f.endswith("codela-release-chain.py")
                    or f.startswith(".releases/") for f in files), "Release infrastructure change requires manual merge")
    require(version_at(head) == version, "Approved version does not match the candidate")
    latest = repo_api("releases/latest")["tag_name"].removeprefix("v")
    require(ver(version) > ver(latest), "Release version is not newer than current release")
    required = expected_workflows(files, pr_specs())
    require(DEPLOY in required, "No deploy-validation workflow for this change")
    if not THEME:
        require({"validate-free-edition.yml", "optional-commerce-acceptance.yml"} <= required,
                "Plugin release must include free and optional-commerce validation")
    runs = []
    for workflow in sorted(required):
        candidates = workflow_runs(workflow, head, "pull_request")
        run = next((x for x in candidates if exact_pr_run(x, number, head, base)), None)
        runs.append(run)
        print("PR", number, workflow, run["status"] + "/" + str(run["conclusion"]) if run else "waiting for exact PR head/base")
    state = check_state(runs)
    require(state != "failed", "An authorized PR validation failed; fix it and reauthorize the new revision")
    if state != "success" or p.get("mergeable") is not True:
        return False
    # Re-read source, approval and main immediately before the SHA-guarded merge.
    fresh = repo_api("pulls/" + str(number))
    if approved_pr(fresh) != approval or fresh["head"]["sha"] != head or fresh["base"]["sha"] != base or main_sha() != base:
        return False
    merged = repo_api("pulls/" + str(number) + "/merge", method="PUT",
                      data={"sha": head, "merge_method": "squash",
                            "commit_title": "Release " + version + " (authorized PR #" + str(number) + ")"})
    require(merged["merged"], "GitHub rejected merge")
    source = merged["sha"]
    require(SHA.fullmatch(source), "Unexpected merged SHA")
    require(repo_api("git/commits/" + source)["parents"][0]["sha"] == base,
            "Base changed during merge; automatic deployment blocked")
    print("Merged", number, source)
    return True


def dispatch(workflow, inputs=None):
    data = {"ref": "main"}
    if inputs is not None:
        data["inputs"] = inputs
    repo_api("actions/workflows/" + workflow + "/dispatches", method="POST", data=data)


def deploy_passed(run):
    if run["status"] != "completed" or run["conclusion"] != "success":
        return False
    jobs = repo_api("actions/runs/" + str(run["id"]) + "/attempts/" + str(run.get("run_attempt", 1)) + "/jobs?per_page=100")["jobs"]
    deploy = [j for j in jobs if j["name"] == "deploy" and j["conclusion"] == "success"]
    if len(deploy) != 1:
        return False
    steps = {s["name"]: s["conclusion"] for s in deploy[0]["steps"]}
    return steps.get(DEPLOY_STEP) == "success" and (not LIVE_STEP or steps.get(LIVE_STEP) == "success")


def check_dependency(source):
    if THEME:
        config = json.loads(file_at("theme/codela-storefront/config/release.json", source)[0])
        required = config["requires"].get("codela")
        if required:
            latest = api("repos/" + OWNER + "/codela/releases/latest")["tag_name"].removeprefix("v")
            require(ver(latest) >= ver(required), "Required Codela plugin release is not available")


def release_manifest(source, version):
    if THEME:
        return {"confirm": "PUBLISH_STABLE", "version": version, "source_sha": source, "publish_feed": True}
    return {"version": version, "source_sha": source, "notes": ["Verified automatic release " + version]}


def verify_release(source, version):
    release = repo_api("releases/latest")
    if release["tag_name"] != "v" + version:
        return False
    ref = repo_api("git/ref/tags/v" + version)["object"]
    if ref["type"] == "tag":
        ref = repo_api("git/tags/" + ref["sha"])["object"]
    require(ref["type"] == "commit" and ref["sha"] == source, "Published tag source mismatch")
    name = ("codela-storefront-" if THEME else "codela-commerce-toolkit-") + version + ".zip"
    assets = {a["name"] for a in release["assets"]}
    require(name in assets, "Release ZIP missing")
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.check_call(["gh", "release", "download", "v" + version, "--repo", REPO, "--pattern", name, "--dir", tmp])
        actual = hashlib.sha256((Path(tmp) / name).read_bytes()).hexdigest()
        if THEME:
            stable = json.loads(file_at("manifest.json", "stable")[0])
            require(stable["version"] == version and stable["source_sha"] == source and stable["sha256"] == actual,
                    "Stable feed version/source/hash mismatch")
        else:
            require(name + ".sha256" in assets, "Plugin checksum asset missing")
            subprocess.check_call(["gh", "release", "download", "v" + version, "--repo", REPO,
                                   "--pattern", name + ".sha256", "--dir", tmp])
            require((Path(tmp) / (name + ".sha256")).read_text().split()[0] == actual, "Plugin ZIP hash mismatch")
    print("RELEASE COMPLETE:", REPO, version, source, actual)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a") as out:
            out.write("## Release verified\n\n" + REPO + " v" + version + "\n\nSource: " + source + "\n\nSHA256: " + actual + "\n")
    return True


def advance_merged(p, approval):
    head, base, version = approval
    source = p["merge_commit_sha"]
    if p["head"]["sha"] != head or not SHA.fullmatch(source or ""):
        return
    current = main_sha()
    manifest_bytes, manifest_blob = file_at(MANIFEST, current)
    manifest = json.loads(manifest_bytes)
    matching_manifest = manifest.get("source_sha") == source and manifest.get("version") == version
    # The only allowed successor is the release-request commit itself.
    if current != source:
        if not matching_manifest:
            return
        commit = repo_api("commits/" + current)
        if len(commit["parents"]) != 1 or commit["parents"][0]["sha"] != source or {f["filename"] for f in commit["files"]} != {MANIFEST}:
            return
    require(repo_api("git/commits/" + source)["parents"][0]["sha"] == base, "Merged base does not match authorization")
    require(version_at(source) == version, "Merged version mismatch")
    check_dependency(source)
    runs = workflow_runs(DEPLOY, source, "workflow_dispatch") + workflow_runs(DEPLOY, source, "push")
    runs = sorted(runs, key=lambda x: (x["id"], x.get("run_attempt", 1)), reverse=True)
    run = next((x for x in runs if x["head_branch"] == "main"), None)
    if not run:
        require(current == source, "Cannot dispatch stale source")
        dispatch(DEPLOY, {"source_sha": source})
        print("Deployment dispatched for", source)
        return
    if run["status"] != "completed":
        print("Deployment running", run["id"])
        return
    require(deploy_passed(run), "Deployment failed or actual FTP/live verification was skipped")
    if matching_manifest:
        release_runs = workflow_runs(RELEASE, current, "workflow_dispatch") + workflow_runs(RELEASE, current, "push")
        if release_runs:
            rr = max(release_runs, key=lambda x: (x["id"], x.get("run_attempt", 1)))
            if rr["status"] != "completed":
                print("Release publication running", rr["id"])
                return
            require(rr["conclusion"] == "success", "Release workflow failed")
            require(verify_release(source, version), "Release workflow did not publish expected version")
            return
        if verify_release(source, version):
            return
        require(main_sha() == current, "Main moved before publication")
        dispatch(RELEASE)
        print("Release publication dispatched")
        return
    require(ver(version) > ver(repo_api("releases/latest")["tag_name"].removeprefix("v")), "Refusing to overwrite or downgrade release")
    require(main_sha() == source, "Main moved before release request")
    body = json.dumps(release_manifest(source, version), indent=2, ensure_ascii=False) + "\n"
    result = repo_api("contents/" + MANIFEST, method="PUT", data={
        "message": "Publish verified " + version + " stable release",
        "content": base64.b64encode(body.encode()).decode(), "sha": manifest_blob, "branch": "main"})
    require(result["commit"]["parents"][0]["sha"] == source, "Concurrent main change during release request")
    # GITHUB_TOKEN pushes do not start another workflow. Dispatch explicitly.
    dispatch(RELEASE)
    print("Verified FTP; dispatched release", version)


def main():
    require(REPO in {"muhammetdkaya/codela", "muhammetdkaya/codela-storefront"}, "Unexpected repository")
    # Scan current candidates on every relevant completion; dropped/concurrent events do not strand another stage.
    for p in pages("pulls?state=open&base=main&per_page=100"):
        approval = approved_pr(p)
        if approval:
            check_pr(repo_api("pulls/" + str(p["number"])), approval)
            break
    current = main_sha()
    manifest = json.loads(file_at(MANIFEST, current)[0])
    sources = {current, manifest.get("source_sha")}
    # Recent merged PRs only; exact source+parent checks above prevent old release replay.
    for p in repo_api("pulls?state=closed&base=main&sort=updated&direction=desc&per_page=50"):
        if p.get("merged_at") and p.get("merge_commit_sha") in sources:
            full = repo_api("pulls/" + str(p["number"]))
            approval = approved_pr(full)
            if approval:
                advance_merged(full, approval)
                break


if __name__ == "__main__":
    main()
