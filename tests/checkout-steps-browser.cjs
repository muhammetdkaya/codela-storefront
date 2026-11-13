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
'<div class="woocommerce-additional-fields"><h3>Ek bilgi</h3><div class="woocommerce-additional-fields__field-wrapper"><p class="form-row"><label for="order_comments">Sipariş notu</label><textarea name="order_comments" id="order_comments"></textarea></p></div>',
'<div class="codela-gift-wrap" id="codela-gift-wrap-wrapper"><label><input type="checkbox" name="codela_gift_wrap" id="codela_gift_wrap">Hediye paketi</label><div class="codela-gift-wrap__note" style="display:none"><label for="codela_gift_note">Hediye Notu</label><textarea id="codela_gift_note" name="codela_gift_note" rows="2"></textarea></div></div></div></div></div>',
'<div class="codela-external-hook"><input name="codela_extra" value="unchanged"></div>',
'<h3 id="order_review_heading">Sipariş</h3><div id="order_review">',
'<div class="cdl-fsb-slot"><div class="cdl-fsb cdl-fsb--checkout" role="status"><div class="cdl-fsb-text"><span class="cdl-fsb-ico"><svg viewBox="0 0 24 24"><path d="M2 4h16v15H2z"/></svg></span><span>Ücretsiz kargo için <strong>₺1.900,00</strong> daha ekleyin.</span></div><div class="cdl-fsb-track"><span class="cdl-fsb-fill" style="width:60%"></span></div></div></div>',
'<table class="woocommerce-checkout-review-order-table"><thead><tr><th>Ürün</th><th>Tutar</th></tr></thead>',
'<tbody><tr class="cart_item"><td class="product-name"><span class="sf-checkout-product-main"><img class="sf-checkout-product-image" alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="><span class="sf-checkout-product-label">Vazo</span></span> <strong class="product-quantity">&times;&nbsp;5</strong></td><td class="product-total">₺800,00</td></tr></tbody><tfoot>',
'<tr class="shipping"><th>Gönderim</th><td><label><input type="radio" name="shipping_method[0]" checked value="flat_rate:1">₺100,00</label></td></tr>',
'<tr class="order-total"><th>Toplam</th><td><strong><span class="woocommerce-Price-amount amount">₺900,00</span></strong></td></tr>',
'</tfoot></table><div id="payment"><ul class="payment_methods"><li>Ödeme yöntemi bulunamadı</li></ul>',
'<div class="form-row place-order"><div class="woocommerce-privacy-policy-text"><p>Kişisel verileriniz <a href="/gizlilik-politikasi/" class="woocommerce-privacy-policy-link">gizlilik ilkesi</a> sayfamızda açıklanan amaçlar için kullanılacaktır.</p></div><label><input type="checkbox" name="terms" id="terms">Mesafeli satış</label>',
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
   assert.equal(await page.locator('.sf-checkout-privacy-brief a').getAttribute('href'),'/gizlilik-politikasi/','The actual Woo privacy URL appears at first data collection');
   assert.equal(await page.locator('.sf-checkout-privacy-brief').evaluate(el=>el.parentElement.id),'','Privacy notice is not nested inside a hidden billing form');
   assert.equal(await page.locator('.sf-checkout-privacy-brief').evaluate(el=>el.previousElementSibling.id),'customer_details','Privacy appears directly under customer address summaries');
   assert.equal(await page.locator('.sf-checkout-privacy-brief').isVisible(),true,'Privacy notice is shown in Details');
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
   assert.equal(await page.locator('.woocommerce-additional-fields').evaluate(el=>getComputedStyle(el).borderTopStyle),'none','The note parent must not surround the gift');
   assert.equal(await page.locator('.sf-checkout-note-row').evaluate(el=>getComputedStyle(el).borderTopStyle),'solid','The note is its own compact card');
   const cardOrder=await page.evaluate(()=>{
      const gift=document.querySelector('#codela-gift-wrap-wrapper').getBoundingClientRect();
      const note=document.querySelector('.sf-checkout-note-row').getBoundingClientRect();
      return {giftBottom:gift.bottom,noteTop:note.top};
   });
   assert(cardOrder.giftBottom<=cardOrder.noteTop,'Gift and note are ordered as independent sibling cards');
   assert.equal(await page.locator('.sf-checkout-note-switch').count(),1,'One optional order note switch');
   assert.equal(await page.locator('.sf-checkout-step-back svg').count(),1,'Previous step uses a light arrow');
   assert.equal(await page.locator('.sf-checkout-step-back').innerText(),'Önceki','Small previous-step copy');
   assert.equal(await page.locator('#order_comments').isDisabled(),true,'Closed note is excluded from native form');
   await page.locator('.sf-checkout-note-switch').check();
   assert.equal(await page.locator('#order_comments').isEnabled(),true,'Opening note enables native Woo field');
   assert.equal(await page.locator('.shipping').isVisible(),true,'Native shipping methods in delivery');
   assert.equal(await page.locator('form.checkout').evaluate(el=>getComputedStyle(el).borderTopStyle),'none',
     'Delivery uses independent surface cards, not one giant form card');
   assert.equal(await page.locator('#codela-gift-wrap-wrapper').evaluate(el=>getComputedStyle(el).borderTopStyle),'solid',
     'Gift option has its own compact card border');
   assert.equal(await page.locator('.woocommerce-additional-fields h3').isVisible(),false,
     'Step heading replaces redundant additional-info heading');
   assert.equal(await page.locator('.codela-gift-wrap').evaluate(el=>getComputedStyle(el).borderTopWidth),'1px',
     'Gift is a separate compact card');
   assert.equal(await page.locator('.cdl-fsb-slot').isVisible(),true,'Live plugin shipping slot shown only in Delivery');
   assert.equal(await page.locator('.sf-checkout-shipping-ring').count(),1,'Single 40px shipping ring wraps original plugin icon');
   assert.equal(await page.locator('.sf-checkout-shipping-ring').evaluate(el=>getComputedStyle(el).width),'36px');
   const ringOffset=await page.locator('.sf-checkout-shipping-ring').evaluate(el=>parseFloat(el.style.getPropertyValue('--sf-checkout-shipping-offset')));
   assert(Math.abs(ringOffset-42.726)<0.1,'Ring uses native plugin percent: '+ringOffset);
   assert.equal(await page.locator('.cdl-fsb-track').isVisible(),false,'Original linear progress is visually replaced');
   assert.equal(await page.locator('.sf-checkout-shipping-ring .cdl-fsb-ico').count(),1,'One original icon preserved');
   await page.evaluate(() => {
      const bar=document.querySelector('#order_review .cdl-fsb');
      bar.classList.add('is-done');
      bar.querySelector('.cdl-fsb-text > span:last-child').textContent='Kargonuz ücretsiz.';
      // Exercise the native stepper's shipping decorator, without
      // introducing a fake jQuery runtime into this browser fixture.
      document.querySelector('.sf-checkout-step-back').click();
      document.querySelector('.sf-checkout-next').click();
   });
   assert.equal(await page.locator('.cdl-fsb.is-done .cdl-fsb-text > span:last-child').innerText(),'Ücretsiz kargo',
     'Only success wording changes; payment method labels and shipping logic remain Woo/plugin owned');
   const completed=await page.locator('#order_review .cdl-fsb.is-done').evaluate(el=>({
      border:getComputedStyle(el).borderTopWidth,
      background:getComputedStyle(el).backgroundColor
   }));
   assert.equal(completed.border,'0px','Success message is not a second bordered card');
   assert.equal(completed.background,'rgba(0, 0, 0, 0)','Success is not a full green banner');
   assert.equal(await page.locator('.codela-external-hook').isVisible(),true,'Checkout hook retains delivery placement');
   assert.equal(await page.locator('#payment').isVisible(),false);
   await page.locator('#codela_gift_wrap').check();
   await page.locator('.codela-gift-wrap__note').evaluate(el=>el.style.display='block');
   const noteGeometry=await page.evaluate(()=>{
     const gift=document.querySelector('#codela_gift_note').getBoundingClientRect();
     const order=document.querySelector('#order_comments').getBoundingClientRect();
     const label=document.querySelector('.codela-gift-wrap__note>label').getBoundingClientRect();
     return {giftHeight:gift.height,orderHeight:order.height,labelWidth:label.width};
   });
   assert(Math.abs(noteGeometry.giftHeight-noteGeometry.orderHeight)<2,'Gift and order note inputs share the same height');
   assert(noteGeometry.labelWidth<=1.5,'Repeated gift note heading is visually hidden, not deleted');
   await page.locator('#order_comments').fill('Kapıya bırakın');
   await page.locator('.sf-checkout-note-switch').uncheck();
   assert.equal(await page.locator('#order_comments').inputValue(),'Kapıya bırakın','Closing note preserves draft');
   assert.equal(await page.locator('#order_comments').isDisabled(),true,'Closed note not submitted');
   await page.locator('.sf-checkout-note-switch').check();
   await page.locator('.sf-checkout-next').click();
   assert.equal(await page.locator('body.sf-checkout-step-3').count(),1);
   assert.equal(await page.locator('#payment').isVisible(),true);
   assert.equal(await page.locator('#order_review_heading').isVisible(),false,
     'Stage title replaces redundant large order heading');
   assert.equal(await page.locator('.woocommerce-form-coupon-toggle').isVisible(),true);
   assert.equal(await page.locator('.sf-checkout-coupon-shell').count(),1,'Native coupon controls share a shell');
   assert.equal(await page.locator('.sf-checkout-coupon-shell > form.checkout_coupon').count(),1,'Original coupon form shares the same parent card');
   assert.equal(await page.locator('.sf-checkout-coupon-shell').evaluate(el=>getComputedStyle(el).borderTopStyle),'solid','Only shell owns the coupon border');
   const collapsedHeight=await page.locator('.sf-checkout-coupon-shell').evaluate(el=>el.getBoundingClientRect().height);
   assert(collapsedHeight>=54 && collapsedHeight<=58,'Collapsed coupon is one 54px heading, not a clipped oversized notice: '+collapsedHeight);
   const closedCouponGeometry=await page.evaluate(()=>{
      const box=el=>el.getBoundingClientRect();
      const shell=box(document.querySelector('.sf-checkout-coupon-shell'));
      const wrap=box(document.querySelector('.sf-checkout-coupon-shell>.woocommerce-form-coupon-toggle'));
      const notice=box(document.querySelector('.sf-checkout-coupon-shell .woocommerce-info'));
      const button=box(document.querySelector('.sf-checkout-coupon-trigger'));
      const icon=box(document.querySelector('.sf-checkout-coupon-icon'));
      return {shellCenter:(shell.top+shell.bottom)/2,wrapTop:wrap.top,wrapHeight:wrap.height,
        noticeHeight:notice.height,buttonTop:button.top,buttonHeight:button.height,
        iconCenter:(icon.top+icon.bottom)/2};
   });
   assert(Math.abs(closedCouponGeometry.iconCenter-closedCouponGeometry.shellCenter)<2,
      'Coupon icon is centered when closed, never clipped at the bottom: '+JSON.stringify(closedCouponGeometry));
   assert(Math.abs(closedCouponGeometry.wrapHeight-54)<1 && Math.abs(closedCouponGeometry.noticeHeight-54)<1,
      'Coupon wrappers must not reserve additional height: '+JSON.stringify(closedCouponGeometry));
   assert(Math.abs(closedCouponGeometry.buttonTop-closedCouponGeometry.wrapTop)<1,
      'Coupon button starts at the top of its wrapper: '+JSON.stringify(closedCouponGeometry));
   assert.equal(await page.locator('form.checkout_coupon').isVisible(),false,'Native coupon form genuinely collapsed');
   assert.equal(await page.locator('.woocommerce-privacy-policy-text').isVisible(),false,'Payment hides redundant privacy paragraph');
   assert.equal(await page.locator('#payment .woocommerce-privacy-policy-text').count(),1,'Native Woo disclosure remains mounted');
   assert.equal(await page.locator('.sf-checkout-stepper').evaluate(el=>getComputedStyle(el).position),'relative','Progress is not sticky');
   assert.equal(await page.locator('.cdl-fsb-slot').isVisible(),false,'Shipping progress does not repeat on payment');
   assert.equal(await page.locator('.sf-checkout-selected-shipping').isVisible(),true,'Selected shipping displayed as read-only payment summary');
   assert.equal(await page.locator('.shipping input[name="shipping_method[0]"]').isVisible(),false,'No repeated shipping selection on payment');
   assert.equal(await page.locator('.shipping input[name="shipping_method[0]"]').isChecked(),true,'Original selected Woo radio kept in form');
   // Revisit payment after a native rate's label changes to free shipping.
   await page.evaluate(()=>{document.querySelector('.shipping td label').lastChild.textContent='Ücretsiz gönderim'});
   await page.locator('.sf-checkout-step-back').click();
   await page.locator('.sf-checkout-next').click();
   assert.equal(await page.locator('.sf-checkout-selected-shipping').innerText(),'Ücretsiz','Do not repeat Gönderim in the value');
   assert.equal(await page.locator('.sf-checkout-selected-shipping').evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap','One-line shipping receipt');
   assert.equal(await page.locator('.sf-checkout-product-image').isVisible(),true,'Checkout review thumbnails have reserved space');
   const productRow=await page.evaluate(()=>{
     const name=document.querySelector('.sf-checkout-product-label').getBoundingClientRect();
     const qty=document.querySelector('.cart_item .product-quantity').getBoundingClientRect();
     return {nameY:name.y+name.height/2,qtyY:qty.y+qty.height/2};
   });
   assert(Math.abs(productRow.nameY-productRow.qtyY)<10,'Quantity remains beside the name: '+JSON.stringify(productRow));
   assert.equal(await page.locator('.cart_item td.product-total').evaluate(el=>getComputedStyle(el).verticalAlign),'middle',
     'Line-item price is vertically centered next to the product');
   assert.equal(await page.locator('.sf-checkout-coupon-trigger').innerText(),'Add discount code','Native coupon button has concise copy');
   assert.equal(await page.locator('.sf-checkout-coupon-trigger').evaluate(el=>el.tagName),'BUTTON','Coupon is a button, not an href link');
   assert.equal(await page.locator('.sf-checkout-coupon-trigger').getAttribute('type'),'button','Coupon cannot submit a checkout form');
   assert.equal(await page.locator('a.showcoupon').count(),0,'No hash link remains to jump to the top');
   assert.equal(await page.locator('.sf-checkout-coupon-hint').count(),0,'Redundant coupon hint is removed');
   assert.equal(await page.locator('.sf-checkout-coupon-trigger').isVisible(),true,'One line coupon toggle is visible');
   const collapsedCoupon=await page.locator('.woocommerce-form-coupon-toggle .woocommerce-info').boundingBox();
   assert(collapsedCoupon && collapsedCoupon.height<=65,'Coupon summary is a compact single row');
   const couponUrl=page.url();
   await page.evaluate(()=>{window.__sfCouponDocumentMark='same-document'});
   await page.locator('.sf-checkout-coupon-trigger').click();
   assert.equal(page.url(),couponUrl,'Opening coupon never navigates/reloads');
   assert.equal(await page.evaluate(()=>window.__sfCouponDocumentMark),'same-document','Opening cannot silently reload the same URL');
   assert.equal(await page.locator('.sf-checkout-coupon-trigger').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('form.checkout_coupon').isVisible(),true,'Coupon opens on first click');
   await page.locator('.woocommerce-form-coupon-toggle.sf-checkout-coupon-open').waitFor();
   assert.equal(await page.locator('.sf-checkout-coupon-shell.sf-checkout-coupon-open').count(),1,'Shell follows native Woo disclosure state');
   const couponInput=await page.locator('form.checkout_coupon input[name="coupon_code"]').boundingBox();
   const couponApply=await page.locator('form.checkout_coupon button[name="apply_coupon"]').boundingBox();
   assert(couponInput && couponApply && Math.abs(couponInput.y-couponApply.y)<2,'Coupon field and native Woo apply button stay on one row '+width);
   assert.equal(await page.locator('form.checkout_coupon button[name="apply_coupon"]').innerText(),'Uygula');
   assert.equal(await page.locator('form.checkout_coupon').evaluate(el=>getComputedStyle(el).display),'grid','Expanded coupon uses one compact grid');
   const couponGap=await page.evaluate(()=>{
      const header=document.querySelector('.woocommerce-form-coupon-toggle').getBoundingClientRect();
      const form=document.querySelector('form.checkout_coupon').getBoundingClientRect();
      return form.top-header.bottom;
   });
   assert(Math.abs(couponGap)<2,'Coupon entry directly joins its header with no empty gap: '+couponGap);
   const openCouponGeometry=await page.evaluate(()=>{
      const shell=document.querySelector('.sf-checkout-coupon-shell').getBoundingClientRect();
      const toggle=document.querySelector('.woocommerce-form-coupon-toggle').getBoundingClientRect();
      const notice=document.querySelector('.sf-checkout-coupon-shell .woocommerce-info').getBoundingClientRect();
      const icon=document.querySelector('.sf-checkout-coupon-icon').getBoundingClientRect();
      return {shellHeight:shell.height,toggleHeight:toggle.height,noticeHeight:notice.height,
        iconOffset:(icon.top+icon.bottom)/2-toggle.top};
   });
   assert(Math.abs(openCouponGeometry.iconOffset-27)<2,
      'Icon stays centered in 54px heading when coupon opens: '+JSON.stringify(openCouponGeometry));
   assert(openCouponGeometry.shellHeight>=105 && openCouponGeometry.shellHeight<=145,
      'Open coupon is one compact card, without ghost space: '+JSON.stringify(openCouponGeometry));
   assert.equal(await page.locator('.sf-checkout-coupon-shell > form.checkout_coupon').evaluate(el=>getComputedStyle(el).borderTopStyle),'solid','Expanded coupon separator is inside the outer card');
   assert.equal(await page.locator('.sf-checkout-coupon-shell .woocommerce-info').evaluate(el=>getComputedStyle(el).borderTopStyle),'none','Coupon heading adds no second border');
   assert.equal(await page.locator('.sf-checkout-coupon-shell .woocommerce-info').evaluate(el=>getComputedStyle(el,'::before').content),'none','No default WooCommerce coupon stripe');
   await page.locator('.sf-checkout-coupon-trigger').click();
   assert.equal(page.url(),couponUrl,'Closing coupon never navigates/reloads');
   assert.equal(await page.evaluate(()=>window.__sfCouponDocumentMark),'same-document','Closing cannot silently reload the same URL');
   await page.locator('.woocommerce-form-coupon-toggle:not(.sf-checkout-coupon-open)').waitFor();
   assert.equal(await page.locator('.sf-checkout-coupon-shell').evaluate(el=>el.getBoundingClientRect().height)<=68,true,'Coupon restores compact height after closing');
   assert.equal(await page.locator('form.checkout_coupon input[name="coupon_code"]').count(),1,'Original Woo coupon input preserved');
   assert.equal(await page.locator('.sf-checkout-shipping-ring').count(),1,'Shipping ring remains mounted for AJAX reentry');
   assert.equal(await page.locator('.woocommerce-checkout-review-order-table thead').isVisible(),false,'Compact summary hides redundant table headings');
   assert.equal(await page.locator('.cart_item').isVisible(),true,'Native products remain visible');
   assert.equal(await page.locator('#order_review').evaluate(el=>getComputedStyle(el).borderTopStyle),'none','Review outer shell has no card border');
   assert.equal(await page.locator('.woocommerce-checkout-review-order-table').evaluate(el=>getComputedStyle(el).borderTopStyle),'solid','Order summary has its own card');
   assert.equal(await page.locator('#payment').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','Native payment area is visually separate from the summary');
   assert.equal(await page.locator('.order-total').isVisible(),false,'Native total row stays mounted but the persistent footer is its only visible total');
   assert.equal(await page.locator('.order-total').count(),1,'Native total row still feeds the fixed footer');
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
