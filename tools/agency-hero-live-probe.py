"""Read-only live Agency verification after the paired theme and plugin deploy."""
import re
import urllib.request
import time
from html import unescape

site='https://codela.dev'
headers={'User-Agent':'CodelaAgencyReadOnlyProbe/0.1.343',
         'Cache-Control':'no-cache, no-store, max-age=0','Pragma':'no-cache'}

def fetch(path):
    req=urllib.request.Request(site+path,headers=headers)
    with urllib.request.urlopen(req,timeout=28) as res:
        return res.status,res.headers,res.read().decode('utf-8','replace')

status,head,style=fetch('/wp-content/themes/codela-storefront/style.css')
m=re.search(r'(?m)^Version:\s*([0-9.]+)',style)
ver=m.group(1) if m else 'unknown'
print('LIVE_THEME_VERSION',ver,flush=True)
assert ver=='0.1.343', 'Theme FTP version is not 0.1.343'

results=[]
for i,uri in enumerate(['/', '/?codela_agency_probe=0343-'+str(int(time.time()))]):
    st,h,html=fetch(uri)
    def yes(x):return x in html
    r={
       'status':st,
       'bytes':len(html),
       'scroll':yes('sf-agency-widget--scroll'),
       'screen':yes('sf-agency-preview-browser'),
       'interactive':yes('data-agency-scroll-device'),
       'old_cards':yes('sf-agency-widget--cards'),
       'services':yes('sf-agency-widget--services'),
       'process':yes('sf-agency-widget--process'),
       'css_version_0343':yes('0.1.343'),
       'cache_control':h.get('Cache-Control','')
    }
    result=re.search(r'<h1[^>]*id="sf-agency-scroll-[^"]*"[^>]*>(.*?)</h1>',html,re.S)
    r['hero_title']=unescape(re.sub(r'<[^>]*>','',result.group(1))).strip()[:130] if result else '(no 3D heading)'
    print('LIVE_HOME',i,r,flush=True)
    results.append(r)
assert all(r['status']==200 and r['scroll'] and r['screen'] and r['interactive'] and
           r['services'] and r['process'] for r in results), 'Saved homepage is still not the new agency 3D starter'
print('LIVE_3D_AGENCY_HERO_OK',flush=True)
