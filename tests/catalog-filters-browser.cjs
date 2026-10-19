// Real PHP header + existing modal controller: archive mode and GET submission.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const styles=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css','assets/styles/catalog.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const overlay=fs.readFileSync(root+'assets/scripts/overlay-controller.js','utf8').replace('export function','function');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 try {
  for(const mode of ['shop','category']) for(const dock of ['1','0']) for(const width of [320,390,700,900,1024,1280,1920]){
   const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_CATALOG:mode,FIXTURE_DOCK:dock}});
   const page=await browser.newPage({viewport:{width,height:850}});
   await page.route('https://store.test/**',route=>route.fulfill({body:'OK',contentType:'text/html'}));
   await page.setContent('<!doctype html><html><head><style>'+styles+'</style></head><body>'+header+'</body></html>');
   await page.addScriptTag({content:overlay+`
    const $=s=>document.querySelector(s);
    const feature={cancel(){},start(){},refresh(){},getData(){return null}};
    const controller=createOverlayController({$,config:()=>({}),t:k=>k,searchFeature:feature,cartFeature:feature,mountDock(){},restoreDock(){},setDockCollapsed(){},markDockActive(){},mobileDock:()=>null,dockScrollPositions:new Map(),onMenuOpen(){}});
    controller.bind($('#sf-panel'));
    $('[data-panel="filters"]').addEventListener('click',event=>controller.open('filters',event));
    $('.sf-panel-top .sf-close').addEventListener('click',()=>controller.close());
   `});
   const geometry=await page.evaluate(()=>{
    const f=document.querySelector('.sf-filter-trigger').getBoundingClientRect(),m=document.querySelector('.sf-menu-trigger').getBoundingClientRect();
    return {fw:f.width,fh:f.height,overlap:f.left<m.right&&f.right>m.left,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert.equal(geometry.fw,44);assert.equal(geometry.fh,44);assert(!geometry.overlap);assert(!geometry.overflow,`${mode} ${dock} ${width}`);
   await page.locator('.sf-filter-trigger').click();
   assert(await page.locator('#sf-panel').evaluate(el=>el.open));
   assert(await page.locator('#sf-filters').isVisible());
   const panel=await page.locator('#sf-panel').boundingBox();
   assert.equal(await page.locator('#sf-filters form').count(),1,'One native GET form at every width');
   if(width>900){assert(panel.x>width/2,'Desktop leaves the catalog visible');assert(panel.width<=480,'Bounded desktop filter panel');}
   else assert(Math.abs(panel.width-width)<1,'Mobile/tablet filters stay full-screen');
   assert(!(await page.locator('#sf-cart').isVisible()));
   await page.locator('#sf-catalog-order').selectOption('price-desc');
   await page.locator('[name=min_price]').fill('10');await page.locator('[name=max_price]').fill('50');
   const action=await page.locator('#sf-filters form').getAttribute('action');
   assert(action.endsWith(mode==='shop'?'/shop/':'/category/7/'));
   if(mode==='category'&&dock==='1'&&width===390) {fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-catalog-filters.png'});}
   await page.keyboard.press('Escape');
   assert(!(await page.locator('#sf-panel').evaluate(el=>el.open)));
   assert(await page.locator('.sf-filter-trigger').evaluate(el=>el===document.activeElement));
   await page.locator('.sf-filter-trigger').click();
   await Promise.all([page.waitForURL(/orderby=price-desc/),page.locator('#sf-filters button[type=submit]').click()]);
   const url=new URL(page.url());assert.equal(url.searchParams.get('min_price'),'10');assert.equal(url.searchParams.get('max_price'),'50');
   await page.close();
  }
  console.log('Catalog Filters: shop/category, dock on/off, 7 widths, same dialog, Escape/focus and scoped GET submission passed.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
