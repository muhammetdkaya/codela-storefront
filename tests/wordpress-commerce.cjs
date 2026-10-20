// Actual WP/Woo/Codela endpoints in the disposable layout site, never production.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const dir=process.env.SF_REPORT_DIR,seed=JSON.parse(fs.readFileSync(dir+'/layout-seed.json'));
if(!seed.account.startsWith('http://127.0.0.1:8888/'))throw new Error('Disposable site only');
(async()=>{const engine=process.env.SF_ENGINE||'chromium',browser=await(engine==='webkit'?webkit:chromium).launch();
const report={versions:seed.versions,engine,checks:[]};let page;
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();
 const errors=[];page.on('pageerror',e=>{if(!e.message.includes('ResizeObserver loop'))errors.push(e.message)});
 await page.goto(seed.account,{waitUntil:'networkidle'});
 assert.equal(await page.locator('script[type=module][src*="storefront.js"]').count(),0,'Guest account does not load the store controller graph');
 assert.equal(await page.locator('.sf-auth-google').count(),0,'An unconfigured OAuth provider is not offered');
 assert.equal(await page.locator('link[href*="journal.css"]').count(),0,'Account does not load journal layout');
 assert(await page.locator('form.woocommerce-form-login').isVisible());
 report.checks.push('Guest native forms work without storefront graph; unavailable Google is hidden');
 await page.goto('http://127.0.0.1:8888/?add-to-cart='+seed.pid,{waitUntil:'networkidle'});
 await page.goto(seed.checkout,{waitUntil:'networkidle'});
 for(const width of [320,390,700,1024,1440]){
  await page.setViewportSize({width,height:900});
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
  const notice=page.locator('.woocommerce-form-coupon-toggle .woocommerce-info');
  assert.equal(await notice.evaluate(e=>getComputedStyle(e,'::before').content),'none','Old Woo notification icon removed');
  assert.equal(await notice.evaluate(e=>getComputedStyle(e).borderTopWidth),'1px');
  if(!await page.locator('form.checkout_coupon').isVisible())await page.locator('a.showcoupon').click();
  await page.locator('#coupon_code').fill('layout-invalid');
  await page.locator('button[name=apply_coupon]').click();
  await page.locator('.woocommerce-error').first().waitFor();
  assert(await page.locator('.woocommerce-error').first().innerText(),'Real native coupon error stays visible');
  assert.equal(await page.locator('.woocommerce-error').first().evaluate(e=>getComputedStyle(e,'::before').content),'none');
  const buttons=await page.locator('#place_order,button[name=apply_coupon]').evaluateAll(nodes=>nodes.map(e=>{const c=getComputedStyle(e);return{height:e.getBoundingClientRect().height,radius:c.borderRadius,paint:c.backgroundColor,color:c.color,type:e.type}}));
  assert(buttons.every(b=>b.height>=44&&b.type==='submit'));
  assert.equal(buttons[0].paint,buttons[1].paint,'Coupon and order use the same Button');assert.equal(buttons[0].radius,buttons[1].radius);
  const order=await page.locator('#order_review').evaluate(e=>({background:getComputedStyle(e).backgroundColor,payment:getComputedStyle(e.querySelector('#payment')).backgroundColor}));
  assert.equal(order.background,'rgb(255, 255, 255)');assert.equal(order.payment,'rgba(0, 0, 0, 0)','One review surface');
  await page.screenshot({path:`${dir}/${engine}-commerce-checkout-${width}.png`,fullPage:true});
 }
 await page.locator('#coupon_code').fill('layout-ten');await page.locator('button[name=apply_coupon]').click();
 await page.locator('.cart-discount').waitFor();assert(await page.locator('.cart-discount').innerText().then(t=>t.includes('layout-ten')));
 await page.locator('#billing_first_name').fill('Preserved');
 await page.locator('.woocommerce-remove-coupon').click();await page.locator('.cart-discount').waitFor({state:'detached'});
 assert.equal(await page.locator('#billing_first_name').inputValue(),'Preserved','Coupon recalculation preserves form values');
 report.checks.push('Native invalid/valid/remove coupon, fragment repaint, preserved billing and shared Button at five widths');
 // Mobile single photo must keep its first frame while the adapter is delayed.
 await page.setViewportSize({width:390,height:844});let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/scripts/product-information.js*',async route=>{await gate;await route.continue()});
 const loading=page.goto(seed.simple,{waitUntil:'load'});loading.catch(()=>{});
 await page.locator('.woocommerce-product-gallery__image').first().waitFor();
 const before=await page.locator('.woocommerce-product-gallery__image').first().boundingBox();
 release();await loading;await page.locator('body.sf-product-sheet-ready').waitFor();
 const after=await page.locator('.woocommerce-product-gallery__image').first().boundingBox();
 assert(Math.abs(before.height-after.height)<1&&Math.abs(before.y-after.y)<1,JSON.stringify({before,after}));
 await page.unroute('**/scripts/product-information.js*');report.checks.push('Actual single Woo photo has zero delayed-mount geometry shift');
 await page.goto('http://127.0.0.1:8888/wp-login.php');await page.locator('#user_login').fill('layout-customer');await page.locator('#user_pass').fill('layout-customer-local');
 await Promise.all([page.waitForNavigation(),page.locator('#wp-submit').click()]);
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(seed.account+'edit-account/',{waitUntil:'networkidle'});
  await page.locator('#account_first_name').fill('');await page.locator('button[name=save_account_details]').click();
  await page.locator('.woocommerce-error').first().waitFor();
  assert.equal(await page.locator('.woocommerce-error').first().evaluate(e=>getComputedStyle(e,'::before').content),'none');
  assert.equal(await page.locator('button[name=save_account_details]').evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)');
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
  await page.screenshot({path:`${dir}/${engine}-commerce-account-error-${width}.png`,fullPage:true});
  for(const endpoint of ['orders','edit-address']){
   await page.goto(seed.account+endpoint+'/',{waitUntil:'networkidle'});
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
   await page.screenshot({path:`${dir}/${engine}-commerce-account-${endpoint}-${width}.png`,fullPage:true});
  }
 }
 report.checks.push('Native edit-account validation, order actions and module addresses retain shared theme styling');
 assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/${engine}-commerce.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){if(page){await page.screenshot({path:`${dir}/${engine}-commerce-failure.png`,fullPage:true}).catch(()=>{});}throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
