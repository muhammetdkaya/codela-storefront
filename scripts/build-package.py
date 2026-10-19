"""Build the standalone theme ZIP and checksum metadata."""
import hashlib,json,os,re,zipfile
from pathlib import Path
ROOT=Path("theme/codela-storefront")
PUBLIC="https://github.com/muhammetdkaya/codela-storefront/releases/download/"
def build():
    version=re.search(r"^Version:\s*(\S+)",(ROOT/"style.css").read_text(),re.M).group(1)
    commit=os.environ.get("GITHUB_SHA","")
    if not re.fullmatch(r"\d+\.\d+\.\d+",version) or not re.fullmatch(r"[0-9a-f]{40}",commit):
        raise ValueError("Invalid version or source commit")
    out=Path("dist");out.mkdir(exist_ok=True)
    target=out/("codela-storefront-"+version+".zip")
    with zipfile.ZipFile(target,"w",compression=zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(ROOT.rglob("*")):
            if file.is_symlink():raise ValueError("Symlink rejected")
            if file.is_file():
                info=zipfile.ZipInfo("codela-storefront/"+file.relative_to(ROOT).as_posix(),(2026,1,1,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
                archive.writestr(info,file.read_bytes())
    metadata={"theme":"codela-storefront","version":version,"source_sha":commit,"sha256":hashlib.sha256(target.read_bytes()).hexdigest(),"package":PUBLIC+"v"+version+"/"+target.name}
    metadata.update(json.loads((ROOT/"config/release.json").read_text()))
    (out/"manifest.json").write_text(json.dumps(metadata,sort_keys=True))
if __name__=="__main__":build()
