// Read-only live browser test for native Woo product document continuity.
// Never submits forms, adds items to a cart, or edits the WordPress site.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const HOME='https://codela.dev/';
const PRODUCT='https://codela.dev/urun/demo-20-v-yaka-tisort-secki/';
(async()=>{
 const browser=await chromium.launch();
 const samples=[];
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
   await context.addInitScript(()=>{
     // Embedded checkout/media frames can block storage. Only instrument the
     // real top-level document; this observer is not storefront application code.
     if (window !== window.top) return;
     const record = (name, event) => {
       try { sessionStorage.setItem(name, String(!!event.viewTransition)); } catch {}
     };
     addEventListener('pageswap',event=>record('sf-qa-page-swap',event));
     addEventListener('pagereveal',event=>record('sf-qa-page-reveal',event));
   });
   const page=await context.newPage();
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto(HOME,{waitUntil:'networkidle',timeout:90000});
   const styles=await page.locator('link[href*="document-continuity.css"]').count();
   assert.equal(styles,1,'Home includes native continuity CSS');
   const version=await page.locator('link[href*="styles/tokens.css"]').first().getAttribute('href');
   // A new release must not break QA simply because the theme version increases.
   const parts=(new URL(version)).searchParams.get('ver')?.split('.').map(Number);
   assert(parts?.length===3 && parts.every(Number.isInteger) &&
     (parts[0]>0 || parts[1]>1 || parts[2]>=80),'Expected 0.1.80 or newer, received '+version);
   assert.equal(await page.locator('.sf-header').evaluate(el=>getComputedStyle(el).viewTransitionName),'sf-persistent-header','Home header shared name');
   const start=await page.evaluate(()=>performance.timeOrigin);
   await page.evaluate(href=>{
     const link=document.createElement('a');link.id='sf-qa-native-product';link.href=href;link.textContent='QA product';
     document.querySelector('.sf-shell').appendChild(link);
   },PRODUCT);
   await page.locator('#sf-qa-native-product').click();
   await page.waitForURL(url=>url.href.startsWith(PRODUCT),{timeout:20000});
   await page.locator('.woocommerce-product-gallery').waitFor({timeout:20000});
   await page.waitForFunction(()=>window.jQuery?.('.woocommerce-product-gallery').data('flexslider')?.count===3,{timeout:20000});
   const evidence=await page.evaluate(()=>({
     version:document.querySelector('link[href*="styles/tokens.css"]')?.href,
     headerName:getComputedStyle(document.querySelector('.sf-header')).viewTransitionName,
     bottomName:getComputedStyle(document.querySelector('.sf-product-purchase')).viewTransitionName,
     dockVisible:document.querySelector('.sf-shell > .sf-mobile-dock')?.getBoundingClientRect().height>0 && getComputedStyle(document.querySelector('.sf-shell > .sf-mobile-dock')).display!=='none',
     purchased:document.querySelectorAll('form.cart button.single_add_to_cart_button').length,
     pageSwap:sessionStorage.getItem('sf-qa-page-swap'),
     pageReveal:sessionStorage.getItem('sf-qa-page-reveal'),
     navType:performance.getEntriesByType('navigation')[0]?.type,
     timeOrigin:performance.timeOrigin,
   }));
   assert(evidence.timeOrigin>start,'Product must load a new document, not a partial router region');
   assert.equal(evidence.pageSwap,'true','Product route should use native cross-document snapshot');
   assert.equal(evidence.pageReveal,'true','Product destination should reveal with native snapshot');
   assert.equal(evidence.headerName,'sf-persistent-header');
   assert.equal(evidence.purchased,1,'Single real Woo add-to-cart control');
   if(width===390){
     assert.equal(evidence.bottomName,'sf-persistent-bottom','Purchase bar continuity');
     assert(!evidence.dockVisible,'Product does not display two mobile bars');
   }
   assert(!errors.length,'No JS page errors: '+errors.join('; '));
   await page.locator('.flex-control-thumbs img').nth(1).click();
   await page.waitForFunction(()=>window.jQuery('.woocommerce-product-gallery').data('flexslider').currentSlide===1);
   samples.push({width, ...evidence,pageErrors:errors});
   console.log('CONTINUITY_ACCEPT '+JSON.stringify(samples.at(-1)));
   await context.close();
  }
 }finally{
  fs.mkdirSync('qa/continuity',{recursive:true});
  fs.writeFileSync('qa/continuity/live-acceptance.json',JSON.stringify(samples,null,2));
  await browser.close();
 }
})().catch(err=>{console.error(err);process.exitCode=1});
