// Public read-only native gallery acceptance; no cart/account writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();const results=[];
 try{for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:width===390?3:1,isMobile:width===390,hasTouch:width===390});
 const page=await context.newPage();
 await page.goto('https://codela.dev/urun/demo-20-v-yaka-tisort-secki/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.jQuery?.('.woocommerce-product-gallery').data('flexslider')?.count===3);
 const before=await page.locator('.summary').evaluate(e=>e.getBoundingClientRect().top);
 const thumbs=page.locator('.flex-control-thumbs img');
 assert.equal(await thumbs.count(),3);
 assert.equal(await thumbs.nth(1).getAttribute('sizes'),'48px');
 await thumbs.nth(1).click();
 await page.waitForFunction(()=>window.jQuery('.woocommerce-product-gallery').data('flexslider').currentSlide===1);
 await page.waitForTimeout(700);
 const slide=page.locator('.woocommerce-product-gallery__image').nth(1);
 assert(await slide.locator('img:not(.zoomImg)').evaluate(e=>e.complete&&e.naturalWidth>0));
 assert(Math.abs(await page.locator('.summary').evaluate(e=>e.getBoundingClientRect().top)-before)<1,'Thumbnail selection leaves details stable');
 // Candidate hit-testing fix; native zoom still owns its parent listeners.
 await page.addStyleTag({content:'.sf-ui-gallery .zoomImg{pointer-events:none}'});
 await slide.locator('a').click();
 await page.locator('.pswp--open').waitFor();
 await page.keyboard.press('Escape');
 await page.locator('.pswp--open').waitFor({state:'hidden'});
 await thumbs.nth(2).click();
 await page.waitForFunction(()=>window.jQuery('.woocommerce-product-gallery').data('flexslider').currentSlide===2);
 await page.waitForTimeout(700);
 assert(await page.locator('.woocommerce-product-gallery__image').nth(2).locator('img:not(.zoomImg)').evaluate(e=>e.complete&&e.naturalWidth>0));
 const d=await page.evaluate(()=>({version:document.querySelector('link[href*="styles/tokens.css"]').href,summaryTop:document.querySelector('.summary').getBoundingClientRect().top,galleryHeight:document.querySelector('.woocommerce-product-gallery').getBoundingClientRect().height,thumbs:[...document.querySelectorAll('.flex-control-thumbs img')].map(e=>({size:e.sizes,src:e.currentSrc,width:e.clientWidth}))}));
 d.width=width;results.push(d);console.log('GALLERY_ACCEPT '+JSON.stringify(d));
 fs.mkdirSync('qa/performance',{recursive:true});await page.screenshot({path:'qa/performance/gallery-live-'+width+'.png'});
 await context.close();
 }}finally{fs.mkdirSync('qa/performance',{recursive:true});fs.writeFileSync('qa/performance/gallery-acceptance.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
