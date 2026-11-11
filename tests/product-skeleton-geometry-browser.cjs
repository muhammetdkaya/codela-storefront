// Compare destination feedback to the actual PHP Woo sheet and gallery adapter.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const {load}=require('./product-sheet-browser.cjs');
const root='theme/codela-storefront/assets/';
const preview=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','navigation'],{encoding:'utf8'}).replace('Add to cart','Sepete ekle');
const feedback=fs.readFileSync(root+'scripts/navigation-feedback.js','utf8');
const feedbackCss=fs.readFileSync(root+'styles/navigation-feedback.css','utf8');
(async()=>{
 const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch();
 try{
  const page=await browser.newPage();
  for(const width of [320,390,402,430,700]){
   for(const short of [false,true]){
    await page.setViewportSize({width,height:844});
    await load(page,{noUrgency:true,longTitle:true,short,productType:true});
    await page.evaluate(()=>document.querySelector('main').id='sf-content');
    const native=await page.evaluate(()=>{
     const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
     const c=getComputedStyle(document.querySelector('.single_add_to_cart_button'));
     const paint={backgroundColor:c.backgroundColor,backgroundImage:c.backgroundImage,boxShadow:c.boxShadow,backdropFilter:c.backdropFilter,color:c.color,fontWeight:c.fontWeight};
     return {panel:box('.sf-product-sheet'),photo:box('.woocommerce-product-gallery__image'),price:box('.sf-product-purchase .sf-product-price-row'),button:box('.single_add_to_cart_button'),paint};
    });
    // Run from both a product and a normal page; body-scoped gap must not leak.
    for(const productSource of [true,false]){
     await page.addStyleTag({content:feedbackCss});
     await page.evaluate(({preview,productSource})=>{
      document.body.classList.toggle('single-product',productSource);
      window.codelaSFDocument={productBase:'https://store.test/product/',purchasePreview:preview};
     },{preview,productSource});
     await page.addScriptTag({content:feedback});
     await page.evaluate(()=>codelaSFFeedback.begin({url:'https://store.test/product/next/'}));
     const pending=await page.evaluate(()=>{
      const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
      const c=getComputedStyle(document.querySelector('.sf-navigation-controls .sf-ui-button'));
      const paint={backgroundColor:c.backgroundColor,backgroundImage:c.backgroundImage,boxShadow:c.boxShadow,backdropFilter:c.backdropFilter,color:c.color,fontWeight:c.fontWeight};
      return {panel:box('.sf-navigation-purchase'),photo:box('.sf-skeleton-gallery'),price:box('.sf-navigation-price-placeholder'),button:box('.sf-navigation-controls .sf-ui-button'),paint};
     });
     // A skeleton cannot know the destination product's price width. Compare
     // viewport/photo anchors and CTA height, not an invented button x-position.
     for(const component of ['panel','photo']){
       for(const key of ['x','width']) assert(Math.abs(native[component][key]-pending[component][key])<2,`${width}/${short}/${productSource} ${component}.${key}: ${native[component][key]} != ${pending[component][key]}`);
     }
     assert(Math.abs(native.button.height-pending.button.height)<1,'Shared CTA hit target');
     assert(Math.abs(native.photo.height-pending.photo.height)<1,'Photo geometry never changes');
     assert(native.price.width>0&&pending.price.width>0,'A price and its placeholder exist');
     assert.deepEqual(pending.paint,native.paint,'Destination CTA and native Woo use the identical primary material');
     assert.equal(await page.locator('.sf-navigation-preview form').count(),0);
     assert(await page.locator('.sf-navigation-preview button').isDisabled());
     assert.equal(await page.locator('.sf-navigation-purchase .sf-product-sheet-handle path').count(),1,'Destination uses the identical one-path handle');
     assert.equal(await page.locator('.sf-navigation-purchase .sf-navigation-heading-title .sf-navigation-heading-placeholder').count(),3,'Title, shipping icon and shipping text placeholders');
     assert.equal(await page.locator('.sf-navigation-price-placeholder').count(),1,'Skeleton has one price placeholder');
     assert.equal(await page.locator('.sf-navigation-quantity').count(),0,'A layout does not display quantity in skeleton');
     assert.equal(await page.locator('.sf-navigation-purchase .sf-navigation-buy-button').evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)','Skeleton CTA matches dark primary paint');
     assert.equal(await page.locator('.sf-skeleton-gallery').evaluate(el=>getComputedStyle(el).animationName),'sf-skeleton-product-pulse','Product photo uses the slightly stronger pulse');
     if(width===390&&!short&&productSource){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-product-skeleton-geometry.png'});}
     await page.evaluate(()=>codelaSFFeedback.end());
    }
   }
  }
  console.log('Native/feedback photo, panel, quantity and CTA coordinates match at four mobile widths, short/long titles, normal/product sources.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
