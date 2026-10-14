// Visual-layout regression fixture for the native WooCommerce single-product structure.
// This checks theme CSS, not a real WooCommerce PHP/plugin/gateway integration.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_PRODUCT:'1'}});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css',
 'assets/styles/navigation.css','assets/styles/components.css','assets/styles/gallery.css','assets/styles/product.css']
 .map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const thumb='<li><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22240%22/%3E" alt="Ürün görünümü"></li>';
const related='<li class="product"><a href="/product"><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22/%3E"><h2 class="woocommerce-loop-product__title">Ürün</h2></a><span class="price">₺500</span></li>';
const documentHtml=`<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>.woocommerce div.product div.images .flex-control-thumbs{padding:0}.woocommerce div.product div.images .flex-control-thumbs li img{opacity:.5}${css}</style></head>
<body class="single-product woocommerce woocommerce-page">${header}<main class="sf-content"><div data-block-name="woocommerce/legacy-template" class="content-area alignwide"><main class="site-main">
<div class="product type-product"><div class="woocommerce-product-gallery images sf-ui-gallery sf-ui-gallery--hero"><a href="#" class="woocommerce-product-gallery__trigger">+</a><div class="woocommerce-product-gallery__wrapper">
<div class="woocommerce-product-gallery__image"><a href="/full-image" aria-label="Görseli büyüt" aria-haspopup="dialog"><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%221000%22/%3E" alt="Ürün"></a></div></div>
<ol class="flex-control-thumbs">${thumb.replace('<img ' ,'<img class="flex-active" ')+thumb.repeat(6)}</ol></div>
<div class="summary entry-summary"><h1 class="product_title entry-title">Minimal Ürün Başlığı</h1><p class="price">₺1.250</p>
<div class="woocommerce-product-details__short-description"><p>Ürün açıklaması. Kumaş ve bakım bilgileri.</p></div>
<form class="cart" method="post"><div class="sf-product-purchase"><div class="quantity"><input class="qty" type="number" value="1" min="1"></div>
<button type="submit" name="add-to-cart" value="123" class="single_add_to_cart_button button alt">Sepete Ekle</button></div></form>
<div class="product_meta"><span class="sku_wrapper">SKU: 123</span></div></div>
<div class="woocommerce-tabs"><ul class="tabs"><li class="active"><a href="#details">Açıklama</a></li><li><a href="#info">Bilgiler</a></li></ul><div class="panel" id="details"><h2>Ürün Bilgisi</h2><p>Detaylı açıklama</p></div></div>
<section class="related products"><h2>Benzer Ürünler</h2><ul class="products columns-4">${related.repeat(4)}</ul></section>
</div></main></div></main></body></html>`;
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']}:{})});
 try{
  const page=await browser.newPage();
  await page.route('**/assets/icons/**',route=>route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('theme/codela-storefront/assets/icons/'+new URL(route.request().url()).pathname.split('/').at(-1),'utf8')}));
  // Match the live block-theme DOM: Woo class is on body, not a descendant wrapper.
  // Include the constrained WordPress block rule that previously masked this bug.
  await page.setContent(documentHtml.replace('</head>', '<style>.sf-content > .alignwide{max-width:1200px;margin-inline:auto}</style></head>'));
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
   assert(result.buttonHeight>=(width<=700?48:54),'Shared purchase target at '+width);
   assert(result.inputHeight>=(width<=700?48:54),'Shared control height for quantity at '+width);
   assert.equal(result.buttonBackground,'color(srgb 0.133333 0.137255 0.121569 / 0.9)','Shared primary UI color');
   assert.equal(result.buttonTransition,'transform','Only shared transform animates');
   assert.equal(result.buttonType,'submit','Native cart submission preserved');
   assert.equal(result.buttonName,'add-to-cart','Native cart parameter preserved');
   assert(result.detail.top>=result.gallery.bottom-1,'Details follow full-width gallery at '+width);
   assert(Math.abs(result.gallery.left)<1&&Math.abs(result.gallery.right-width)<1,'Gallery spans viewport at '+width);
   assert(Math.abs(result.gallery.top)<1,'Gallery begins at document top at '+width);
   assert.equal(await page.locator('.woocommerce-product-gallery__image img').evaluate(el=>getComputedStyle(el).objectFit),'cover','Hero fills frame without contain letterboxing');
   assert.equal(result.relatedColumns,width>=901?4:2,'Related product grid at '+width);
   const purchase=await page.locator('.sf-product-purchase').evaluate(el=>({position:getComputedStyle(el).position,rect:el.getBoundingClientRect().toJSON()}));
   assert.equal(await page.locator('form.cart .single_add_to_cart_button').count(),1,'One native submit control');
   if(width<=700){
    assert.equal(purchase.position,'fixed','Purchase occupies bottom on mobile');
    assert(Math.abs(purchase.rect.height-58)<1,'Purchase matches the 58px navigation bar');
    assert(purchase.rect.bottom<=900-3&&purchase.rect.bottom>=900-7,'Purchase clears bottom safe area');
    assert.equal(await page.locator('.sf-shell > .sf-mobile-dock').evaluate(el=>getComputedStyle(el).display),'none','Document dock is replaced by purchase');
    assert.equal(await page.locator('.sf-actions').evaluate(el=>getComputedStyle(el).display),'flex','Store tools remain available in header');
   }else assert.equal(purchase.position,'static','Desktop keeps native inline form');

   assert.equal(await page.locator('.woocommerce-product-gallery__trigger').evaluate(el=>getComputedStyle(el).display),'none','Native optional zoom button stays hidden');
   const rail=await page.locator('.flex-control-thumbs').evaluate(el=>{
    const r=el.getBoundingClientRect();
    const active=el.querySelector('img.flex-active'),image=active.getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
      background:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).backdropFilter,
      thumbWidth:image.width,thumbHeight:image.height,padding:getComputedStyle(el).paddingLeft,
      border:getComputedStyle(active.parentElement).borderColor,scrollable:el.scrollWidth>el.clientWidth};
   });
   assert(rail.top>70&&rail.bottom<=result.gallery.bottom,'Rail overlays gallery below header');
   assert(rail.left>=19&&rail.right<=width-19,'Rail keeps equal viewport insets');
   assert(Math.abs((rail.left+rail.right)/2-width/2)<1,'Rail is centered');
   assert.equal(await page.locator('.flex-control-thumbs img').nth(1).evaluate(el=>getComputedStyle(el).opacity),'1','Native Woo opacity cannot fade other previews');
   assert(rail.thumbWidth>=44&&rail.thumbHeight>=44,'Native thumbnail click target remains at least 44px');
   assert.equal(rail.padding,'6px','Native Woo rule cannot erase rail spacing');
   assert.equal(rail.background,'rgba(250, 250, 252, 0.28)','Rail reuses floating glass surface');
   assert(rail.blur.includes('blur(8px)'),'Rail reuses shared blur');
   assert.notEqual(rail.border,'rgba(0, 0, 0, 0)','Active image has visible selection edge');
   if(width<=390)assert(rail.scrollable,'Long gallery rail scrolls on narrow screens');
   if([390,1280].includes(width)){
    fs.mkdirSync('qa',{recursive:true});
    await page.screenshot({path:'qa/storefront-ui-kit-gallery-'+width+'.png',fullPage:true});
   }
  }

  await page.setViewportSize({width:390,height:900});
  await page.locator('form.cart').evaluate(el=>{el.addEventListener('submit',event=>{event.preventDefault();el.dataset.submits=String(Number(el.dataset.submits||0)+1)});el.querySelector('input.qty').value='0'});
  await page.locator('.single_add_to_cart_button').click();
  assert.equal(await page.locator('form.cart').getAttribute('data-submits'),null,'Native quantity validation blocks invalid submission');
  await page.locator('input.qty').fill('2');
  await page.locator('.single_add_to_cart_button').click();
  assert.equal(await page.locator('form.cart').getAttribute('data-submits'),'1','One click produces one native submit');
  await page.locator('#sf-panel').evaluate(dialog=>{dialog.append(document.querySelector('.sf-mobile-dock'));dialog.showModal()});
  assert.equal(await page.locator('.sf-product-purchase').evaluate(el=>getComputedStyle(el).visibility),'hidden','Purchase hides while dialog owns bottom');
  assert.equal(await page.locator('#sf-panel .sf-mobile-dock').evaluate(el=>getComputedStyle(el).display),'block','Same dock available in dialog');
  assert.equal(await page.locator('#sf-panel .sf-mobile-dock').evaluate(el=>el.getBoundingClientRect().height),58,'Navigation and purchase share the same height');
  assert(await page.evaluate(()=>Math.abs(document.querySelector('#sf-panel .sf-mobile-dock').getBoundingClientRect().bottom-document.querySelector('.sf-product-purchase').getBoundingClientRect().bottom)<1),'Navigation and purchase share the lower baseline');
  await page.locator('#sf-panel').evaluate(dialog=>{dialog.close();document.querySelector('.sf-shell').append(dialog.querySelector('.sf-mobile-dock'))});
  assert.equal(await page.locator('.sf-product-purchase').evaluate(el=>getComputedStyle(el).visibility),'visible','Purchase restores after dialog');
  await page.locator('.sf-product-purchase').evaluate(el=>el.remove());
  assert.equal(await page.locator('.sf-shell > .sf-mobile-dock').evaluate(el=>getComputedStyle(el).display),'block','No purchase form retains navigation (out of stock)');
  await page.setViewportSize({width:320,height:900});
  await page.locator('.flex-control-thumbs').evaluate(el=>{el.scrollLeft=el.scrollWidth});
  assert(await page.locator('.flex-control-thumbs').evaluate(el=>el.scrollLeft>0),'Overflowing thumbnails can scroll');
  await page.locator('.flex-control-thumbs').evaluate(el=>{[...el.children].slice(1).forEach(x=>x.remove())});
  assert.equal(await page.locator('.flex-control-thumbs').evaluate(el=>getComputedStyle(el).display),'none','Single image has no navigation rail');
  const galleryHtml='<div class="wp-block-gallery has-nested-images is-style-sf-media-slider" tabindex="0" aria-label="Galeri">'+
   ['#ddd','#acb','#bcd'].map(c=>'<figure class="wp-block-image"><img alt="Görsel" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22%3E%3Crect width=%22400%22 height=%22500%22 fill=%22'+c.replace('#','%23')+'%22/%3E%3C/svg%3E"></figure>').join('')+'</div>';
  await page.setContent('<style>'+css+'</style><main style="max-width:440px">'+galleryHtml+'</main>');
  await page.setViewportSize({width:390,height:844});
  const reusable=page.locator('.is-style-sf-media-slider');
  await reusable.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  assert(await reusable.evaluate(el=>el.scrollLeft>0),'Reusable native gallery can be keyboard-scrolled');
  assert(await reusable.evaluate(el=>el.scrollWidth>el.clientWidth),'Core Gallery stays one horizontal track');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Reusable gallery has no page overflow');
  console.log('Product layout: 5 widths, native cart semantics, UI Kit button, full-bleed gallery, reusable core Gallery scroll and related cards passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
