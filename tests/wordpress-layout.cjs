// Real WP/Woo/full Codela. Geometry after native init/scroll/resize and endpoint ownership.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const localOrigin='http://127.0.0.1:8888';
const testUsername=process.env.SF_TEST_USERNAME,testPassword=process.env.SF_TEST_PASSWORD;
if(!testUsername?.trim()||!testPassword)throw new Error('SF_TEST_USERNAME and SF_TEST_PASSWORD are required from the offline disposable harness; no values are logged.');
function requireLocalURL(value,label){
 let url;try{url=new URL(value)}catch{throw new Error('Invalid disposable URL: '+label)}
 if(url.origin!==localOrigin||url.username||url.password)throw new Error('Disposable localhost origin required: '+label);
 return url.href;
}
function redact(value){
 let text=String(value);
 for(const secret of [testPassword,testUsername])text=text.split(secret).join('[redacted]');
 return text;
}
const dir=process.env.SF_REPORT_DIR,seed=JSON.parse(fs.readFileSync(dir+'/layout-seed.json'));
for(const key of ['simple','variable','checkout','account','order'])requireLocalURL(seed[key],'seed '+key);
async function verifyLocalLogin(page){
 const current=new URL(requireLocalURL(page.url(),'login page'));
 if(current.pathname!=='/wp-login.php')throw new Error('Expected the disposable native login page.');
 const form=page.locator('form#loginform');
 if(await form.count()!==1)throw new Error('Expected one disposable native login form.');
 const target=await form.evaluate(el=>({action:el.action,method:el.method}));
 if(new URL(requireLocalURL(target.action,'login form action')).pathname!=='/wp-login.php'||target.method.toLowerCase()!=='post')throw new Error('Expected the disposable native login form action.');
 for(const selector of ['#user_login','#user_pass','#wp-submit']){
  const control=page.locator(selector);
  if(await control.count()!==1||!await control.evaluate(el=>el.form?.id==='loginform'))throw new Error('Expected original disposable login controls.');
 }
 const override=await page.locator('#wp-submit').getAttribute('formaction');
 if(override&&new URL(requireLocalURL(new URL(override,current).href,'login submit action')).pathname!=='/wp-login.php')throw new Error('Unexpected disposable login submit action.');
 const redirect=form.locator('input[name="redirect_to"]');
 if(await redirect.count()){
  const value=await redirect.inputValue();
  if(value)requireLocalURL(new URL(value,current).href,'login redirect');
 }
}
(async()=>{const browser=await (process.env.SF_ENGINE==='webkit'?webkit:chromium).launch();
const report={versions:seed.versions,engine:process.env.SF_ENGINE||'chromium',checks:[]};
try{const context=await browser.newContext({viewport:{width:1440,height:900},hasTouch:true,serviceWorkers:'block'});
// Defense in depth for initial request targets. Playwright routing alone is
// not a redirect-chain firewall; the private harness's network isolation is
// authoritative. Final login page/form targets are rechecked before each use.
await context.route('**/*',route=>{
 try{requireLocalURL(route.request().url(),'browser request')}catch{return route.abort('blockedbyclient')}
 return route.continue();
});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>{if(!e.message.includes('ResizeObserver loop'))errors.push(e.message)});
for(const url of [seed.simple,seed.variable]){
 await page.goto(url,{waitUntil:'networkidle'});
 for(const width of [901,1100,1440,1920]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(150);
  const geometry=()=>page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{gallery:r('.woocommerce-product-gallery'),summary:r('.summary'),media:r('.sf-product-media'),overview:r('.sf-product-overview'),information:r('.sf-product-information'),position:getComputedStyle(document.querySelector('.sf-product-media')).position,overflow:document.documentElement.scrollWidth>innerWidth+1}});
  let g=await geometry();assert(!g.overflow,JSON.stringify(g));assert(Math.abs(g.gallery.top-g.summary.top)<16,JSON.stringify(g));assert(g.information.top>=g.overview.bottom,JSON.stringify(g));assert.equal(g.position,'sticky');assert(g.summary.left-g.gallery.right>=43,'Desktop center gutter retained');assert(g.information.width>=g.overview.width-1,'Information spans both columns');const trust=page.locator('.cdl-tb');if(await trust.count())assert.equal(await page.locator('.summary > .cdl-tb').count(),1,'Original reassurance belongs to summary');
  await page.evaluate(()=>scrollTo(0,500));g=await geometry();assert(g.gallery.bottom<=g.information.top,JSON.stringify(g));
  assert.equal(await page.locator('form.cart').count(),1,'One original purchase form');
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.waitForSelector('body.sf-product-sheet-ready');assert.equal(await page.locator('.sf-product-sheet form.cart').count(),1);assert.equal(await page.locator('.sf-product-sheet .woocommerce-product-gallery').count(),0,'Photo remains in document');
 await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet'));assert.equal(await page.locator('.sf-product-overview > .summary form.cart').count(),1);
}report.checks.push('Actual Woo simple/variable gallery alignment, bounded scroll, mobile/desktop restoration');
await page.goto(seed.simple,{waitUntil:'networkidle'});await page.setViewportSize({width:1440,height:900});assert(!(await page.locator('.sf-header-menu').isVisible()));
const buttons=page.locator('.sf-desktop-navigation [popovertarget]');assert.equal(await buttons.count(),2);await buttons.first().tap();assert(await page.locator('.sf-desktop-submenu:popover-open').count());await page.locator('.sf-desktop-submenu:popover-open button').tap();assert.equal(await page.locator('.sf-desktop-submenu:popover-open').count(),2);await page.keyboard.press('Escape');assert.equal(await page.locator('.sf-desktop-submenu:popover-open').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.sf-desktop-submenu:popover-open').count(),0);
const ids=await page.locator('.sf-shell [id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(ids.length,new Set(ids).size,'Menu projections have unique IDs');await page.setViewportSize({width:1099,height:900});assert(await page.locator('.sf-header-menu').isVisible());assert(!(await page.locator('.sf-desktop-navigation').isVisible()));report.checks.push('Real WordPress nested menu, native popover/Escape/touch, unique IDs, exclusive hamburger');
// Real Woo guest cart, no production purchase or gateway request.
await page.goto(localOrigin+'/?add-to-cart='+encodeURIComponent(seed.pid),{waitUntil:'networkidle'});
await page.goto(seed.checkout,{waitUntil:'networkidle'});
for(const width of [320,390,700,1024,1440]){
 await page.setViewportSize({width,height:900});const g=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{customer:r('#customer_details'),order:r('#order_review'),heading:r('#order_review_heading'),overflow:document.documentElement.scrollWidth>innerWidth+1}});assert(!g.overflow,JSON.stringify(g));if(width>900){assert(g.order.left>g.customer.right,JSON.stringify(g));assert(g.heading.top<g.order.top)}else{assert(g.order.top>g.customer.bottom,JSON.stringify(g))}assert.equal(await page.locator('form.checkout').count(),1);await page.screenshot({path:`${dir}/${report.engine}-checkout-${width}.png`,fullPage:true});
}report.checks.push('Actual classic Woo checkout, 5 widths, original form and payment submit');
await page.goto(localOrigin+'/wp-login.php');
try{
 await verifyLocalLogin(page);await page.locator('#user_login').fill(testUsername);
 await verifyLocalLogin(page);await page.locator('#user_pass').fill(testPassword);
 await verifyLocalLogin(page);await Promise.all([page.waitForNavigation(),page.locator('#wp-submit').click()]);
 requireLocalURL(page.url(),'post-login page');
}catch{throw new Error('Disposable native login failed; credential details are withheld.')}
for(const width of [390,1440]){
 await page.setViewportSize({width,height:900});await page.goto(seed.account,{waitUntil:'networkidle'});assert(await page.locator('.woocommerce-MyAccount-navigation').isVisible());assert(await page.locator('.sf-account-overview').isVisible());assert.equal(await page.locator('.sf-content > .wp-block-post-title').count(),0);assert(!await page.locator('.sf-account-overview').innerText().then(t=>/Hello|Merhaba/.test(t)));assert(await page.locator('.sf-header').isVisible());assert.equal(await page.locator('body.codela-my-account-layout,body.cdl-account-shell-fs,html.cdl-account-fs-pending').count(),0);assert.equal(await page.locator('link[href*="codela-my-account.css"],script[src*="codela-my-account.js"],#codela-account-fs-bootstrap').count(),0);assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)));await page.screenshot({path:`${dir}/${report.engine}-account-${width}.png`,fullPage:true});
 const accountHref=page.url();
 const accountLabel=(await page.locator('.sf-header .sf-context-label').innerText()).trim();
 assert(accountLabel,'The native account root has an accessible destination label');
 const destinations={};
 for(const endpoint of ['orders','edit-address','edit-account']){
  const link=page.locator(`.woocommerce-MyAccount-navigation-link--${endpoint} a`);
  assert.equal(await link.count(),1,'One native account destination: '+endpoint);
  assert(await link.isVisible(),'Account hub exposes its real destination: '+endpoint);
  destinations[endpoint]={href:await link.evaluate(el=>el.href),label:(await link.innerText()).trim()};
  assert.equal(new URL(destinations[endpoint].href).origin,new URL(accountHref).origin,'Account destinations stay on the local site');
 }
 const assertEndpoint=async()=>{
  assert(await page.locator('.woocommerce-MyAccount-content').isVisible());
  assert(await page.locator('.sf-header').isVisible());
  assert.equal(await page.locator('.woocommerce-MyAccount-navigation').count(),1,'Native account navigation is not duplicated');
  assert.equal(await page.locator('.woocommerce-MyAccount-navigation').isVisible(),width>800,'Mobile endpoint uses Back; desktop keeps its native sidebar');
 };
 const followBack=async(destination,label)=>{
  const back=page.locator('.sf-header a[data-sf-account-back]');
  assert.equal(await back.count(),1,'One real header Back link');
  assert(await back.isVisible(),'Back control is visible on the endpoint');
  assert.equal(await back.evaluate(el=>el.href),destination,'Back points to the native parent endpoint');
  const name=await back.getAttribute('aria-label');
  assert(name&&name.endsWith(': '+label),'Accessible Back name identifies its parent: '+name);
  await Promise.all([page.waitForURL(destination,{waitUntil:'networkidle'}),back.click()]);
  assert.equal(page.url(),destination,'Native Back reached its exact parent');
 };
 const assertHub=async()=>{
  assert.equal(page.url(),accountHref,'Returned to the actual account root');
  assert(await page.locator('.woocommerce-MyAccount-navigation').isVisible(),'Hub menu is visible before any endpoint click');
  assert(await page.locator('.sf-account-overview').isVisible());
  assert.equal(await page.locator('.sf-header [data-sf-account-back]').count(),0,'Account root does not invent another parent');
 };
 await page.goto(seed.order,{waitUntil:'networkidle'});assert(await page.locator('.woocommerce-order-details').isVisible());assert(await page.locator('.woocommerce-order-details').innerText().then(t=>t.includes('Layout acceptance product')),'Native order keeps its original line item');await page.screenshot({path:`${dir}/${report.engine}-order-${width}.png`,fullPage:true});
 // This hierarchy already exists at immutable baseline 687ef83: order details
 // return to Orders first, then Orders returns to the visible account hub.
 // Never force-click the intentionally hidden mobile endpoint sidebar.
 await assertEndpoint();
 await followBack(destinations.orders.href,destinations.orders.label);
 await assertEndpoint();
 assert.equal(await page.locator('.woocommerce-MyAccount-navigation-link--orders a').getAttribute('aria-current'),'page','The first Back step is the actual Orders endpoint');
 await followBack(accountHref,accountLabel);
 await assertHub();
 for(const endpoint of ['orders','edit-address','edit-account']){
  const link=page.locator(`.woocommerce-MyAccount-navigation-link--${endpoint} a`);
  assert(await link.isVisible(),'Only click a visible native hub link: '+endpoint);
  assert.equal(await link.evaluate(el=>el.href),destinations[endpoint].href,'Native endpoint destination stays unchanged');
  await Promise.all([page.waitForURL(destinations[endpoint].href,{waitUntil:'networkidle'}),link.click()]);
  await assertEndpoint();
  assert.equal(await page.locator(`.woocommerce-MyAccount-navigation-link--${endpoint} a`).getAttribute('aria-current'),'page','Native endpoint selection is preserved');
  await followBack(accountHref,accountLabel);
  await assertHub();
 }
}report.checks.push('Signed-in Theme appearance, native view-order → orders → account Back chain, visible hub endpoint navigation, no duplicate CSS/fullscreen shell');
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
fs.writeFileSync(dir+'/'+report.engine+'-layout.json',redact(JSON.stringify(report,null,2)));console.log(redact(JSON.stringify(report)));
}catch(error){fs.writeFileSync(dir+'/'+report.engine+'-failure.txt',redact(error.stack));throw error}finally{await browser.close()}})().catch(e=>{console.error(redact(e.stack));process.exitCode=1});
