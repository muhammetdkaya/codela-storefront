// Production native sheet/CSS acceptance. No live requests or commerce mutation.
// Invoked by document-continuity-browser.cjs; DOM-only coverage is a separate claim.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const root = 'theme/codela-storefront/';
module.exports = async function nativeBottomBrowser(browser) {
 const template = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-product-sheet.php'], {encoding:'utf8'});
 const bootstrap = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-product-sheet.php', 'bootstrap'], {encoding:'utf8'});
 const css = ['assets/styles/tokens.css','assets/storefront.css','assets/styles/components.css','assets/styles/navigation.css','assets/styles/gallery.css','assets/styles/product.css','assets/styles/navigation-feedback.css'].map(path=>fs.readFileSync(root+path,'utf8')).join('\n');
 const feedback = fs.readFileSync(root+'assets/scripts/navigation-feedback.js','utf8');
 const adapter = fs.readFileSync(root+'assets/scripts/product-information.js','utf8');
 const fixture = ({product=true,purchase=true,dock=true}={}) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${product?bootstrap:''}<style>${css}</style><script>window.codelaSFDocument={productBase:"https://store.test/product/"};</script></head><body class="${product?'single-product woocommerce':''}"><div class="sf-shell ${dock?'has-mobile-dock':''}"><header class="sf-header"><span class="sf-brand">Codela</span><nav class="sf-actions"><a class="sf-cart-trigger" href="#cart">Cart</a></nav></header>${dock?'<nav class="sf-mobile-dock"><div class="sf-dock-surface"><a data-dock-view="home" href="#home">Home</a><a href="#search">Search</a><a href="#cart">Cart</a><a href="#account">Account</a></div></nav>':''}</div><main id="sf-content" class="sf-content">${product?`<div class="product"><div class="sf-product-overview"><div class="sf-product-media"><div class="woocommerce-product-gallery sf-ui-gallery sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper"><div class="woocommerce-product-gallery__image"><a href="#photo"><img alt="Original product" width="800" height="1000"></a></div></div></div></div><div class="summary"><h1 class="product_title">Original product</h1><div class="sf-product-price-row"><p class="price">42 ₺</p></div>${purchase?'<form id="native-cart" class="cart"><div class="sf-product-purchase"><div class="quantity"><input class="qty" type="number" name="quantity" value="2" min="1"></div><button type="submit" class="single_add_to_cart_button" name="add-to-cart" value="42">Add to cart</button></div></form>':'<p class="stock">Sold out</p>'}<p class="private-detail" style="visibility:visible">Not part of the bottom surface</p></div></div><div class="sf-product-information"><details><summary>Details</summary><div>Original description</div></details></div>${template}</div>`:'<h1>Shop</h1>'}</main></body></html>`;
 const context = await browser.newContext({viewport:{width:390,height:850}});
 try {
  await context.route('https://store.test/**', route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><body></body>'}));
  // Pure shared contract gets its own page, without native adapter listeners.
  const contract = await context.newPage();
  await contract.goto('https://store.test/current/');
  await contract.setContent('<main id="sf-content"></main>');
  await contract.addScriptTag({content:feedback});
  await contract.exposeFunction('__feedbackContractResize', width=>contract.setViewportSize({width,height:850}));
  const checks = await contract.evaluate(require('./navigation-feedback-bottom.cjs'));
  assert(!checks.some(check=>check.startsWith('SKIPPED')), 'Browser runs every native-bottom DOM contract');
  await contract.close();
  for (const width of [320,390,700,701,900,901,1280]) {
   const page = await context.newPage();
   await page.goto('https://store.test/current/');
   await page.setViewportSize({width,height:850});
   await page.setContent(fixture());
   await page.addScriptTag({content:adapter});
   await page.addScriptTag({content:feedback});
   const before = await page.evaluate(()=>{
    if(innerWidth<=700){const vv=new EventTarget();Object.assign(vv,{height:850,offsetTop:0,scale:1});Object.defineProperty(window,'visualViewport',{value:vv,configurable:true});}
    window.originalForm = document.querySelector('#native-cart');
    window.originalPurchase = document.querySelector('.sf-product-purchase');
    window.originalDock = document.querySelector('.sf-mobile-dock');
    window.submitCount = 0; window.buyClicks = 0;
    originalForm.addEventListener('submit',event=>{event.preventDefault();window.submitCount++;});
    originalPurchase.querySelector('button').addEventListener('click',()=>window.buyClicks++);
    const sheet = document.querySelector('.sf-product-sheet');
    window.originalSheet = sheet;
    if (sheet) sheet.querySelector('.sf-product-sheet-toggle').click();
    return {expanded:sheet?.classList.contains('is-expanded'),height:sheet?.getBoundingClientRect().height};
   });
   await page.evaluate(()=>{window.token=codelaSFFeedback.begin({url:'https://store.test/product/new/',link:null});});
   assert.equal(await page.locator('form.cart').count(),1);
   assert.equal(await page.locator('.sf-mobile-dock').count(),1);
   assert.equal(await page.locator('.sf-skeleton-purchase,.sf-skeleton-summary').count(),0);
   assert(await page.evaluate(()=>document.querySelector('#native-cart')===originalForm && document.querySelector('.sf-product-purchase')===originalPurchase && document.querySelector('.sf-mobile-dock')===originalDock));
   if (width <= 700) {
    const sheet = page.locator('[data-sf-feedback-bottom]');
    assert(await sheet.isVisible(),'The actual native panel stays visible');
    assert.equal(await sheet.getAttribute('aria-busy'),'true');
    assert.equal(await sheet.evaluate(el=>el.inert),true);
    assert.equal(await page.locator('.sf-mobile-dock').isVisible(),false,'Never two mobile bottoms');
    assert.equal(await page.locator('.sf-product-sheet .product_title').isVisible(),true);
    assert.equal(await page.locator('.sf-product-sheet .price').textContent(),'42 ₺','Current data is retained, not replaced with destination guesses');
    assert.equal(await page.locator('.private-detail').isVisible(),false,'Expanded native body stays concealed');
    assert.equal(await sheet.evaluate(el=>getComputedStyle(el).animationName),'none','Native panel is not animated');
    assert.equal(await page.locator('.sf-skeleton-gallery').evaluate(el=>getComputedStyle(el).animationName),'sf-skeleton-pulse');
    const buy = await page.locator('.single_add_to_cart_button').boundingBox();
    await page.mouse.click(buy.x+buy.width/2,buy.y+buy.height/2);
    await page.keyboard.press('Tab');
    assert(await page.evaluate(()=>!document.activeElement.closest('[data-sf-feedback-bottom]')),'Tab never enters the old purchase panel');
    await page.evaluate(()=>originalForm.requestSubmit());
    assert.deepEqual(await page.evaluate(()=>[submitCount,buyClicks]),[0,0],'Pointer and stale requestSubmit cannot act on the old purchase');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.sf-skeleton-gallery').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(()=>{
     Object.assign(visualViewport,{height:650,offsetTop:25});visualViewport.dispatchEvent(new Event('resize'));
     window.dispatchEvent(new Event('resize'));
    });
    await page.waitForFunction(()=>document.querySelector('.sf-skeleton').style.getPropertyValue('--sf-feedback-top')==='25px');
    const boxes=await page.evaluate(()=>{
     const panel=document.querySelector('[data-sf-feedback-bottom]').getBoundingClientRect();
     const gallery=document.querySelector('.sf-skeleton-gallery').getBoundingClientRect();
     return {panelTop:panel.top,panelBottom:panel.bottom,galleryBottom:gallery.bottom};
    });
    assert(boxes.panelTop>=25 && boxes.panelBottom<=675,'Real panel remains inside the visible viewport');
    assert(Math.abs(boxes.galleryBottom-boxes.panelTop)<1,'Only the gallery above the translucent bottom pulses');
    if(width===390){
     fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-native-bottom-pending.png'});
     await page.evaluate(()=>{codelaSFFeedback.end(token);window.token=codelaSFFeedback.begin({url:'https://store.test/about/'});});
     const normal=await page.evaluate(()=>({layoutBottom:document.querySelector('.sf-skeleton-layout').getBoundingClientRect().bottom,panelTop:document.querySelector('[data-sf-feedback-bottom]').getBoundingClientRect().top}));
     assert(normal.layoutBottom<=normal.panelTop+1,'Normal-target shapes cannot pulse behind the retained translucent product panel');
     await page.screenshot({path:'qa/storefront-ui-kit-native-bottom-to-page.png'});
    }
   } else {
    assert.equal(await page.locator('[data-sf-feedback-bottom]').count(),0,'Desktop composition stays outside mobile retention');
    assert.equal(await page.locator('.sf-mobile-dock').isVisible(),false);
   }
   await page.evaluate(()=>codelaSFFeedback.end(token));
   assert.equal(await page.locator('[data-sf-feedback-bottom]').count(),0);
   assert(await page.evaluate(()=>document.querySelector('#native-cart')===originalForm && originalForm.querySelector('input').value==='2'));
   if(width<=700)assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),String(before.expanded),'CSS masking never rewrites native open state');
   await page.close();
  }
  for (const options of [{product:false},{product:false,dock:false},{product:true,purchase:false}]) {
   const page=await context.newPage();await page.goto('https://store.test/current/');await page.setContent(fixture(options));
   if(options.product)await page.addScriptTag({content:adapter});
   await page.addScriptTag({content:feedback});
   await page.evaluate(()=>codelaSFFeedback.begin({url:'https://store.test/product/new/'}));
   assert.equal(await page.locator('[data-sf-feedback-bottom]').count(),0);
   assert.equal(await page.locator('.sf-mobile-dock').count(),options.dock===false?0:1);
   if(options.dock!==false)assert(await page.locator('.sf-mobile-dock').isVisible(),'Normal/sold-out source keeps its real dock until native takeover');
   await page.close();
  }
  console.log('Native bottom browser contracts: original Woo nodes, pointer/keyboard blocking, viewport geometry, motion, responsive and no-dock cases passed.');
 } finally {await context.close();}
};
if (require.main === module) {
 const {chromium,webkit}=require('playwright');
 (async()=>{const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch();try{await module.exports(browser);}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
}
