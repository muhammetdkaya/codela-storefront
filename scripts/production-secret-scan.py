#!/usr/bin/env python3
"""High-confidence secret detection; never print secret matches."""
import argparse, re, subprocess, sys
RULES = {
    "github-token": re.compile(rb"\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{50,255})\b"),
    "aws-access-key": re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "stripe-live-key": re.compile(rb"\b(?:sk|rk)_live_[A-Za-z0-9]{20,255}\b"),
    "google-oauth-secret": re.compile(rb"\bGOCSPX-[A-Za-z0-9_-]{20,100}\b"),
    "openai-key": re.compile(rb"\bsk-(?:proj-|svcacct-)[A-Za-z0-9_-]{40,255}\b"),
    "private-key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----"),
}
def git(*args):
    return subprocess.check_output(["git", *args])
def matches(data):
    return [name for name, pattern in RULES.items() if pattern.search(data)]
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--history", action="store_true", help="Scan all reachable Git blobs, including deleted files")
    parser.add_argument("--self-test", action="store_true")
    args=parser.parse_args()
    if args.self_test:
        assert matches(b"gh"+b"p_"+b"a"*36)==["github-token"]
        assert matches(b"ordinary env var FTP_PASSWORD")==[]
        assert matches(b"-----BEGIN "+b"RSA PRIVATE KEY-----")==["private-key"]
        print("Secret scanner self-test passed")
        return 0
    if args.history:
        # Scan unique blobs once. Never print commit contents or paths containing values.
        entries=git("rev-list","--objects","--all").splitlines()
    else:
        entries=[line.split(b"\t",1)[0].split()[2]+b" "+line.split(b"\t",1)[1] for line in git("ls-tree","-r","-z","HEAD").split(b"\0") if line and line.split()[1]==b"blob"]
    seen=set(); findings=0
    with subprocess.Popen(["git","cat-file","--batch"],stdin=subprocess.PIPE,stdout=subprocess.PIPE) as proc:
        for entry in entries:
            oid=entry.split(b" ",1)[0]
            if oid in seen: continue
            seen.add(oid)
            proc.stdin.write(oid+b"\n");proc.stdin.flush()
            meta=proc.stdout.readline().split()
            if len(meta)!=3: raise RuntimeError("Git object unavailable")
            size=int(meta[2]); remaining=size; tail=b""; found=set()
            while remaining:
                block=proc.stdout.read(min(remaining,1024*1024))
                if not block: raise RuntimeError("Truncated Git object")
                remaining-=len(block)
                if meta[1]==b"blob": found.update(matches(tail+block));tail=(tail+block)[-512:]
            if proc.stdout.read(1)!=b"\n": raise RuntimeError("Git framing error")
            for rule in sorted(found):
                print("Possible secret:",rule,"object",oid.decode("ascii")[:12])
                findings+=1
        proc.stdin.close()
        if proc.wait()!=0: raise RuntimeError("Git object scan failed")
    print("Scanned",len(seen),"unique objects;",findings,"findings")
    return int(bool(findings))
if __name__=="__main__":
    sys.exit(main())
