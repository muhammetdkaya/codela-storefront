// The real core router is tested post-deploy. This checks controller ownership,
// delay, navigation guards and the visual placeholder in an isolated browser.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
let script=fs.readFileSync('theme/codela-storefront/assets/scripts/navigation-controller.js','utf8')
 .replace(/^import .*;\s*$/gm,'')
 .replace("import('@wordpress/interactivity-router')","Promise.resolve({actions:{navigate:window.__routeNavigate}})");
const css=fs.readFileSync('theme/codela-storefront/assets/styles/navigation-loading.css','utf8');
const main=(type='home')=>'<main id="sf-content" class="sf-content" data-wp-router-region="codela/storefront/main" data-sf-route-type="'+type+'"><h1>Example</h1><p>Page content</p></main>';
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  const html = '<!doctype html><html><head><style>'+css+'</style></head><body>'+
   '<header id="persistent-header">Codela</header><div class="sf-shell has-mobile-dock">'+
   '<a id="to-content" data-sf-route="content" href="https://store.test/about/">About</a>'+
   '<a id="to-checkout" href="https://store.test/checkout/">Checkout</a>'+
   '<nav class="sf-mobile-dock has-selection"><a class="sf-dock-item" data-dock-view="home" aria-current="page" data-sf-route="home" href="https://store.test/">Home</a></nav></div>'+
   main()+'<script>window.__routeState={url:"https://store.test/",navigating:false};window.__watchers=[];window.store=()=>({state:window.__routeState});window.watch=fn=>{window.__watchers.push(fn);fn()};window.__duration=350;window.__routeCalls=0;window.__routeNavigate=(url)=>new Promise(resolve=>{window.__routeCalls++;window.__routeState.navigating=true;window.__watchers.forEach(fn=>fn());setTimeout(()=>{document.querySelector("#sf-content").outerHTML='+JSON.stringify(main('page'))+';history.pushState({},'',new URL(url).pathname);window.__routeState.url=url;window.__routeState.navigating=false;window.__watchers.forEach(fn=>fn());resolve()},window.__duration)});</script></body></html>';
  await page.route('https://store.test/**',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto('https://store.test/');
  await page.addScriptTag({content:script});
  await page.locator('#persistent-header').evaluate(el=>{el.dataset.original='yes'});
  await page.locator('#to-content').click();
  await page.waitForTimeout(210);
  assert.equal(await page.locator('.sf-route-skeleton').count(),1,'Skeleton visible after 160ms only in main');
  assert.equal(await page.locator('#persistent-header').getAttribute('data-original'),'yes','Header stays in DOM');
  assert.equal(await page.locator('.sf-mobile-dock').count(),1,'One dock retained during navigation');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.sf-route-skeleton').count(),0,'Skeleton removed after new page');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),null,'Home no longer active after page');
  assert.equal(await page.locator('main').getAttribute('tabindex'),'-1','New main focusable');
  assert.equal(await page.locator('main').evaluate(el=>document.activeElement===el),true,'Focus moves to new content');
  // Subsequent fast cached route does not flash skeleton.
  await page.evaluate(()=>{window.__duration=30});
  await page.locator('.sf-dock-item').click();
  await page.waitForTimeout(70);
  assert.equal(await page.locator('.sf-route-skeleton').count(),0,'Quick navigation never displays placeholder');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),'page','Home active again');
  // Native checkout and modified-clicks are not intercepted.
  const before=await page.evaluate(()=>window.__routeCalls||0);
  await page.locator('#to-content').click({modifiers:['Control']});
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>window.__routeCalls||0),before,'Modified navigation not hijacked');
  assert.equal(await page.locator('#to-checkout').getAttribute('data-sf-route'),null,'Checkout left to browser');
  console.log('Shell navigation: persistent header/dock, slow skeleton, fast no-flash, focus and native fallback passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
