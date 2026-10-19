const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const js=fs.readFileSync('theme/codela-storefront/assets/scripts/media-loading.js','utf8');
const fixture='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}picture,img{display:block}img{width:100%;height:auto}.gap{height:2400px}</style><script>'+js+'</script><noscript><style>img[data-sf-media-src]{display:none!important}picture:has(>img[data-sf-media-src]){display:none!important}</style></noscript><img src="/hero.svg" width="1200" height="900" alt="Hero"><div class="gap"></div><picture><source media="(max-width:700px)" data-sf-media-srcset="/mobile.svg 600w" sizes="100vw"><img data-sf-media-src="/desktop.svg" data-sf-media-srcset="/desktop.svg 1200w" data-sf-media-sizes="100vw" src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%221200%22%20height=%22900%22/%3E" loading="lazy" width="1200" height="900" alt="Lower photo"></picture><noscript><picture><source media="(max-width:700px)" srcset="/mobile.svg 600w" sizes="100vw"><img src="/desktop.svg" srcset="/desktop.svg 1200w" sizes="100vw" loading="lazy" width="1200" height="900" alt="Lower photo"></picture></noscript>';
(async()=>{const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{});try{
 for(const width of [390,1280])for(const javaScriptEnabled of [true,false]){
  const context=await browser.newContext({viewport:{width,height:844},javaScriptEnabled}),page=await context.newPage(),requests=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://media.test/**',route=>{const path=new URL(route.request().url()).pathname;if(path==='/')return route.fulfill({contentType:'text/html',body:fixture});requests.push(path);return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="tan"/></svg>'});});
  await page.goto('https://media.test/',{waitUntil:'load'});
  if(javaScriptEnabled){await page.waitForTimeout(100);assert(!requests.some(x=>/mobile|desktop/.test(x)),'Below-fold source must not compete with the critical photo');}
  const image=page.locator('img[alt="Lower photo"]:visible').last();const before=await image.boundingBox();
  if(javaScriptEnabled&&width===1280){await image.evaluate(img=>img.closest('picture').dispatchEvent(new Event('codela:media-intent',{bubbles:true})));await page.waitForFunction(()=>document.querySelector('img[alt="Lower photo"]').src.startsWith('https:'));assert((await image.boundingBox()).y>844,'Intent starts the actual selected photo before it is visible');}
  await image.scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const image=[...document.images].find(e=>e.alt==='Lower photo'&&e.getBoundingClientRect().width>0);return image.complete&&image.currentSrc.startsWith('https:')});
  const after=await image.boundingBox();assert(Math.abs(before.height-after.height)<1,'No geometry change at promotion');assert.equal(await image.evaluate(e=>new URL(e.currentSrc).pathname),width<700?'/mobile.svg':'/desktop.svg');assert.equal(await page.locator('img[alt="Lower photo"]:visible').count(),1,'Exactly one visible image with or without scripts');
  if(javaScriptEnabled){await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));assert.equal(await page.locator('img[data-sf-media-src]').count(),0);}
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Media delivery: cold network isolation, responsive picture, stable geometry, no-script and print passed.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
