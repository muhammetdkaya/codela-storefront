// Real production template, native scroll, original form, responsive restoration.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const template=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php'],{encoding:'utf8'});
const bootstrap=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','bootstrap'],{encoding:'utf8'});
const quantity=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','quantity'],{encoding:'utf8'});
const css='.woocommerce div.product div.images .woocommerce-product-gallery__image:nth-child(n+2){width:25%;display:inline-block}'+['assets/styles/tokens.css','assets/storefront.css','assets/styles/components.css','assets/styles/navigation.css','assets/styles/gallery.css','assets/styles/product.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const picture=n=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="${['#dbd1c3','#bab4a1','#ad998a'][n]}"/><text x="200" y="300" font-size="80">${n+1}</text></svg>`);
function fixture({variable=false,stock=true,short=false,noUrgency=false,longTitle=false,pending=false,promotion='none',visitor=false}={}){return `<!doctype html><html><head>${pending?bootstrap:''}<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,Helvetica,sans-serif}${css}</style></head><body class="single-product woocommerce"><div class="sf-shell"><header class="sf-header"><span>Codela</span></header><nav class="sf-mobile-dock" hidden></nav><dialog id="sf-panel"></dialog></div><main class="sf-content"><div class="woocommerce-notices-wrapper"></div><div class="product">
<div class="woocommerce-product-gallery images sf-ui-gallery sf-ui-gallery--hero sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper">${[0,1,2].map(n=>`<div class="woocommerce-product-gallery__image" data-thumb="${picture(n)}"><a href="${picture(n)}"><img alt="Product ${n+1}" src="${picture(n)}"></a></div>`).join('')}</div></div>${visitor?'<div id="codela-live-visitor-container" class="sf-product-visitor" hidden><div class="cdl-lv"><span class="cdl-lv-dot" aria-hidden="true"></span><span class="cdl-lv-text">Şu an <strong>2</strong> kişi bakıyor</span></div></div>':''}
<div class="summary"><h1 class="product_title">${promotion!=='none'?'Kavis Dekoratif Obje':short?'Luna':longTitle?'Kavis Dekoratif Obje Doğal Traverten Taş Heykel Seti':'Luna Traverten Lamba'}</h1><div class="sf-product-price-row">${promotion!=='none'?'<p class="price"><del>$80,00</del><ins>$40,00</ins></p>':'<p class="price">3.490 ₺</p>'}${promotion!=='none'?`<div class="cdl-ub">${promotion!=='timer'?'<div class="cdl-ub-item cdl-ub-scarcity"><svg class="cdl-ub-ico" viewBox="0 0 24 24"></svg><span class="cdl-ub-text">Son <strong>2</strong> ürün kaldı!</span></div>':''}${promotion!=='scarcity'?'<div class="cdl-ub-item cdl-ub-timer"><svg class="cdl-ub-ico" viewBox="0 0 24 24"></svg><span class="cdl-ub-text">Kampanya bitişine: <span class="cdl-ub-countdown" data-evergreen-hours="24">23:59:49</span></span></div>':''}</div>`:short||noUrgency?'':'<div class="cdl-ub">Son 3 adet</div>'}</div><p class="woocommerce-product-details__short-description">Doğal taşın dokusu.</p>
${stock?`<form id="native-cart" class="cart ${variable?'variations_form':''}" method="post">${variable?'<table class="variations"><tbody><tr><th><label for="color">Renk</label></th><td><select id="color" name="attribute_color"><option value="">Seçiniz</option><option value="cream">Kum</option></select></td></tr></tbody></table><input name="variation_id" value="123" type="hidden">':''}<div class="sf-product-purchase"><div class="quantity">${quantity}</div><button class="single_add_to_cart_button button alt ${variable?'disabled wc-variation-selection-needed':''}" type="submit" name="add-to-cart" value="42">Sepete ekle</button></div></form>`:'<p class="stock out-of-stock">Stokta yok</p>'}
<div class="cdl-fsb--product"><div class="cdl-fsb-text">Ücretsiz kargoya 510 ₺ kaldı</div><div class="cdl-fsb-track"><span class="cdl-fsb-fill" style="width:87%"></span></div></div></div>
<div class="sf-product-information"><details open class="sf-product-information-section"><summary>Ürün hakkında</summary><div style="min-height:450px">Ürün bilgisi</div></details><details id="sf-product-section-reviews" class="sf-product-information-section"><summary>Değerlendirmeler</summary><div id="reviews"><a id="review_form">Yorum yaz</a><textarea aria-label="Yorum"></textarea></div></details></div><div class="cdl-tb">Güvenli ödeme</div><section class="related" style="min-height:1200px"><h2>İlgili ürünler</h2><a href="/related">Diğer ürün</a></section>${template}</div></main><footer class="sf-footer"><div class="sf-footer-inner"><a href="/privacy">Gizlilik</a></div></footer></body></html>`;}
async function load(page,options){await page.goto('about:blank');await page.setContent(fixture(options));await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8')});}
(async()=>{const browser=await chromium.launch();let lastPage;try{const page=await browser.newPage();lastPage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [320,390,700]){
 await page.setViewportSize({width,height:844});await load(page);
 // Three mobile preview controls must all be clipped circles with equal
 // hit targets. Check the actual shared IconButton + gallery stylesheet,
 // not a mock class with a hand-written radius.
 const circles=await page.locator('.sf-product-gallery-thumb:not([hidden])').evaluateAll(buttons=>
   buttons.map(button=>{
     const img=button.querySelector('img'),rect=button.getBoundingClientRect(),
       style=getComputedStyle(button),imageStyle=getComputedStyle(img);
     return {width:rect.width,height:rect.height,radius:style.borderTopLeftRadius,
       overflow:style.overflow,fit:imageStyle.objectFit, imageWidth:img.getBoundingClientRect().width,
       imageHeight:img.getBoundingClientRect().height};
   }));
 assert.equal(circles.length,3,'Exactly three product image previews remain visible');
 for(const circle of circles){
   assert(Math.abs(circle.width-circle.height)<.1,'Every preview is a true square');
   assert.equal(circle.radius,'50%','Every mobile gallery preview is a clipped circle');
   assert.equal(circle.overflow,'hidden','The entire preview image is clipped by the circular button');
   assert.equal(circle.fit,'cover','Every thumbnail fills its circle without distortion');
   assert(Math.abs(circle.imageWidth-circle.imageHeight)<.1,'Every preview image is square before circle clipping');
 }
 assert(circles.every(c=>Math.abs(c.width-circles[0].width)<.1),'All three circles have the same diameter');
 const toggle=page.locator('.sf-product-sheet-toggle');const buy=page.locator('.single_add_to_cart_button');
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert(await buy.isVisible(),'Collapsed native purchase remains visible');
 assert.equal(await buy.evaluate(e=>e.form.id),'native-cart','Native form ownership retained');
 assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1,'No copied submit');
 const material=await page.evaluate(()=>{
  const probe=document.createElement('div');probe.className='sf-dock-surface';probe.style.display='none';document.querySelector('.sf-shell').append(probe);
  const props=['backdropFilter','borderTopColor','boxShadow'];
  const expected=getComputedStyle(probe),actual=getComputedStyle(document.querySelector('.sf-product-sheet'));
  const same=props.every(key=>expected[key]===actual[key]);probe.remove();return same;
 });
 assert(material,'Large panel keeps shared dock filter, border and shadow');
 const panelTint=await page.locator('.sf-product-sheet').evaluate(e=>getComputedStyle(e).backgroundColor);
 assert.equal(panelTint,'rgba(247, 247, 249, 0.78)','Whole panel has a visibly translucent tint instead of almost opaque white');
 assert.equal(await page.locator('.sf-product-quantity').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(247, 247, 249, 0.96)','Compact quantity keeps header tint independent of the large panel');
 const panelBox=await page.locator('.sf-product-sheet').boundingBox();
 assert(Math.abs(panelBox.width-Math.min(width-32,430))<1,'Panel uses the same inset and max width as the site dock');
 assert(Math.abs(panelBox.x-(width-panelBox.width)/2)<1,'Panel is centered like the dock');
 assert(Math.abs(panelBox.y+panelBox.height-840)<1,'Panel uses the same bottom gap as the dock');
 assert.equal(await page.locator('.sf-product-sheet .sf-footer').count(),0,'Footer is outside both panel states');
 assert.equal(await page.locator('body > .sf-footer').count(),1,'Native footer remains at the end of the document');
 assert.equal(await page.locator('.sf-product-sheet .sf-product-purchase').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','One sheet material');
 assert.equal(await toggle.evaluate(e=>getComputedStyle(e,'::after').content),'none','Arrow is removed; accessible grip button remains');
 const spacing=await page.locator('.sf-product-purchase').evaluate(e=>{const s=getComputedStyle(e);return [s.paddingTop,s.paddingBottom]});assert.deepEqual(spacing,['12px','12px'],'Balanced purchase edge spacing');
 assert.equal(Math.round((await buy.boundingBox()).height),44,'Smaller CTA retains a 44px touch target');
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
 const purchaseGap=()=>page.evaluate(()=>document.querySelector('.single_add_to_cart_button').getBoundingClientRect().top-document.querySelector('.sf-product-sheet-heading').getBoundingClientRect().bottom);
 const closedGap=await purchaseGap();
 assert(closedHeight<180,'Compact collapsed panel '+width+' '+closedHeight);
 assert.equal(await page.locator('.sf-product-sheet .related').count(),0,'Recommendations are outside product details');
 assert.equal(await page.locator('.sf-product-discovery > .related a').getAttribute('href'),'/related','Native related anchor preserved');
 await page.locator('.woocommerce-product-gallery__wrapper').focus();await page.keyboard.press('End');
 await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
 await page.waitForFunction(previous=>{const e=document.querySelector('.sf-product-sheet'),target=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'));return Math.abs(target-previous)<1&&Math.abs(e.getBoundingClientRect().height-target)<2},closedHeight);
 assert(await page.locator('.sf-product-discovery .related').isVisible(),'Related products reachable without opening details');
 assert(Math.abs((await page.locator('.sf-product-sheet').boundingBox()).height-closedHeight)<1,'Panel keeps the same height during discovery');
 assert(Math.abs(await purchaseGap()-closedGap)<1,'Title to purchase gap stays unchanged during discovery');
 assert.equal(await page.locator('.sf-product-sheet-heading .product_title').evaluate(e=>getComputedStyle(e).fontSize),titleFont,'Title size is identical over photos and recommendations');
 assert(await buy.isVisible(),'Same purchase remains visible while discovering');
 // Repeated gestures beyond the last card must not grow the document or
 // correct its resting position on release. Native OS rubber-band is covered
 // by the scoped overscroll policy; a desktop wheel cannot emulate that paint.
 await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await page.waitForFunction(()=>Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<1);
 const bottom=await page.evaluate(()=>({y:scrollY,height:document.documentElement.scrollHeight}));
 assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).paddingBottom),'0px','Hidden navigation dock adds no second bottom reserve to product document');
 const footerGap=await page.evaluate(()=>document.querySelector('.sf-product-sheet').getBoundingClientRect().top-document.querySelector('.sf-footer-inner').getBoundingClientRect().bottom);
 assert(footerGap>=0&&footerGap<=28,'Native Footer finishes immediately above floating panel '+width+' '+footerGap);
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
 await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.sf-product-sheet').evaluate(e=>getComputedStyle(e).backgroundColor),panelTint,'Expanded panel keeps the same translucent material as collapsed');
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
 await page.waitForFunction(()=>{
   const grip=document.querySelector('.sf-product-sheet-header');
   return new DOMMatrix(getComputedStyle(grip,'::before').transform).a>1.02;
 });
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
// Native Woo title, price and purchase are the REAL initial dock before the
// same nodes are moved into the enhanced sheet. It must not be blank while
// loading, including DOMContentLoaded and a slow or blocked adapter.
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
streaming.catch(()=>{}); // The delayed script remains pending if an earlier assertion fails.
await page.locator('#sf-product-sheet-template').waitFor({state:'attached'});
assert(await page.locator('.summary .product_title').isVisible(),'Original title paints inside the first-frame glass sheet');
assert(await page.locator('.sf-product-purchase').isVisible(),'The real native purchase form paints while the adapter is blocked');
const pendingBox=await page.locator('div.product > .summary').boundingBox();
const firstPurchase=await page.locator('.sf-product-purchase').boundingBox();
const firstTitle=await page.locator('div.product > .summary > .product_title').boundingBox();
const surfaceStyle=selector=>page.locator(selector).evaluate(e=>{
 const v=getComputedStyle(e),inner=getComputedStyle(e.querySelector('.sf-product-purchase'));
 return {
   borderRadius:v.borderRadius,background:v.backgroundColor,shadow:v.boxShadow,
   backdrop:v.backdropFilter,webkitBackdrop:v.webkitBackdropFilter,
   footerBackground:inner.backgroundColor,footerShadow:inner.boxShadow,
   footerBorder:inner.borderTopWidth,footerBackdrop:inner.backdropFilter
 };
});
const nativeSurface=await surfaceStyle('div.product > .summary');
assert.equal(nativeSurface.borderRadius,'28px','Native first paint keeps the more oval 28px product-panel corners');
assert.equal(nativeSurface.background,'rgba(247, 247, 249, 0.78)','Native panel uses shared translucent glass token');
assert.equal(nativeSurface.footerBackground,'rgba(0, 0, 0, 0)','Native purchase footer has no extra white pill');
assert.equal(nativeSurface.footerShadow,'none','Native purchase footer has no independent shadow');
assert.equal(nativeSurface.footerBorder,'0px','Native purchase footer has no second surface border');
assert.equal(nativeSurface.footerBackdrop,'none','Native purchase footer does not double blur');

console.log('NATIVE_FIRST_PANEL '+JSON.stringify({pendingBox,firstPurchase,firstTitle}));
assert(Math.abs(pendingBox.width-358)<2,'First-frame panel shares dock horizontal inset');
assert(pendingBox.y>0&&pendingBox.y+pendingBox.height<=844,'First-frame sheet is fixed within viewport');
assert(firstPurchase.y>=pendingBox.y && firstPurchase.y+firstPurchase.height<=pendingBox.y+pendingBox.height+4,'First-frame purchase belongs inside panel');
assert(firstTitle.y>=pendingBox.y && firstTitle.y+firstTitle.height<=firstPurchase.y,'Real heading precedes native controls');
assert.equal(await page.locator('.single_add_to_cart_button').count(),1,'Only original Woo submit appears before enhancement');
assert.equal(await page.locator('.woocommerce-product-gallery').evaluate(e=>getComputedStyle(e).opacity),'1','Native first photo does not wait for Woo footer opacity');
await page.waitForTimeout(4300);
assert(await page.locator('.summary .product_title').isVisible(),'Slow connection leaves real purchase panel visible for four seconds');
assert(await page.locator('.sf-product-purchase').isVisible(),'Native purchase remains usable before enhancement');
releaseAdapter();await page.locator('.sf-product-sheet').waitFor({state:'visible'});
assert.equal(await page.evaluate(()=>document.readyState),'loading','Panel mounts before delayed footer/DOMContentLoaded');
assert(await page.locator('.single_add_to_cart_button').isVisible());
assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('sf-product-sheet-pending')),false);
releaseFooter();await streaming;
await page.locator('body > .sf-footer').waitFor({state:'attached'});
assert.equal(await page.locator('.sf-product-sheet .sf-footer').count(),0,'Late footer never enters the product panel');
assert.equal(await page.locator('.sf-footer').count(),1,'Late native footer is preserved once');
await page.unroute('https://sheet.test/**');
// A late async/deferred adapter may start AFTER DOMContentLoaded. This is the
// production first-paint race that a slow mobile refresh can expose.
let releaseAsync;
const asyncGate=new Promise(resolve=>{releaseAsync=resolve;});
await page.route('https://sheet-async.test/**',async route=>{
 const path=new URL(route.request().url()).pathname;
 if(path==='/product.js'){
   await asyncGate;
   await route.fulfill({contentType:'text/javascript',body:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});
 }else if(path==='/'){
   await route.fulfill({contentType:'text/html',body:fixture({pending:true}).replace(template,template+'<script async src="/product.js"></script>')});
 }else await route.fulfill({status:404,body:''});
});
await page.goto('https://sheet-async.test/',{waitUntil:'domcontentloaded'});
await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
assert(await page.locator('html').evaluate(e=>e.classList.contains('sf-product-sheet-pending')),'DOM ready cannot release product first-paint guard before adapter');
assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('sf-product-sheet-ready')),false);
assert(await page.locator('div.product > .summary .product_title').isVisible(),'Same compact heading is painted before async mount');
assert(await page.locator('div.product > .summary .single_add_to_cart_button').isVisible(),'Original Woo submit is visible before async mount');
const prePanel=await page.locator('div.product > .summary').boundingBox();
const preTitle=await page.locator('div.product > .summary .product_title').boundingBox();
const preQty=await page.locator('div.product > .summary .quantity').boundingBox();
const preSubmit=await page.locator('div.product > .summary .single_add_to_cart_button').boundingBox();
assert.equal(await page.locator('div.product > .summary .sf-product-quantity-step:visible').count(),2,'Native pending quantity shows original two controls');
assert(preQty.width>100 && preQty.width<155,'Pending quantity already uses compact controls');
assert(preSubmit.width<=202,'Native pending add-to-cart matches final compact CTA');
assert(prePanel.y>0 && prePanel.height>100,'First document paint includes real lower panel, not a blank gallery bottom');
assert(preTitle.height<50,'Initial title already uses final compact typography');
assert(await page.locator('.woocommerce-product-gallery').isVisible(),'Real photograph paints before adapter');
const beforePhoto=await page.locator('.woocommerce-product-gallery__image').first().boundingBox();
const beforeFrame=await page.locator('.woocommerce-product-gallery__wrapper').evaluate(e=>getComputedStyle(e).overflowY);
assert.equal(beforeFrame,'visible','Prepaint photo already uses final mobile gallery flow');
releaseAsync();
await page.locator('.sf-product-sheet').waitFor({state:'visible'});
await page.waitForFunction(()=>!document.documentElement.classList.contains('sf-product-sheet-pending'));
const afterPhoto=await page.locator('.woocommerce-product-gallery__image').first().boundingBox();
const postPanel=await page.locator('.sf-product-sheet').boundingBox();
const mountedSurface=await surfaceStyle('.sf-product-sheet');
console.log('PRODUCT_PANEL_MATERIAL '+JSON.stringify({first:nativeSurface,mounted:mountedSurface}));
assert.deepEqual(nativeSurface,mountedSurface,'First-paint panel and enhanced panel must have identical material, radius and no stacked footer');

const postQty=await page.locator('.sf-product-sheet .quantity').boundingBox();
const postSubmit=await page.locator('.sf-product-sheet .single_add_to_cart_button').boundingBox();
console.log('PRODUCT_INITIAL_CONTROLS '+JSON.stringify({quantityBefore:preQty,quantityAfter:postQty,buttonBefore:preSubmit,buttonAfter:postSubmit}));
assert(Math.abs(preQty.width-postQty.width)<6,'Quantity does not resize after mount');
assert(Math.abs(preSubmit.width-postSubmit.width)<6,'Purchase button does not resize after mount');
assert(Math.abs(preQty.y-postQty.y)<3,'First paint quantity has no vertical jump after mount');
assert(Math.abs(preSubmit.y-postSubmit.y)<3,'First paint purchase button has no vertical jump after mount');
console.log('PRODUCT_FIRST_PANEL '+JSON.stringify({first:prePanel,enhanced:postPanel}));
assert(Math.abs(prePanel.y-postPanel.y)<3,'Hydration may not visually jump the lower panel');
assert(Math.abs(prePanel.height-postPanel.height)<2,'Real first-paint height must match mounted header/footer without a resize');
const frameDrift=Math.abs(beforePhoto.height-afterPhoto.height);
console.log('PRODUCT_PREPAINT_FRAME '+JSON.stringify({before:beforePhoto.height,after:afterPhoto.height,drift:frameDrift}));
assert(Math.abs(beforePhoto.y-afterPhoto.y)<1,'Hydration must not move the first photo top');
assert(frameDrift<5,'Initial mobile photo preserves mounted frame geometry without a visible resize');
assert.equal(await page.locator('.sf-product-sheet .product_title').count(),1,'Same native title moves exactly once into product panel');
assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1,'No duplicated purchase control during async hydration');
await page.unroute('https://sheet-async.test/**');
// The live Kavis product has no urgency badge. A fixed 157px first panel was
// only aligned for the TWO-LINE badge fixture and then visibly shrank on iOS.
// Check with and without the badge, and both single/multi-line title lengths.
for(const width of [320,390,700]){
 await page.setViewportSize({width,height:844});
 for(const scenario of [{noUrgency:true},{short:true},{noUrgency:true,longTitle:true}]){
   let release;
   const gate=new Promise(resolve=>{release=resolve;});
   await page.route('https://sheet-height.test/**',async route=>{
     const path=new URL(route.request().url()).pathname;
     if(path==='/product.js'){
       await gate;
       await route.fulfill({contentType:'text/javascript',body:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});
     }else if(path==='/'){
       await route.fulfill({contentType:'text/html',body:fixture({...scenario,pending:true}).replace(template,template+'<script async src="/product.js"></script>')});
     }else await route.fulfill({status:404,body:''});
   });
   await page.goto('https://sheet-height.test/',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const pending=await page.locator('div.product > .summary').boundingBox();
   const padBefore=await page.locator('div.product > .summary').evaluate(e=>({height:getComputedStyle(e).height,padding:getComputedStyle(e).padding,form:getComputedStyle(e.querySelector('form.cart')).padding,title:e.querySelector('.product_title').getBoundingClientRect().height,price:e.querySelector('.sf-product-price-row').getBoundingClientRect().height,footer:e.querySelector('.sf-product-purchase').getBoundingClientRect().height}));
   release();
   await page.locator('.sf-product-sheet').waitFor({state:'visible'});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('sf-product-sheet-pending'));
   const mounted=await page.locator('.sf-product-sheet').boundingBox();
   const padAfter=await page.locator('.sf-product-sheet').evaluate(e=>({height:getComputedStyle(e).height,padding:getComputedStyle(e).padding,header:e.querySelector('.sf-product-sheet-header').getBoundingClientRect().height,footer:e.querySelector('.sf-product-purchase').getBoundingClientRect().height}));
   console.log('PRODUCT_HEIGHT_VARIANT '+JSON.stringify({width,scenario,pending,mounted,padBefore,padAfter}));
   assert(Math.abs(pending.height-mounted.height)<3,'First paint product sheet cannot grow or shrink at '+width+' / '+JSON.stringify(scenario));
   assert(Math.abs(pending.y-mounted.y)<3,'First paint product sheet remains fixed at '+width+' / '+JSON.stringify(scenario));
   await page.unroute('https://sheet-height.test/**');
 }
}
// Genuine enabled conversion tools must not turn the price into a tall
// sidebar. Validate native FIRST PAINT as well as the reparented live nodes:
// title/price share one row, stock/timer share the next, height never jumps.
for(const [width,promotion] of [[320,'both'],[390,'both'],[700,'both'],[390,'scarcity'],[390,'timer']]){
 await page.setViewportSize({width,height:844});
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 await page.route('https://sheet-urgency.test/**',async route=>{
   const uri=new URL(route.request().url());
   if(uri.pathname==='/product.js'){
     await gate;
     await route.fulfill({contentType:'text/javascript',body:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});
   }else if(uri.pathname==='/'){
     await route.fulfill({contentType:'text/html',body:fixture({pending:true,promotion}).replace(template,template+'<script async src="/product.js"></script>')});
   }else await route.fulfill({status:404,body:''});
 });
 await page.goto('https://sheet-urgency.test/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
 const probe=(hydrated)=>page.evaluate(hydrated=>{
   const root=document.querySelector(hydrated?'.sf-product-sheet':'div.product > .summary');
   const title=root.querySelector('.product_title'),price=root.querySelector('.sf-product-price-row > .price');
   const urgency=root.querySelector('.sf-product-price-row > .cdl-ub'),cart=root.querySelector('.sf-product-purchase');
   const a=title.getBoundingClientRect(),b=price.getBoundingClientRect(),c=urgency.getBoundingClientRect(),d=cart.getBoundingClientRect(),panel=root.getBoundingClientRect();
   const ticker=urgency.querySelector('.cdl-ub-countdown');
   return {panelY:panel.y,panelHeight:panel.height,centerOffset:Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2),urgencyTop:c.top,titleBottom:a.bottom,priceBottom:b.bottom,urgencyHeight:c.height,urgencyX:c.x,urgencyWidth:c.width,headingX:a.x,cartY:d.y,overflow:document.documentElement.scrollWidth>innerWidth+1,urgencyDisplay:getComputedStyle(urgency).display,prefixSize:ticker?getComputedStyle(ticker.parentElement).fontSize:null,tickerSize:ticker?getComputedStyle(ticker).fontSize:null,items:urgency.querySelectorAll('.cdl-ub-item').length,priceText:price.innerText};
 },hydrated);
 const before=await probe(false);
 release();
 await page.locator('.sf-product-sheet').waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sf-product-sheet-pending'));
 const after=await probe(true);
 for(const state of [before,after]){
   assert(state.centerOffset<7,'Title and discounted price share aligned first row '+width+' '+promotion+' '+JSON.stringify(state));
   assert(state.urgencyTop>=Math.max(state.titleBottom,state.priceBottom)+5,'Scarcity and timer appear below title and price '+width+' '+promotion);
   assert(state.urgencyHeight<=28,'Conversion messages occupy one compact row '+width+' '+promotion);
   assert.equal(state.urgencyDisplay,'grid','Native plugin urgency is a single compact grid '+width+' '+promotion);
   assert(!state.overflow,'Urgency must not cause horizontal overflow '+width+' '+promotion);
   assert(state.priceText.includes('$40,00'),'Native sale price retained '+width+' '+promotion);
   assert.equal(state.items,promotion==='both'?2:1,'Enabled modules not duplicated '+width+' '+promotion);
   if(promotion!=='scarcity'){
     assert.equal(state.prefixSize,'0px','Long timer prefix is visually suppressed '+width);
     assert.equal(state.tickerSize,'11px','Native live countdown remains readable '+width);
   }
 }
 assert(Math.abs(before.panelHeight-after.panelHeight)<3,'No conversion-module first-paint panel jump '+width+' '+promotion+' '+JSON.stringify({before,after}));
 assert(Math.abs(before.panelY-after.panelY)<3,'No conversion-module vertical panel movement '+width+' '+promotion);
 assert(Math.abs(before.cartY-after.cartY)<3,'Original purchase controls retain position '+width+' '+promotion);
 assert.equal(await page.locator('.sf-product-sheet .cdl-ub').count(),1,'Single original urgency host');
 if(promotion!=='scarcity'){
   const height=after.panelHeight;
   await page.locator('.cdl-ub-countdown').evaluate(el=>{el.textContent='01:02:03';});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const changed=await page.locator('.sf-product-sheet').boundingBox();
   assert(Math.abs(changed.height-height)<2,'Live timer changes cannot grow the panel '+width);
 }
 await page.unroute('https://sheet-urgency.test/**');
}
// The actual Woo hook host starts as a sibling of the gallery, hidden until
// a successful Codela ping reaches the merchant's real threshold. Adopt the
// one node onto the gallery frame so visitor and 1/N remain fixed together
// while the photographs scroll independently (never a cloned counter).
for(const width of [320,390,700]){
 await page.setViewportSize({width,height:844});
 await load(page,{visitor:true});
 const original=page.locator('#codela-live-visitor-container');
 assert.equal(await page.locator('.woocommerce-product-gallery > #codela-live-visitor-container').count(),1,'Original Woo sibling host moved directly to gallery frame '+width);
 assert.equal(await original.isVisible(),false,'Genuine Codela host is hidden before ping '+width);
 await original.evaluate(el=>{el.hidden=false;});
 assert(await page.locator('.sf-product-visitor .cdl-lv-text').isVisible(),'Live visitor text revealed after a count reaching threshold '+width);
 const snapshot=()=>page.evaluate(()=>{
   const gallery=document.querySelector('.woocommerce-product-gallery'),host=gallery.querySelector('#codela-live-visitor-container');
   const index=gallery.querySelector('.sf-product-gallery-count'),sheet=document.querySelector('.sf-product-sheet');
   const v=host.getBoundingClientRect(),n=index.getBoundingClientRect(),label=host.querySelector('.cdl-lv');
   const ls=getComputedStyle(label),cs=getComputedStyle(host),panel=getComputedStyle(sheet);
   return {count:document.querySelectorAll('#codela-live-visitor-container').length,
     index:index.textContent,visitorText:host.innerText,visitorY:v.y,indexY:n.y,
     visitorX:v.x,indexRight:n.right,position:cs.position,
     background:ls.backgroundColor,font:ls.fontSize,line:ls.lineHeight,
     radius:panel.borderTopLeftRadius,hidden:host.hidden,
     overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
 const first=await snapshot();
 assert.equal(first.count,1,'One native Codela counter only '+width);
 assert.equal(first.index,'1 / 3','Live gallery image index remains native '+width);
 assert.equal(first.position,'fixed','Visitor follows the gallery index on the viewport '+width);
 assert.equal(first.background,'rgba(0, 0, 0, 0)','Visitor text has no background '+width);
 assert.equal(first.font,'12px','Photo index and visitor share the font size '+width);
 assert.equal(first.line,'18px','Photo index and visitor share line height '+width);
 assert.equal(first.radius,'28px','Mounted panel shares the same more oval corner radius '+width);
 assert(first.visitorX>first.indexRight+8,'Visitor stays to the right of 1/N '+width);
 assert(Math.abs(first.visitorY-first.indexY)<2,'Visitor and 1/N share a baseline '+width+' '+JSON.stringify(first));
 assert(!first.overflow,'No overflow with gallery annotations '+width);
 await page.evaluate(()=>{const e=document.querySelectorAll('.woocommerce-product-gallery__image')[1];window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'})});
 await page.waitForFunction(()=>document.querySelector('.sf-product-gallery-count').textContent==='2 / 3');
 const second=await snapshot();
 assert.equal(second.index,'2 / 3','Native count changes on second photo '+width);
 assert.equal(second.count,1,'Gallery swipe never clones Codela host '+width);
 assert(!second.hidden,'Codela count remains visible across photos '+width);
 assert.equal(second.visitorText,first.visitorText,'Gallery scroll does not alter real visitor count '+width);
 assert(Math.abs(second.visitorY-first.visitorY)<2,'Visitor never disappears or moves while scrolling photos '+width+' '+JSON.stringify({first,second}));
 assert(Math.abs(second.visitorY-second.indexY)<2,'Gallery 2/N and visitor stay in the same row '+width);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('.sf-product-gallery-count').textContent==='1 / 3');
 await page.locator('.sf-product-sheet-toggle').click();
 assert.equal(await original.evaluate(el=>getComputedStyle(el).visibility),'hidden','Expanded product detail keeps gallery metadata behind details '+width);
}
await page.setViewportSize({width:390,height:844});
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
await touchPage.evaluate(()=>{
 window.__touchTrace=[];
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','resize'])window.addEventListener(type,e=>window.__touchTrace.push({type,y:e.clientY,width:innerWidth,height:innerHeight,sheet:document.querySelector('.sf-product-sheet')?.getBoundingClientRect().height,classes:document.querySelector('.sf-product-sheet')?.className}));
});
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
await touchPage.waitForFunction(h=>Math.abs(document.querySelector('.sf-product-sheet').getBoundingClientRect().height-h-40)<2,touchHeight,{timeout:2000}).catch(async error=>{console.error('TOUCH_TRACE',JSON.stringify(await touchPage.evaluate(()=>window.__touchTrace)));throw error;});
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
await page.waitForFunction(previous=>{const e=document.querySelector('.sf-product-sheet'),target=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'));return Math.abs(target-previous)<1&&Math.abs(e.getBoundingClientRect().height-target)<2},plainHeight);
await page.emulateMedia({reducedMotion:'reduce'});await load(page);await page.locator('.sf-product-sheet-toggle').click();assert(await page.locator('.sf-product-information').isVisible());
assert.deepEqual(errors,[]);console.log('Product sheet: 3 mobile widths, vertical photos, independent detail scroll, native form/validation/variation, drag, hash, modal, stockless, responsive restoration and reduced motion passed.');
}catch(error){console.error('SHEET_DEBUG',JSON.stringify(await lastPage?.evaluate(()=>({active:document.activeElement?.tagName+' '+document.activeElement?.className,parts:['.woocommerce-product-gallery__wrapper','.woocommerce-product-gallery__image','.sf-product-sheet','.sf-product-sheet-body','.sf-product-purchase'].map(selector=>{const e=document.querySelector(selector);if(!e)return{selector};const s=getComputedStyle(e);return{selector,rect:e.getBoundingClientRect().toJSON(),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,scrollTop:e.scrollTop,display:s.display,overflow:s.overflow,visibility:s.visibility}})}))));fs.mkdirSync('qa',{recursive:true});await lastPage?.screenshot({path:'qa/storefront-ui-kit-product-sheet-failure.png'});throw error;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
