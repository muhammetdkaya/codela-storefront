import hashlib,importlib.util,json,os,tempfile,unittest,zipfile
from pathlib import Path
from unittest.mock import patch
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
build=module("build","scripts/build-package.py");deploy=module("deploy","scripts/deploy.py")
class Tests(unittest.TestCase):
    def test_theme_identity(self):
        self.assertFalse(deploy.valid_theme(b"Theme Name: Other\nText Domain: codela-storefront\n"))
        self.assertFalse(deploy.valid_theme(b"Theme Name: Codela Storefront\nText Domain: other\n"))
        self.assertTrue(deploy.valid_theme((build.ROOT/"style.css").read_bytes()))
    def test_theme_owned_settings_schema(self):
        schema_path=build.ROOT/"config/settings.json"
        schema=json.loads(schema_path.read_text(encoding="utf-8"))
        self.assertEqual(schema["schema_version"],1)
        sections={section["id"]:section for section in schema["sections"]}
        self.assertEqual(set(sections),{"header","homepage","footer"})
        fields=[field["id"] for section in schema["sections"] for field in section["fields"]]
        self.assertEqual(len(fields),len(set(fields)))
        self.assertEqual(set(fields),{"brand","menu_id","hero_product_id","footer_text"})
        self.assertTrue(all(field["type"] in {"text","menu","product"} for section in schema["sections"] for field in section["fields"]))
        self.assertIn("wp:codela/storefront-footer", (build.ROOT/"parts/footer.html").read_text())
        self.assertIn("codela_sf_footer", (build.ROOT/"inc/render.php").read_text())
        self.assertIn("Version: 0.1.5", (build.ROOT/"style.css").read_text())
    def test_fullscreen_panel_controls_do_not_show_automatic_focus_rings(self):
        css=(build.ROOT/"assets/storefront.css").read_text()
        js=(build.ROOT/"assets/storefront.js").read_text()
        self.assertIn("#sf-panel button.sf-close",css)
        self.assertIn("#sf-panel #sf-query",css)
        self.assertIn("#sf-panel .sf-initial-focus:focus-visible",css)
        self.assertIn("border:0!important",css)
        self.assertIn("outline:none!important",css)
        self.assertIn("initialFocus.classList.add('sf-initial-focus')",js)
        self.assertIn("event.key === 'Tab'",js)
        self.assertIn("dialog.querySelectorAll('.sf-initial-focus').forEach",js)
    def test_search_and_cart_panels_have_no_repeated_copy(self):
        render=(build.ROOT/"inc/render.php").read_text()
        js=(build.ROOT/"assets/storefront.js").read_text()
        css=(build.ROOT/"assets/storefront.css").read_text()
        self.assertIn("placeholder=\"<?php esc_attr_e( 'Search products', 'codela-storefront' ); ?>\"",render)
        self.assertNotIn("Search by product name or SKU",render)
        self.assertNotIn("Type at least two characters.",render)
        self.assertNotIn("sf-cart-link",render)
        self.assertIn("results.textContent = ''; return;",js)
        self.assertIn("dialog.classList.toggle('is-search-panel', name === 'search')",js)
        self.assertIn("#sf-panel.is-search-panel #sf-panel-title",css)
        self.assertNotIn(".sf-cart-link{",css)
        self.assertIn("Version: 0.1.5", (build.ROOT/"style.css").read_text())
    def test_balanced_header_and_source_anchored_panel_animation(self):
        render=(build.ROOT/"inc/render.php").read_text()
        css=(build.ROOT/"assets/storefront.css").read_text()
        js=(build.ROOT/"assets/storefront.js").read_text()
        header=render.split('<header class="sf-header">',1)[1].split('</header>',1)[0]
        self.assertLess(header.index('data-panel="menu"'),header.index('class="sf-brand"'))
        self.assertLess(header.index('class="sf-brand"'),header.index('data-panel="search"'))
        self.assertLess(header.index('data-panel="search"'),header.index('data-panel="cart"'))
        self.assertEqual(header.count('data-panel='),3)
        self.assertIn("grid-template-columns:minmax(0,1fr) minmax(0,auto) minmax(0,1fr)",css)
        self.assertIn("const sourceRect = trigger?.getBoundingClientRect();",js)
        self.assertIn("placePanelReveal(revealRect);",js)
        self.assertIn("const panel = dialog.getBoundingClientRect();",js)
        self.assertIn("clip-path:inset(var(--sf-reveal-top,0px)",css)
        self.assertIn("clip-path:inset(0px round 0px)",css)
        self.assertIn("closing = setTimeout(finish, PANEL_MOTION_MS)",js)
        self.assertIn("PANEL_MOTION_MS = 420",js)
        self.assertIn("prefers-reduced-motion:reduce",css)
        self.assertIn("font-size:16px",css)
        self.assertIn("min-height:50px",css)
        self.assertIn("Version: 0.1.5", (build.ROOT/"style.css").read_text())
    def test_missing_secret_never_connects(self):
        with patch.dict(os.environ,{"FTP_PASSWORD":""}),patch.object(deploy.ftplib,"FTP_TLS") as ftp:
            self.assertEqual(deploy.main(),1);ftp.assert_not_called()
    def test_reproducible_package(self):
        root=build.ROOT.resolve();previous=Path.cwd()
        with tempfile.TemporaryDirectory() as temp,patch.object(build,"ROOT",root),patch.dict(os.environ,{"GITHUB_SHA":"a"*40}):
            try:
                os.chdir(temp);build.build()
                meta=json.loads(Path("dist/manifest.json").read_text());archive=Path("dist")/Path(meta["package"]).name
                data=archive.read_bytes();build.build()
                self.assertEqual(data,archive.read_bytes());self.assertEqual(hashlib.sha256(data).hexdigest(),meta["sha256"])
                with zipfile.ZipFile(archive) as zip:
                    self.assertIn("codela-storefront/templates/index.html",zip.namelist())
                    self.assertIn("codela-storefront/config/settings.json",zip.namelist())
                    self.assertTrue(all(n.startswith("codela-storefront/") and ".." not in n.split("/") for n in zip.namelist()))
            finally:os.chdir(previous)

