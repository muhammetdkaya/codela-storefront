"""Fixed theme-only FTPS deployment with verified staging and rollback."""
import ftplib,hashlib,io,json,os,re,ssl,urllib.parse,urllib.request,uuid
from pathlib import Path
TARGET="codela-storefront"
PUBLIC="https://codela.dev/wp-content/themes/codela-storefront/"
def read_url(url):
    request=urllib.request.Request(url,headers={"Cache-Control":"no-cache"})
    with urllib.request.urlopen(request,timeout=30) as response:
        final=urllib.parse.urlsplit(response.url)
        if final.scheme!="https" or final.hostname!="codela.dev":raise RuntimeError("Unexpected destination")
        return response.read()
def valid_theme(data):
    return bool(re.search(rb"(?m)^Theme Name:\s*Codela Storefront\s*$",data) and re.search(rb"(?m)^Text Domain:\s*codela-storefront\s*$",data))
def package_files():
    root=Path("theme/codela-storefront");files={}
    for file in sorted(root.rglob("*")):
        if file.is_symlink():raise RuntimeError("Symlink rejected")
        if file.is_file():
            relative=file.relative_to(root).as_posix()
            if ".." in relative.split("/") or "\n" in relative or "\r" in relative:raise RuntimeError("Invalid path")
            files[relative]=file.read_bytes()
    if not valid_theme(files.get("style.css",b"")) or "templates/index.html" not in files:raise RuntimeError("Invalid theme")
    meta=json.loads(Path("dist/manifest.json").read_text())
    archive=Path("dist")/("codela-storefront-"+meta["version"]+".zip")
    files["support/packages/"+archive.name]=archive.read_bytes()
    files["support/packages/manifest.json"]=Path("dist/manifest.json").read_bytes()
    return files
def main():
    password=os.environ.get("FTP_PASSWORD","")
    server=os.environ.get("FTP_SERVER","").strip()
    username=os.environ.get("FTP_USERNAME","")
    if not password or not server or not username:
        print("Missing FTP_PASSWORD, FTP_SERVER or FTP_USERNAME; no connection attempted.");return 1
    files=package_files()
    ftp=ftplib.FTP_TLS(context=ssl.create_default_context(),timeout=30)
    stage="connect";originals={};changed=[];temporary=[]
    backup=Path(os.environ["RUNNER_TEMP"])/"storefront-rollback";backup.mkdir(exist_ok=True)
    try:
        ftp.connect(server,21);stage="TLS/authentication"
        ftp.auth();ftp.login(username,password);ftp.prot_p();ftp.set_pasv(True)
        stage="select fixed theme directory"
        base_entries={name for name,facts in ftp.mlsd()}
        print("FTP scope markers: "+",".join(name for name in ("codela-site","codela-storefront","wp-content","public_html","codela-commerce-toolkit.php") if name in base_entries))
        root_is_theme=False
        if "style.css" in base_entries:
            root_style=io.BytesIO();ftp.retrbinary("RETR style.css",root_style.write)
            root_is_theme=valid_theme(root_style.getvalue())
        print("Account root is Storefront: "+str(root_is_theme))
        if not root_is_theme and not ftp.pwd().rstrip("/").endswith("/"+TARGET):
            try:ftp.cwd(TARGET)
            except ftplib.error_perm:ftp.mkd(TARGET);ftp.cwd(TARGET)
        def get(path):
            stream=io.BytesIO();ftp.retrbinary("RETR "+path,stream.write);return stream.getvalue()
        def put(path,data):
            ftp.storbinary("STOR "+path,io.BytesIO(data))
            if hashlib.sha256(get(path)).digest()!=hashlib.sha256(data).digest():raise RuntimeError("Readback mismatch")
        def names(directory="."):
            return {n for n,f in ftp.mlsd(directory) if f.get("type")=="file"}
        stage="verify theme identity";root_files=names()
        if "style.css" in root_files:
            if not valid_theme(get("style.css")):raise RuntimeError("Unexpected theme")
        elif root_files-{".ftpquota",".htaccess","index.php","index.html"}:raise RuntimeError("Unexpected target")
        stage="verify public mapping";probe="codela-theme-probe-"+uuid.uuid4().hex+".txt";nonce=uuid.uuid4().hex.encode()
        try:
            put(probe,nonce)
            if read_url(PUBLIC+probe+"?nocache="+uuid.uuid4().hex)!=nonce:raise RuntimeError("Wrong public mapping")
        finally:ftp.delete(probe)
        stage="stage theme files";directories={"."}
        for path,data in files.items():
            parts=path.split("/")[:-1]
            for index in range(1,len(parts)+1):
                directory="/".join(parts[:index])
                if directory not in directories:
                    try:ftp.mkd(directory)
                    except ftplib.error_perm:list(ftp.mlsd(directory))
                    directories.add(directory)
            old=get(path) if path.split("/")[-1] in names("/".join(parts) or ".") else None
            originals[path]=old
            if old is not None:
                target=backup/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(old)
            temp=path+".stage-"+uuid.uuid4().hex
            temporary.append((temp,path));put(temp,data)
        stage="switch staged files"
        temporary.sort(key=lambda item:(item[1]=="support/packages/manifest.json",item[1]=="style.css"))
        for temp,path in temporary:ftp.rename(temp,path);changed.append(path)
        stage="verify public source and store"
        for path in ("style.css","assets/storefront.js","assets/storefront.css","support/packages/manifest.json"):
            if read_url(PUBLIC+path+"?nocache="+uuid.uuid4().hex)!=files[path]:raise RuntimeError("Public mismatch")
        read_url("https://codela.dev/?storefront_check="+uuid.uuid4().hex);read_url("https://codela.dev/wp-json/")
        print("Storefront deployed; checks passed.");return 0
    except Exception as error:
        if isinstance(error,urllib.error.HTTPError):print("Public mapping/health HTTP status: "+str(error.code))
        restored=True
        for path in reversed(changed):
            try:
                if originals[path] is None:ftp.delete(path)
                else:put(path,originals[path])
            except Exception:restored=False
        print("STOP at "+stage+" ("+type(error).__name__+"). Credentials/raw responses omitted.")
        if changed:print("Rollback restored." if restored else "Rollback incomplete; use private artifact.")
        return 1
    finally:
        for temp,path in temporary:
            if path not in changed:
                try:ftp.delete(temp)
                except Exception:pass
        ftp.close()
if __name__=="__main__":raise SystemExit(main())
