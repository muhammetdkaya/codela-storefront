"""Fixed theme-only FTPS deployment with verified staging and rollback."""
import ftplib,hashlib,io,json,os,re,ssl,urllib.parse,urllib.request,uuid
from pathlib import Path
TARGET="codela-storefront"
PUBLIC="https://codela.dev/wp-content/themes/codela-storefront/"
MANIFEST=".codela-deploy-manifest.json"

def build_manifest(files):
    return json.dumps({
        "format":1,"theme":TARGET,"site":"https://codela.dev",
        "files":{path:hashlib.sha256(data).hexdigest() for path,data in sorted(files.items())}
    },sort_keys=True,separators=(",",":")).encode()

def checked_manifest(raw):
    record=json.loads(raw)
    if not isinstance(record,dict) or record.get("format")!=1 or record.get("theme")!=TARGET or record.get("site")!="https://codela.dev":
        raise RuntimeError("Invalid existing deployment manifest")
    entries=record.get("files")
    if not isinstance(entries,dict) or not entries or "style.css" not in entries:
        raise RuntimeError("Incomplete existing deployment manifest")
    for path,digest in entries.items():
        if not isinstance(path,str) or not re.fullmatch(r"[A-Za-z0-9_.@+ -]+(?:/[A-Za-z0-9_.@+ -]+)*",path) or any(part in (".","..") for part in path.split("/")) or path==MANIFEST or not isinstance(digest,str) or not re.fullmatch(r"[a-f0-9]{64}",digest):
            raise RuntimeError("Unsafe existing deployment manifest")
    return record

def delta_plan(files,previous):
    hashes=json.loads(build_manifest(files))["files"]
    old=previous["files"] if previous is not None else {}
    changed={path:data for path,data in files.items() if old.get(path)!=hashes[path]}
    retired=sorted(set(old)-set(files))
    return changed,retired
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
    if MANIFEST in files or not valid_theme(files.get("style.css",b"")) or "templates/index.html" not in files:raise RuntimeError("Invalid theme")
    return files
def main():
    password=os.environ.get("FTP_PASSWORD","")
    server=os.environ.get("FTP_SERVER","").strip()
    username=os.environ.get("FTP_USERNAME","")
    if not password or not server or not username:
        print("Missing FTP_PASSWORD, FTP_SERVER or FTP_USERNAME; no connection attempted.");return 1
    files=package_files()
    ftp=ftplib.FTP_TLS(context=ssl.create_default_context(),timeout=30)
    stage="connect";originals={};changed=[];temporary=[];marker_temp=None;marker_switched=False;marker_before=None
    backup=Path(os.environ["RUNNER_TEMP"])/"storefront-rollback";backup.mkdir(exist_ok=True)
    try:
        for attempt in range(3):
            try:
                ftp.connect(server,21);stage="TLS/authentication"
                ftp.auth();ftp.login(username,password);ftp.prot_p();ftp.set_pasv(True)
                break
            except ftplib.error_temp:
                ftp.close()
                if attempt==2:raise
                import time
                time.sleep(20)
                ftp=ftplib.FTP_TLS(context=ssl.create_default_context(),timeout=30)
        stage="select fixed theme directory"
        account_root=ftp.pwd()
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
        def probe_mapping():
            probe="codela-theme-probe-"+uuid.uuid4().hex+".txt";nonce=uuid.uuid4().hex.encode()
            try:
                put(probe,nonce)
                if read_url(PUBLIC+probe+"?nocache="+uuid.uuid4().hex)!=nonce:raise RuntimeError("Wrong public mapping")
            finally:ftp.delete(probe)
        stage="verify public mapping"
        try:probe_mapping()
        except urllib.error.HTTPError as mapping_error:
            if mapping_error.code!=404 or ftp.pwd()==account_root:raise
            # A restricted FTP account may expose the theme itself as "/" even before installation.
            ftp.cwd(account_root);root_files=names()
            if "style.css" in root_files:
                if not valid_theme(get("style.css")):raise RuntimeError("Unexpected account root theme")
            elif root_files-{".ftpquota",".htaccess","index.php","index.html"}:raise RuntimeError("Unexpected account root")
            print("Retry public mapping at restricted account root.")
            probe_mapping()
        stage="compare verified deployment manifest"
        root_files=names()
        if MANIFEST in root_files:
            marker_before=get(MANIFEST)
        previous=checked_manifest(marker_before) if marker_before is not None else None
        changed_files,retired=delta_plan(files,previous)
        print("Theme delta: %d changed/new, %d unchanged, %d retired (of %d files)." % (
            len(changed_files),len(files)-len(changed_files),len(retired),len(files)),flush=True)
        stage="stage theme files";directories={"."}
        for path,data in changed_files.items():
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
        temporary.sort(key=lambda item:item[1]=="style.css")
        for temp,path in temporary:ftp.rename(temp,path);changed.append(path)
        stage="remove retired theme files"
        for path in retired:
            try:old=get(path)
            except ftplib.error_perm:continue
            originals[path]=old
            target=backup/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(old)
            ftp.delete(path);changed.append(path)
        stage="verify public source and store"
        for path in ("style.css","assets/storefront.js","assets/storefront.css"):
            if read_url(PUBLIC+path+"?nocache="+uuid.uuid4().hex)!=files[path]:raise RuntimeError("Public mismatch")
        read_url("https://codela.dev/?storefront_check="+uuid.uuid4().hex);read_url("https://codela.dev/wp-json/")
        stage="record verified release"
        marker_temp=MANIFEST+".stage-"+uuid.uuid4().hex
        put(marker_temp,build_manifest(files))
        ftp.rename(marker_temp,MANIFEST)
        marker_temp=None;marker_switched=True
        if get(MANIFEST)!=build_manifest(files):raise RuntimeError("Manifest readback mismatch")
        print("Storefront deployed; %d theme files uploaded, %d retired; health and checksums passed." % (len(changed_files),len(retired)),flush=True)
        return 0
    except Exception as error:
        if marker_switched:
            try:
                if marker_before is None:ftp.delete(MANIFEST)
                else:
                    previous_temp=MANIFEST+".rollback-"+uuid.uuid4().hex
                    put(previous_temp,marker_before);ftp.rename(previous_temp,MANIFEST)
            except Exception:print("WARNING: Manifest rollback incomplete; inspect remote marker.")
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
        if marker_temp is not None:
            try:ftp.delete(marker_temp)
            except Exception:pass
        for temp,path in temporary:
            if path not in changed:
                try:ftp.delete(temp)
                except Exception:pass
        try:ftp.quit()
        except Exception:ftp.close()
if __name__=="__main__":raise SystemExit(main())
