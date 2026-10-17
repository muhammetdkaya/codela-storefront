// Exercise the real overlay controller with the real mobile product composition.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fixtureSource=fs.readFileSync('tests/product-sheet-browser.cjs','utf8').split('(async()=>{const browser=')[0];
const {fixture,load}=new Function('require',fixtureSource+'\nreturn {fixture,load};')(require);
const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_PRODUCT:'1'}});
const overlay=fs.readFileSync('theme/codela-storefront/assets/scripts/overlay-controller.js','utf8').replace('export function','function');
(async()=>{const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{});try{
for(const width of [320,390,700]){
 const page=await browser.newPage({viewport:{width,height:844},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(fixture().replace(/<div class="sf-shell">.*?<\/div><main/s,header+'<main'));
 await page.addStyleTag({content:fs.readFileSync('theme/codela-storefront/assets/styles/overlay.css','utf8')});
 for(const name of ['product-information','gallery-defer'])await page.addScriptTag({content:fs.readFileSync('theme/codela-storefront/assets/scripts/'+name+'.js','utf8')});
 await page.addScriptTag({content:overlay+`;window.overlay=createOverlayController({$:s=>document.querySelector(s),config:()=>({}),t:s=>s,searchFeature:{cancel(){},start(){}},cartFeature:{getData:()=>({items:[]}),refresh(){}},mountDock(){},restoreDock(){},setDockCollapsed(){},markDockActive(){},mobileDock:()=>null,dockScrollPositions:new Map(),onMenuOpen(){}});overlay.bind(document.querySelector('#sf-panel'));`});
 await page.waitForSelector('.sf-product-sheet');
 for(const selector of ['.woocommerce-product-gallery__image:nth-child(1)','.woocommerce-product-gallery__image:nth-child(2)','.woocommerce-product-gallery__image:nth-child(3)','.sf-product-discovery']){
  await page.locator(selector).evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top,behavior:'instant'}));
  await page.waitForTimeout(150);
  const before=await page.evaluate(()=>({y:scrollY,discovery:document.querySelector('.woocommerce-product-gallery').classList.contains('is-discovering')}));
  for(let i=0;i<2;i++){
   await page.evaluate(()=>overlay.open('menu',{preventDefault(){},target:document.querySelector('[data-panel=menu]')}));
   await page.waitForTimeout(60);
   await page.evaluate(()=>overlay.close());
   await page.waitForFunction(()=>!document.querySelector('#sf-panel').open);
   await page.waitForTimeout(160);
   const after=await page.evaluate(()=>({y:scrollY,discovery:document.querySelector('.woocommerce-product-gallery').classList.contains('is-discovering')}));
   console.log('PRODUCT_MENU',width,selector,JSON.stringify({before,after}));
   assert(Math.abs(before.y-after.y)<=2,'Menu must preserve the product position');assert.equal(after.discovery,before.discovery,'Discovery state is preserved');
  }
 }
 assert.deepEqual(errors,[]);await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
