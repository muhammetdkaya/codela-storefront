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
   for(const route of routes){
    const snapshot=await page.evaluate(url=>{
      const token=window.codelaSFFeedback.begin({url,owner:'agency-qa'});
      const surface=document.querySelector('.sf-agency-route-line');
      const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
      const main=document.querySelector('#sf-content');
      return {token,kind:surface?.dataset.sfAgency,logo:rect(document.querySelector('.sf-brand')),
        tools:rect(document.querySelector('.sf-agency-header-tools')),height:surface?.getBoundingClientRect().height,
        width:surface?.getBoundingClientRect().width,scrollWidth:document.documentElement.scrollWidth,
        skeleton:!!document.querySelector('.sf-skeleton'),oldContent:getComputedStyle(main).visibility,
        busy:main.getAttribute('aria-busy'),background:getComputedStyle(surface).backgroundColor,
        beam:(()=>{const c=getComputedStyle(surface,'::before');return {top:parseFloat(c.top),left:parseFloat(c.left),height:c.height,width:parseFloat(c.width)};})(),
        opacity:getComputedStyle(surface).opacity,viewport:innerHeight,
        headerAbove:Number(getComputedStyle(document.querySelector('.sf-header')).zIndex)>Number(getComputedStyle(surface).zIndex)};
    },route.url);
    assert(snapshot.token&&snapshot.kind===route.kind,'Agency route '+route.kind);
    assert.equal(snapshot.skeleton,false,'No fictional page layout');
    assert.equal(snapshot.oldContent,'visible','Outgoing content remains visible');
    assert.equal(snapshot.busy,'true');
    assert.equal(snapshot.height,snapshot.viewport,'Full dark transition surface');
    assert.equal(snapshot.background,'rgb(9, 9, 12)');
    assert.equal(snapshot.beam.height,'1px');
    assert(Math.abs(snapshot.beam.top-snapshot.viewport/2)<=1,'Beam centered vertically');
    assert(Math.abs(snapshot.beam.left-width/2)<=1,'Beam centered horizontally');
    assert(Math.abs(snapshot.beam.width-Math.min(260,width*.64))<=1,'First-entry beam width');
    assert.equal(snapshot.opacity,'0','Fast navigation starts without a visible veil');
    assert(snapshot.headerAbove,'Native header above transition surface');
    assert(snapshot.width>=width-1&&snapshot.scrollWidth<=width+1);
    for(const key of ['logo','tools'])for(const prop of ['x','y','w','h']){
      assert(Math.abs(snapshot[key][prop]-before[key][prop])<=1.2,'Native header does not jump');
    }
    if(route.kind==='home'){
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('.sf-agency-route-line')).opacity==='1');
    }
    await page.evaluate(()=>window.codelaSFFeedback.end());
    assert.equal(await page.locator('.sf-agency-route-line').count(),0);
    assert.equal(await page.locator('#sf-content').getAttribute('aria-busy'),null);
    assert.equal(await page.locator('#sf-content').getAttribute('inert'),null);
   }
   await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://agency.test/myaccount/'}));
   assert.equal(await page.locator('.sf-skeleton').getAttribute('data-sf-agency'),'account');
   await page.evaluate(()=>window.codelaSFFeedback.end());
   // Unlisted custom Agency page has neutral dark layout, no white jump.
   await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://agency.test/another-page/'}));
   assert.equal(await page.locator('.sf-agency-route-line').getAttribute('data-sf-agency'),'page');
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
  console.log('Agency route line: native header geometry, cancellation, commerce isolation and 6 routes.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
