// Real production template, native scroll, original form, responsive restoration.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const template=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php'],{encoding:'utf8'});
const bootstrap=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','bootstrap'],{encoding:'utf8'});
const quantity=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','quantity'],{encoding:'utf8'});
const css='.woocommerce div.product div.images .woocommerce-product-gallery__image:nth-child(n+2){width:25%;display:inline-block}'+['assets/styles/tokens.css','assets/storefront.css','assets/styles/components.css','assets/styles/gallery.css','assets/styles/product.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const picture=n=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="${['#dbd1c3','#bab4a1','#ad998a'][n]}"/><text x="200" y="300" font-size="80">${n+1}</text></svg>`);
function fixture({variable=false,stock=true,short=false,pending=false}={}){return `<!doctype html><html><head>${pending?bootstrap:''}<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,Helvetica,sans-serif}${css}</style></head><body class="single-product woocommerce"><div class="sf-shell"><header class="sf-header"><span>Codela</span></header><dialog id="sf-panel"></dialog></div><main class="sf-content"><div class="woocommerce-notices-wrapper"></div><div class="product">
<div class="woocommerce-product-gallery images sf-ui-gallery sf-ui-gallery--hero sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper">${[0,1,2].map(n=>`<div class="woocommerce-product-gallery__image" data-thumb="${picture(n)}"><a href="${picture(n)}"><img alt="Product ${n+1}" src="${picture(n)}"></a></div>`).join('')}</div></div>
<div class="summary"><h1 class="product_title">${short?'Luna':'Luna Traverten Lamba'}</h1><div class="sf-product-price-row"><p class="price">3.490 ₺</p>${short?'':'<div class="cdl-ub">Son 3 adet</div>'}</div><p class="woocommerce-product-details__short-description">Doğal taşın dokusu.</p>
${stock?`<form id="native-cart" class="cart ${variable?'variations_form':''}" method="post">${variable?'<table class="variations"><tbody><tr><th><label for="color">Renk</label></th><td><select id="color" name="attribute_color"><option value="">Seçiniz</option><option value="cream">Kum</option></select></td></tr></tbody></table><input name="variation_id" value="123" type="hidden">':''}<div class="sf-product-purchase"><div class="quantity">${quantity}</div><button class="single_add_to_cart_button button alt ${variable?'disabled wc-variation-selection-needed':''}" type="submit" name="add-to-cart" value="42">Sepete ekle</button></div></form>`:'<p class="stock out-of-stock">Stokta yok</p>'}
<div class="cdl-fsb--product"><div class="cdl-fsb-text">Ücretsiz kargoya 510 ₺ kaldı</div><div class="cdl-fsb-track"><span class="cdl-fsb-fill" style="width:87%"></span></div></div></div>
<div class="sf-product-information"><details open class="sf-product-information-section"><summary>Ürün hakkında</summary><div style="min-height:450px">Ürün bilgisi</div></details><details id="sf-product-section-reviews" class="sf-product-information-section"><summary>Değerlendirmeler</summary><div id="reviews"><a id="review_form">Yorum yaz</a><textarea aria-label="Yorum"></textarea></div></details></div><div class="cdl-tb">Güvenli ödeme</div><section class="related" style="min-height:1200px"><h2>İlgili ürünler</h2><a href="/related">Diğer ürün</a></section>${template}</div></main><footer class="sf-footer"><a href="/privacy">Gizlilik</a></footer></body></html>`;}
async function load(page,options){await page.goto('about:blank');await page.setContent(fixture(options));await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8')});}
(async()=>{const browser=await chromium.launch();let lastPage;try{const page=await browser.newPage();lastPage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [320,390,700]){
 await page.setViewportSize({width,height:844});await load(page);
 const toggle=page.locator('.sf-product-sheet-toggle');const buy=page.locator('.single_add_to_cart_button');
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert(await buy.isVisible(),'Collapsed native purchase remains visible');
 assert.equal(await buy.evaluate(e=>e.form.id),'native-cart','Native form ownership retained');
 assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1,'No copied submit');
 assert.equal(await page.locator('.sf-product-sheet .sf-product-purchase').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','One sheet material');
 const bounds=await buy.boundingBox();assert(bounds.y+bounds.height<=844&&bounds.y>700,'Purchase stays at bottom '+width);
 assert(!(await page.locator('.variations,.sf-product-information').last().isVisible()),'Details hidden while collapsed');
 assert(!(await page.locator('.cdl-fsb-text').isVisible()),'No free-shipping message while collapsed');
 assert(!(await page.locator('.cdl-fsb-track').isVisible()),'No free-shipping bar while collapsed');
 assert.equal(await page.locator('.sf-product-delivery .cdl-fsb--product').count(),1,'Original shipping node in one native disclosure');
 const plus=page.locator('[data-quantity-step="1"]'),minus=page.locator('[data-quantity-step="-1"]');
 assert(await minus.isDisabled(),'Quantity cannot go below minimum');
 await plus.click();assert.equal(await page.locator('input.qty').inputValue(),'2');
 await plus.click();assert.equal(await page.locator('input.qty').inputValue(),'3');assert(await plus.isDisabled(),'Quantity cannot exceed stock');
 await minus.click();assert.equal(await page.locator('input.qty').inputValue(),'2');
 await page.locator('input.qty').fill('1');
 assert.equal(await page.locator('.sf-product-purchase .cdl-wa').count(),0,'Contact never shares purchase controls');
 // A partial wheel gesture must finish on the next photograph, not rest
 // between frames. Native root scrolling/overscroll stays available at top.
 await page.mouse.move(width/2,350);await page.mouse.wheel(0,450);
 await page.waitForFunction(()=>Math.abs(document.querySelectorAll('.woocommerce-product-gallery__image')[1].getBoundingClientRect().top)<1);
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollSnapType),'y mandatory');
 await page.mouse.wheel(0,-450);
 await page.waitForFunction(()=>Math.abs(document.querySelector('.woocommerce-product-gallery__image').getBoundingClientRect().top)<1);
 await page.locator('.woocommerce-product-gallery__wrapper').focus();await page.keyboard.press('ArrowDown');
 await page.waitForFunction(()=>document.querySelector('.sf-product-gallery-count').textContent==='2 / 3');
 await page.waitForFunction(()=>Math.abs(document.querySelectorAll('.woocommerce-product-gallery__image')[1].getBoundingClientRect().top)<1);
 const geometry=await page.evaluate(()=>{const a=document.querySelectorAll('.woocommerce-product-gallery__image'),r=a[0].getBoundingClientRect(),next=a[1].getBoundingClientRect(),img=a[1].querySelector('img').getBoundingClientRect();return{gap:Math.max(...Array.from(a).slice(1).map((node,i)=>Math.abs(node.getBoundingClientRect().top-a[i].getBoundingClientRect().bottom))),padding:getComputedStyle(a[1]).paddingBottom,overflow:getComputedStyle(a[0].parentElement).overflowY,root:getComputedStyle(document.documentElement).overscrollBehaviorY,body:getComputedStyle(document.body).overflowY,covered:img.bottom>=document.querySelector('.sf-product-sheet').getBoundingClientRect().top,framing:innerHeight-img.height,innerScroll:a[0].parentElement.scrollTop}});
 assert(Math.abs(geometry.gap)<1,'No white gap between native photographs');assert.equal(geometry.padding,'0px');assert.equal(geometry.overflow,'visible');assert.equal(geometry.root,'auto','Native browser overscroll is allowed');assert.notEqual(geometry.body,'hidden');assert(geometry.covered,'Photo reaches behind the fixed sheet');assert(geometry.framing>40,'Image uses the visible product area instead of cropping behind the entire panel');assert.equal(geometry.innerScroll,0,'The document owns mobile scrolling');
 assert.equal(await toggle.getAttribute('aria-expanded'),'false','Gallery scrolling does not open details');
 await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
 const titleFont=await page.locator('.sf-product-sheet-heading .product_title').evaluate(e=>getComputedStyle(e).fontSize);
 const closedHeight=await page.locator('.sf-product-sheet').evaluate(e=>e.getBoundingClientRect().height);
 assert(closedHeight<180,'Compact collapsed panel '+width+' '+closedHeight);
 assert.equal(await page.locator('.sf-product-sheet .related').count(),0,'Recommendations are outside product details');
 assert.equal(await page.locator('.sf-product-discovery > .related a').getAttribute('href'),'/related','Native related anchor preserved');
 await page.locator('.woocommerce-product-gallery__wrapper').focus();await page.keyboard.press('End');
 await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
 await page.waitForFunction(previous=>{const e=document.querySelector('.sf-product-sheet'),target=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'));return target<previous-1&&Math.abs(e.getBoundingClientRect().height-target)<2},closedHeight);
 assert(await page.locator('.sf-product-discovery .related').isVisible(),'Related products reachable without opening details');
 assert((await page.locator('.sf-product-sheet').boundingBox()).height<closedHeight,'Panel compacts further during discovery');
 assert.equal(await page.locator('.sf-product-sheet-heading .product_title').evaluate(e=>getComputedStyle(e).fontSize),titleFont,'Title size is identical over photos and recommendations');
 assert(await buy.isVisible(),'Same purchase remains visible while discovering');
 // Repeated gestures beyond the last card must not grow the document or
 // correct its resting position on release. Native OS rubber-band is covered
 // by the scoped overscroll policy; a desktop wheel cannot emulate that paint.
 await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await page.waitForFunction(()=>Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<1);
 const bottom=await page.evaluate(()=>({y:scrollY,height:document.documentElement.scrollHeight}));
 const reserve=await page.locator('.sf-product-discovery').evaluate(e=>({minHeight:getComputedStyle(e).minHeight,bottom:parseFloat(getComputedStyle(e).paddingBottom),normal:parseFloat(getComputedStyle(document.querySelector('.woocommerce-product-gallery')).getPropertyValue('--sf-product-normal-height'))}));
 assert.equal(reserve.minHeight,'0px','Related products follow their actual content height, not a minimum viewport');
 assert(reserve.bottom<reserve.normal,'No full normal purchase-height spacer after the last related item');
 assert(reserve.bottom<=1,'Only an actual device safe-area inset is reserved below related products');
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).overscrollBehaviorY),'none','No bottom boundary rubber-band in recommendations');
 assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).overscrollBehaviorY),'none');
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollSnapType),'none','Long recommendations scroll without snapping back to the section heading');
 await page.mouse.move(190,400);
 for(let gesture=0;gesture<3;gesture++)await page.mouse.wheel(0,500);
 const settled=await page.evaluate(async()=>{const samples=[];for(let i=0;i<60;i++){await new Promise(requestAnimationFrame);samples.push({y:scrollY,height:document.documentElement.scrollHeight})}return samples});
 settled.forEach(s=>{assert(Math.abs(s.y-bottom.y)<1,'No bottom scroll correction on release');assert.equal(s.height,bottom.height,'No growing bottom whitespace')});
 await page.mouse.wheel(0,-200);
 await page.waitForFunction(y=>scrollY<y-50,bottom.y);
 assert(await page.locator('.sf-product-sheet').evaluate(e=>e.classList.contains('is-discovering')),'Long recommendations scroll freely inside their snap area');
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForFunction(()=>!document.querySelector('.woocommerce-product-gallery').classList.contains('is-discovering'));
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).overscrollBehaviorY),'auto','Top native refresh policy restored');

 await page.locator('.woocommerce-product-gallery__wrapper').focus();await page.keyboard.press('End');
 await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));

 await page.locator('.sf-product-sheet-toggle').click();
 assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'true','Details open from recommendations');
 await page.locator('.sf-product-sheet-toggle').click();
 await page.evaluate(()=>{const e=document.querySelectorAll('.woocommerce-product-gallery__image')[1];window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'})});
 await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
 await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
 const photoOffset=await page.evaluate(()=>scrollY);
 await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
 await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').getBoundingClientRect().height>700);assert(await page.locator('.woocommerce-product-gallery').evaluate(e=>e.inert),'Open details stops gallery gestures/focus');
 await page.locator('.sf-product-delivery > summary').click();assert(await page.locator('.cdl-fsb-text').isVisible(),'Shipping visible inside open delivery section');
 const bar=await page.locator('.cdl-fsb-track').boundingBox(),text=await page.locator('.cdl-fsb-text').boundingBox();assert(Math.abs(bar.width-text.width)<1,'Full width shipping track');
 await page.locator('.sf-product-sheet-body').evaluate(e=>e.scrollTop=300);
 assert.equal(await page.evaluate(()=>scrollY),photoOffset,'Sheet scroll cannot move photos');
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).overflowY),'hidden','Only open details lock document scrolling');
 assert(Math.abs((await buy.boundingBox()).y-bounds.y)<1,'Purchase fixed in expanded state');
 await page.locator('.sf-product-sheet-toggle').focus();await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 await page.evaluate(()=>location.hash='review_form');await page.waitForFunction(()=>document.querySelector('#sf-product-section-reviews').open);assert.equal(await toggle.getAttribute('aria-expanded'),'true','Review hash opens panel');
 await page.locator('.sf-product-sheet-toggle').click();
 await page.locator('form.cart').evaluate(e=>e.addEventListener('submit',event=>{event.preventDefault();e.dataset.submits=String(Number(e.dataset.submits||0)+1)}));
 await page.locator('input.qty').fill('2');await buy.click();assert.equal(await page.locator('form.cart').getAttribute('data-submits'),'1');
 await page.locator('input.qty').fill('0');await buy.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true','Native invalid quantity exposes validation');assert.equal(await page.locator('form.cart').getAttribute('data-submits'),'1','Invalid form never submitted');
 await page.locator('#sf-panel').evaluate(e=>e.showModal());assert(!(await buy.isVisible()),'Global modal hides document purchase');await page.locator('#sf-panel').evaluate(e=>e.close());
 await toggle.click();
 await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'))+2});
 const handle=await page.locator('.sf-product-sheet-header').boundingBox();
 const beforeDrag=(await page.locator('.sf-product-sheet').boundingBox()).height;
 await page.mouse.move(handle.x+handle.width/2,handle.y+20);await page.mouse.down();
 await page.mouse.move(handle.x+handle.width/2,handle.y-80,{steps:8});
 const during=(await page.locator('.sf-product-sheet').boundingBox()).height;
 assert(Math.abs(during-beforeDrag-100)<2,'Sheet follows 100px movement before release '+width+' '+during);
 assert(during<500,'Drag does not jump to fully open');
 await page.mouse.move(handle.x+handle.width/2,handle.y-30,{steps:4});
 assert(Math.abs((await page.locator('.sf-product-sheet').boundingBox()).height-beforeDrag-50)<2,'Reversing the pointer reverses the sheet immediately');
 await page.mouse.move(handle.x+handle.width/2,handle.y-150,{steps:4});await page.mouse.up();
 assert.equal(await toggle.getAttribute('aria-expanded'),'true','Release settles the sheet open');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No mobile horizontal overflow');
 if(width===390){await page.locator('input.qty').fill('1');await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').getBoundingClientRect().height>750);fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-product-sheet-open.png'});await toggle.click();await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'))+2});await page.screenshot({path:'qa/storefront-ui-kit-product-sheet-closed.png'});}
 await page.setViewportSize({width:1280,height:900});await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet'));assert.equal(await page.locator('.sf-product-sheet').count(),0,'Desktop restores original document');assert.equal(await page.locator('div.product > .summary .product_title').count(),1);assert.equal(await page.locator('div.product > .related').count(),1,'Desktop recommendation position restored');assert.equal(await page.locator('.sf-product-discovery').count(),0);assert.equal(await page.locator('.summary > .cdl-fsb--product').count(),1,'Desktop restores original live shipping node');assert.equal(await page.locator('.sf-product-delivery').count(),0,'No generated mobile sections on desktop');assert.equal(await page.locator('body > .sf-footer').count(),1);assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1);
 await page.setViewportSize({width,height:844});await page.waitForFunction(()=>!!document.querySelector('.sf-product-sheet'));assert.equal(await page.locator('.sf-product-sheet').count(),1,'Return to mobile mounts once');
}
// Native summary must never flash while the dependency-free adapter loads.
// It mounts before DOMContentLoaded, even with a blocked footer script.
await page.setViewportSize({width:390,height:844});
let releaseAdapter,releaseFooter;
const adapterGate=new Promise(r=>releaseAdapter=r),footerGate=new Promise(r=>releaseFooter=r);
await page.route('https://sheet.test/**',async route=>{
 const path=new URL(route.request().url()).pathname;
 if(path==='/product.js'){await adapterGate;await route.fulfill({contentType:'text/javascript',body:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});return;}
 if(path==='/slow-footer.js'){await footerGate;await route.fulfill({contentType:'text/javascript',body:''});return;}
 if(path==='/'){
  const body=fixture({pending:true}).replace('class="woocommerce-product-gallery images','style="opacity:0" class="woocommerce-product-gallery images').replace(template,template+'<script src="/product.js"></script><script src="/slow-footer.js"></script>');
  await route.fulfill({contentType:'text/html',body});return;
 }
 await route.fulfill({status:404,body:''});
});
const streaming=page.goto('https://sheet.test/',{waitUntil:'load'});
await page.locator('#sf-product-sheet-template').waitFor({state:'attached'});
assert(!(await page.locator('.summary .product_title').isVisible()),'Old large title never paints while adapter is pending');
assert(!(await page.locator('.sf-product-purchase').isVisible()),'Old detached purchase never paints while adapter is pending');
assert.equal(await page.locator('.woocommerce-product-gallery').evaluate(e=>getComputedStyle(e).opacity),'1','Native first photo does not wait for Woo footer opacity');
await page.waitForTimeout(4300);
assert(!(await page.locator('.summary .product_title').isVisible()),'A network slower than four seconds never expires the prepaint guard');
releaseAdapter();await page.locator('.sf-product-sheet').waitFor({state:'visible'});
assert.equal(await page.evaluate(()=>document.readyState),'loading','Panel mounts before delayed footer/DOMContentLoaded');
assert(await page.locator('.single_add_to_cart_button').isVisible());
assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('sf-product-sheet-pending')),false);
releaseFooter();await streaming;
await page.locator('.sf-product-sheet-body .sf-footer').waitFor({state:'attached'});
assert.equal(await page.locator('.sf-footer').count(),1,'Late footer is moved once after parsing');
await page.unroute('https://sheet.test/**');
// Once parsing completes without enhancement, native Woo fails open.
await page.setContent(fixture({pending:true}));
await page.waitForFunction(()=>!document.documentElement.classList.contains('sf-product-sheet-pending'));
assert(await page.locator('.summary .product_title').isVisible(),'Failed enhancement fails open to native Woo');
// A real mobile viewport starts at a provisional desktop layout width before
// its meta viewport. The guard must already exist before that meta is parsed.
const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const touchPage=await touchContext.newPage();
await touchPage.setContent(fixture({pending:true}).replace('<meta name="viewport"','<script>window.__guardBeforeViewport=document.documentElement.classList.contains("sf-product-sheet-pending")</script><meta name="viewport"'));
assert.equal(await touchPage.evaluate(()=>window.__guardBeforeViewport),true,'Guard is independent of the provisional mobile viewport width');
await load(touchPage);
const touchSession=await touchContext.newCDPSession(touchPage);
const headerBox=await touchPage.locator('.sf-product-sheet-header').boundingBox();
assert(headerBox.height>=60,'Whole header provides a comfortable touch grip');
assert.equal(await touchPage.locator('.sf-product-sheet-header').evaluate(e=>getComputedStyle(e).userSelect),'none','Holding the title never starts native text selection');
const touchToggle=touchPage.locator('.sf-product-sheet-toggle');
const toggleBox=await touchToggle.boundingBox();
const tx=toggleBox.x+toggleBox.width/2,ty=toggleBox.y+toggleBox.height/2;
const touchHeight=(await touchPage.locator('.sf-product-sheet').boundingBox()).height;
const sendTouch=(type,y)=>touchSession.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:tx,y,id:1}]});
await sendTouch('touchStart',ty);
for(const jitter of [-2,2,-1,0])await sendTouch('touchMove',ty+jitter);
assert.equal(await touchPage.locator('.sf-product-sheet.is-dragging').count(),0,'Small finger jitter never starts a panel gesture');
assert(Math.abs((await touchPage.locator('.sf-product-sheet').boundingBox()).height-touchHeight)<1,'Holding leaves the panel still');
await sendTouch('touchMove',ty-80);
assert(Math.abs((await touchPage.locator('.sf-product-sheet').boundingBox()).height-touchHeight-80)<2,'Real touch follows the finger before release');
await touchPage.setViewportSize({width:390,height:820});
assert.equal(await touchPage.locator('.sf-product-sheet.is-dragging').count(),1,'Height-only toolbar resize does not cancel a held touch');
await sendTouch('touchMove',ty-40);
assert(Math.abs((await touchPage.locator('.sf-product-sheet').boundingBox()).height-touchHeight-40)<2,'Real touch reverses without a jump');
await sendTouch('touchMove',ty-180);await sendTouch('touchEnd');
assert.equal(await touchToggle.getAttribute('aria-expanded'),'true');
await touchPage.waitForTimeout(100);
await touchToggle.evaluate(e=>e.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})));
assert.equal(await touchToggle.getAttribute('aria-expanded'),'true','Delayed synthetic release click cannot toggle the sheet back');
// A fresh intentional press can still close it immediately.
await touchToggle.click();assert.equal(await touchToggle.getAttribute('aria-expanded'),'false');
await touchContext.close();
const noScriptContext=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
const noScript=await noScriptContext.newPage();await noScript.setContent(fixture({pending:true}));
assert(await noScript.locator('.summary .product_title').isVisible(),'No-JS native title remains available');
assert(await noScript.locator('.single_add_to_cart_button').isVisible(),'No-JS native purchase remains available');
await noScriptContext.close();

