// Public read-only native gallery/sheet acceptance; no cart/account writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {liveProduct}=require('./live-product.cjs');
(async()=>{
 const product=await liveProduct();const browser=await chromium.launch();const results=[];
 try{for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:width===390?3:1,isMobile:width===390,hasTouch:width===390});
 const page=await context.newPage();
 await page.goto(product.url,{waitUntil:'networkidle'});
 await page.locator('.sf-ui-gallery--scroll').waitFor();
 assert.equal(await page.locator('.zoomImg').count(),0,'Image link is the only enlargement action');
 const images=page.locator('.woocommerce-product-gallery__image');
 assert.equal(await images.count(),product.images,'Published gallery image count');const selected=product.images>1?1:0;
 if(width===390){
  const toggle=page.locator('.sf-product-sheet-toggle');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert(await page.locator('.single_add_to_cart_button').isVisible());
  if(selected){
   await page.mouse.move(width/2,350);await page.mouse.wheel(0,180);
   await page.waitForFunction(()=>Math.abs(document.querySelectorAll('.woocommerce-product-gallery__image')[1].getBoundingClientRect().top)<1);
  }
 }else if(selected)await page.locator('.sf-product-gallery-thumb').nth(selected).click();
 await page.waitForFunction(n=>document.querySelector('.sf-product-gallery-count').textContent.startsWith((n+1)+' /'),selected);
 const slide=images.nth(selected);await slide.locator('img:not(.zoomImg)').evaluate(e=>e.decode());
 const quality=await images.evaluateAll(nodes=>nodes.map(node=>{const image=node.querySelector('img:not(.zoomImg)');return{width:Number(image.getAttribute('width')),height:Number(image.getAttribute('height')),largeWidth:Number(image.dataset.large_image_width),largeHeight:Number(image.dataset.large_image_height),src:image.dataset.sfGallerySrc||image.getAttribute('src')}}));
 for(const image of quality){assert(image.width>100,'Every native photo has a product-size source');assert(Math.abs(image.width/image.height-image.largeWidth/image.largeHeight)<.01,'Every product photo retains its original aspect ratio');assert(!/-100x100\./.test(image.src),'No thumbnail stretched into a full photograph');}
 const decoded=await slide.locator('img:not(.zoomImg)').evaluate(e=>({width:e.naturalWidth,height:e.naturalHeight,src:e.currentSrc}));assert(decoded.width>100);assert(!/-(100x100|150x150|300x300)\./.test(decoded.src));
 console.log('GALLERY_QUALITY '+JSON.stringify({width,quality,decoded}));
 fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-selected-'+width+'.png'});
 await slide.locator('a').click();await page.locator('.pswp--open').waitFor();
 await page.keyboard.press('Escape');await page.locator('.pswp--open').waitFor({state:'hidden'});
 if(width===390){
  const track=page.locator('.woocommerce-product-gallery__wrapper');const before=await page.evaluate(()=>scrollY);
  await page.locator('.sf-product-sheet-toggle').click();
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-expanded'));
  assert(await page.locator('.sf-product-information').isVisible());
  await page.locator('.sf-product-sheet-body').evaluate(e=>e.scrollTop=200);
  assert.equal(await page.evaluate(()=>scrollY),before,'Panel scroll leaves photos fixed');
  assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1);
  await page.locator('.sf-product-sheet-toggle').focus();await page.keyboard.press('Escape');
  await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
  const closedHeight=(await page.locator('.sf-product-sheet').boundingBox()).height;assert(closedHeight<180,'Compact live purchase panel');
  assert.equal(await page.locator('.sf-product-sheet .related').count(),0);
  assert(await page.locator('.sf-product-discovery .related li.product').count()>0,'Live native recommendations follow photographs');
  const material=await page.evaluate(()=>{const color=s=>getComputedStyle(document.querySelector(s)).backgroundColor;return{sheet:color('.sf-product-sheet'),button:color('.sf-menu-trigger')}});assert.equal(material.sheet,material.button);
  await page.evaluate(()=>{const e=document.querySelector('.sf-product-discovery');window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'})});
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
  await page.waitForFunction(previous=>{const e=document.querySelector('.sf-product-sheet'),target=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'));return target<previous-1&&Math.abs(e.getBoundingClientRect().height-target)<2},closedHeight);
  assert(await page.locator('.single_add_to_cart_button').isVisible());
  fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-discovery.png'});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));

 }
 const d=await page.evaluate(()=>({version:document.querySelector('link[href*="styles/tokens.css"]').href,images:document.querySelectorAll('.woocommerce-product-gallery__image').length,count:document.querySelector('.sf-product-gallery-count').textContent,sheet:document.querySelector('.sf-product-sheet-toggle')?.getAttribute('aria-expanded'),overflow:document.documentElement.scrollWidth>innerWidth+1}));
 assert(!d.overflow);d.width=width;d.product=product;d.multiImageLive=product.images>1;results.push(d);console.log('GALLERY_ACCEPT '+JSON.stringify(d));
 fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-'+width+'.png'});await context.close();
 }}finally{fs.mkdirSync('qa/performance',{recursive:true});fs.writeFileSync('qa/performance/gallery-acceptance.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
