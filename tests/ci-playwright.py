#!/usr/bin/env python3
"""Offline contracts for the browser bootstrap. No real apt writes."""
import importlib.util
import subprocess
import unittest
from unittest.mock import patch
from pathlib import Path

spec = importlib.util.spec_from_file_location("ci_playwright", Path("scripts/ci-playwright.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

SOURCES = """Types: deb
URIs: http://azure.archive.ubuntu.com/ubuntu/
Suites: noble noble-updates noble-backports
Components: main universe
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
"""

class BootstrapTests(unittest.TestCase):
    def test_valid_browser_avoids_apt(self):
        with patch.object(m, "run") as run, patch.object(m, "probe", return_value=True) as probe, patch.object(m, "install_system_dependencies") as apt:
            m.prepare(["chromium","webkit"])
            run.assert_called_once_with([*m.CLI,"install","chromium","webkit"])
            probe.assert_called_once_with(["chromium","webkit"])
            apt.assert_not_called()

    def test_fallback_then_real_probe(self):
        with patch.object(m, "run"), patch.object(m, "probe", side_effect=[False,True]) as probe, patch.object(m, "install_system_dependencies") as apt:
            m.prepare(["chromium","webkit"])
            apt.assert_called_once_with(["chromium","webkit"])
            self.assertEqual(probe.call_count,2)

    def test_failure_never_passes(self):
        with patch.object(m, "run"), patch.object(m, "probe", return_value=False), patch.object(m, "install_system_dependencies"):
            with self.assertRaises(RuntimeError):
                m.prepare(["webkit"])
        with patch.object(m,"run",side_effect=subprocess.CalledProcessError(1,["node"])), patch.object(m,"probe") as probe:
            with self.assertRaises(subprocess.CalledProcessError):
                m.prepare(["webkit"])
            probe.assert_not_called()

    def test_apt_uses_only_signed_ubuntu_sources(self):
        self.assertEqual(m.checked_ubuntu_sources(SOURCES),SOURCES)
        for bad in [SOURCES+"URIs: https://packages.microsoft.com/ubuntu/24.04/prod\n",
                    SOURCES+"Trusted: yes\n", "Types: deb\n"]:
            with self.assertRaises(RuntimeError):
                m.checked_ubuntu_sources(bad)

    def test_temporary_apt_config_removed_even_on_failure(self):
        calls=[]
        def run(cmd):
            calls.append(cmd)
            if cmd[:2]==["sudo","install"]:
                config=Path(cmd[-2]).read_text()
                self.assertIn('APT::Update::Error-Mode "any"',config)
                self.assertNotIn("AllowUnauthenticated",config)
                self.assertNotIn("packages.microsoft.com",config)
            if cmd[:3]==[*m.CLI,"install-deps"]:
                raise subprocess.CalledProcessError(100,cmd)
        original_read=Path.read_text
        def read(path,*args,**kwargs):
            if path==Path("/etc/os-release"):
                return 'ID=ubuntu\nVERSION_ID="24.04"\n'
            if path==m.UBUNTU_SOURCES:
                return SOURCES
            return original_read(path,*args,**kwargs)
        with patch.dict(m.os.environ,{"GITHUB_ACTIONS":"true","RUNNER_OS":"Linux"}), patch.object(Path,"read_text",read), patch.object(m,"run",side_effect=run):
            with self.assertRaises(subprocess.CalledProcessError):
                m.install_system_dependencies(["webkit"])
        self.assertEqual(calls[-1],["sudo","rm","-f",calls[0][-1]])

    def test_invalid_engines_rejected(self):
        for engines in [[],["chromium","chromium"],["--with-deps"]]:
            with self.assertRaises(ValueError):
                m.prepare(engines)

if __name__=="__main__":
    unittest.main()
