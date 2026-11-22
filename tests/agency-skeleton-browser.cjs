// Destination-aware Agency skeleton color and geometry; merchant routes stay isolated.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='theme/codela-storefront/assets/';
const css=fs.readFileSync(base+'styles/navigation-feedback.css','utf8');
const js=fs.readFileSync(base+'scripts/navigation-feedback.js','utf8');
const routes=[
 ['home','/'],['services','/services-renamed/'],['detail','/services-renamed/web-renamed/'],
 ['about','/about-renamed/'],['contact','/contact-renamed/'],['project','/project-renamed/']
].map(([kind,path])=>({kind,url:'https://agency.test'+path}));
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{})});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://agency.test/**',route=>route.fulfill({contentType:'text/html',body:
     '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
     '<body style="margin:0"><div class="sf-shell has-agency-profile"><header class="sf-header"></header></div>'+
     '<main id="sf-content">Outgoing content</main></body></html>'}));
   await page.goto('https://agency.test/');
   await page.addStyleTag({content:css});
   await page.evaluate(items=>{window.codelaSFDocument={
     home:'https://agency.test/',account:'https://agency.test/myaccount/',agencyRoutes:items
   }},routes);
   await page.addScriptTag({content:js});
   for(const route of routes){
     const state=await page.evaluate(url=>{
       const token=window.codelaSFFeedback.begin({url,owner:'agency-qa'});
       const node=document.querySelector('.sf-skeleton');
       return {token,kind:node?.dataset.sfAgency,
         bg:node&&getComputedStyle(node).backgroundColor,
         specific:!!node?.querySelector('.sf-agency-loading--'+node.dataset.sfAgency),
         shapes:node?.querySelectorAll('.sf-agency-loading__shape').length,
         width:node?.getBoundingClientRect().width,scrollWidth:document.documentElement.scrollWidth};
     },route.url);
     assert(state.token,'A pending Agency transition has an owner');
     assert.equal(state.kind,route.kind);
     assert.equal(state.bg,route.kind==='about'?'rgb(6, 6, 10)':'rgb(9, 9, 12)');
     assert(state.specific&&state.shapes>=5,'Layout matches '+route.kind);
     assert(state.width>=width-1&&state.scrollWidth<=width+1,'Viewport coverage at '+width);
     await page.evaluate(()=>window.codelaSFFeedback.end());
     assert.equal(await page.locator('.sf-skeleton').count(),0,'Cleanup');
   }
   await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://agency.test/myaccount/'}));
   assert.equal(await page.locator('.sf-skeleton').getAttribute('data-sf-agency'),'account');
   await page.evaluate(()=>window.codelaSFFeedback.end());
   await page.evaluate(()=>document.querySelector('.sf-shell').classList.remove('has-agency-profile'));
   for(const url of ['https://agency.test/myaccount/','https://agency.test/shop/']){
     await page.evaluate(url=>window.codelaSFFeedback.begin({url}),url);
     assert.equal(await page.locator('.sf-skeleton[data-sf-agency]').count(),0,'Merchant fallback');
     await page.evaluate(()=>window.codelaSFFeedback.end());
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Agency skeletons: 6 destinations, 2 viewports, account and merchant isolation.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
