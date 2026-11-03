const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
(async()=>{
 const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'&&process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN,args:['--no-sandbox']}:{});
 let page,stage='start';const observations=[];
 const snapshot=()=>page.evaluate(()=>{
  const first=document.querySelector('.woocommerce-product-gallery__image img'),track=document.querySelector('.woocommerce-product-gallery__wrapper');
  return {width:innerWidth,mobile:matchMedia('(max-width:900px)').matches,vertical:matchMedia('(max-width:700px)').matches,
   count:document.querySelector('.sf-product-gallery-count')?.textContent,alt:first?.alt,currentSrc:first?.currentSrc,
   thumbs:[...document.querySelectorAll('.sf-product-gallery-thumb img')].map(img=>({src:img.src,loading:img.loading})),
   slides:[...document.querySelectorAll('.woocommerce-product-gallery__image')].map(el=>({device:el.dataset.sfGalleryDevice,display:getComputedStyle(el).display,rect:el.getBoundingClientRect().toJSON()})),
   scroll:{x:scrollX,y:scrollY,track:track?.scrollLeft},events:window.__mediaEvents||[]};
 });
 try{
  page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://media.example/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><rect width="800" height="1200" fill="tan"/></svg>'}));
  const css=fs.readFileSync(root+'assets/styles/gallery.css','utf8');
  const slide=(n,device='both')=>`<div class="woocommerce-product-gallery__image" data-sf-gallery-device="${device}" data-thumb="https://media.example/d${n}.svg" data-sf-mobile-thumb="https://media.example/m${n}.svg"><a href="https://media.example/d${n}.svg"><picture><source media="(max-width:900px)" srcset="https://media.example/m${n}.svg"><img width="800" height="1200" src="https://media.example/d${n}.svg" data-sf-mobile-url="https://media.example/m${n}.svg" data-sf-mobile-alt="Portrait ${n}" alt="Desktop ${n}"></picture></a></div>`;
  await page.setContent(`<style>${css}.woocommerce-product-gallery__image{height:900px}</style><div class="woocommerce"><div class="product"><div class="sf-product-media"><div class="woocommerce-product-gallery sf-ui-gallery sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper">${slide(1)+slide(2)+slide(3,'mobile')}</div></div></div></div></div><img id="catalog" src="https://media.example/catalog.svg">`);
  await page.evaluate(()=>{
   window.__mediaEvents=[];
   window.__originalProductMedia=[...document.querySelectorAll('.woocommerce-product-gallery__image img')];
   window.addEventListener('resize',()=>__mediaEvents.push({event:'resize',width:innerWidth}));
   for(const query of ['(max-width:900px)','(max-width:700px)'])matchMedia(query).addEventListener('change',event=>__mediaEvents.push({event:'change',query,matches:event.matches,width:innerWidth}));
  });
  await page.addScriptTag({content:`window.jQuery=()=>({on:(types,selector,fn)=>window.variation=fn});window.jQuery.fn={};`});
  await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8')});
  // currentSrc is browser-owned and may switch before MediaQueryList.change.
  // Count alone is also insufficient when old/new lists both have 3 entries.
  // Native source AND JS-owned alt/thumb/list must agree before another resize.
  async function settled(width,total,label){
   stage=label;
   await page.waitForFunction(({width,total})=>{
    const mobile=width<=900,first=document.querySelector('.woocommerce-product-gallery__image img');
    const thumbs=[...document.querySelectorAll('.sf-product-gallery-thumb img')];
    return innerWidth===width&&matchMedia('(max-width:900px)').matches===mobile&&
     document.querySelector('.sf-product-gallery-count').textContent==='1 / '+total&&
     first.currentSrc.endsWith(mobile?'/m1.svg':'/d1.svg')&&first.alt===(mobile?'Portrait 1':'Desktop 1')&&
     thumbs.length===total&&thumbs[0]?.src.endsWith(mobile?'/m1.svg':'/d1.svg');
   },{width,total});
   observations.push({stage,...await snapshot()});
  }
  const first=page.locator('.woocommerce-product-gallery__image img').first();
  await settled(390,3,'initial mobile');
  assert.equal(await first.getAttribute('alt'),'Portrait 1');
  assert.equal(await page.locator('.sf-product-gallery-count').textContent(),'1 / 3');
  assert.equal(await page.locator('.sf-product-gallery-thumb img').first().getAttribute('src'),'https://media.example/m1.svg');
  stage='variation';await page.evaluate(()=>window.variation({type:'found_variation'},{image:{src:'variation.svg'}}));
  await page.waitForFunction(()=>document.querySelector('.woocommerce-product-gallery__image img').currentSrc.endsWith('/d1.svg'));
  await page.evaluate(()=>window.variation({type:'reset_data'}));
  await settled(390,3,'variation reset');
  for(const width of [900,901,1280,390]){
   await page.setViewportSize({width,height:844});
   await settled(width,width<=900?3:2,'resize '+width);
   assert.equal(await first.getAttribute('alt'),width<=900?'Portrait 1':'Desktop 1');
  }
  assert.equal(await page.locator('#catalog').getAttribute('src'),'https://media.example/catalog.svg');
  // A shorter mobile gallery must exclude desktop-only slides and thumbnails.
  await page.locator('[data-sf-gallery-device="mobile"]').evaluate(el=>el.dataset.sfGalleryDevice='desktop');
  await page.setViewportSize({width:1280,height:844});
  await settled(1280,3,'desktop-only third slide, intermediate desktop');
  await page.setViewportSize({width:390,height:844});
  await settled(390,2,'desktop-only third slide, final mobile');
  assert.equal(await page.locator('[data-sf-gallery-device="desktop"]').evaluate(el=>getComputedStyle(el).display),'none','Excluded desktop slide stays native but hidden');
  assert.equal(await page.locator('.sf-product-gallery-thumb').count(),2,'Only two native mobile choices are built');
  assert(await page.evaluate(()=>__originalProductMedia.length===3&&__originalProductMedia.every((image,index)=>image===document.querySelectorAll('.woocommerce-product-gallery__image img')[index])),'Responsive rebuild never clones or replaces native product images');
  assert(await page.locator('.sf-product-gallery-thumb img').evaluateAll(images=>images.every(img=>img.loading==='lazy')),'Rebuilt preview images retain native lazy loading');
  assert.equal(await page.locator('#catalog').getAttribute('src'),'https://media.example/catalog.svg','Separate product art direction never changes catalog source');
  assert.deepEqual(errors,[]);
  fs.mkdirSync('qa',{recursive:true});fs.writeFileSync(`qa/product-mobile-media-${engine}.json`,JSON.stringify(observations,null,2));
  console.log('Responsive sources, independent counts, lazy thumbnails, acknowledged resize, native node identity, variation/reset and catalog isolation passed ('+engine+').');
 }catch(error){
  fs.mkdirSync('qa',{recursive:true});
  const diagnostic={stage,observations,current:page?await snapshot().catch(e=>({diagnosticError:e.message})):null};
  fs.writeFileSync(`qa/product-mobile-media-${engine}-failure.json`,JSON.stringify(diagnostic,null,2));
  console.error('PRODUCT_MOBILE_MEDIA_DIAGNOSTIC',JSON.stringify(diagnostic));
  await page?.screenshot({path:`qa/product-mobile-media-${engine}-failure.png`,fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
