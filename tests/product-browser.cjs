// Visual-layout regression fixture for the native WooCommerce single-product structure.
// This checks theme CSS, not a real WooCommerce PHP/plugin/gateway integration.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css',
 'assets/styles/navigation.css','assets/styles/components.css','assets/styles/product.css']
 .map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const thumb='<li><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22240%22/%3E" alt="Ürün görünümü"></li>';
const related='<li class="product"><a href="/product"><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22/%3E"><h2 class="woocommerce-loop-product__title">Ürün</h2></a><span class="price">₺500</span></li>';
const documentHtml=`<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head>
<body class="single-product"><main class="sf-content"><div class="woocommerce"><nav class="woocommerce-breadcrumb">Mağaza / Kategori / Ürün</nav>
<div class="product type-product"><div class="woocommerce-product-gallery"><div class="woocommerce-product-gallery__wrapper">
<div class="woocommerce-product-gallery__image"><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%221000%22/%3E" alt="Ürün"></div></div>
<ol class="flex-control-thumbs">${thumb.repeat(5)}</ol></div>
<div class="summary entry-summary"><h1 class="product_title entry-title">Minimal Ürün Başlığı</h1><p class="price">₺1.250</p>
<div class="woocommerce-product-details__short-description"><p>Ürün açıklaması. Kumaş ve bakım bilgileri.</p></div>
<form class="cart" method="post"><div class="quantity"><input class="qty" type="number" value="1" min="1"></div>
<button type="submit" name="add-to-cart" value="123" class="single_add_to_cart_button button alt">Sepete Ekle</button></form>
<div class="product_meta"><span class="sku_wrapper">SKU: 123</span></div></div>
<div class="woocommerce-tabs"><ul class="tabs"><li class="active"><a href="#details">Açıklama</a></li><li><a href="#info">Bilgiler</a></li></ul><div class="panel" id="details"><h2>Ürün Bilgisi</h2><p>Detaylı açıklama</p></div></div>
<section class="related products"><h2>Benzer Ürünler</h2><ul class="products columns-4">${related.repeat(4)}</ul></section>
</div></div></main></body></html>`;
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']}:{})});
 try{
  const page=await browser.newPage();
  await page.setContent(documentHtml);
  for(const width of [320,390,700,900,1280]){
   await page.setViewportSize({width,height:900});
   const result=await page.evaluate(()=>{
    const gallery=document.querySelector('.woocommerce-product-gallery').getBoundingClientRect();
    const detail=document.querySelector('.summary').getBoundingClientRect();
    const button=document.querySelector('.single_add_to_cart_button');
    const nativeInput=document.querySelector('.quantity input.qty');
    const related=document.querySelector('.related ul.products');
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,
     gallery:{left:gallery.left,right:gallery.right,top:gallery.top,bottom:gallery.bottom},
     detail:{left:detail.left,top:detail.top},
     buttonHeight:button.getBoundingClientRect().height,
     buttonBackground:getComputedStyle(button).backgroundColor,
     buttonTransition:getComputedStyle(button).transitionProperty,
     buttonType:button.type,buttonName:button.name,
     inputHeight:nativeInput.getBoundingClientRect().height,
     relatedColumns:getComputedStyle(related).gridTemplateColumns.split(' ').length};
   });
   assert(!result.overflow,'No horizontal overflow at '+width+': '+JSON.stringify(result));
   assert(result.buttonHeight>=54,'Shared 54px purchase button at '+width);
   assert(result.inputHeight>=54,'Shared control height for quantity at '+width);
   assert.equal(result.buttonBackground,'color(srgb 0.133333 0.137255 0.121569 / 0.9)','Shared primary UI color');
   assert.equal(result.buttonTransition,'transform','Only shared transform animates');
   assert.equal(result.buttonType,'submit','Native cart submission preserved');
   assert.equal(result.buttonName,'add-to-cart','Native cart parameter preserved');
   if(width<=700){
    assert(result.detail.top>=result.gallery.bottom-1,'Details follow gallery at '+width);
   }else{
    assert(result.detail.left>=result.gallery.right,'Details sit right of gallery at '+width);
    assert(Math.abs(result.detail.top-result.gallery.top)<35,'Columns top align at '+width);
   }
   assert.equal(result.relatedColumns,width>=901?4:2,'Related product grid at '+width);
  }
  console.log('Product layout: 5 widths, native cart semantics, UI Kit button, responsive gallery and related cards passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
