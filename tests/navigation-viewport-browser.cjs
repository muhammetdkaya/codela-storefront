// Native fixed-viewport geometry regression for mobile browser chrome.
// Synthetic visualViewport data is deliberately different from the rendered
// viewport: adding it to native CSS fixed anchoring double-counts Safari chrome.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const preview=require('node:child_process').execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','navigation'],{encoding:'utf8'});
const root='theme/codela-storefront/assets/';
const script=fs.readFileSync(root+'scripts/navigation-feedback.js','utf8');
const css=['tokens','components','navigation','navigation-feedback'].map(name=>fs.readFileSync(root+'styles/'+name+'.css','utf8')).join('\n');
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:850}});
  page.setDefaultTimeout(3000);
  await page.setContent('<style>'+css+'</style><div class="sf-shell has-mobile-dock"><nav class="sf-mobile-dock"><div class="sf-dock-surface"><a data-dock-view="home">Home</a></div></nav></div><main id="sf-content"><a id="product" data-sf-skeleton="product" href="https://store.test/product/item/">Product</a></main>');
  await page.evaluate(preview=>{
   const vv=new EventTarget();Object.assign(vv,{height:650,offsetTop:0,scale:1});
   const add=vv.addEventListener.bind(vv),remove=vv.removeEventListener.bind(vv);vv.listeners=new Set();
   vv.addEventListener=(type,fn)=>{vv.listeners.add(fn);add(type,fn)};
   vv.removeEventListener=(type,fn)=>{remove(type,fn);vv.listeners.delete(fn)};
   Object.defineProperty(window,'visualViewport',{value:vv,configurable:true});
   window.codelaSFDocument={home:'https://store.test/',productBase:'https://store.test/product/',purchasePreview:preview};
  },preview);
  await page.addScriptTag({content:script});
  await page.evaluate(()=>{const link=document.querySelector('#product');window.token=codelaSFFeedback.begin({url:link.href,link});});
  for(const [height,offsetTop] of [[650,0],[740,0],[620,25],[300,0]]){
   // The real CSS viewport changes; visualViewport may report different
   // sizes/offsets while browser chrome animates. Never sum the two systems.
   await page.setViewportSize({width:390,height});
   await page.evaluate(({height,offsetTop})=>{
    Object.assign(visualViewport,{height:Math.max(100,height-65),offsetTop,scale:1});
    visualViewport.dispatchEvent(new Event('resize'));
    visualViewport.dispatchEvent(new Event('scroll'));
   },{height,offsetTop});
   await page.waitForFunction(h=>document.querySelector('.sf-skeleton').getBoundingClientRect().height===h,height);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const boxes=await page.evaluate(()=>{
    const surface=document.querySelector('.sf-skeleton').getBoundingClientRect();
    const gallery=document.querySelector('.sf-skeleton-gallery').getBoundingClientRect();
    const panel=document.querySelector('.sf-navigation-preview').getBoundingClientRect();
    const dock=document.querySelector('.sf-mobile-dock');
    return {top:surface.top,bottom:surface.bottom,galleryTop:gallery.top,galleryBottom:gallery.bottom,panelTop:panel.top,panelBottom:panel.bottom,panelHeight:panel.height,manualTop:document.querySelector('.sf-skeleton').style.getPropertyValue('--sf-feedback-top'),manualHeight:document.querySelector('.sf-skeleton').style.getPropertyValue('--sf-feedback-height'),manualDock:dock.style.getPropertyValue('--sf-feedback-bottom-offset')};
   });
   assert.equal(boxes.top,0,'Browser native fixed top, independent of visualViewport.offsetTop');
   assert.equal(boxes.bottom,height,'Browser native bottom, no double compensation');
   assert.equal(boxes.galleryTop,0);
   assert(Math.abs(boxes.galleryBottom-(height-116))<2,'Gallery uses native photo frame, not panel top');
   assert(boxes.galleryBottom>boxes.panelTop,'Photo continues behind glass panel');
   assert(boxes.panelHeight>=150,'Destination includes native sheet header and controls');
   assert(boxes.panelBottom<=height&&boxes.panelTop>=0,'Whole purchase panel visible above bottom chrome');
   assert.equal(boxes.manualTop,'');assert.equal(boxes.manualHeight,'');assert.equal(boxes.manualDock,'');
   if(height===650){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-skeleton-visible-viewport.png'});}
  }
  await page.evaluate(()=>{visualViewport.scale=2;visualViewport.dispatchEvent(new Event('resize'));});
  assert.equal(await page.locator('.sf-skeleton').evaluate(el=>el.style.getPropertyValue('--sf-feedback-top')),'','Pinch zoom stays browser-owned');
  await page.evaluate(()=>{visualViewport.scale=1;visualViewport.dispatchEvent(new Event('resize'));codelaSFFeedback.end(token);});
  await page.waitForTimeout(40);
  assert.equal(await page.locator('.sf-skeleton').count(),0,'Queued updates cannot resurrect finished transition');
  assert.equal(await page.evaluate(()=>visualViewport.listeners.size),0,'Viewport listeners released');

  // Product -> home: the actual dock must remain at its normal CSS bottom
  // even when visualViewport pretends a smaller visible region.
  await page.setViewportSize({width:390,height:650});
  await page.evaluate(()=>{visualViewport.height=410;visualViewport.offsetTop=38;window.token=codelaSFFeedback.begin({url:'https://store.test/'});visualViewport.dispatchEvent(new Event('resize'));});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const dock=await page.evaluate(()=>{
   const el=document.querySelector('.sf-mobile-dock'),r=el.getBoundingClientRect();
   return {bottom:r.bottom,visible:getComputedStyle(el).display!=='none',manual:el.style.getPropertyValue('--sf-feedback-bottom-offset')};
  });
  assert(dock.visible&&dock.bottom<=650&&dock.bottom>=610,'Home dock stays near native viewport bottom');
  assert.equal(dock.manual,'','Never add visualViewport offset a second time');
  await page.evaluate(()=>codelaSFFeedback.end(token));

  await page.evaluate(()=>Object.defineProperty(window,'visualViewport',{value:null,configurable:true}));
  await page.setViewportSize({width:390,height:850});
  await page.evaluate(()=>{const link=document.querySelector('#product');codelaSFFeedback.begin({url:link.href,link});});
  assert.equal(await page.locator('.sf-skeleton').evaluate(el=>el.getBoundingClientRect().height),850,'Fixed CSS viewport fallback without VisualViewport');
  await page.setViewportSize({width:1280,height:800});
  assert.equal(await page.locator('.sf-navigation-preview').isVisible(),false,'Desktop has no mobile preview');
  console.log('Native fixed viewport/sheet/dock geometry, mismatch resilience, zoom, cleanup and desktop fallback passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
