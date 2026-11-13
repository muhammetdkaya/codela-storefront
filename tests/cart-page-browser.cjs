// Cart page layout smoke checks — native Block Cart and classic Woo shortcode.
// The test exercises only presentation; Woo's real mutations remain server-owned.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=[
  'theme/codela-storefront/assets/styles/tokens.css',
  'theme/codela-storefront/assets/styles/cart-page.css'
].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const head='<meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<style>body{margin:0;font-family:system-ui}.sf-cart-page{box-sizing:border-box}button{font:inherit}</style>'
 +'<style>'+css+'</style>';
const block=()=>'<div class="sf-cart-page"><h1 class="wp-block-post-title">Sepetim</h1>'
 +'<div class="wp-block-post-content"><div class="wc-block-cart">'
 +'<div class="wc-block-cart__main"><table class="wc-block-cart-items"><tbody><tr class="wc-block-cart-items__row">'
 +'<td class="wc-block-cart-item__image"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E" alt=""></td>'
 +'<td class="wc-block-cart-item__product"><a class="wc-block-components-product-name" href="#product">Çok uzun ürün ismi — Seramik</a>'
 +'<p class="wc-block-cart-item__prices">₺1.200</p><div class="wc-block-components-quantity-selector">'
 +'<button type="button" aria-label="Azalt">−</button><input aria-label="Adet" type="number" value="2"><button type="button" aria-label="Artır">+</button></div>'
 +'<button class="wc-block-cart-item__remove-link" type="button">Kaldır</button></td>'
 +'<td class="wc-block-cart-item__total">₺2.400</td></tr></tbody></table></div>'
 +'<div class="wc-block-cart__sidebar"><h2 class="wc-block-cart__totals-title">Sipariş özeti</h2>'
 +'<div class="wc-block-components-totals-wrapper"><div class="wc-block-components-totals-item__label">Ara toplam</div><div class="wc-block-components-totals-item__value">₺2.400</div></div>'
 +'<div class="wc-block-components-totals-coupon"><form class="wc-block-components-totals-coupon__form">'
 +'<div class="wc-block-components-text-input"><input aria-label="İndirim kodu"></div><button class="wc-block-components-totals-coupon__button">Uygula</button></form></div>'
 +'<div class="wc-block-cart__submit-container"><a href="/odeme/" class="wc-block-cart__submit-button">Ödemeye geç</a></div>'
 +'</div></div></div></div>';
const classic=()=>'<div class="sf-cart-page"><h1 class="wp-block-post-title">Sepetim</h1>'
 +'<div class="wp-block-post-content"><div class="woocommerce">'
 +'<form class="woocommerce-cart-form"><table class="shop_table"><thead><tr><th>Ürün</th></tr></thead><tbody>'
 +'<tr class="cart_item"><td class="product-remove"><a class="remove" href="#remove">×</a></td>'
 +'<td class="product-thumbnail"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E" alt=""></td>'
 +'<td class="product-name"><a href="#product">Seramik Ürün</a></td><td class="product-price">₺1.200</td>'
 +'<td class="product-quantity"><div class="quantity"><input class="qty" aria-label="Adet" type="number" value="1"></div></td>'
 +'<td class="product-subtotal">₺1.200</td></tr>'
 +'<tr><td class="actions" colspan="6"><div class="coupon"><input id="coupon_code" aria-label="Kupon" type="text">'
 +'<button type="button" class="button">Uygula</button></div><button name="update_cart" class="button" type="button">Sepeti güncelle</button></td></tr>'
 +'</tbody></table></form>'
 +'<div class="cart-collaterals"><div class="cart_totals"><h2>Sipariş özeti</h2>'
 +'<table class="shop_table"><tbody><tr><th>Toplam</th><td>₺1.200</td></tr></tbody></table>'
 +'<div class="wc-proceed-to-checkout"><a class="checkout-button" href="/odeme/">Ödemeye geç</a></div>'
 +'</div></div></div></div></div>';
(async()=>{
  const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
  try{
    for(const [name,markup] of [['blocks',block],['classic',classic]]){
      for(const width of [390,1120]){
        const page=await browser.newPage({viewport:{width,height:850}});
        await page.setContent('<!doctype html><html><head>'+head+'</head><body class="woocommerce-cart">'+markup()+'</body></html>');
        const root=name==='blocks'?'.wc-block-cart':'.woocommerce';
        const rootColumns=await page.locator('.sf-cart-page .wp-block-post-content '+root).evaluate(el=>getComputedStyle(el).gridTemplateColumns);
        const tracks=rootColumns.split(' ').filter(Boolean);
        assert.equal(tracks.length,width<861?1:2,name+'/'+width+' native layout columns');
        const btn=name==='blocks'?'.wc-block-cart__submit-button':'.checkout-button';
        const button=page.locator(btn);
        const visual=await button.evaluate(el=>({height:el.getBoundingClientRect().height,color:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor,radius:getComputedStyle(el).borderTopLeftRadius}));
        assert(visual.height>=62,name+'/'+width+' CTA minimum height');
        assert.equal(visual.color,'rgb(255, 255, 255)',name+'/'+width+' dark CTA has white type');
        assert.notEqual(visual.bg,'rgba(0, 0, 0, 0)',name+'/'+width+' dark CTA is opaque');
        assert.equal(visual.radius,'24px',name+'/'+width+' matches popup CTA radius');
        const quantity=page.locator(name==='blocks'?'.wc-block-components-quantity-selector input':'.qty');
        await quantity.fill('3');
        assert.equal(await quantity.inputValue(),'3',name+'/'+width+' quantity remains editable');
        const coupon=page.locator(name==='blocks'?'.wc-block-components-totals-coupon__form input':'#coupon_code');
        await coupon.fill('DENEME');
        assert.equal(await coupon.inputValue(),'DENEME',name+'/'+width+' coupon is usable');
        if(name==='classic'&&width===390){
          const img=await page.locator('.product-thumbnail').boundingBox();
          const product=await page.locator('.product-name').boundingBox();
          assert(img && product && product.x>img.x+30,'Classic mobile thumbnails sit next to names');
        }
        await page.close();
      }
    }
    console.log('Native Cart Block/classic, 390/1120px, coupon, quantity, checkout materials passed.');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
