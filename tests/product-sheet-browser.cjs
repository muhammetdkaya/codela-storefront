// Real production template, native scroll, original form, responsive restoration.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const template=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php'],{encoding:'utf8'});
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/components.css','assets/styles/gallery.css','assets/styles/product.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const picture=n=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="${['#dbd1c3','#bab4a1','#ad998a'][n]}"/><text x="200" y="300" font-size="80">${n+1}</text></svg>`);
function fixture({variable=false,stock=true}={}){return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,Helvetica,sans-serif}${css}</style></head><body class="single-product woocommerce"><div class="sf-shell"><header class="sf-header"><span>Codela</span></header><dialog id="sf-panel"></dialog></div><main class="sf-content"><div class="woocommerce-notices-wrapper"></div><div class="product">
<div class="woocommerce-product-gallery sf-ui-gallery sf-ui-gallery--hero sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper">${[0,1,2].map(n=>`<div class="woocommerce-product-gallery__image" data-thumb="${picture(n)}"><a href="${picture(n)}"><img alt="Product ${n+1}" src="${picture(n)}"></a></div>`).join('')}</div></div>
<div class="summary"><h1 class="product_title">Luna Traverten Lamba</h1><div class="sf-product-price-row"><p class="price">3.490 ₺</p><div class="cdl-ub">Son 3 adet</div></div><p class="woocommerce-product-details__short-description">Doğal taşın dokusu.</p>
${stock?`<form id="native-cart" class="cart ${variable?'variations_form':''}" method="post">${variable?'<table class="variations"><tbody><tr><th><label for="color">Renk</label></th><td><select id="color" name="attribute_color"><option value="">Seçiniz</option><option value="cream">Kum</option></select></td></tr></tbody></table><input name="variation_id" value="123" type="hidden">':''}<div class="sf-product-purchase"><div class="quantity"><input aria-label="Adet" class="qty" type="number" name="quantity" value="1" min="1" max="3" required></div><button class="single_add_to_cart_button button alt ${variable?'disabled wc-variation-selection-needed':''}" type="submit" name="add-to-cart" value="42">Sepete ekle</button></div></form>`:'<p class="stock out-of-stock">Stokta yok</p>'}
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
 await page.locator('.woocommerce-product-gallery__wrapper').focus();await page.keyboard.press('ArrowDown');
 await page.waitForFunction(()=>document.querySelector('.sf-product-gallery-count').textContent==='2 / 3');
 await page.waitForFunction(()=>{const e=document.querySelector('.woocommerce-product-gallery__wrapper');return Math.abs(e.scrollTop-e.clientHeight)<1});
 assert.equal(await toggle.getAttribute('aria-expanded'),'false','Gallery scrolling does not open details');
 await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
 const closedHeight=await page.locator('.sf-product-sheet').evaluate(e=>e.getBoundingClientRect().height);
 assert(closedHeight<180,'Compact collapsed panel '+width+' '+closedHeight);
 assert.equal(await page.locator('.sf-product-sheet .related').count(),0,'Recommendations are outside product details');
 assert.equal(await page.locator('.sf-product-discovery > .related a').getAttribute('href'),'/related','Native related anchor preserved');
 await page.locator('.woocommerce-product-gallery__wrapper').focus();await page.keyboard.press('End');
 await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
 await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
 assert(await page.locator('.sf-product-discovery .related').isVisible(),'Related products reachable without opening details');
 assert((await page.locator('.sf-product-sheet').boundingBox()).height<closedHeight,'Panel compacts further during discovery');
 assert(await buy.isVisible(),'Same purchase remains visible while discovering');
 await page.locator('.sf-product-sheet-toggle').click();
 assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'true','Details open from recommendations');
 await page.locator('.sf-product-sheet-toggle').click();
 await page.locator('.woocommerce-product-gallery__wrapper').evaluate(e=>e.scrollTo({top:e.clientHeight,behavior:'instant'}));
 await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
 await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
 const photoOffset=await page.locator('.woocommerce-product-gallery__wrapper').evaluate(e=>e.scrollTop);
 await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
 await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').getBoundingClientRect().height>700);assert(await page.locator('.woocommerce-product-gallery').evaluate(e=>e.inert),'Open details stops gallery gestures/focus');
 const bar=await page.locator('.cdl-fsb-track').boundingBox(),text=await page.locator('.cdl-fsb-text').boundingBox();assert(Math.abs(bar.width-text.width)<1,'Full width shipping track');
 await page.locator('.sf-product-sheet-body').evaluate(e=>e.scrollTop=300);
 assert.equal(await page.locator('.woocommerce-product-gallery__wrapper').evaluate(e=>e.scrollTop),photoOffset,'Sheet scroll cannot move photos');
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
 const handle=await page.locator('.sf-product-sheet-header').boundingBox();await page.mouse.move(handle.x+handle.width/2,handle.y+20);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2,handle.y-80,{steps:8});await page.mouse.up();assert.equal(await toggle.getAttribute('aria-expanded'),'true','Header drag opens');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No mobile horizontal overflow');
 if(width===390){await page.locator('input.qty').fill('1');await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').getBoundingClientRect().height>750);fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-product-sheet-open.png'});await toggle.click();await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'))+2});await page.screenshot({path:'qa/storefront-ui-kit-product-sheet-closed.png'});}
 await page.setViewportSize({width:1280,height:900});await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet'));assert.equal(await page.locator('.sf-product-sheet').count(),0,'Desktop restores original document');assert.equal(await page.locator('div.product > .summary .product_title').count(),1);assert.equal(await page.locator('div.product > .related').count(),1,'Desktop recommendation position restored');assert.equal(await page.locator('.sf-product-discovery').count(),0);assert.equal(await page.locator('body > .sf-footer').count(),1);assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1);
 await page.setViewportSize({width,height:844});await page.waitForFunction(()=>!!document.querySelector('.sf-product-sheet'));assert.equal(await page.locator('.sf-product-sheet').count(),1,'Return to mobile mounts once');
}
await page.setViewportSize({width:390,height:844});await load(page,{variable:true});await page.locator('.single_add_to_cart_button').click();assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'true');await page.waitForFunction(()=>document.activeElement?.id==='color');assert.equal(await page.locator('#color').evaluate(e=>e===document.activeElement),true,'Missing native variation focused');await page.locator('#color').selectOption('cream');
await load(page,{stock:false});assert.equal(await page.locator('.single_add_to_cart_button').count(),0);await page.locator('.sf-product-sheet-toggle').click();assert(await page.locator('.out-of-stock').isVisible(),'Stockless product details accessible');
await page.emulateMedia({reducedMotion:'reduce'});await load(page);await page.locator('.sf-product-sheet-toggle').click();assert(await page.locator('.sf-product-information').isVisible());
assert.deepEqual(errors,[]);console.log('Product sheet: 3 mobile widths, vertical photos, independent detail scroll, native form/validation/variation, drag, hash, modal, stockless, responsive restoration and reduced motion passed.');
}catch(error){console.error('SHEET_DEBUG',await lastPage?.evaluate(()=>({active:document.activeElement?.tagName+' '+document.activeElement?.className,parts:['.woocommerce-product-gallery__wrapper','.woocommerce-product-gallery__image','.sf-product-sheet','.sf-product-sheet-body','.sf-product-purchase'].map(selector=>{const e=document.querySelector(selector);if(!e)return{selector};const s=getComputedStyle(e);return{selector,rect:e.getBoundingClientRect().toJSON(),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,scrollTop:e.scrollTop,display:s.display,overflow:s.overflow,visibility:s.visibility}})})));fs.mkdirSync('qa',{recursive:true});await lastPage?.screenshot({path:'qa/storefront-ui-kit-product-sheet-failure.png'});throw error;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
