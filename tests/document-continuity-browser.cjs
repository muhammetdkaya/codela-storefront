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
  '<style>'+baseCss+style+'</style><script>window.codelaSFDocument={account:location.origin+"/account/",accountLabel:"My account",backIcon:"<svg></svg>",accountParents:[{url:"/account/view-order/",back:"/account/orders/",label:"Orders"},{url:"/account/edit-address/",back:"/account/edit-address/",label:"Addresses",childOnly:true}]};'+accountScript+'</script><script>window.addEventListener("pageswap",e=>sessionStorage.setItem("continuity-pageswap",String(Boolean(e.viewTransition))));window.addEventListener("pagereveal",e=>{sessionStorage.setItem("continuity-pagereveal",String(Boolean(e.viewTransition)));sessionStorage.setItem("account-direction",document.documentElement.dataset.sfAccountTransition||"none")});</script></head><body class="'+(product?'single-product':path.startsWith('/account/')?'woocommerce-account logged-in':'')+'">'+
  '<header class="sf-header" id="native-header"><div class="sf-brand">Codela</div></header><div class="sf-shell">'+
  '<nav class="sf-mobile-dock" id="native-dock">Navigation</nav></div>'+
  '<main id="sf-content"><a id="slow-account" href="/account/orders/?slow=1">Slow orders</a><a id="account-root" href="/account/">Account</a><a id="account-orders" href="/account/orders/">Orders</a><h1>'+path+'</h1>'+links+'<a id="open-checkout" href="/checkout/">Checkout</a>'+
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
  if(req.url.includes('slow=1')) { setTimeout(()=>res.end(doc(req.url.split('?')[0])),900); return; }
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
  const previews=await page.evaluate(()=>{
   const cases=['/account/orders/','/account/view-order/1048/','/account/edit-address/','/account/edit-address/billing/'];
   window.addEventListener('click',e=>e.preventDefault(),{once:false});
   return cases.map(href=>{const a=document.createElement('a');a.href=href;document.body.append(a);a.click();const b=document.querySelector('[data-sf-account-back]');const result={label:b?.textContent,path:b?new URL(b.href).pathname:null};document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));result.restored=document.querySelector('.sf-brand').textContent==='Codela'&&!document.querySelector('[data-sf-account-pending]');a.remove();return result;});
  });
  assert.deepEqual(previews.map(x=>[x.label,x.path]),[['My account','/account/'],['Orders','/account/orders/'],['My account','/account/'],['Addresses','/account/edit-address/']]);
  assert(previews.every(x=>x.restored),'Cancelled navigation restores header and content');
  await page.goto(origin+'/account/');
  await page.locator('#account-orders').click();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='forward');
  await page.locator('#account-root').click();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='back');
  await page.goBack();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='back');
  assert(page.url().endsWith('/account/orders/'),'History traversal still browser-owned');
  // A delayed native HTML request must show immediate main-only feedback.
  await page.goto(origin+'/account/');
  const pending=await page.evaluate(()=>{
   const started=performance.now();document.querySelector('#slow-account').click();
   const main=document.querySelector('#sf-content'), skeleton=main.querySelector('.sf-account-loading');
   const visible=el=>!!el && el.getBoundingClientRect().height>0 && getComputedStyle(el).visibility==='visible';
   return {backLabel:document.querySelector('[data-sf-account-back]')?.textContent,backHref:document.querySelector('[data-sf-account-back]')?.getAttribute('href'),icon:!!document.querySelector('[data-sf-account-back] svg'),elapsed:performance.now()-started,pending:main.hasAttribute('data-sf-account-pending'),busy:main.getAttribute('aria-busy'),skeleton:visible(skeleton),header:visible(document.querySelector('#native-header')),dock:visible(document.querySelector('#native-dock')),inert:!!document.querySelector('#account-root').closest('[inert]')};
  });
  // Read synchronously inside the outgoing document: Playwright locators wait
  // for pending navigation and cannot inspect that document during a native GET.
  assert(pending.pending && pending.skeleton,'Skeleton paints in the click task, before the delayed response');
  assert.equal(pending.backLabel,'My account','Back label changes in click task');assert.equal(pending.backHref,origin+'/account/');assert(pending.icon,'Back icon requires no request');
  assert(pending.elapsed<100,'Feedback has no timer or network dependency');
  assert(pending.header && pending.dock,'Header and dock remain visible during slow GET');
  assert.equal(pending.busy,'true');assert(pending.inert,'Hidden old actions cannot receive keyboard focus');
  await page.waitForURL('**/account/orders/?slow=1');
  await page.waitForLoadState('load');
  assert.equal(await page.locator('.sf-account-loading').count(),0,'Fresh native document clears feedback');
  await page.goBack();
  assert.equal(await page.locator('[data-sf-account-pending]').count(),0,'History/BFCache restores usable content');
  await context.close();
  const desktop=await browser.newContext({viewport:{width:1280,height:900}});
  const d=await desktop.newPage();await d.goto(origin+'/account/');await d.locator('#account-orders').click();
  const desktopPending=await d.evaluate(()=>{
   document.querySelector('#slow-account').click();
   return {backLabel:document.querySelector('[data-sf-account-back]')?.textContent,pending:document.querySelector('#sf-content').hasAttribute('data-sf-account-pending'),header:getComputedStyle(document.querySelector('#native-header')).visibility};
  });
  assert.equal(desktopPending.backLabel,'My account','Desktop back label updates before response');
  assert(desktopPending.pending,'Desktop also paints feedback in the click task');
  assert.equal(desktopPending.header,'visible','Desktop header visible during slow GET');
  await d.waitForURL('**/account/orders/?slow=1');
  await d.waitForLoadState('load');
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

