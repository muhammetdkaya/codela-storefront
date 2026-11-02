// Slow real HTTP script delivery around production PHP descriptions and sheet.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const {fixture}=require('./product-sheet-browser.cjs');
const root='theme/codela-storefront/',engine=process.env.TEST_WEBKIT?'webkit':'chromium';
const script=fs.readFileSync(root+'assets/scripts/product-information.js','utf8');
const gallery=fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8');
async function measure(page){return page.evaluate(()=>Object.fromEntries(['.summary','.product_title','.sf-product-purchase','.quantity','.single_add_to_cart_button','#sf-product-section-description','.sf-product-information'].map(selector=>{
 const el=document.querySelector(selector),r=el?.getBoundingClientRect(),s=el&&getComputedStyle(el);
 return [selector,r?{x:r.x,y:r.y,width:r.width,height:r.height,background:s.backgroundColor,shadow:s.boxShadow,radius:s.borderRadius,backdrop:s.backdropFilter}:null];
})));}
(async()=>{const browser=await(engine==='webkit'?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{});try{
 fs.mkdirSync('qa/first-paint',{recursive:true});
 for(const width of [701,900,901,1280,1440])for(const options of [{},{variable:true},{stock:false}]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));
  let adapter;let requested;const started=new Promise(resolve=>requested=resolve);
  let html=fixture({...options,pending:true}).replace('<head>','<head><meta charset="utf-8">').replace('</body>','<script async id="codela-storefront-product-information-js" src="/adapter.js"></script></body>');
  if(process.env.FIRST_PAINT_OLD_CSS)html=html.replace('</head>','<style>'+fs.readFileSync(process.env.FIRST_PAINT_OLD_CSS,'utf8')+'</style></head>');
  await page.route('https://first-paint.test/**',route=>{if(route.request().url().endsWith('/adapter.js')){adapter=route;requested();return;}return route.fulfill({contentType:'text/html',body:html});});
  await page.goto('https://first-paint.test/',{waitUntil:'domcontentloaded'});await started;
  assert(await page.locator('html').evaluate(el=>el.classList.contains('sf-product-sheet-pending')),'Adapter really remains pending');
  assert.equal(await page.locator('.summary > #sf-product-section-description').count(),1,'Description is server-rendered in final column');
  await page.evaluate(()=>{window.formBefore=document.querySelector('form.cart');window.descriptionBefore=document.querySelector('#sf-product-section-description');});
  const before=await measure(page);
  // WebKit's document.fonts.ready waits for this intentionally blocked async
  // script. Keep all pre-load geometry/material assertions in both engines;
  // take its visual capture after release instead of deadlocking screenshot.
  if(engine==='chromium'&&width===1280&&!Object.keys(options).length)await page.screenshot({path:`qa/first-paint/${engine}-desktop-before.png`});
  await adapter.fulfill({contentType:'text/javascript',body:script});await page.waitForLoadState('load');
  await page.addScriptTag({content:gallery});
  const after=await measure(page),label=width+'/'+JSON.stringify(options);
  for(const [selector,rect] of Object.entries(before)){
   if(!rect)continue;
   for(const key of ['x','y','width','height'])assert(Math.abs(rect[key]-after[selector][key])<=1,`${label} ${selector}.${key} moved: ${rect[key]} → ${after[selector][key]}`);
   for(const key of ['background','shadow','radius','backdrop'])assert.equal(after[selector][key],rect[key],`${label} ${selector}.${key} changed after script`);
  }
  assert(await page.evaluate(()=>window.formBefore===document.querySelector('form.cart')&&window.descriptionBefore===document.querySelector('#sf-product-section-description')),'Original form and description identity');
  if(width===1280&&!Object.keys(options).length)await page.screenshot({path:`qa/first-paint/${engine}-desktop-after.png`});
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.body.classList.contains('sf-product-sheet-ready'));
  assert.equal(await page.locator('.sf-product-sheet-body .sf-product-information > #sf-product-section-description').count(),1,'Single description reaches original mobile disclosure order');
  await page.setViewportSize({width,height:900});
  await page.waitForFunction(()=>!document.body.classList.contains('sf-product-sheet-ready'));
  assert.equal(await page.locator('.summary > #sf-product-section-description').count(),1,'Same description returns to summary');
  assert.deepEqual(errors,[]);await context.close();
 }
 for(const width of [390,701,1280]){
  const context=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:false}),page=await context.newPage();
  await page.setContent(fixture({pending:true}));
  assert.equal(await page.locator('#sf-product-section-description').count(),1);
  assert(await page.locator('#sf-product-section-description').isVisible(),'Native description without JavaScript');
  assert.equal(await page.locator('form.cart').count(),1);
  await context.close();
 }
 console.log('Product first paint: 15 delayed-script states, unchanged geometry/material, single native callbacks/nodes, mobile restore and no-script passed ('+engine+').');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
