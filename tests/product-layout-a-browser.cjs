// Mobile A layout: native price, normal long title, native qty=1, one CTA.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {load}=require('./product-sheet-browser.cjs');
(async()=>{
 const browser=await chromium.launch();
 try {
  const page=await browser.newPage();
  for(const width of [320,390,402,430]){
   await page.setViewportSize({width,height:844});
   await load(page,{productType:true,longTitle:true,noUrgency:true});
   const result=await page.evaluate(()=>{
    const sheet=document.querySelector('.sf-product-sheet');
    const heading=sheet.querySelector('.sf-product-sheet-heading');
    const purchase=sheet.querySelector('.sf-product-purchase');
    const qty=purchase.querySelector('.quantity');
    const price=purchase.querySelector('.sf-product-price-row');
    const handle=sheet.querySelector('.sf-product-sheet-handle');
    const title=heading.querySelector('.product_title');
    const buy=purchase.querySelector('.single_add_to_cart_button');
    return {enabled:sheet.classList.contains('is-layout-a'),priceNode:!!price,quantityValue:qty.querySelector('input.qty').value,
      quantityHidden:getComputedStyle(qty).display==='none',buttonCount:document.querySelectorAll('.single_add_to_cart_button').length,
      formId:buy.form.id,handleWidth:handle.getBoundingClientRect().width,handlePath:handle.querySelector('path').getAttribute('d'),
      titleDisplay:getComputedStyle(title).display,titleClamp:getComputedStyle(title).webkitLineClamp,
      titleWidth:title.getBoundingClientRect().width,headingWidth:heading.getBoundingClientRect().width,
      priceRight:price.getBoundingClientRect().right,buyLeft:buy.getBoundingClientRect().left};
   });
   assert(result.enabled, 'A layout must activate for standard default-one products at '+width);
   assert(result.priceNode && result.quantityHidden && result.quantityValue==='1', 'Native price + submitted Woo quantity');
   assert.equal(result.buttonCount,1);
   assert.equal(result.formId,'native-cart');
   assert.equal(result.handleWidth,38);
   assert(result.handlePath.includes('L19 7') && result.handlePath.includes('L36 7'));
   assert.equal(result.titleDisplay,'block');
   assert(Math.abs(result.titleWidth-result.headingWidth)<2,'Title spans the full heading');
   assert(result.priceRight<=result.buyLeft+1,'Price stays to the left of the button');
   await page.setViewportSize({width:1280,height:900});
   await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet'));
   assert.equal(await page.locator('.summary > .sf-product-price-row').count(),1,'Price returns to original desktop summary');
   assert.equal(await page.locator('form.cart input.qty').count(),1);
  }
  console.log('A mobile panel: all narrow widths and desktop restore passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
