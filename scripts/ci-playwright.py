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

CLI = ["node", "node_modules/playwright/cli.js"]
ENGINES = {"chromium", "webkit", "firefox"}
UBUNTU_KEYRING = Path("/usr/share/keyrings/ubuntu-archive-keyring.gpg")
UBUNTU_SOURCES = """Types: deb
URIs: https://archive.ubuntu.com/ubuntu/
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: https://security.ubuntu.com/ubuntu/
Suites: noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
"""
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


def install_system_dependencies(engines):
    if os.environ.get("GITHUB_ACTIONS") != "true" or os.environ.get("RUNNER_OS") != "Linux":
        raise RuntimeError("OS dependency fallback is restricted to GitHub Ubuntu runners")
    os_release = Path("/etc/os-release").read_text()
    if 'VERSION_ID="24.04"' not in os_release or "\nID=ubuntu\n" not in "\n" + os_release:
        raise RuntimeError("Unexpected runner OS for dependency fallback")
    if not UBUNTU_KEYRING.is_file():
        raise RuntimeError("Ubuntu archive keyring is missing")
    sources = UBUNTU_SOURCES
    with tempfile.TemporaryDirectory(prefix="codela-playwright-") as name:
        tmp = Path(name)
        tmp.chmod(0o755)
        source_dir = tmp / "sources"
        source_dir.mkdir(mode=0o755)
        (source_dir / "ubuntu.sources").write_text(sources)
        # Limit only this apt invocation window to the official signed Ubuntu
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
