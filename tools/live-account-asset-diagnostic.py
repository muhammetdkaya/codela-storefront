#!/usr/bin/env python3
"""Public read-only Account asset and markup diagnostic (no visitor data)."""
import re, urllib.request, urllib.parse, time
from html import unescape

u='https://codela.dev/hesabim/?sf_account_probe=0344-'+str(int(time.time()))
req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1','Cache-Control':'no-store','Pragma':'no-cache'})
with urllib.request.urlopen(req,timeout=30) as r:
    data=r.read().decode('utf-8','replace')
    print('HTML_STATUS',r.status,'LEN',len(data),'FINAL_URL',r.url.split('?')[0],flush=True)
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
 tags=re.findall(r'<(?:link|script)\\b[^>]*'+re.escape(key)+r'[^>]*>',data,re.I|re.S)
 print('ASSET',key,'tags',len(tags))
 for tag in tags[:2]:
  print(' ',tag[:600])
  found=re.search(r'(?:href|src)=["\\x27]([^"\\x27]+)',tag,re.I)
  if not found:continue
  addr=unescape(found.group(1))
  if addr.startswith('//'):addr='https:'+addr
  elif addr.startswith('/'):addr='https://codela.dev'+addr
  try:
   with urllib.request.urlopen(urllib.request.Request(addr,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'}),timeout=22) as res:
    body=res.read().decode('utf-8','replace')
    print('  HTTP',res.status,'bytes',len(body),'MIME',res.headers.get('Content-Type'))
    if key=='auth-smart.css':
     print('  CSS has SSR selector','html.sf-auth-ssr-enabled .woocommerce > .sf-smart-auth' in body)
    if key=='auth-smart.js':
     print('  JS has hydrate marker',"shell.dataset.sfSmartBound='1'" in body)
  except Exception as e:
   print('  FETCH_FAIL',type(e).__name__,str(e)[:180])
