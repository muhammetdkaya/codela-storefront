const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const script=fs.readFileSync('theme/codela-storefront/assets/scripts/document-continuity.js','utf8');
(async()=>{const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const head=(root,fallback)=>`<header><div class="sf-brand sf-context-brand"><a data-sf-context-back ${root?'data-sf-context-root hidden':''} href="${fallback}" aria-label="Back"><svg></svg></a><span class="sf-context-label" ${root?'':'hidden'}>Hakkımızda</span></div></header>`;
 await page.route('https://store.test/**',route=>{const url=new URL(route.request().url());const root=url.pathname==='/about/';const product=url.pathname==='/product/item/';const post=url.pathname==='/blog/article/';const html=`<!doctype html><html><head><script>window.codelaSFDocument={excluded:['https://store.test/checkout/']}</script></head><body>${root||product||post?head(root,product?'/shop/':post?'/blog/':'/'):''}<nav id="sf-menu"><a id="menu-about" href="/about/">About</a></nav><main id="sf-content"><a id="content-about" href="/about/">About</a><a id="product" href="/product/item/">Product</a><a id="post" href="/blog/article/">Post</a></main><script>${script}</script></body></html>`;return route.fulfill({contentType:'text/html',body:html});});
 const back=()=>page.locator('[data-sf-context-back]');
 await page.goto('https://store.test/');await page.locator('#menu-about').click();assert(!await back().isVisible());assert(await page.locator('.sf-context-label').isVisible());
 await page.reload();assert(!await back().isVisible());
 await page.goto('https://store.test/source/?filter=blue');await page.locator('#content-about').click();assert(await back().isVisible());assert.equal(await back().getAttribute('href'),'https://store.test/source/?filter=blue');assert.equal((await back().innerText()).trim(),'');await page.reload();assert(await back().isVisible());
 await page.goto('https://store.test/shop/?filter=blue');await page.locator('#product').click();assert.equal(await back().getAttribute('href'),'https://store.test/shop/?filter=blue');
 await page.evaluate(()=>sessionStorage.clear());await page.goto('https://store.test/product/item/');assert.equal(await back().getAttribute('href'),'/shop/');
 await page.goto('https://store.test/blog/article/');assert.equal(await back().getAttribute('href'),'/blog/');
 await page.goto('https://store.test/checkout/');await page.locator('#content-about').click();assert(!await back().isVisible(),'checkout is excluded as back destination');
 console.log('Header: menu roots, content paths, filtered return, refresh, product/blog fallbacks and checkout exclusion passed.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
