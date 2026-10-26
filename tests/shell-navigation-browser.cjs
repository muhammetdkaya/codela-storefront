// The real core router is tested post-deploy. This checks controller ownership,
// immediate feedback, navigation guards and the visual placeholder in an isolated browser.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
let script=fs.readFileSync('theme/codela-storefront/assets/scripts/navigation-controller.js','utf8')
 .replace(/^import .*;\s*$/gm,'')
 .replace("import('@wordpress/interactivity-router')","Promise.resolve({actions:{navigate:window.__routeNavigate}})");
const documentScript=fs.readFileSync('theme/codela-storefront/assets/scripts/document-continuity.js','utf8');
const css=['tokens','navigation-loading'].map(name=>fs.readFileSync('theme/codela-storefront/assets/styles/'+name+'.css','utf8')).join('\n');
const main=(type='home')=>'<main id="sf-content" class="sf-content" data-wp-router-region="codela/storefront/main" data-sf-route-type="'+type+'"><h1>Example</h1><p>Page content</p></main>';
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  const html = '<!doctype html><html><head><title>Home</title><style>'+css+'</style></head><body>'+
   '<header id="persistent-header"><a data-sf-context-back href="https://store.test/"><span>Home</span></a></header><div class="sf-shell has-mobile-dock">'+
   '<a id="to-content" data-sf-route="content" href="https://store.test/about/">About</a>'+
   '<a id="to-checkout" href="https://store.test/checkout/">Checkout</a>'+
   '<nav class="sf-mobile-dock has-selection"><a class="sf-dock-item" data-dock-view="home" aria-current="page" data-sf-route="home" href="https://store.test/">Home</a></nav></div>'+
   main()+'<script>window.__routeState={url:"https://store.test/",};window.__watchers=[];window.store=()=>({state:window.__routeState});window.watch=fn=>{window.__watchers.push(fn);fn()};window.__duration=350;window.__routeCalls=0;window.__routeNavigate=(url)=>new Promise(resolve=>{window.__routeCalls++;window.__watchers.forEach(fn=>fn());setTimeout(()=>{document.querySelector("#sf-content").outerHTML='+JSON.stringify(main('page'))+';history.pushState({},"",new URL(url).pathname);document.title=new URL(url).pathname==="/about/"?"About":"Home";window.__routeState.url=url;window.__watchers.forEach(fn=>fn());resolve()},window.__duration)});</script></body></html>';
  await page.route('https://store.test/**',route=>route.fulfill({status:200,contentType:'text/html',body:html}));
  await page.goto('https://store.test/');
  await page.addScriptTag({content:documentScript});
  await page.addScriptTag({content:script});
  await page.locator('#persistent-header').evaluate(el=>{el.dataset.original='yes'});
  const immediate=await page.evaluate(()=>{document.querySelector('#to-content').click();return {count:document.querySelectorAll('.sf-route-skeleton').length,busy:document.querySelector('main').getAttribute('aria-busy'),native:document.querySelectorAll('.sf-document-loading').length};});
  assert.deepEqual(immediate,{count:1,busy:'true',native:0},'Exactly one skeleton is present in the click task');
  assert.equal(await page.locator('.sf-route-skeleton').count(),1,'Skeleton visible immediately in main');
  assert.equal(await page.locator('.sf-route-text').first().evaluate(el=>getComputedStyle(el).animationName),'sf-skeleton-pulse','Core router shares loading motion');
  assert.equal(await page.locator('#persistent-header').getAttribute('data-original'),'yes','Header stays in DOM');
  assert.equal(await page.locator('.sf-mobile-dock').count(),1,'One dock retained during navigation');
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.sf-route-skeleton').count(),0,'Skeleton removed after new page');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),null,'Home no longer active after page');
  assert.equal(await page.locator('main').getAttribute('tabindex'),'-1','New main focusable');
  assert.equal(await page.locator('main').evaluate(el=>document.activeElement===el),true,'Focus moves to new content');
  assert.equal(await page.locator('[data-sf-context-back]').getAttribute('href'),'https://store.test/','First route knows the previous home address');
  assert.equal(await page.locator('[data-sf-context-back] span').innerText(),'Home','Back label names previous home page');
  // Cached responses replace feedback immediately without a minimum dwell time.
  await page.evaluate(()=>{window.__duration=30});
  await page.locator('.sf-dock-item').click();
  await page.waitForTimeout(70);
  assert.equal(await page.locator('.sf-route-skeleton').count(),0,'Quick navigation removes placeholder without a minimum delay');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),'page','Home active again');
  assert.equal(await page.locator('[data-sf-context-back]').getAttribute('href'),'https://store.test/about/','Subsequent same-document route retains the real previous address');
  assert.equal(await page.locator('[data-sf-context-back] span').innerText(),'About','Back label and URL both name the previous page');
  // A history URL update does not force scroll/focus as an explicit click does.
  await page.evaluate(()=>{
    window.__historyScrollCalls=0;
    const original=window.scrollTo;
    window.scrollTo=()=>{window.__historyScrollCalls++};
    window.__routeState.url='https://store.test/about/';
    window.__watchers.forEach(fn=>fn());
    window.scrollTo=original;
  });
  assert.equal(await page.evaluate(()=>window.__historyScrollCalls),0,'History traversal retains browser/core scroll ownership');
  assert.equal(await page.locator('.sf-dock-item').getAttribute('aria-current'),null,'History updates dock selection');
  // Native checkout and modified-clicks are not intercepted.
  const before=await page.evaluate(()=>window.__routeCalls||0);
  await page.locator('#to-content').click({modifiers:['Control']});
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>window.__routeCalls||0),before,'Modified navigation not hijacked');
  assert.equal(await page.locator('#to-checkout').getAttribute('data-sf-route'),null,'Checkout left to browser');
  console.log('Shell navigation: persistent header/dock, immediate skeleton, ready-content replacement, focus and native fallback passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

