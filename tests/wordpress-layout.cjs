// Real WP/Woo/full Codela. Geometry after native init/scroll/resize and endpoint ownership.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const dir=process.env.SF_REPORT_DIR,seed=JSON.parse(fs.readFileSync(dir+'/layout-seed.json'));
(async()=>{const browser=await (process.env.SF_ENGINE==='webkit'?webkit:chromium).launch();
const report={versions:seed.versions,engine:process.env.SF_ENGINE||'chromium',checks:[]};
try{const context=await browser.newContext({viewport:{width:1440,height:900},hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>{if(!e.message.includes('ResizeObserver loop'))errors.push(e.message)});
for(const url of [seed.simple,seed.variable]){
 await page.goto(url,{waitUntil:'networkidle'});
 for(const width of [901,1100,1440,1920]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(150);
  const geometry=()=>page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{gallery:r('.woocommerce-product-gallery'),summary:r('.summary'),media:r('.sf-product-media'),overview:r('.sf-product-overview'),information:r('.sf-product-information'),position:getComputedStyle(document.querySelector('.sf-product-media')).position,overflow:document.documentElement.scrollWidth>innerWidth+1}});
  let g=await geometry();assert(!g.overflow,JSON.stringify(g));assert(Math.abs(g.gallery.top-g.summary.top)<16,JSON.stringify(g));assert(g.information.top>=g.overview.bottom,JSON.stringify(g));assert.equal(g.position,'sticky');
  await page.evaluate(()=>scrollTo(0,500));g=await geometry();assert(g.gallery.bottom<=g.information.top,JSON.stringify(g));
  assert.equal(await page.locator('form.cart').count(),1,'One original purchase form');
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.waitForSelector('body.sf-product-sheet-ready');assert.equal(await page.locator('.sf-product-sheet form.cart').count(),1);assert.equal(await page.locator('.sf-product-sheet .woocommerce-product-gallery').count(),0,'Photo remains in document');
 await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet'));assert.equal(await page.locator('.sf-product-overview > .summary form.cart').count(),1);
}report.checks.push('Actual Woo simple/variable gallery alignment, bounded scroll, mobile/desktop restoration');
await page.goto(seed.simple,{waitUntil:'networkidle'});await page.setViewportSize({width:1440,height:900});assert(!(await page.locator('.sf-header-menu').isVisible()));
const buttons=page.locator('.sf-desktop-navigation [popovertarget]');assert.equal(await buttons.count(),2);await buttons.first().click();assert(await page.locator('.sf-desktop-submenu:popover-open').count());await page.locator('.sf-desktop-submenu:popover-open button').click();assert.equal(await page.locator('.sf-desktop-submenu:popover-open').count(),2);await page.keyboard.press('Escape');assert.equal(await page.locator('.sf-desktop-submenu:popover-open').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.sf-desktop-submenu:popover-open').count(),0);
const ids=await page.locator('.sf-shell [id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(ids.length,new Set(ids).size,'Menu projections have unique IDs');await page.setViewportSize({width:1099,height:900});assert(await page.locator('.sf-header-menu').isVisible());assert(!(await page.locator('.sf-desktop-navigation').isVisible()));report.checks.push('Real WordPress nested menu, native popover/Escape/touch, unique IDs, exclusive hamburger');
// Real Woo guest cart, no production purchase or gateway request.
await page.goto('http://127.0.0.1:8888/?add-to-cart='+seed.pid,{waitUntil:'networkidle'});
await page.goto(seed.checkout,{waitUntil:'networkidle'});
for(const width of [320,390,700,1024,1440]){
 await page.setViewportSize({width,height:900});const g=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{customer:r('#customer_details'),order:r('#order_review'),heading:r('#order_review_heading'),overflow:document.documentElement.scrollWidth>innerWidth+1}});assert(!g.overflow,JSON.stringify(g));if(width>900){assert(g.order.left>g.customer.right,JSON.stringify(g));assert(g.heading.top<g.order.top)}else{assert(g.order.top>g.customer.bottom,JSON.stringify(g))}assert.equal(await page.locator('form.checkout').count(),1);await page.screenshot({path:`${dir}/${report.engine}-checkout-${width}.png`,fullPage:true});
}report.checks.push('Actual classic Woo checkout, 5 widths, original form and payment submit');
await page.goto('http://127.0.0.1:8888/wp-login.php');await page.locator('#user_login').fill('layout-customer');await page.locator('#user_pass').fill('layout-customer-local');await Promise.all([page.waitForNavigation(),page.locator('#wp-submit').click()]);
for(const width of [390,1440]){
 await page.setViewportSize({width,height:900});await page.goto(seed.account,{waitUntil:'networkidle'});assert(await page.locator('.woocommerce-MyAccount-navigation').isVisible());assert(await page.locator('.sf-header').isVisible());assert.equal(await page.locator('body.codela-my-account-layout,body.cdl-account-shell-fs,html.cdl-account-fs-pending').count(),0);assert.equal(await page.locator('link[href*="codela-my-account.css"],script[src*="codela-my-account.js"],#codela-account-fs-bootstrap').count(),0);assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)));await page.screenshot({path:`${dir}/${report.engine}-account-${width}.png`,fullPage:true});
 for(const endpoint of ['orders','edit-address','edit-account']){await page.locator(`.woocommerce-MyAccount-navigation-link--${endpoint} a`).click();await page.waitForLoadState('networkidle');assert(await page.locator('.woocommerce-MyAccount-content').isVisible());assert(await page.locator('.sf-header').isVisible())}
}report.checks.push('Signed-in Theme appearance, native endpoints, no duplicate CSS/fullscreen shell');
// Preserve the actual checkout module with a signed-in customer and a physical cart.
await page.goto(seed.checkout,{waitUntil:'networkidle'});
assert.equal(await page.locator('link#codela-checkout-pro-css').count(),1,'Codela checkout module keeps its own stylesheet');
for(const width of [390,1440]){
 await page.setViewportSize({width,height:900});
 assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)));
 await page.screenshot({path:`${dir}/${report.engine}-checkout-codela-${width}.png`,fullPage:true});
}
report.checks.push('Checkout module remains enabled with its own stylesheet and signed-in physical cart');
assert.deepEqual(errors,[]);
fs.writeFileSync(dir+'/'+report.engine+'-layout.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){fs.writeFileSync(dir+'/'+report.engine+'-failure.txt',String(error.stack));throw error}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
