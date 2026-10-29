// Exercise actual cross-document Chrome navigations (not a mocked router).
// Requests are served by this test's own HTTP server; no live cart mutation.
const {createServer}=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const css=['tokens','components','navigation-feedback','document-continuity'].map(name=>fs.readFileSync('theme/codela-storefront/assets/styles/'+name+'.css','utf8')).join('\n');
const accountScript=fs.readFileSync('theme/codela-storefront/assets/scripts/navigation-feedback.js','utf8')+fs.readFileSync('theme/codela-storefront/assets/scripts/document-continuity.js','utf8');
const purchasePreview=require('node:child_process').execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','navigation'],{encoding:'utf8'});
const baseCss='body{margin:0;font-family:sans-serif}.sf-header{position:fixed;inset:0 0 auto;z-index:1000;height:72px;display:flex;align-items:center;padding:0 20px;background:#fafafa}.sf-mobile-dock,.sf-product-purchase{z-index:1000;position:fixed;bottom:12px;left:16px;right:16px;height:58px;border-radius:30px;background:#eee}body.single-product .sf-mobile-dock{display:none}main{padding:100px 30px 30px;min-height:1800px}';
const doc=(path)=>{
 const product=path.startsWith('/product/');
 const productId=path.includes('/next/')?84:42;
 const category=path==='/category/';
 const checkout=path==='/checkout/';
 const style=checkout?'':css;
 const links=path==='/'?'<a id="open-category" href="/category/">Category</a>':category?'<a id="open-product" href="/product/">Product</a>':'<a id="back-home" href="/">Home</a>';
 return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<style>'+baseCss+style+'</style><script>window.codelaSFDocument={purchasePreview:'+JSON.stringify(purchasePreview)+',home:location.origin+"/",shop:location.origin+"/category/",productBase:location.origin+"/product/",catalogBases:[location.origin+"/category/"],account:location.origin+"/account/",accountLabel:"My account",excluded:["/checkout/","/cart/","/account/customer-logout/"],backIcon:"<svg></svg>",accountParents:[{url:"/account/view-order/",back:"/account/orders/",label:"Orders"},{url:"/account/edit-address/",back:"/account/edit-address/",label:"Addresses",childOnly:true}]};window.addEventListener("pageswap",event=>{sessionStorage.removeItem("retained-bottom-transition-skipped");if(event.viewTransition){const skip=event.viewTransition.skipTransition.bind(event.viewTransition);event.viewTransition.skipTransition=()=>{sessionStorage.setItem("retained-bottom-transition-skipped","true");return skip();};}});'+accountScript+'</script><script>window.addEventListener("pageswap",e=>sessionStorage.setItem("continuity-pageswap",String(Boolean(e.viewTransition))));window.addEventListener("pagereveal",e=>{sessionStorage.setItem("continuity-pagereveal",String(Boolean(e.viewTransition)));sessionStorage.setItem("account-direction",document.documentElement.dataset.sfAccountTransition||"none")});</script></head><body class="'+(product?'single-product':path.startsWith('/account/')?'woocommerce-account logged-in':'')+'">'+
  '<header class="sf-header" id="native-header"><div class="sf-brand">Codela</div></header><div class="sf-shell">'+
  '<nav class="sf-mobile-dock" id="native-dock">Navigation</nav></div>'+
  '<main id="sf-content"><a id="slow-account" href="/account/orders/?slow=1">Slow orders</a><a id="account-root" href="/account/">Account</a><a id="account-orders" href="/account/orders/">Orders</a><h1>'+path+'</h1>'+links+'<a id="open-checkout" href="/checkout/">Checkout</a>'+
  (product?'<div class="product"><form class="cart" method="post" action="/purchase"><div class="sf-product-purchase"><span data-product-price>'+productId+' ₺</span><input name="quantity" value="1"><button type="submit" name="add-to-cart" value="'+productId+'">Add to cart</button></div></form></div>':'')+
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
  // Browse links show feedback synchronously even far down an old page.
  for (const path of ['/', '/category/', '/product/']) {
   await page.goto(origin+path);
   const result=await page.evaluate(()=>{
    window.scrollTo(0,800);
    window.addEventListener('click',e=>e.preventDefault());
    const a=document.createElement('a');a.href='/category/?slow=1';document.body.append(a);a.click();
    const skeleton=document.querySelector('.sf-skeleton');
    const result={count:document.querySelectorAll('.sf-skeleton').length,top:skeleton?.getBoundingClientRect().top,
     busy:document.querySelector('main').getAttribute('aria-busy'),header:getComputedStyle(document.querySelector('.sf-header')).visibility==='visible'&&Number(getComputedStyle(document.querySelector('.sf-header')).zIndex)>Number(getComputedStyle(skeleton).zIndex),headerLocked:document.querySelector('.sf-header').inert};
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
    result.restored=!document.querySelector('[data-sf-navigation-pending]')&&!document.querySelector('[data-sf-pending-inert]');
    return result;
   });
   assert.deepEqual(result,{count:1,top:0,busy:'true',header:true,headerLocked:true,restored:true},'Immediate scrolled native feedback: '+path);
  }
  await page.goto(origin+'/');
  const guards=await page.evaluate(()=>{
   window.addEventListener('click',e=>e.preventDefault());
   return ['/checkout/','/checkout/order-pay/42/','/cart/','/?add-to-cart=42','/account/customer-logout/?_wpnonce=abc','/#section','https://elsewhere.test/','/photo.webp'].map(href=>{
    const a=document.createElement('a');a.href=href;document.body.append(a);a.click();
    const pending=!!document.querySelector('[data-sf-navigation-pending]');a.remove();return pending;
   });
  });
  assert(guards.every(value=>!value),'Commerce, external, media and fragment links never get browsing feedback');
  // Target-based feedback must cover the entire old product, including
  // descendants which explicitly restore visibility and transformed containers.
  for (const width of [390, 1280]) {
   await page.setViewportSize({width,height:850});
   for (const source of ['/', '/product/']) {
    await page.goto(origin+source);
    await page.addStyleTag({content:fs.readFileSync('theme/codela-storefront/assets/styles/product.css','utf8')});
    const cases=await page.evaluate(()=>{
     window.addEventListener('click',e=>e.preventDefault());
     const main=document.querySelector('#sf-content');
     main.style.transform='translateZ(0)';
     const sheet=document.createElement('div');sheet.className='sf-product-sheet';sheet.innerHTML='<div style="visibility:visible">OLD PRODUCT</div>';main.append(sheet);
     const paths=[['/','home'],['/category/','catalog'],['/product/example/','product'],['/account/orders/','account'],['/about/','page'],['/?post_type=product&p=42','product'],['/?product_cat=tiles','catalog']];
     return paths.map(([href,type])=>{
      const a=document.createElement('a');a.href=href;document.body.append(a);
      // Home must differ from the current URL to be an actual navigation.
      if(a.href===location.href) a.search='?preview=1';
      if(type==='home') a.dataset.sfRoute='home';
      a.click();
      const surface=document.querySelector('.sf-skeleton');
      const dock=document.querySelector('.sf-mobile-dock');
      const purchase=document.querySelector('.sf-skeleton-purchase');
      const result={type:document.documentElement.dataset.sfNavigationTarget,expected:type,
       top:surface?.getBoundingClientRect().top, outside:surface?.parentNode===document.body,
       old:getComputedStyle(sheet.firstChild).visibility,
       dock:getComputedStyle(dock).display!=='none'&&!dock.hidden,
       purchase:!!purchase&&getComputedStyle(purchase).display!=='none',
       color:getComputedStyle(surface.querySelector('.sf-skeleton-shape,.sf-skeleton-media')).backgroundColor};
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
      result.restored=!document.querySelector('.sf-skeleton')&&!dock.inert&&getComputedStyle(sheet.firstChild).visibility==='visible';
      a.remove();return result;
     });
    });
    if(source==='/product/' && width===390){
     fs.mkdirSync('qa',{recursive:true});
     for(const target of ['home','product','catalog']){
      await page.evaluate(target=>{
       const a=document.createElement('a');a.href='/preview/';a.dataset.sfSkeleton=target;document.body.append(a);a.click();a.remove();
      },target);
      if(target==='product') {
       const gallery=page.locator('.sf-skeleton-gallery');
       const dockTop=await page.locator('.sf-navigation-preview').evaluate(el=>el.getBoundingClientRect().top);
       const photoHeight=await page.evaluate(()=>innerHeight-116);
       assert.deepEqual(await gallery.boundingBox(),{x:0,y:0,width:390,height:photoHeight});
       assert(photoHeight>dockTop,'Native photo overlaps the translucent destination panel');
       assert.equal(await gallery.evaluate(el=>getComputedStyle(el).animationName),'sf-skeleton-pulse');
       assert.equal(await page.locator('.sf-skeleton-purchase,.sf-skeleton-summary,.sf-skeleton-product-controls').count(),0,'No pulsing purchase skeleton or invented product data');
       await page.emulateMedia({reducedMotion:'reduce'});
       assert.equal(await gallery.evaluate(el=>getComputedStyle(el).animationName),'none');
       await page.emulateMedia({reducedMotion:'no-preference'});
      }
      await page.screenshot({path:'qa/storefront-product-to-'+target+'-skeleton.png'});
      await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
     }
    }
    for(const result of cases){
     assert.equal(result.type,result.expected,'Destination silhouette');
     assert.equal(result.top,0,'Viewport surface escapes transformed product');
     assert(result.outside&&result.restored,'Outside main and cancellation restores state');
     assert.equal(result.old,'hidden','Old explicitly visible product descendants hidden');
     assert.equal(result.purchase,false,'Purchase panel never uses skeleton');
     if(width<=700) assert.equal(result.dock,result.type!=='product','Normal dock appears only for non-product destinations');
     assert.equal(result.color,'rgb(223, 225, 229)','Stronger static contrast');
    }
   }
  }
  await page.setViewportSize({width:390,height:850});
  await page.goto(origin+'/account/');
  const previews=await page.evaluate(()=>{
   const cases=['/account/orders/','/account/view-order/1048/','/account/edit-address/','/account/edit-address/billing/'];
   window.addEventListener('click',e=>e.preventDefault(),{once:false});
   return cases.map(href=>{const a=document.createElement('a');a.href=href;document.body.append(a);a.click();const b=document.querySelector('[data-sf-account-back]');const result={label:b?.getAttribute('aria-label'),path:b?new URL(b.href).pathname:null};document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));result.restored=document.querySelector('.sf-brand').textContent==='Codela'&&!document.querySelector('[data-sf-navigation-pending]');a.remove();return result;});
  });
  assert.deepEqual(previews.map(x=>[x.label,x.path]),[['My account','/account/'],['Orders','/account/orders/'],['My account','/account/'],['Addresses','/account/edit-address/']]);
  assert(previews.every(x=>x.restored),'Cancelled navigation restores header and content');
  await page.evaluate(()=>document.querySelector('#slow-account').click());
  fs.mkdirSync('qa',{recursive:true});
  await page.screenshot({path:'qa/storefront-account-skeleton-mobile.png'});
  await page.setViewportSize({width:1280,height:900});
  await page.screenshot({path:'qa/storefront-account-skeleton-desktop.png'});
  await page.setViewportSize({width:390,height:850});
  await page.goto(origin+'/account/');
  await page.locator('#account-orders').click();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='none');
  await page.locator('#account-root').click();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='none');
  await page.goBack();
  await page.waitForFunction(()=>sessionStorage.getItem('account-direction')==='none');
  assert(page.url().endsWith('/account/orders/'),'History traversal still browser-owned');
  // A delayed native HTML request must show immediate main-only feedback.
  await page.goto(origin+'/account/');
  const pending=await page.evaluate(()=>{
   const started=performance.now();document.querySelector('#slow-account').click();
   const main=document.querySelector('#sf-content'), skeleton=document.querySelector('.sf-skeleton');
   const visible=el=>!!el && el.getBoundingClientRect().height>0 && getComputedStyle(el).visibility==='visible';
   return {rows:skeleton.querySelectorAll('.sf-skeleton-account-link').length,shapes:skeleton.querySelectorAll('.sf-skeleton-media,.sf-skeleton-lines i').length,statusClipped:getComputedStyle(skeleton.querySelector('.sf-skeleton-status')).clipPath,transform:getComputedStyle(main).transform,backLabel:document.querySelector('[data-sf-account-back]')?.textContent,backHref:document.querySelector('[data-sf-account-back]')?.getAttribute('href'),icon:!!document.querySelector('[data-sf-account-back] svg'),elapsed:performance.now()-started,pending:document.documentElement.hasAttribute('data-sf-navigation-pending'),busy:main.getAttribute('aria-busy'),skeleton:visible(skeleton),header:visible(document.querySelector('#native-header')),dock:visible(document.querySelector('#native-dock')),inert:!!document.querySelector('#account-root').closest('[inert]')};
  });
  // Read synchronously inside the outgoing document: Playwright locators wait
  // for pending navigation and cannot inspect that document during a native GET.
  assert.equal(pending.rows,6);assert.equal(pending.shapes,8);assert.equal(pending.statusClipped,'inset(50%)','Loading text is screen-reader-only');assert.equal(pending.transform,'none','Skeleton never slides');
  assert(pending.pending && pending.skeleton,'Skeleton paints in the click task, before the delayed response');
  assert.equal(pending.backLabel,'','Back stays icon-only in click task');assert.equal(pending.backHref,origin+'/account/');assert(pending.icon,'Back icon requires no request');
  assert(pending.elapsed<100,'Feedback has no timer or network dependency');
  assert(pending.header && pending.dock,'Header and dock remain visible during slow GET');
  assert.equal(pending.busy,'true');assert(pending.inert,'Hidden old actions cannot receive keyboard focus');
  await page.waitForURL('**/account/orders/?slow=1');
  await page.waitForLoadState('load');
  assert.equal(await page.locator('.sf-skeleton').count(),0,'Fresh native document clears feedback');
  await page.goBack();
  assert.equal(await page.locator('#sf-content').evaluate(e=>getComputedStyle(e).viewTransitionName),'none','Mobile account content has no slide layer');
  assert.equal(await page.locator('[data-sf-navigation-pending]').count(),0,'History/BFCache restores usable content');
  // Delayed real native takeovers cannot carry an outgoing price under the new URL.
  for(const [from,to,expectedBottom] of [['/product/','/product/next/','product'],['/','/product/next/','product'],['/product/','/category/','dock']]){
   await page.goto(origin+from);
   await page.evaluate(()=>{
    window.addEventListener('pageswap',event=>{sessionStorage.setItem('native-bottom-pageswap',String(document.documentElement.dataset.sfNavigationBottom||'none'));event.viewTransition?.finished.catch(()=>{});});
   });
   const bottomState=await page.evaluate(to=>{
    const a=document.createElement('a');a.href=to+'?slow=1';a.textContent='Next';document.body.append(a);a.click();
    const visible=node=>!!node&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&node.getBoundingClientRect().height>0;
    return {bottom:document.documentElement.dataset.sfNavigationBottom,dock:visible(document.querySelector('.sf-mobile-dock')),panel:visible(document.querySelector('.sf-navigation-preview')),oldPriceVisible:visible(document.querySelector('[data-product-price]'))};
   },to);
   assert.equal(bottomState.bottom,expectedBottom);
   assert.equal(bottomState.dock,expectedBottom==='dock');
   assert.equal(bottomState.panel,expectedBottom==='product');assert(!bottomState.oldPriceVisible,'Outgoing price is hidden for every target');
   await page.waitForURL(origin+to+'?slow=1');
   await page.waitForLoadState('domcontentloaded');
   assert.equal(await page.locator('[data-sf-navigation-pending]').count(),0);
   assert.equal(await page.locator('.sf-navigation-preview').count(),0);
   assert.equal(await page.locator('button[value="42"]').count(),0,'Committed target never adopts the old product control');
   if(to.startsWith('/product/'))assert.equal(await page.locator('[data-product-price]').textContent(),'84 ₺');
   await page.goBack();
   assert.equal(await page.locator('[data-sf-navigation-pending]').count(),0,'Back restores a non-busy native document');
   await page.goForward();
   assert.equal(await page.locator('[data-sf-navigation-pending]').count(),0,'Forward restores a non-busy native document');
  }
  await context.close();
  const desktop=await browser.newContext({viewport:{width:1280,height:900}});
  const d=await desktop.newPage();await d.goto(origin+'/account/');await d.locator('#account-orders').click();
  const desktopPending=await d.evaluate(()=>{
   document.querySelector('#slow-account').click();
   return {backLabel:document.querySelector('[data-sf-account-back]')?.textContent,pending:document.documentElement.hasAttribute('data-sf-navigation-pending'),header:getComputedStyle(document.querySelector('#native-header')).visibility};
  });
  assert.equal(desktopPending.backLabel,'','Desktop back stays icon-only before response');
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
  await require('./navigation-feedback-bottom-browser.cjs')(browser);
  console.log('Native continuity: real HTML navigation, browser snapshots, purchase bar, one WC-style form POST, reduced-motion opt-out passed.');
 } finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exit(1)});

