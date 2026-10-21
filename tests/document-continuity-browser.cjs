// Exercise actual cross-document Chrome navigations (not a mocked router).
// Requests are served by this test's own HTTP server; no live cart mutation.
const {createServer}=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const css=fs.readFileSync('theme/codela-storefront/assets/styles/document-continuity.css','utf8');
const accountScript=fs.readFileSync('theme/codela-storefront/assets/scripts/document-continuity.js','utf8');
const baseCss='body{margin:0;font-family:sans-serif}.sf-header{height:72px;display:flex;align-items:center;padding:0 20px;background:#fafafa}.sf-mobile-dock,.sf-product-purchase{position:fixed;bottom:12px;left:16px;right:16px;height:58px;border-radius:30px;background:#eee}body.single-product .sf-mobile-dock{display:none}main{padding:30px;min-height:500px}';
const doc=(path)=>{
 const product=path==='/product/';
 const category=path==='/category/';
 const checkout=path==='/checkout/';
 const style=checkout?'':css;
 const links=path==='/'?'<a id="open-category" href="/category/">Category</a>':category?'<a id="open-product" href="/product/">Product</a>':'<a id="back-home" href="/">Home</a>';
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<style>'+baseCss+style+'</style><script>window.codelaSFDocument={account:location.origin+"/account/"};'+accountScript+'</script><script>window.addEventListener("pageswap",e=>sessionStorage.setItem("continuity-pageswap",String(Boolean(e.viewTransition))));window.addEventListener("pagereveal",e=>{sessionStorage.setItem("continuity-pagereveal",String(Boolean(e.viewTransition)));sessionStorage.setItem("account-direction",document.documentElement.dataset.sfAccountTransition||"none")});</script></head><body class="'+(product?'single-product':'')+'">'+
  '<header class="sf-header" id="native-header">Codela</header><div class="sf-shell">'+
  '<nav class="sf-mobile-dock" id="native-dock">Navigation</nav></div>'+
  '<main id="sf-content"><a id="account-root" href="/account/">Account</a><a id="account-orders" href="/account/orders/">Orders</a><h1>'+path+'</h1>'+links+'<a id="open-checkout" href="/checkout/">Checkout</a>'+
  (product?'<div class="product"><form class="cart" method="post" action="/purchase"><div class="sf-product-purchase"><input name="quantity" value="1"><button type="submit" name="add-to-cart" value="42">Add to cart</button></div></form></div>':'')+
  '</main></body></html>';
};
(async()=>{
 let purchases=0;
 const server=createServer((req,res)=>{
  if(req.method==='POST'&&req.url==='/purchase'){
   purchases++;let data='';req.on('data',x=>data+=x);req.on('end',()=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<html><body id="native-post">Received '+data+'</body></html>')});return;
  }
  res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
  res.end(doc(req.url.split('?')[0]));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch();
 try {
  const context=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(origin+'/',{waitUntil:'load'});
  assert.equal(await page.locator('.sf-header').evaluate(el=>getComputedStyle(el).viewTransitionName),'sf-persistent-header','Header names shared transition');
  await page.locator('#open-category').click();
  assert(page.url().endsWith('/category/'),'Native category page navigation');
  const swapped=await page.evaluate(()=>sessionStorage.getItem('continuity-pageswap'));
  // The head observer catches pagereveal even when it fires before body parses.
  await page.waitForFunction(()=>sessionStorage.getItem('continuity-pagereveal')==='true',{timeout:5000});
  const revealed=await page.evaluate(()=>sessionStorage.getItem('continuity-pagereveal'));
  assert.equal(swapped,'true','Cross-document old header snapshot exists');
  assert.equal(revealed,'true','Cross-document new header snapshot exists');
  assert.equal(await page.locator('header').count(),1,'Only one native header');
  assert.equal(await page.locator('nav.sf-mobile-dock').count(),1,'Only one native dock');
  await page.locator('#open-product').click();
  assert(page.url().endsWith('/product/'),'Product gets a real new HTML document');
  assert.equal(await page.locator('form.cart button[name="add-to-cart"]').count(),1,'Native Woo-style submit kept');
  assert.equal(await page.locator('form.cart').evaluate(el=>getComputedStyle(el.querySelector('.sf-product-purchase')).viewTransitionName),'sf-persistent-bottom','Purchase bar shares visual bottom slot');
  assert.equal(await page.locator('.sf-mobile-dock').evaluate(el=>getComputedStyle(el).display),'none','Product does not display two bottom bars');
  assert.equal(await page.locator('.sf-header').evaluate(el=>getComputedStyle(el).viewTransitionName),'sf-persistent-header','Product header still shared');
  await page.locator('form.cart button').click();
  assert.equal(purchases,1,'Exactly one native POST made');
  assert(await page.locator('#native-post').count()===1,'Browser owns form submission');
  await page.goto(origin+'/account/');
  await page.locator('#account-orders').click();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='forward');
  await page.locator('#account-root').click();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='back');
  await page.goBack();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='back');
  assert(page.url().endsWith('/account/orders/'),'History traversal still browser-owned');
  await context.close();
  const desktop=await browser.newContext({viewport:{width:1280,height:900}});
  const d=await desktop.newPage();await d.goto(origin+'/account/');await d.locator('#account-orders').click();
  assert.equal(await d.evaluate(()=>sessionStorage.getItem('account-direction')),'none','Desktop account navigation never slides');
  assert.equal(await d.locator('#sf-content').evaluate(e=>getComputedStyle(e).viewTransitionName),'none','Desktop content has no horizontal transition layer');
  await desktop.close();

  const quiet=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const p=await quiet.newPage();
  await p.goto(origin+'/',{waitUntil:'load'});
  assert.equal(await p.locator('.sf-header').evaluate(el=>getComputedStyle(el).viewTransitionName),'none','Reduced motion disables transition snapshots');
  await p.locator('#open-category').click();
  assert(p.url().endsWith('/category/'),'Reduced motion still navigates normally');
  await quiet.close();
  console.log('Native continuity: real HTML navigation, browser snapshots, purchase bar, one WC-style form POST, reduced-motion opt-out passed.');
 } finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
