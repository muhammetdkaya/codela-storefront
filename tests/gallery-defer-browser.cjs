// Mocked Woo track; real live gallery acceptance remains a separate post-deploy gate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  const requested=[];
  await page.route('https://media.example/**',route=>{
    requested.push(route.request().url().split('/').pop());
    return route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"></svg>'});
  });
  const slide=(num,active=false)=>'<div class="woocommerce-product-gallery__image'+(active?' flex-active-slide':'')+'"><a href="https://media.example/full'+num+'.jpg"><img '+(num>1?'data-sf-gallery-src="https://media.example/full'+num+'.jpg" ':'')+'src="https://media.example/'+(num===1?'full1.jpg':'thumb'+num+'.jpg')+'" alt="Image '+num+'"></a></div>';
  await page.setContent('<div class="woocommerce-product-gallery sf-ui-gallery"><div class="flex-viewport"><div class="woocommerce-product-gallery__wrapper">'+slide(1,true)+slide(2)+slide(3)+'</div></div><ol class="flex-control-thumbs">'+[1,2,3].map(n=>'<li><img alt="Thumb" src="https://media.example/thumb'+n+'.jpg"></li>').join('')+'</ol></div>');
  await page.addScriptTag({content:fs.readFileSync('theme/codela-storefront/assets/scripts/gallery-defer.js','utf8')});
  await page.waitForTimeout(250);
  assert(!requested.includes('full2.jpg')&&!requested.includes('full3.jpg'),'No full secondary image at initial load');
  assert.equal(await page.locator('.woocommerce-product-gallery__image').nth(1).locator('a').getAttribute('href'),'https://media.example/full2.jpg','Lightbox link stays full resolution');
  await page.locator('.flex-control-thumbs li').nth(1).click();
  await page.waitForFunction(()=>document.querySelectorAll('.woocommerce-product-gallery__image img')[1].getAttribute('src').endsWith('full2.jpg'));
  assert(requested.includes('full2.jpg'),'Selecting native thumb promotes exact requested slide');
  assert(!requested.includes('full3.jpg'),'Another slide stays deferred');
  await page.locator('.woocommerce-product-gallery__image').nth(2).evaluate(el=>{el.parentNode.querySelector('.flex-active-slide')?.classList.remove('flex-active-slide');el.classList.add('flex-active-slide')});
  await page.waitForFunction(()=>document.querySelectorAll('.woocommerce-product-gallery__image img')[2].getAttribute('src').endsWith('full3.jpg'));
  assert(requested.includes('full3.jpg'),'Native active class mutation promotes slide');
  assert.equal(await page.locator('.woocommerce-product-gallery__image').nth(2).locator('a').getAttribute('href'),'https://media.example/full3.jpg','PhotoSwipe href untouched');
  const native=await browser.newPage({viewport:{width:390,height:844}});
  const nativeRequests=[];
  await native.route('https://native.example/**',route=>{nativeRequests.push(route.request().url().split('/').pop());return route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"></svg>'});});
  await native.setContent('<style>body{margin:0}.woocommerce-product-gallery__image{height:900px}img{width:100%;height:100%;object-fit:cover}</style><div class="woocommerce-product-gallery sf-ui-gallery sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper">'+[1,2,3,4,5].map(n=>'<div class="woocommerce-product-gallery__image" data-thumb="https://native.example/thumb'+n+'.svg"><a href="https://native.example/full'+n+'.svg"><img width="800" height="1000" '+(n>1?'data-sf-gallery-src="https://native.example/full'+n+'.svg" ':'')+'src="https://native.example/'+(n===1?'full':'medium')+n+'.svg"></a></div>').join('')+'</div></div>');
  await native.addScriptTag({content:fs.readFileSync('theme/codela-storefront/assets/scripts/gallery-defer.js','utf8')});
  await native.waitForTimeout(200);
  assert(!nativeRequests.some(name=>/^full[2-5]/.test(name)),'Native cold gallery does not fetch all secondary originals');
  await native.locator('.woocommerce-product-gallery__wrapper').dispatchEvent('pointerdown',{pointerType:'touch'});
  await native.waitForFunction(()=>document.querySelectorAll('.woocommerce-product-gallery__image img')[1].src.includes('full2'));
  assert(!nativeRequests.some(name=>/^full[3-5]/.test(name)),'Real intent prepares the adjacent photo, not the whole gallery');
  assert.equal(await native.locator('.woocommerce-product-gallery__image img').nth(1).getAttribute('width'),'800');
  assert.equal(await native.locator('.woocommerce-product-gallery__image img').nth(1).getAttribute('height'),'1000');
  await native.close();
  console.log('Gallery defer: cold secondary requests omitted; thumbnail, native class and fullscreen links passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