// Keep document photo edges and snap targets stable across repeated discovery
// entry/exit and height-only browser-toolbar changes. CSS tokens emulate the
// stable small/large viewports while Playwright changes the visible viewport.
await page.setViewportSize({width:390,height:844});await load(page);
await page.evaluate(()=>{document.documentElement.style.setProperty('--sf-product-viewport-small','760px');document.documentElement.style.setProperty('--sf-product-viewport-large','844px')});
const stableEdges=await page.locator('.woocommerce-product-gallery__image').evaluateAll(nodes=>nodes.map(e=>scrollY+e.getBoundingClientRect().top));
for(let cycle=0;cycle<3;cycle++){
 await page.evaluate(()=>{const e=document.querySelector('.sf-product-discovery');window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'})});
 await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
 const reserved=await page.locator('.sf-product-discovery').evaluate(e=>getComputedStyle(e).paddingBottom);
 await page.setViewportSize({width:390,height:760});
 await page.evaluate(()=>{const e=document.querySelectorAll('.woocommerce-product-gallery__image')[2];window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'})});
 await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
 await page.waitForFunction(()=>Math.abs(document.querySelectorAll('.woocommerce-product-gallery__image')[2].getBoundingClientRect().top)<1);
 const edges=await page.locator('.woocommerce-product-gallery__image').evaluateAll(nodes=>nodes.map(e=>scrollY+e.getBoundingClientRect().top));
 edges.forEach((edge,i)=>assert(Math.abs(edge-stableEdges[i])<1,'Toolbar/panel does not move photo edge '+i));
 assert.equal(await page.locator('.sf-product-discovery').evaluate(e=>getComputedStyle(e).paddingBottom),reserved,'Discovery compaction does not resize its snap area');
 await page.setViewportSize({width:390,height:844});
}
await page.setViewportSize({width:390,height:844});await load(page,{variable:true});await page.locator('.single_add_to_cart_button').click();assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'true');await page.waitForFunction(()=>document.activeElement?.id==='color');assert.equal(await page.locator('#color').evaluate(e=>e===document.activeElement),true,'Missing native variation focused');await page.locator('#color').selectOption('cream');
await load(page,{stock:false});assert.equal(await page.locator('.single_add_to_cart_button').count(),0);await page.locator('.sf-product-sheet-toggle').click();assert(await page.locator('.out-of-stock').isVisible(),'Stockless product details accessible');
await load(page,{short:true});
await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
const plainHeight=(await page.locator('.sf-product-sheet').boundingBox()).height;
await page.locator('.woocommerce-product-gallery__wrapper').focus();await page.keyboard.press('End');
await page.waitForFunction(previous=>{const e=document.querySelector('.sf-product-sheet'),target=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'));return target<previous-1&&Math.abs(e.getBoundingClientRect().height-target)<2},plainHeight);
await page.emulateMedia({reducedMotion:'reduce'});await load(page);await page.locator('.sf-product-sheet-toggle').click();assert(await page.locator('.sf-product-information').isVisible());
assert.deepEqual(errors,[]);console.log('Product sheet: 3 mobile widths, vertical photos, independent detail scroll, native form/validation/variation, drag, hash, modal, stockless, responsive restoration and reduced motion passed.');
}catch(error){console.error('SHEET_DEBUG',JSON.stringify(await lastPage?.evaluate(()=>({active:document.activeElement?.tagName+' '+document.activeElement?.className,parts:['.woocommerce-product-gallery__wrapper','.woocommerce-product-gallery__image','.sf-product-sheet','.sf-product-sheet-body','.sf-product-purchase'].map(selector=>{const e=document.querySelector(selector);if(!e)return{selector};const s=getComputedStyle(e);return{selector,rect:e.getBoundingClientRect().toJSON(),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,scrollTop:e.scrollTop,display:s.display,overflow:s.overflow,visibility:s.visibility}})}))));fs.mkdirSync('qa',{recursive:true});await lastPage?.screenshot({path:'qa/storefront-ui-kit-product-sheet-failure.png'});throw error;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
