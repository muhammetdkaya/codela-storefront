#!/usr/bin/env python3
"""Install locked Playwright engines, and OS libraries only if a real launch fails.

The dependency fallback is restricted to the disposable Ubuntu 24.04 GitHub
runner. Never disable apt signature verification, use foreign package sources,
or suppress a failed browser launch.
"""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit

CLI = ["node", "node_modules/playwright/cli.js"]
ENGINES = {"chromium", "webkit", "firefox"}
UBUNTU_SOURCES = Path("/etc/apt/sources.list.d/ubuntu.sources")
PROBE = r"""
const {chromium, webkit, firefox} = require('playwright');
const engines = {chromium, webkit, firefox};
(async () => {
  for (const name of process.argv.slice(1)) {
    const browser = await engines[name].launch({headless:true, timeout:30000});
    try {
      const page = await browser.newPage();
      await page.setContent('<title>codela-ci-probe</title>');
      if (await page.title() !== 'codela-ci-probe') throw Error('Browser probe failed: '+name);
    } finally {
      await browser.close();
    }
  }
})().catch(error => { console.error(error); process.exitCode=1; });
"""


def validate_engines(engines):
    if not engines or len(engines) != len(set(engines)) or not set(engines) <= ENGINES:
        raise ValueError("Pass a unique list of supported Playwright engines")


def run(command):
    subprocess.run(command, check=True)


def probe(engines):
    return subprocess.run(["node", "-e", PROBE, *engines], check=False).returncode == 0


def checked_ubuntu_sources(text):
    """Allow only runner-provided Ubuntu archive/security endpoints."""
    uris = []
    for line in text.splitlines():
        if line.startswith("URIs:"):
            uris.extend(line.split(":", 1)[1].split())
        if line.startswith(("Trusted:", "Allow-Insecure:", "Allow-Weak:", "Allow-Downgrade-To-Insecure:")):
            if line.split(":", 1)[1].strip().lower() in {"yes", "true", "1"}:
                raise RuntimeError("Unsafe apt source configuration")
    if not uris:
        raise RuntimeError("Ubuntu apt sources not found")
    for uri in uris:
        host = urlsplit(uri).hostname or ""
        if urlsplit(uri).scheme not in {"http", "https"} or not (
            host in {"archive.ubuntu.com", "security.ubuntu.com", "ports.ubuntu.com"}
            or host.endswith(".archive.ubuntu.com")
        ):
            raise RuntimeError("Unexpected Ubuntu apt source; refusing dependency installation")
    return text


def install_system_dependencies(engines):
    if os.environ.get("GITHUB_ACTIONS") != "true" or os.environ.get("RUNNER_OS") != "Linux":
        raise RuntimeError("OS dependency fallback is restricted to GitHub Ubuntu runners")
    os_release = Path("/etc/os-release").read_text()
    if 'VERSION_ID="24.04"' not in os_release or "\nID=ubuntu\n" not in "\n" + os_release:
        raise RuntimeError("Unexpected runner OS for dependency fallback")
    sources = checked_ubuntu_sources(UBUNTU_SOURCES.read_text())
    with tempfile.TemporaryDirectory(prefix="codela-playwright-") as name:
        tmp = Path(name)
        tmp.chmod(0o755)
        source_dir = tmp / "sources"
        source_dir.mkdir(mode=0o755)
        (source_dir / "ubuntu.sources").write_text(sources)
        # Limit only this apt invocation window to the runner's signed Ubuntu
        # repositories. Playwright invokes apt via sudo, so use a temporary apt
        # config file rather than an environment variable that sudo may drop.
        config = tmp / "apt.conf"
        config.write_text(
            'Dir::Etc::sourcelist "/dev/null";\n'
            f'Dir::Etc::sourceparts "{source_dir}";\n'
            'Acquire::Retries "2";\n'
            'APT::Update::Error-Mode "any";\n'
        )
        target = "/etc/apt/apt.conf.d/99-" + tmp.name
        try:
            run(["sudo", "install", "-m", "0644", str(config), target])
            run([*CLI, "install-deps", *engines])
        finally:
            run(["sudo", "rm", "-f", target])


def prepare(engines):
    validate_engines(engines)
    # On a cache hit Playwright reuses its own matching engine binaries.
    run([*CLI, "install", *engines])
    if probe(engines):
        print("Browser launch verified; no apt installation needed", flush=True)
        return
    print("Browser launch requires system dependency preparation", flush=True)
    install_system_dependencies(engines)
    if not probe(engines):
        raise RuntimeError("Browser launch still fails after dependency installation")
    print("Browser launch verified after dependency preparation", flush=True)


if __name__ == "__main__":
    prepare(sys.argv[1:])
