"""Read-only production menu/agency structural diagnostic; no logins or writes."""
import re,urllib.request,urllib.error,random
from html import unescape

base="https://codela.dev"
paths=["/","/?probe_menu=1","/hizmetler/","/hesabim/"]
for path in paths:
  print("BEGIN",path,flush=True)
  req=urllib.request.Request(base+path,headers={
    "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Accept":"text/html,application/xhtml+xml",
    "Accept-Language":"tr-TR,tr;q=0.9",
    "Cache-Control":"no-cache,no-store",
  })
  try:
    with urllib.request.urlopen(req,timeout=28) as r:
      html=r.read().decode("utf-8","replace")
      print("HTTP",r.status,"LENGTH",len(html),"CACHE",r.headers.get("x-litespeed-cache","none"),flush=True)
  except (urllib.error.URLError,TimeoutError) as e:
    print("REQUEST ERROR",type(e).__name__,flush=True)
    continue
  print("WAF_OR_CHALLENGE",('<body' not in html.lower()) or ('data-agency-widget' not in html and len(html)<16000),flush=True)
  for marker in [
    'data-agency-widget="cards"','data-agency-widget="scroll"',
    'data-agency-widget="services"','data-agency-widget="process"',
    'sf-agency-swap-card','data-agency-container-scroll',
    'sf-agency-preview-browser','sf-mobile-dock',
    'sf-account','sf-auth-critical-first-paint'
  ]:
    print("COUNT",marker,html.count(marker),flush=True)
  for m in re.finditer(r'<[^>]*data-agency-widget="([^"]+)"[^>]*>',html):
    print("WIDGET",m.group(1),re.sub(r"\s+"," ",m.group(0))[:230],flush=True)
  print("END",path,flush=True)
