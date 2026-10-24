const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
(async()=>{const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN,args:['--no-sandbox']}:{});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://media.example/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><rect width="800" height="1200" fill="tan"/></svg>'}));
 const css=fs.readFileSync(root+'assets/styles/gallery.css','utf8');
 const slide=(n,device='both')=>`<div class="woocommerce-product-gallery__image" data-sf-gallery-device="${device}" data-thumb="https://media.example/d${n}.svg" data-sf-mobile-thumb="https://media.example/m${n}.svg"><a href="https://media.example/d${n}.svg"><picture><source media="(max-width:900px)" srcset="https://media.example/m${n}.svg"><img width="800" height="1200" src="https://media.example/d${n}.svg" data-sf-mobile-url="https://media.example/m${n}.svg" data-sf-mobile-alt="Portrait ${n}" alt="Desktop ${n}"></picture></a></div>`;
 await page.setContent(`<style>${css}.woocommerce-product-gallery__image{height:900px}</style><div class="woocommerce"><div class="product"><div class="sf-product-media"><div class="woocommerce-product-gallery sf-ui-gallery sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper">${slide(1)+slide(2)+slide(3,'mobile')}</div></div></div></div></div><img id="catalog" src="https://media.example/catalog.svg">`);
 await page.addScriptTag({content:`window.jQuery=()=>({on:(types,selector,fn)=>window.variation=fn});window.jQuery.fn={};`});
 await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8')});
 const first=page.locator('.woocommerce-product-gallery__image img').first();
 await page.waitForFunction(()=>document.querySelector('.woocommerce-product-gallery__image img').currentSrc.endsWith('/m1.svg'));
 assert.equal(await first.getAttribute('alt'),'Portrait 1');
 assert.equal(await page.locator('.sf-product-gallery-count').textContent(),'1 / 3');
 assert.equal(await page.locator('.sf-product-gallery-thumb img').first().getAttribute('src'),'https://media.example/m1.svg');
 await page.evaluate(()=>window.variation({type:'found_variation'},{image:{src:'variation.svg'}}));
 await page.waitForFunction(()=>document.querySelector('.woocommerce-product-gallery__image img').currentSrc.endsWith('/d1.svg'));
 await page.evaluate(()=>window.variation({type:'reset_data'}));
 await page.waitForFunction(()=>document.querySelector('.woocommerce-product-gallery__image img').currentSrc.endsWith('/m1.svg'));
 for(const width of [900,901,1280,390]){
  await page.setViewportSize({width,height:844});
  await page.waitForFunction(mobile=>document.querySelector('.sf-product-gallery-count').textContent===(mobile?'1 / 3':'1 / 2'),width<=900);
  await page.waitForFunction(mobile=>document.querySelector('.woocommerce-product-gallery__image img').currentSrc.endsWith(mobile?'/m1.svg':'/d1.svg'),width<=900);
  assert.equal(await first.getAttribute('alt'),width<=900?'Portrait 1':'Desktop 1');
 }
 assert.equal(await page.locator('#catalog').getAttribute('src'),'https://media.example/catalog.svg');
 // A shorter mobile gallery must exclude desktop-only slides and thumbnails.
 await page.locator('[data-sf-gallery-device="mobile"]').evaluate(el=>el.dataset.sfGalleryDevice='desktop');
 await page.setViewportSize({width:1280,height:844});await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>document.querySelector('.sf-product-gallery-count').textContent==='1 / 2');
 assert.deepEqual(errors,[]);
 console.log('Responsive sources, independent counts, thumbnails, resize, variation/reset and catalog isolation passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