class FakeFTP:
    def __init__(self,files):self.files=files
    def connect(self,*a):pass
    def auth(self):pass
    def login(self,*a):pass
    def prot_p(self):pass
    def set_pasv(self,*a):pass
    def pwd(self):return "/codela-storefront"
    def mlsd(self,directory="."):
        prefix="" if directory=="." else directory+"/"
        return [(n[len(prefix):],{"type":"file"}) for n in self.files if n.startswith(prefix) and "/" not in n[len(prefix):]]
    def mkd(self,*a):pass
    def retrbinary(self,cmd,callback):callback(self.files[cmd[5:]])
    def storbinary(self,cmd,stream):self.files[cmd[5:]]=stream.read()
    def rename(self,src,dest):self.files[dest]=self.files.pop(src)
    def delete(self,path):del self.files[path]
    def close(self):pass
class DeploymentTests(unittest.TestCase):
    def run_deploy(self,failure=None):
        old={"style.css":b"Theme Name: Codela Storefront\nText Domain: codela-storefront\nVersion: 0.1.0\n","assets/storefront.js":b"old","custom.txt":b"keep"}
        files=dict(old);ftp=FakeFTP(files)
        new={"style.css":(build.ROOT/"style.css").read_bytes(),"assets/storefront.js":b"new","assets/storefront.css":b"css","support/packages/manifest.json":b"{}"}
        def read(url):
            path=url.split("?")[0].removeprefix(deploy.PUBLIC)
            if failure=="mapping" and path.startswith("codela-theme-probe-"):return b"wrong"
            if failure=="health" and url.startswith("https://codela.dev/?"):raise RuntimeError("health")
            return files[path] if url.startswith(deploy.PUBLIC) else b"ok"
        with tempfile.TemporaryDirectory() as temp,patch.dict(os.environ,{"FTP_PASSWORD":"test","FTP_SERVER":"example.test","FTP_USERNAME":"theme-user","RUNNER_TEMP":temp}),patch.object(deploy.ftplib,"FTP_TLS",return_value=ftp),patch.object(deploy,"package_files",return_value=new),patch.object(deploy,"read_url",side_effect=read):
            result=deploy.main()
        self.assertFalse(any(".stage-" in n or n.startswith("codela-theme-probe-") for n in files))
        self.assertEqual(files["custom.txt"],b"keep")
        return result,files,old,new
    def test_success_only_changes_theme_files(self):
        result,files,old,new=self.run_deploy();self.assertEqual(result,0)
        for name,data in new.items():self.assertEqual(files[name],data)
    def test_mapping_failure_keeps_old_theme(self):
        result,files,old,new=self.run_deploy("mapping");self.assertEqual(result,1);self.assertEqual(files,old)
    def test_failed_health_restores_old_theme(self):
        result,files,old,new=self.run_deploy("health");self.assertEqual(result,1);self.assertEqual(files,old)

if __name__=="__main__":unittest.main()

