const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const html=execFileSync(process.env.PHP_BIN||'php',['tests/homepage.php'],{encoding:'utf8',env:{...process.env,RENDER_HOME:'1'}});
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/components.css','assets/styles/catalog.css','assets/styles/gallery.css','assets/styles/homepage.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
(async()=>{const browser=await chromium.launch(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{});try{
 for(const width of [320,390,700,1280]){
 const page=await browser.newPage({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).pathname==='/'?route.fulfill({contentType:'text/html',body:'<html></html>'}):route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#d8cdbd"/></svg>'}));
 await page.goto('https://store.test/');
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="home"><main class="sf-content">'+html+'</main></body></html>');
 await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8')});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow '+width);
 assert.equal(await page.locator('[data-gallery-count]').textContent(),'1 / 2');
 await page.locator('[data-gallery-next]').click();await page.waitForFunction(()=>document.querySelector('[data-gallery-count]').textContent==='2 / 2');
 assert(await page.locator('[data-gallery-next]').isDisabled());
 await page.locator('.sf-ui-gallery-track').focus();await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('[data-gallery-count]').textContent==='1 / 2');
 assert(await page.locator('[data-gallery-prev]').isDisabled());
 assert.equal(await page.locator('.sf-home-category-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),width<=700?2:4);
 // Long editor content still leaves the real CTA reachable above navigation.
 await page.locator('.sf-home-slide-copy h1').evaluate(e=>e.textContent='Doğal dokularla yaşam alanınıza sıcaklık katan özel koleksiyonlardan seçmeler ve yeni ürünler');
 await page.locator('.sf-home-slide-copy p').evaluate(e=>e.textContent='Doğal taş ve sade çizgilerle yaşam alanınızı keşfedin. '.repeat(6));
 const metrics=await page.locator('.sf-home-slide-copy .sf-ui-button').evaluate(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('.sf-home-slider').getBoundingClientRect(),nav=document.querySelector('.sf-home-slider-controls').getBoundingClientRect();return{inside:r.top>=s.top&&r.bottom<=s.bottom,clear:r.right<nav.left||r.bottom<=nav.top}});
 assert(metrics.inside&&metrics.clear,'Long text keeps CTA inside slider and clear of navigation '+width);
 if(process.env.SAVE_SCREENSHOT){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/homepage-'+width+'.png',fullPage:true});}
 assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Homepage horizontal gallery, keyboard, responsive categories, CTA and long-text layout passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
