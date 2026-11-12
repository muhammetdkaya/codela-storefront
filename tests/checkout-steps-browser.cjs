// Native Woo checkout fixture: only visibility and fixed action are new.
// The original field names, coupon form, Woo nonce and gateway button stay in place.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/assets/';
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/checkout.css']
    .map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const source=fs.readFileSync(root+'scripts/checkout-steps.js','utf8');
const native=[
'<div class="woocommerce">',
'<div class="woocommerce-form-coupon-toggle"><div class="woocommerce-info">Kuponunuz var mı? <a href="#" class="showcoupon">Kupon kodu</a></div></div>',
'<form class="checkout_coupon" style="display:none"><p class="form-row form-row-first"><input name="coupon_code" aria-label="Coupon"></p><p class="form-row form-row-last"><button type="submit" name="apply_coupon">Kupon kullan</button></p></form>',
'<form class="checkout woocommerce-checkout" action="/pay" method="post">',
'<div id="customer_details" class="col2-set">',
'<div class="col-1"><div class="woocommerce-billing-fields"><h3>Fatura</h3><div class="woocommerce-billing-fields__field-wrapper">',
'<p class="form-row validate-required" id="billing_first_name_field"><label>Ad</label><input name="billing_first_name" id="billing_first_name" required></p>',
'<p class="form-row validate-required" id="billing_email_field"><label>E-posta</label><input name="billing_email" id="billing_email" type="email" required></p>',
'<p class="form-row"><label>TCKN</label><input name="codela_personal_id" id="codela_personal_id"></p>',
'</div></div></div>',
'<div class="col-2"><div class="woocommerce-shipping-fields"><h3>Teslimat adresi</h3>',
'<label><input id="ship-to-different-address-checkbox" type="checkbox">Farklı teslimat</label>',
'<div class="shipping_address" style="display:none"><p class="form-row validate-required"><input name="shipping_first_name" required></p></div></div>',
'<div class="codela-gift-wrap" id="codela-gift-wrap-wrapper"><label><input type="checkbox" name="codela_gift_wrap" id="codela_gift_wrap">Hediye paketi</label></div>',
'<div class="woocommerce-additional-fields"><h3>Ek bilgi</h3><textarea name="order_comments" id="order_comments"></textarea></div></div></div>',
'<div class="codela-external-hook"><input name="codela_extra" value="unchanged"></div>',
'<h3 id="order_review_heading">Sipariş</h3><div id="order_review">',
'<div class="cdl-fsb-slot"><div class="cdl-fsb cdl-fsb--checkout" role="status"><div class="cdl-fsb-text"><span class="cdl-fsb-ico"><svg viewBox="0 0 24 24"><path d="M2 4h16v15H2z"/></svg></span><span>Ücretsiz kargo için <strong>₺1.900,00</strong> daha ekleyin.</span></div><div class="cdl-fsb-track"><span class="cdl-fsb-fill" style="width:60%"></span></div></div></div>',
'<table class="woocommerce-checkout-review-order-table"><thead><tr><th>Ürün</th><th>Tutar</th></tr></thead>',
'<tbody><tr class="cart_item"><td>Vazo</td><td>₺800,00</td></tr></tbody><tfoot>',
'<tr class="shipping"><th>Gönderim</th><td><label><input type="radio" name="shipping_method[0]" checked value="flat_rate:1">₺100,00</label></td></tr>',
'<tr class="order-total"><th>Toplam</th><td><strong><span class="woocommerce-Price-amount amount">₺900,00</span></strong></td></tr>',
'</tfoot></table><div id="payment"><ul class="payment_methods"><li>Ödeme yöntemi bulunamadı</li></ul>',
'<div class="form-row place-order"><label><input type="checkbox" name="terms" id="terms">Mesafeli satış</label>',
'<label><input type="checkbox" name="pre_info" id="pre_info">Ön bilgilendirme</label>',
'<input type="hidden" name="woocommerce-process-checkout-nonce" value="original-nonce">',
'<button id="place_order" name="woocommerce_checkout_place_order" type="submit">Siparişi onayla</button>',
'</div></div></div></form></div>'
].join('');
const blocks='<div class="woocommerce"><form class="wc-block-checkout"><input name="billing_email"><button type="submit">Sipariş ver</button></form></div>';
function html(markup){
 return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style>'+
 '<style>body{font-family:Arial,sans-serif;margin:0;background:#f8f8f6;color:#222}.sf-header{height:68px;background:#fff}.sf-checkout-page{max-width:100%}.woocommerce .form-row{margin:0 0 12px}.form-row label{display:block}.form-row input{min-height:54px}</style>'+
 '</head><body class="woocommerce-checkout"><header class="sf-header"></header><main class="sf-checkout-page" style="min-height:1200px">'+markup+'</main></body></html>';
}
(async()=>{
 const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true,
 ...(!process.env.TEST_WEBKIT&&process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 try{
  for(const width of [320,390,700,1024]){
   const page=await browser.newPage({viewport:{width,height:844}});
   await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:html(native)}));
   await page.goto('https://checkout.test/pay');
   await page.addScriptTag({content:source});
   await page.locator('body.sf-checkout-step-1').waitFor();
   assert.equal(await page.locator('form.checkout').count(),1,'Single native Woo form');
   assert.equal(await page.locator('#place_order').count(),1,'One order submit');
   assert.equal(await page.locator('#place_order').evaluate(el=>el.parentElement.classList.contains('place-order')),true,'Native gateway button stays in place');
   assert.equal(await page.locator('#customer_details .col-1').isVisible(),true);
   assert.equal(await page.locator('#customer_details .col-2').isVisible(),false);
   assert.equal(await page.locator('#order_review').isVisible(),false);
   assert.equal(await page.locator('.woocommerce-form-coupon-toggle').isVisible(),false);
   const footer=await page.locator('.sf-checkout-fixed-footer').boundingBox();
   const footerStyle=await page.locator('.sf-checkout-fixed-footer').evaluate(el=>{
    const css=getComputedStyle(el);
    return {left:css.left,right:css.right,width:css.width,bottom:css.bottom,
      edge:getComputedStyle(el.parentElement).getPropertyValue('--sf-checkout-fixed-edge'),
      viewport:innerWidth};
   });
   assert(footer&&footer.width<=762&&footer.y+footer.height<=846&&footer.y+footer.height>758,
     'Fixed footer '+width+' '+JSON.stringify({footer,footerStyle}));
   assert.equal(await page.locator('.sf-checkout-total-value').innerText(),'₺900,00');
   await page.locator('.sf-checkout-next').click();
   assert.equal(await page.locator('body.sf-checkout-step-1').count(),1,'Required native details gate step');
   assert.equal(await page.locator('.sf-checkout-step-error').isVisible(),true);
   await page.locator('#billing_first_name').fill('Deniz');
   await page.locator('#billing_email').fill('deniz@example.com');
   await page.locator('.sf-checkout-next').click();
   assert.equal(await page.locator('body.sf-checkout-step-2').count(),1);
   assert.equal(await page.locator('#customer_details .col-1').isVisible(),false);
   assert.equal(await page.locator('#customer_details .col-2').isVisible(),true);
   assert.equal(await page.locator('#codela_gift_wrap').isVisible(),true,'Gift plugin intact');
   assert.equal(await page.locator('.shipping').isVisible(),true,'Native shipping methods in delivery');
   assert.equal(await page.locator('form.checkout').evaluate(el=>getComputedStyle(el).borderTopStyle),'solid',
     'Delivery uses a single unified native-form surface');
   assert.equal(await page.locator('.woocommerce-additional-fields h3').isVisible(),false,
     'Step heading replaces redundant additional-info heading');
   assert.equal(await page.locator('.codela-gift-wrap').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px',
     'Gift option no longer adds a separate card border');
   assert.equal(await page.locator('.cdl-fsb-slot').isVisible(),true,'Live plugin shipping slot shown only in Delivery');
   assert.equal(await page.locator('.sf-checkout-shipping-ring').count(),1,'Single 40px shipping ring wraps original plugin icon');
   assert.equal(await page.locator('.sf-checkout-shipping-ring').evaluate(el=>getComputedStyle(el).width),'40px');
   const ringOffset=await page.locator('.sf-checkout-shipping-ring').evaluate(el=>parseFloat(el.style.getPropertyValue('--sf-checkout-shipping-offset')));
   assert(Math.abs(ringOffset-42.726)<0.1,'Ring uses native plugin percent: '+ringOffset);
   assert.equal(await page.locator('.cdl-fsb-track').isVisible(),false,'Original linear progress is visually replaced');
   assert.equal(await page.locator('.sf-checkout-shipping-ring .cdl-fsb-ico').count(),1,'One original icon preserved');
   assert.equal(await page.locator('.codela-external-hook').isVisible(),true,'Checkout hook retains delivery placement');
   assert.equal(await page.locator('#payment').isVisible(),false);
   await page.locator('#codela_gift_wrap').check();
   await page.locator('#order_comments').fill('Kapıya bırakın');
   await page.locator('.sf-checkout-next').click();
   assert.equal(await page.locator('body.sf-checkout-step-3').count(),1);
   assert.equal(await page.locator('#payment').isVisible(),true);
   assert.equal(await page.locator('#order_review_heading').isVisible(),false,
     'Stage title replaces redundant large order heading');
   assert.equal(await page.locator('.woocommerce-form-coupon-toggle').isVisible(),true);
   assert.equal(await page.locator('.cdl-fsb-slot').isVisible(),false,'Shipping progress does not repeat on payment');
   assert.equal(await page.locator('.showcoupon').innerText(),'Add discount code','Native coupon link has clearer copy');
   assert.equal(await page.locator('.sf-checkout-coupon-hint').count(),0,'Redundant coupon hint is removed');
   assert.equal(await page.locator('.showcoupon').isVisible(),true,'One line coupon toggle is visible');
   const collapsedCoupon=await page.locator('.woocommerce-form-coupon-toggle .woocommerce-info').boundingBox();
   assert(collapsedCoupon && collapsedCoupon.height<=65,'Coupon summary is a compact single row');
   await page.locator('form.checkout_coupon').evaluate(el=>el.style.display='block');
   await page.locator('.woocommerce-form-coupon-toggle.sf-checkout-coupon-open').waitFor();
   const couponInput=await page.locator('form.checkout_coupon input[name="coupon_code"]').boundingBox();
   const couponApply=await page.locator('form.checkout_coupon button[name="apply_coupon"]').boundingBox();
   assert(couponInput && couponApply && Math.abs(couponInput.y-couponApply.y)<2,'Coupon field and native Woo apply button stay on one row '+width);
   assert.equal(await page.locator('form.checkout_coupon button[name="apply_coupon"]').innerText(),'Apply');
   await page.locator('form.checkout_coupon').evaluate(el=>el.style.display='none');
   await page.locator('.woocommerce-form-coupon-toggle:not(.sf-checkout-coupon-open)').waitFor();
   assert.equal(await page.locator('form.checkout_coupon input[name="coupon_code"]').count(),1,'Original Woo coupon input preserved');
   assert.equal(await page.locator('.sf-checkout-shipping-ring').count(),1,'Shipping ring remains mounted for AJAX reentry');
   assert.equal(await page.locator('.woocommerce-checkout-review-order-table thead').isVisible(),false,'Compact summary hides redundant table headings');
   assert.equal(await page.locator('.cart_item').isVisible(),true,'Native products remain visible');
   assert.equal(await page.locator('.order-total').isVisible(),true,'Native summary total remains visible');
   assert.equal(await page.locator('.cart_item').isVisible(),true);
   assert.equal(await page.locator('#place_order').isVisible(),true);
   assert.equal(await page.locator('#place_order').getAttribute('type'),'submit');
   assert.equal(await page.locator('#terms').count(),1);
   assert.equal(await page.locator('#pre_info').count(),1);
   assert.equal(await page.locator('input[name="woocommerce-process-checkout-nonce"]').count(),1);
   const place=await page.locator('#place_order').boundingBox();
   assert(place&&place.y+place.height<=844&&place.y+place.height>755,'Native submit fixed on final step '+width);
   await page.locator('.sf-checkout-step-back').click();
   await page.locator('.sf-checkout-step-back').click();
   assert.equal(await page.locator('#billing_first_name').inputValue(),'Deniz');
   assert.equal(await page.locator('#codela_gift_wrap').isChecked(),true);
   assert.equal(await page.locator('#order_comments').inputValue(),'Kapıya bırakın');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No horizontal overflow '+width);
   await page.close();
  }
  const block=await browser.newPage();
  await block.route('**/*',r=>r.fulfill({contentType:'text/html',body:html(blocks)}));
  await block.goto('https://checkout.test/blocks');
  await block.addScriptTag({content:source});
  assert.equal(await block.locator('.sf-checkout-stepper').count(),0,'Checkout Blocks left native');
  assert.equal(await block.locator('body.sf-checkout-steps-active').count(),0);
  await block.close();
  console.log('Classic three-stage checkout regression passed: native form, plugin fields, coupon, legal consent, sticky total, actual submit, 4 viewports and Blocks fallback.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
