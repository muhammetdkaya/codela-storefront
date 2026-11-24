// Navigation skeletons must preserve the real Agency header and reflect
// each destination's first-screen geometry without changing merchant routes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const assets=path.join(root,'theme/codela-storefront/assets');
const css=['styles/storefront-base.css','styles/navigation-feedback.css']
  .map(f=>fs.readFileSync(path.join(assets,f),'utf8')).join('\n');
const js=fs.readFileSync(path.join(assets,'scripts/navigation-feedback.js'),'utf8');
const routes=[
 ['home','/'],['services','/services-renamed/'],['detail','/services-renamed/web-renamed/'],
 ['about','/about-renamed/'],['contact','/contact-renamed/'],['project','/project-renamed/']
].map(([kind,route])=>({kind,url:'https://agency.test'+route}));
const icon=fs.readFileSync(path.join(assets,'icons/codela-brand-mark.svg'),'utf8');
function header(dock){
 return execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{
   cwd:root,encoding:'utf8',env:{...process.env,FIXTURE_EXPERIENCE:'agency',FIXTURE_DOCK:dock?'1':'0'}
 }).replaceAll('https://store.test','https://agency.test');
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{
   executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']
 }:{})});
 try{
  for(const dock of [true,false])for(const width of [390,1440]){
   const head=header(dock);
   const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const source='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<style>'+css+'</style></head><body class="home" style="margin:0;background:#09090c">'+head+
      '<main id="sf-content" class="sf-content" style="min-height:1200px">Old content</main></body></html>';
   await page.route('https://agency.test/**',route=>{
    if(route.request().url().endsWith('/assets/icons/codela-brand-mark.svg'))
      return route.fulfill({contentType:'image/svg+xml',body:icon});
    return route.fulfill({contentType:'text/html',body:source});
   });
   await page.goto('https://agency.test/');
   assert.equal(await page.locator('.sf-shell.has-agency-header').count(),1,'Real Agency header fixture');
   await page.evaluate(items=>{window.codelaSFDocument={
     home:'https://agency.test/',account:'https://agency.test/myaccount/',
     cart:'https://agency.test/cart/',checkout:'https://agency.test/checkout/',
     shop:'https://agency.test/shop/',productBase:'https://agency.test/product/',agencyRoutes:items
   }},routes);
   await page.addScriptTag({content:js});
   const before=await page.evaluate(()=>{
     const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
     return {logo:rect(document.querySelector('.sf-brand')),
       tools:rect(document.querySelector('.sf-agency-header-tools'))};
   });
   const expectedShapes={
      home:['hero','hero-media','intro'],
      services:['bento--services','bento-card--feature','bento-card--strip'],
      contact:['bento--contact','bento-card--map','bento-card--feature','bento-card--strip'],
      detail:['detail','media','tags'],
      about:['about-head','principles','principle-list'],
      project:['project-panel','progress','choice-grid']
   };
   for(const route of routes){
    const snapshot=await page.evaluate(url=>{
      const token=window.codelaSFFeedback.begin({url,owner:'agency-qa'});
      const surface=document.querySelector('.sf-skeleton'),h=document.querySelector('.sf-header');
      const current=document.querySelector('.sf-agency-header-tools');
      const logo=document.querySelector('.sf-brand');
      const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
      const dock=document.querySelector('.sf-mobile-dock');
      const layout=surface?.querySelector('.sf-agency-loading');
      return {token,kind:surface?.dataset.sfAgency,
       bg:surface&&getComputedStyle(surface).backgroundColor,
       layout:layout?.outerHTML,logo:rect(logo),tools:rect(current),
       logoVisibility:getComputedStyle(logo).visibility,
       toolsVisibility:getComputedStyle(current).visibility,
       accountVisibility:getComputedStyle(current.querySelector('.sf-actions')).display,
       duplicateHeader:h.querySelectorAll('.sf-header-destination').length,
       merchantIcons:h.querySelectorAll('.sf-cart-trigger,.sf-search-trigger').length,
       width:surface?.getBoundingClientRect().width,scrollWidth:document.documentElement.scrollWidth,
       dock:dock?{index:dock.style.getPropertyValue('--sf-dock-index'),
        selection:dock.classList.contains('has-selection'),
        active:[...dock.querySelectorAll('.is-active')].map(x=>x.dataset.dockView)}:null
      };
    },route.url);
    assert(snapshot.token&&snapshot.kind===route.kind,'Agency route '+route.kind);
    assert.equal(snapshot.bg,route.kind==='about'?'rgb(6, 6, 10)':'rgb(9, 9, 12)');
    for(const marker of expectedShapes[route.kind]){
      assert(snapshot.layout.includes('sf-agency-loading__'+marker),'Real geometry '+route.kind+':'+marker);
    }
    assert.equal(snapshot.duplicateHeader,0,'Never fabricate a second header');
    assert.equal(snapshot.merchantIcons,0,'Agency header has no merchant search/cart');
    assert.equal(snapshot.logoVisibility,'visible','Native Codela mark remains visible');
    assert.equal(snapshot.toolsVisibility,'visible','Combined native account/menu capsule stays visible');
    assert.notEqual(snapshot.accountVisibility,'none','Agency account icon is not hidden by dock styling');
    for(const key of ['logo','tools'])for(const prop of ['x','y','w','h']){
       assert(Math.abs(snapshot[key][prop]-before[key][prop])<=1.2,
         'Native header does not jump: '+route.kind+' '+key+'.'+prop);
    }
    assert(snapshot.width>=width-1&&snapshot.scrollWidth<=width+1,'No skeleton overflow at '+width);
    if(dock){
      const selection={home:['0','home'],services:['1','services'],contact:['2','contact']};
      if(selection[route.kind]){
        assert.equal(snapshot.dock.index,selection[route.kind][0],'Correct dock thumb');
        assert(snapshot.dock.selection,'Dock selection shown');
        assert.deepEqual(snapshot.dock.active,[selection[route.kind][1]],'Correct dock active tab');
      }else assert.equal(snapshot.dock.selection,false,'No false dock selection');
    }else assert.equal(snapshot.dock,null,'Disabled dock remains absent');
    await page.evaluate(()=>window.codelaSFFeedback.end());
    assert.equal(await page.locator('.sf-skeleton').count(),0,'Owner cleanup');
    assert.equal(await page.locator('html[data-sf-navigation-agency]').count(),0,'Agency dataset cleaned');
   }
   await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://agency.test/myaccount/'}));
   assert.equal(await page.locator('.sf-skeleton').getAttribute('data-sf-agency'),'account');
   await page.evaluate(()=>window.codelaSFFeedback.end());
   // Unlisted custom Agency page has neutral dark layout, no white jump.
   await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://agency.test/another-page/'}));
   assert.equal(await page.locator('.sf-skeleton').getAttribute('data-sf-agency'),'page');
   await page.evaluate(()=>window.codelaSFFeedback.end());
   // Woo documents stay on the shared commerce skeleton, even on Agency sites.
   for(const url of ['https://agency.test/cart/','https://agency.test/checkout/',
       'https://agency.test/shop/','https://agency.test/product/sample/']){
     await page.evaluate(url=>window.codelaSFFeedback.begin({url}),url);
     assert.equal(await page.locator('.sf-skeleton[data-sf-agency]').count(),0,'Native Woo skeleton: '+url);
     await page.evaluate(()=>window.codelaSFFeedback.end());
   }
   await page.evaluate(()=>document.querySelector('.sf-shell').classList.remove('has-agency-profile'));
   await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://agency.test/merchant-page/'}));
   assert.equal(await page.locator('.sf-skeleton[data-sf-agency]').count(),0,'Commerce remains neutral');
   await page.evaluate(()=>window.codelaSFFeedback.end());
   assert.deepEqual(errors,[],'No page errors');
   await page.close();
  }
  console.log('Agency skeletons: native header geometry, 6 destination layouts and dock/no-dock behavior at 2 widths.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
