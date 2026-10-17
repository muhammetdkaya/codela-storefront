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
 assert.equal(await page.locator('.zoomImg').count(),0,'Inline zoom does not fetch/create a zoom image before user intent');
 const titleFont=width===390?await page.locator('.sf-product-sheet-heading .product_title').evaluate(e=>getComputedStyle(e).fontSize):null;
 const images=page.locator('.woocommerce-product-gallery__image');
 assert.equal(await images.count(),product.images,'Published gallery image count');const selected=product.images>1?1:0;
 if(width===390){
  const toggle=page.locator('.sf-product-sheet-toggle');
  const panelBox=await page.locator('.sf-product-sheet').boundingBox();
  assert(Math.abs(panelBox.width-Math.min(width-32,430))<1,'Live sheet matches dock width');
  assert.equal(await page.locator('.sf-product-sheet .sf-footer').count(),0,'Live footer is outside the sheet');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert(await page.locator('.single_add_to_cart_button').isVisible());
  const release=await page.locator('link[href*="styles/product.css"]').getAttribute('href');
  const parts=new URL(release).searchParams.get('ver').split('.').map(Number);
  assert(parts[0]>0||parts[1]>1||parts[2]>=120,'Updated purchase sheet must be live: '+release);
  for(const node of await page.locator('.cdl-fsb-text,.cdl-fsb-track,.sf-product-sheet-body .cdl-wa').all()){
   assert(!(await node.isVisible()),'Closed panel contains no shipping or contact information');
  }
  const input=page.locator('.sf-product-purchase input.qty[type="number"]');
  if(await input.count()){
   assert.equal(await page.locator('.sf-product-purchase [data-quantity-step]').count(),2);
   const prior=await input.inputValue(),plus=page.locator('.sf-product-purchase [data-quantity-step="1"]');
   if(!(await plus.isDisabled())){
    await plus.click();assert(Number(await input.inputValue())>Number(prior),'Native quantity increases without submitting');
    await input.fill(prior);await input.dispatchEvent('change');
   }
  }
  console.log('PRODUCT_SHEET_DOCK '+JSON.stringify({width,release,collapsedShipping:false,forms:await page.locator('form.cart').count(),quantityInputs:await input.count()}));
  assert.equal(await page.locator('script#codela-storefront-product-information-js').count(),1,'One early WordPress script instance');
  const handle=await page.locator('.sf-product-sheet-header').boundingBox();
  const initialHeight=(await page.locator('.sf-product-sheet').boundingBox()).height;
  await page.mouse.move(handle.x+handle.width/2,handle.y+20);await page.mouse.down();
  await page.mouse.move(handle.x+handle.width/2,handle.y-40,{steps:5});
  assert(Math.abs((await page.locator('.sf-product-sheet').boundingBox()).height-initialHeight-60)<2,'Live panel follows pointer before release');
  await page.mouse.move(handle.x+handle.width/2,handle.y+20,{steps:5});await page.mouse.up();
  await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet').classList.contains('is-dragging'));
  assert.equal(await toggle.getAttribute('aria-expanded'),'false','Return gesture settles closed');

  if(selected){
   await page.mouse.move(width/2,350);const distance=await images.first().evaluate(e=>e.getBoundingClientRect().height*.8);await page.mouse.wheel(0,distance);
   try{await page.waitForFunction(()=>Math.abs(document.querySelectorAll('.woocommerce-product-gallery__image')[1].getBoundingClientRect().top)<1,null,{timeout:5000});}
   catch(error){
    console.log('GALLERY_GEOMETRY '+JSON.stringify(await page.evaluate(()=>({height:innerHeight,width:innerWidth,y:scrollY,rootHeight:document.documentElement.clientHeight,rootSnap:getComputedStyle(document.documentElement).scrollSnapType,rootPadding:getComputedStyle(document.documentElement).scrollPaddingBottom,inset:document.documentElement.style.getPropertyValue('--sf-product-photo-inset'),body:document.body.className,photos:[...document.querySelectorAll('.woocommerce-product-gallery__image')].map(e=>({rect:e.getBoundingClientRect().toJSON(),snap:getComputedStyle(e).scrollSnapAlign,stop:getComputedStyle(e).scrollSnapStop,margin:getComputedStyle(e).scrollMarginBottom,source:e.querySelector('img').currentSrc})),count:document.querySelector('.sf-product-gallery-count').textContent}))));
    fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-geometry-failure.png'});throw error;
   }
  }
 }else if(selected)await page.locator('.sf-product-gallery-thumb').nth(selected).click();
 await page.waitForFunction(n=>document.querySelector('.sf-product-gallery-count').textContent.startsWith((n+1)+' /'),selected);
 const slide=images.nth(selected);await slide.locator('img:not(.zoomImg)').evaluate(e=>e.decode());
 const quality=await images.evaluateAll(nodes=>nodes.map(node=>{const image=node.querySelector('img:not(.zoomImg)');return{width:Number(image.getAttribute('width')),height:Number(image.getAttribute('height')),largeWidth:Number(image.dataset.large_image_width),largeHeight:Number(image.dataset.large_image_height),src:image.dataset.sfGallerySrc||image.getAttribute('src')}}));
 for(const image of quality){assert(image.width>100,'Every native photo has a product-size source');assert(Math.abs(image.width/image.height-image.largeWidth/image.largeHeight)<.01,'Every product photo retains its original aspect ratio');assert(!/-100x100\./.test(image.src),'No thumbnail stretched into a full photograph');}
 const decoded=await slide.locator('img:not(.zoomImg)').evaluate(e=>({width:e.naturalWidth,height:e.naturalHeight,src:e.currentSrc}));assert(decoded.width>100);assert(!/-(100x100|150x150|300x300)\./.test(decoded.src));
 console.log('GALLERY_QUALITY '+JSON.stringify({width,quality,decoded}));
 fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-selected-'+width+'.png'});
 assert.equal(await page.locator('.sf-product-gallery-thumb:visible').count(),Math.min(3,product.images),'At most three real preview controls');
 const originalURL=page.url(),photoPosition=await slide.evaluate(e=>scrollY+e.getBoundingClientRect().top);
 if(width===390)await slide.locator('a').tap();else await slide.locator('a').click();
 await page.waitForFunction(index=>document.querySelectorAll('.woocommerce-product-gallery__image')[index].querySelector('a').getAttribute('aria-pressed')==='true',selected);
 await page.waitForFunction(index=>{const e=document.querySelectorAll('.woocommerce-product-gallery__image')[index].querySelector('.zoomImg');return e&&Number(getComputedStyle(e).opacity)>.99},selected);
 await page.screenshot({path:'qa/performance/gallery-live-inline-zoom-'+width+'.png'});
 assert.equal(page.url(),originalURL,'Zoom stays on the product document');
 assert.equal(await page.locator('.pswp--open').count(),0,'No fullscreen popup');
 assert.equal(await slide.locator('.zoomImg').count(),1,'Same native Woo zoom plugin renders inside the original photo');
 assert(await page.locator('.single_add_to_cart_button').isVisible());
 assert.equal(await slide.evaluate(e=>scrollY+e.getBoundingClientRect().top),photoPosition,'Zoom does not move photo geometry');
 await page.keyboard.press('Escape');
 await page.waitForFunction(index=>document.querySelectorAll('.woocommerce-product-gallery__image')[index].querySelector('a').getAttribute('aria-pressed')==='false',selected);
 await slide.locator('a').press('Space');
 await page.waitForFunction(index=>document.querySelectorAll('.woocommerce-product-gallery__image')[index].querySelector('a').getAttribute('aria-pressed')==='true',selected);
 await slide.locator('a').click();
 await page.waitForFunction(index=>document.querySelectorAll('.woocommerce-product-gallery__image')[index].querySelector('a').getAttribute('aria-pressed')==='false',selected);
 if(width===390&&selected<product.images-1){
  await slide.locator('a').press('Space');
  await page.waitForFunction(index=>document.querySelectorAll('.woocommerce-product-gallery__image')[index].querySelector('a').getAttribute('aria-pressed')==='true',selected);
  await page.mouse.move(width/2,350);await page.mouse.wheel(0,await slide.evaluate(e=>e.getBoundingClientRect().height*.8));
  await page.waitForFunction(index=>document.querySelectorAll('.woocommerce-product-gallery__image')[index].querySelector('a').getAttribute('aria-pressed')==='false',selected);
  await page.waitForFunction(index=>Math.abs(document.querySelectorAll('.woocommerce-product-gallery__image')[index+1].getBoundingClientRect().top)<1,selected);
 }
 await page.locator('.sf-product-gallery-thumb[aria-current="true"]').evaluate(e=>e.blur());
 assert.equal(await page.locator('.sf-product-gallery-thumb[aria-current="true"]').evaluate(e=>getComputedStyle(e).outlineStyle),'none','Selection adds no black outline');
 console.log('GALLERY_INLINE_ZOOM '+JSON.stringify({width,popup:false,previewCount:await page.locator('.sf-product-gallery-thumb:visible').count(),nativeZoom:true}));
 if(width===390){
  const track=page.locator('.woocommerce-product-gallery__wrapper');const before=await page.evaluate(()=>scrollY);
  await page.locator('.sf-product-sheet-toggle').click();
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-expanded'));
  assert(await page.locator('.sf-product-information').isVisible());
  const contact=page.locator('.sf-product-sheet-body > .cdl-wa');
  if(await contact.count())assert(await contact.isVisible(),'Original contact link is an expanded information row');
  const shippingSection=page.locator('.sf-product-delivery:visible');
  if(await shippingSection.count()){
   await shippingSection.locator('summary').click();
   assert.equal(await shippingSection.getAttribute('open'),'','Shipping is a native disclosure');
  }
  await page.screenshot({path:'qa/performance/product-sheet-modules-open-390.png'});
  await page.locator('.sf-product-sheet-body').evaluate(e=>e.scrollTop=200);
  assert.equal(await page.evaluate(()=>scrollY),before,'Panel scroll leaves photos fixed');
  assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1);
  await page.locator('.sf-product-sheet-toggle').focus();await page.keyboard.press('Escape');
  await page.waitForFunction(()=>{const e=document.querySelector('.sf-product-sheet');return Math.abs(e.getBoundingClientRect().height-parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height')))<2});
  const purchaseGap=()=>page.evaluate(()=>document.querySelector('.single_add_to_cart_button').getBoundingClientRect().top-document.querySelector('.sf-product-sheet-heading').getBoundingClientRect().bottom);
  const closedGap=await purchaseGap();
  const closedHeight=(await page.locator('.sf-product-sheet').boundingBox()).height;assert(closedHeight<180,'Compact live purchase panel');
  assert.equal(await page.locator('.sf-product-sheet .related').count(),0);
  assert(await page.locator('.sf-product-discovery .related li.product').count()>0,'Live native recommendations follow photographs');
  const quantityMaterial=await page.locator('.sf-product-quantity').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,blur:getComputedStyle(e).backdropFilter}));
  const sheetMaterial=await page.locator('.sf-product-sheet').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,blur:getComputedStyle(e).backdropFilter}));
  assert.equal(quantityMaterial.blur,sheetMaterial.blur,'Live large and compact surfaces share the filter');
  assert.equal(sheetMaterial.bg,'rgba(247, 247, 249, 0.78)','Whole live panel uses the large glass tint');
  const material=await page.evaluate(()=>{const color=s=>getComputedStyle(document.querySelector(s)).backgroundColor;return{sheet:color('.sf-product-sheet'),button:color('.sf-menu-trigger')}});assert.equal(material.button,quantityMaterial.bg,'Compact header and quantity retain the original tint');
  // Sample every animation frame through both directions of the real boundary.
  async function transition(selector){
   const metrics=await page.evaluate(async selector=>{
    const photos=[...document.querySelectorAll('.woocommerce-product-gallery__image')];
    const edges=photos.map(e=>scrollY+e.getBoundingClientRect().top);
    const target=document.querySelector(selector),destination=scrollY+target.getBoundingClientRect().top;
    const direction=Math.sign(destination-scrollY);let previous=scrollY,reverse=0,drift=0,flips=0,compact=document.querySelector('.sf-product-sheet').classList.contains('is-discovering');
    window.scrollTo({top:destination,behavior:'smooth'});
    for(let frame=0;frame<90;frame++){
     await new Promise(requestAnimationFrame);
     const current=document.querySelector('.sf-product-sheet').classList.contains('is-discovering');
     if(current!==compact){flips++;compact=current;}
     drift=Math.max(drift,...photos.map((e,i)=>Math.abs(scrollY+e.getBoundingClientRect().top-edges[i])));
     reverse=Math.max(reverse,-direction*(scrollY-previous));previous=scrollY;
    }
    return{drift,reverse,flips,top:target.getBoundingClientRect().top};
   },selector);
   assert(metrics.drift<1,'Photo coordinates never change during panel transition '+JSON.stringify(metrics));
   assert(metrics.reverse<2,'No backward scroll correction during the transition '+JSON.stringify(metrics));
   assert(metrics.flips<=1,'Discovery state does not oscillate '+JSON.stringify(metrics));
   assert(Math.abs(metrics.top)<1,'Transition finishes on its native target '+JSON.stringify(metrics));
   console.log('GALLERY_TRANSITION '+JSON.stringify({selector,...metrics}));
  }
  await page.evaluate(()=>{const a=document.querySelectorAll('.woocommerce-product-gallery__image'),e=a[a.length-1];window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'})});
  await page.waitForFunction(()=>{const a=document.querySelectorAll('.woocommerce-product-gallery__image');return Math.abs(a[a.length-1].getBoundingClientRect().top)<1});
  await transition('.sf-product-discovery');
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
  await page.waitForFunction(previous=>{const e=document.querySelector('.sf-product-sheet'),target=parseFloat(getComputedStyle(e).getPropertyValue('--sf-product-closed-height'));return Math.abs(target-previous)<1&&Math.abs(e.getBoundingClientRect().height-target)<2},closedHeight);
  assert(Math.abs(await purchaseGap()-closedGap)<1,'Live title to purchase spacing remains stable over recommendations');
  assert.equal(Math.round((await page.locator('.single_add_to_cart_button').boundingBox()).height),44,'Live CTA uses smaller44px target');
  assert.equal(await page.locator('.sf-product-sheet-toggle').evaluate(e=>getComputedStyle(e,'::after').content),'none','Live chevron removed');
  assert(await page.locator('.single_add_to_cart_button').isVisible());
  fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-discovery.png'});

 // Repeated gestures beyond the last card must not grow the document or
 // correct its resting position on release. Native OS rubber-band is covered
 // by the scoped overscroll policy; a desktop wheel cannot emulate that paint.
 await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await page.waitForFunction(()=>Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<1);
 const bottom=await page.evaluate(()=>({y:scrollY,height:document.documentElement.scrollHeight}));
 const tail=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('.sf-product-discovery :is(.related,.upsells) li.product')];
  const last=Math.max(...cards.map(e=>e.getBoundingClientRect().bottom));
  const sheet=document.querySelector('.sf-product-sheet').getBoundingClientRect();
  const section=document.querySelector('.sf-product-discovery');
  const lists=[...section.querySelectorAll(':is(.related,.upsells) ul.products')];
  const footer=document.querySelector('.sf-footer');
  const footerContent=footer && footer.querySelector('.sf-footer-inner');
  const end=footerContent ? footerContent.getBoundingClientRect().bottom : last;
  return {gap:sheet.top-end,sheetTop:sheet.top,lastBottom:last,footerOutside:!!footer && !footer.closest('.sf-product-sheet'),reserve:getComputedStyle(section).paddingBottom,minHeight:getComputedStyle(section).minHeight,gridMargin:lists.map(e=>getComputedStyle(e).marginBottom)};
 });
  assert.equal(await page.locator('.sf-product-sheet-heading .product_title').evaluate(e=>getComputedStyle(e).fontSize),titleFont,'Live title font remains stable over recommendations');
 console.log('GALLERY_LAST_CARD '+JSON.stringify(tail));
 assert(tail.footerOutside,'Native footer stays outside the product panel');
 assert.equal(tail.minHeight,'0px','The final recommendation does not reserve a whole viewport');
 assert(tail.gridMargin.every(v=>v==='0px'),'Catalog grid does not add trailing margin under product discovery');
 assert(tail.gap>=-8&&tail.gap<=28,'Final native footer links sit above the floating panel without overlap or blank strip: '+JSON.stringify(tail));
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).overscrollBehaviorY),'none','No bottom boundary rubber-band in recommendations');
 assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).overscrollBehaviorY),'none');
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollSnapType),'none','Recommendations must scroll without photo snapping');
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

  await page.evaluate(()=>{const e=document.querySelector('.sf-product-discovery');window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'})});
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));
  console.log('GALLERY_BOTTOM '+JSON.stringify({stableHeight:bottom.height,stableY:bottom.y,samples:settled.length,overscroll:'none',topRefresh:'auto'}));
  await transition('.woocommerce-product-gallery__image:nth-child('+product.images+')');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet').classList.contains('is-discovering'));

 }
 const d=await page.evaluate(()=>({version:document.querySelector('link[href*="styles/tokens.css"]').href,images:document.querySelectorAll('.woocommerce-product-gallery__image').length,count:document.querySelector('.sf-product-gallery-count').textContent,sheet:document.querySelector('.sf-product-sheet-toggle')?.getAttribute('aria-expanded'),overflow:document.documentElement.scrollWidth>innerWidth+1}));
 assert(!d.overflow);d.width=width;d.product=product;d.multiImageLive=product.images>1;results.push(d);console.log('GALLERY_ACCEPT '+JSON.stringify(d));
 fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-'+width+'.png'});await context.close();
 }}finally{fs.mkdirSync('qa/performance',{recursive:true});fs.writeFileSync('qa/performance/gallery-acceptance.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
