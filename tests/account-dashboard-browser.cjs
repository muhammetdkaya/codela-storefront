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
     assert(c.y>=n.y+n.height,'Mobile card follows navigation');
     assert(await nav.locator('a').first().isVisible(),'No-JS keeps native destinations available');
     await nav.locator('summary').click();
     assert(!await nav.locator('a').first().isVisible(),'Native mobile disclosure closes without JS');
     await nav.locator('summary').click();
     assert(await nav.locator('a[href="/account/privacy/"]').isVisible(),'Independent plugin destination appears in disclosure');
     assert(await nav.locator('a[aria-current="page"]').isVisible(),'Native current destination preserved');
     await nav.locator('summary').focus();await page.keyboard.press('Enter');
     assert(!await nav.locator('a').first().isVisible(),'Native keyboard closes menu');
    }else{
     assert(c.x>=n.x+n.width,'Desktop sidebar and content sit alongside');
     assert(await nav.locator('a').first().isVisible(),'Desktop destinations available without JS');
     assert(!await nav.locator('summary').isVisible(),'No redundant desktop disclosure control');
    }
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
   console.log(`Account overview ${width}px: native no-JS menu, endpoints, owned order, empty/cancelled states passed`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1)});
