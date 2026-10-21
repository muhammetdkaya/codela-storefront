const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=['tokens.css','components.css','account.css'].map(p=>fs.readFileSync('theme/codela-storefront/assets/styles/'+p,'utf8')).join('\n');
const render=env=>execFileSync(process.env.PHP_BIN||'php',['tests/render-account-dashboard.php'],{encoding:'utf8',env:{...process.env,...env}});
(async()=>{
 for(const width of [320,390,800,1280,1440]){
  const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true,...(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote','--single-process']}:{})});
  try{
   const page=await browser.newPage({viewport:{width,height:1000},javaScriptEnabled:false});
   for(const [name,env] of [['order',{}],['empty',{ACCOUNT_EMPTY:'1'}],['cancelled',{ACCOUNT_CANCELLED:'1'}]]){
    const html=render(env);
    assert(!html.includes('Hello')&&!html.includes('<h1>'),'No title or greeting block');
    assert(html.includes('hook:woocommerce_account_dashboard')&&html.includes('hook:woocommerce_after_account_navigation'),'Independent module hooks retained');
    await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f8f7f4}.sf-content{max-width:1180px;margin:auto!important}'+css+'</style></head><body class="woocommerce-account logged-in sf-account-dashboard"><main class="sf-content">'+html+'</main></body></html>');
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'No horizontal overflow');
    const nav=page.locator('.woocommerce-MyAccount-navigation'), content=page.locator('.woocommerce-MyAccount-content');
    const n=await nav.boundingBox(), c=await content.boundingBox();
    if(width<=800){
     assert(n.y>=c.y+c.height,'Mobile account hub follows recent order');
     assert(await nav.locator('a[href="/account/orders/"]').isVisible(),'Native destinations available without JS');
     assert(await nav.locator('a[href="/account/privacy/"]').isVisible(),'Independent plugin destination retained');
     assert(!await nav.locator('a[aria-current="page"]').isVisible(),'Hub does not repeat its own destination');
     assert.equal(await nav.locator('summary').count(),0,'No redundant disclosure');
     await nav.locator('a[href="/account/orders/"]').focus();
     assert(await nav.locator('a[href="/account/orders/"]').evaluate(e=>e===document.activeElement),'Hub keyboard access');
    }else{
     assert(c.x>=n.x+n.width,'Desktop sidebar and content sit alongside');
     assert(await nav.locator('a').first().isVisible(),'Desktop destinations available without JS');
     assert.equal(await nav.locator('summary').count(),0,'No redundant desktop disclosure control');
    }
    if([390,1280].includes(width)){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-account-hub-${name}-${process.env.TEST_WEBKIT?'webkit':'chromium'}-${width}.png`});}
    if(name==='empty'){
     assert.equal(await page.locator('.sf-account-order-item').count(),0);
     assert(await page.getByRole('link',{name:'Browse products'}).isVisible(),'Empty customer gets real shop link');
    }else{
     assert.equal(await page.locator('.sf-account-order-item strong').innerText(),'<Test product with a very long title & characters>','Order item escaped');
     assert(await page.locator('.sf-account-order-item').innerText().then(t=>t.includes('1 more items')),'Multiple items not silently omitted');
     assert.equal(await page.getByRole('link',{name:'View order',exact:true}).getAttribute('href'),'/account/view-order/1048/');
     assert.equal(await page.getByRole('link',{name:'View order',exact:true}).evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)','Account links cannot override the shared primary foreground');const button=await page.getByRole('link',{name:'View order',exact:true}).boundingBox();assert(button.height>=44,'Shared primary target retains touch size');
     assert.equal(await page.locator('.sf-account-status--active').count(),name==='cancelled'?0:1,'Status styling follows actual order state');
    }
   }
   const emptyOrders=render({ACCOUNT_ORDERS_EMPTY:'1'});
   assert(emptyOrders.includes('hook:woocommerce_before_account_orders')&&emptyOrders.includes('hook:woocommerce_after_account_orders'),'Empty orders retain native verification/module hooks');
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f8f7f4}'+css+'</style></head><body class="woocommerce-account logged-in"><main class="sf-content">'+emptyOrders+'</main></body></html>');
   assert(await page.locator('.sf-account-empty-orders').isVisible());
   assert(await page.locator('body').evaluate(e=>e.matches('.woocommerce-account.logged-in')),'Endpoint fixture retains account scope');
   if(width<=800)assert(!await page.locator('.woocommerce-MyAccount-navigation').isVisible(),'Endpoint uses header back rather than repeating hub navigation');
   assert.equal(await page.locator('.sf-account-empty-orders a').getAttribute('href'),'/shop/');
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'Empty orders fit narrow screen');
   if([390,1280].includes(width)){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-empty-orders-${process.env.TEST_WEBKIT?'webkit':'chromium'}-${width}.png`});}
   const wooNoticeCSS='.wc-block-components-notice-banner>.wc-block-components-notice-banner__content .wc-forward{appearance:none;background:transparent!important;border:0;color:#2f2f2f!important;float:right;margin:0 0 0 20px;opacity:.7;padding:0!important;text-decoration-line:underline;transition:all .2s ease-in-out}';
   await page.setContent('<!doctype html><html><head><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0}'+css+wooNoticeCSS+'</style></head><body class="woocommerce-account logged-in"><main class="sf-content"><div class="woocommerce"><div class="woocommerce-MyAccount-content"><div class="wc-block-components-notice-banner is-info"><div class="wc-block-components-notice-banner__content"><a class="woocommerce-Button button wc-forward wp-element-button" href="/shop/">Browse products</a>No downloads available yet.</div></div></div></div></main></body></html>');
   const action=page.locator('.wc-forward');
   const style=await action.evaluate(e=>{const s=getComputedStyle(e);return {color:s.color,background:s.backgroundColor,opacity:s.opacity,padding:s.paddingLeft,height:e.getBoundingClientRect().height,float:s.cssFloat}});
   assert.equal(style.color,'rgb(255, 255, 255)','Native block notice cannot force dark Button text');
   assert(!['transparent','rgba(0, 0, 0, 0)'].includes(style.background),'Native block notice cannot erase Button surface');
   assert.equal(style.padding,'20px');assert.equal(style.opacity,'1');assert.equal(style.float,'none');assert(style.height>=44);
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
   await action.focus();assert(await action.evaluate(e=>e===document.activeElement),'Native action remains keyboard accessible');
   if([390,1440].includes(width)){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-account-notice-${process.env.TEST_WEBKIT?'webkit':'chromium'}-${width}.png`});}
   console.log(`Account overview ${width}px: native no-JS menu, endpoints, owned order, empty/cancelled states passed`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1)});
