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
  for(const width of [320,390,430,700]){
   for(const short of [false,true]){
    await page.setViewportSize({width,height:844});
    await load(page,{noUrgency:true,longTitle:true,short});
    await page.evaluate(()=>document.querySelector('main').id='sf-content');
    const native=await page.evaluate(()=>{
     const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
     return {panel:box('.sf-product-sheet'),photo:box('.woocommerce-product-gallery__image'),quantity:box('.sf-product-quantity'),button:box('.single_add_to_cart_button')};
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
      return {panel:box('.sf-navigation-purchase'),photo:box('.sf-skeleton-gallery'),quantity:box('.sf-navigation-quantity'),button:box('.sf-navigation-controls .sf-ui-button')};
     });
     for(const component of ['panel','photo','quantity','button']){
      for(const key of ['x','y','width','height']) assert(Math.abs(native[component][key]-pending[component][key])<1,`${width}/${short}/${productSource} ${component}.${key}: ${native[component][key]} != ${pending[component][key]}`);
     }
     assert.equal(await page.locator('.sf-navigation-preview form').count(),0);
     assert(await page.locator('.sf-navigation-preview button').isDisabled());
     if(width===390&&!short&&productSource){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-product-skeleton-geometry.png'});}
     await page.evaluate(()=>codelaSFFeedback.end());
    }
   }
  }
  console.log('Native/feedback photo, panel, quantity and CTA coordinates match at four mobile widths, short/long titles, normal/product sources.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
