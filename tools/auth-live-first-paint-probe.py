#!/usr/bin/env python3
"""Read-only live My Account first-paint probe; no credentials or HTML dump."""
from html import unescape
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import re
import sys
import time

base = "https://codela.dev/hesabim/"
headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
    "Cache-Control": "no-cache, no-store, max-age=0",
    "Pragma": "no-cache",
}

def fetch(url):
    request = Request(url, headers=headers)
    with urlopen(request, timeout=22) as response:
        return response.status, response.headers, response.read().decode("utf-8", "replace")

def summary(name, url):
    print(f"\\n## {name} — {url}", flush=True)
    try:
        status, response_headers, body = fetch(url)
    except Exception as exc:
        print(f"FETCH_ERROR={type(exc).__name__}: {exc}", flush=True)
        return
    print(f"status={status} bytes={len(body)}", flush=True)
    for key in ["x-litespeed-cache", "x-cache", "cf-cache-status", "age", "cache-control", "vary", "server"]:
        value = response_headers.get(key)
        if value:
            print(f"header.{key}={value[:180]}", flush=True)
    flags = {
        "ssr_markup": 'data-sf-auth-rendered="server"' in body,
        "ssr_prepaint_script": "sf-auth-ssr-enabled" in body,
        "native_woo_form": 'woocommerce-form-login' in body,
        "legacy_booting_script": "sf-auth-booting" in body,
        "smart_auth_asset": "auth-smart.js" in body,
        "account_css": "account.css" in body,
    }
    for key, value in flags.items():
        print(f"{key}={value}", flush=True)
    match = re.search(r'<span[^>]*class="sf-auth-heading-text"[^>]*>(.*?)</span>', body, re.S)
    if match:
        text = re.sub(r'<[^>]+>', '', match.group(1))
        print("heading=" + unescape(text).strip()[:120], flush=True)
    for asset in ["auth-smart.js", "auth-smart.css", "account.css"]:
        hit = re.search(r'(?P<url>[^"\\s<>]*' + re.escape(asset) + r'[^"\\s<>]*)', body)
        if hit:
            # Query-string version only: avoid printing cache tokens or user data.
            matched = unescape(hit.group("url"))
            version = re.search(r'[?&]ver=([^&]+)', matched)
            print(f"{asset}.ver={version.group(1) if version else 'none'}", flush=True)

summary("Canonical guest", base)
summary("Cache-busted guest", base + "?" + urlencode({"sf_auth_first_paint_diagnostic": "0342-" + str(int(time.time()))}))
summary("Public theme stylesheet", "https://codela.dev/wp-content/themes/codela-storefront/style.css")
