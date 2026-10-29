// Verify server-rendered headers and real same-tab navigations, including
// restrictive referrer policies and plain-permalink exclusions.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const root='theme/codela-storefront/assets/';
const css=['storefront.css','styles/tokens.css','styles/overlay.css','styles/navigation.css','styles/components.css','styles/catalog.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const script=fs.readFileSync(process.env.CONTEXT_SCRIPT||root+'scripts/document-continuity.js','utf8');
const render=env=>execFileSync('php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,...env}});
const headers={home:render({}),shop:render({FIXTURE_CATALOG:'shop'}),category:render({FIXTURE_CATALOG:'category'}),tag:render({FIXTURE_CATALOG:'tag'}),product:render({FIXTURE_PRODUCT:'1'}),page:render({FIXTURE_PAGE:'1'})};
(async()=>{
 const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch();
 try{for(const width of [320,390,1280])for(const policy of ['no-referrer','origin','strict-origin-when-cross-origin']){
  const context=await browser.newContext({viewport:{width,height:850}});const page=await context.newPage();
  await page.route('https://store.test/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.startsWith('/theme/assets/icons/'))return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'icons/'+url.pathname.split('/').pop())});
   if(url.pathname==='/product/redirect')return route.fulfill({status:302,headers:{location:'/product/item/'},body:''});
   const kind=url.pathname==='/shop/'?'shop':url.pathname==='/category/'?'category':url.pathname==='/tag/'?'tag':url.pathname.startsWith('/product/')?'product':url.pathname==='/about/'?'page':'home';
   const body=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="${policy}"><style>${css}</style><script>window.codelaSFDocument={excluded:['https://store.test/?page_id=7','https://store.test/checkout/']};</script><script>${script}</script></head><body>${headers[kind]}<main id="sf-content"><nav class="sf-desktop-navigation" style="display:block!important"><a id="menu-shop" href="/shop/">Shop</a><a id="menu-category" href="/category/">Category</a><a id="menu-about" href="/about/">About</a></nav><ul class="products"><li class="product"><a class="woocommerce-LoopProduct-link woocommerce-loop-product__link" id="product" href="/product/item/"><img alt="Product" width="100" height="100" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"><h2>Product</h2></a></li></ul><a id="related" href="/product/next/">Related product</a><a id="redirect" href="/product/redirect">Redirected product</a><a id="about" href="/about/">About</a></main></body></html>`;
   return route.fulfill({contentType:'text/html',headers:{'cache-control':'no-store'},body});
  });
  const back=()=>page.locator('.sf-header [data-sf-context-back]');
  const title=()=>page.locator('.sf-header .sf-context-label');
  // User's exact report: a real Woo product card on the home page.
  await page.goto('https://store.test/');await page.evaluate(()=>sessionStorage.clear());
  await page.locator('#product').click();
  assert.equal(await back().getAttribute('href'),'https://store.test/',`${width}/${policy} home to product must return home`);
  assert.equal((await back().innerText()).trim(),'');
  await page.reload();assert.equal(await back().getAttribute('href'),'https://store.test/','Reload retains home parent');
  await back().click();assert.equal(new URL(page.url()).pathname,'/','Back action actually opens home');
  // Archive titles are server-rendered, on both desktop and mobile.
  for(const [path,label] of [['/shop/','Mağaza'],['/category/','Bags & more'],['/tag/','Bags & more']]){
   await page.goto('https://store.test'+path);assert.equal((await title().innerText()).trim(),label);assert.equal(await page.locator('.sf-header [data-sf-context-back]:visible').count(),0);assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
  }
  // Product returns to the exact filtered archive, including its query.
  await page.goto('https://store.test/category/?orderby=price&filter_color=blue');await page.locator('#product').click();
  assert.equal(await back().getAttribute('href'),'https://store.test/category/?orderby=price&filter_color=blue');
  await back().click();assert.equal(new URL(page.url()).search,'?orderby=price&filter_color=blue');
  // Returning through a related product must preserve the first product's own parent.
  await page.goto('https://store.test/');await page.locator('#product').click();await page.locator('#related').click();
  assert.equal(await back().getAttribute('href'),'https://store.test/product/item/');await back().click();
  assert.equal(await back().getAttribute('href'),'https://store.test/','Returning through related product retains original home parent');
  // Canonical redirect to a slash URL must keep the clicked source.
  await page.goto('https://store.test/category/?filter=blue');await page.locator('#redirect').click();
  assert.equal(await back().getAttribute('href'),'https://store.test/category/?filter=blue','Canonical product redirect');
  // Menu entries start a top-level page, not a back chain.
  await page.goto('https://store.test/');await page.locator('#menu-about').click();assert(!await back().isVisible());assert.equal(await title().innerText(),'Hakkımızda');
  // A direct visit has the server fallback even if an older record exists.
  await page.goto('https://store.test/');await page.evaluate(()=>sessionStorage.removeItem('sf-context-pending'));
  await page.goto('https://store.test/product/item/');assert.equal(await back().getAttribute('href'),'https://store.test/shop/','Direct entry uses shop fallback');
  await page.goto('https://store.test/?page_id=7');await page.locator('#product').click();assert.equal(await back().getAttribute('href'),'https://store.test/shop/','Plain permalink checkout does not become a back target');
  await page.goto('https://store.test/');await page.locator('#product').click();assert.equal(await back().getAttribute('href'),'https://store.test/','Plain permalink exclusion does not block home');
  await context.close();
 }
 console.log('Real PHP catalog headers and product return: three widths × three referrer policies, direct, filtered, redirect, reload, related, menu and plain permalink passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
