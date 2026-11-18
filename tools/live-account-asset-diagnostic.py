#!/usr/bin/env python3
"""Public read-only Account asset and markup diagnostic (no visitor data)."""
import re, urllib.request, urllib.parse, time
from html import unescape

u='https://codela.dev/hesabim/'
data=''
for attempt in range(4):
    req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1','Accept':'text/html,application/xhtml+xml','Accept-Language':'tr-TR,tr;q=0.9','Cache-Control':'no-store'})
    with urllib.request.urlopen(req,timeout=30) as r:
        data=r.read().decode('utf-8','replace')
        print('HTML_TRY',attempt,'STATUS',r.status,'LEN',len(data),'FINAL_URL',r.url.split('?')[0],flush=True)
    if 'data-sf-auth-rendered="server"' in data:break
    time.sleep(1.0)
print('HAS SSR markup', 'data-sf-auth-rendered="server"' in data)
print('HAS native woo form','woocommerce-form-login' in data)
print('HAS head boot','sf-auth-ssr-enabled' in data)
print('HAS theme CSS link','auth-smart.css' in data)
print('HAS account CSS link','account.css' in data)
print('HAS auth script','auth-smart.js' in data)
print('HAS auth loader','auth-loader.js' in data)
for regex in ['<html[^>]+>','<body[^>]+>']:
 m=re.search(regex,data,re.I|re.S)
 print('TAG',m.group(0)[:800] if m else 'absent')
for key in ['auth-smart.css','account.css','quick-login.css','auth-smart.js','auth.js']:
    idx=data.find(key)
    print('ASSET',key,'position',idx)
    if idx<0:continue
    before=data.rfind('<',0,idx)
    after=data.find('>',idx)
    tag=data[before:after+1] if before>=0 and after>idx else ''
    print('  TAG',tag[:600])
    found=re.search(r'(?:href|src)=["\x27]([^"\x27]+)',tag,re.I)
    if not found:
        print('  NO_SRC_HREF')
        continue
    addr=unescape(found.group(1))
    if addr.startswith('//'):addr='https:'+addr
    elif addr.startswith('/'):addr='https://codela.dev'+addr
    try:
        with urllib.request.urlopen(urllib.request.Request(addr,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=22) as res:
            body=res.read().decode('utf-8','replace')
            print('  HTTP',res.status,'bytes',len(body),'MIME',res.headers.get('Content-Type'))
            if key=='auth-smart.css':
                print('  CSS_HAS_SSR_SELECTOR','html.sf-auth-ssr-enabled' in body)
            if key=='auth-smart.js':
                print('  JS_HAS_HYDRATE',"shell.dataset.sfSmartBound='1'" in body)
    except Exception as e:
        print('  FETCH_FAIL',type(e).__name__,str(e)[:180])
