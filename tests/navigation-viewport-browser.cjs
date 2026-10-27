// Reproduce browser-chrome changes where visual and layout viewport differ.
// This controlled viewport boundary is not a physical Safari acceptance test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const root='theme/codela-storefront/assets/';
const script=fs.readFileSync(root+'scripts/navigation-feedback.js','utf8');
const css=['tokens','components','navigation-feedback'].map(name=>fs.readFileSync(root+'styles/'+name+'.css','utf8')).join('\n');
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:850}});
  page.setDefaultTimeout(3000);
  await page.setContent('<style>'+css+'</style><main id="sf-content"><a id="product" href="https://store.test/product/item/">Product</a></main>');
  await page.evaluate(()=>{
   const vv=new EventTarget();Object.assign(vv,{height:650,offsetTop:0,scale:1});
   const add=vv.addEventListener.bind(vv),remove=vv.removeEventListener.bind(vv);vv.listeners=new Set();
   vv.addEventListener=(type,fn)=>{vv.listeners.add(fn);add(type,fn)};
   vv.removeEventListener=(type,fn)=>{remove(type,fn);vv.listeners.delete(fn)};
   Object.defineProperty(window,'visualViewport',{value:vv,configurable:true});
   window.codelaSFDocument={productBase:'https://store.test/product/'};
  });
  await page.addScriptTag({content:script});
  await page.evaluate(()=>{const link=document.querySelector('#product');window.token=codelaSFFeedback.begin({url:link.href,link});});
  for(const [height,offsetTop] of [[650,0],[740,0],[620,25],[300,0]]){
   await page.evaluate(({height,offsetTop})=>{Object.assign(visualViewport,{height,offsetTop});visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'));},{height,offsetTop});
   await page.waitForFunction(h=>document.querySelector('.sf-skeleton').getBoundingClientRect().height===h,height);
   const boxes=await page.evaluate(()=>{
    const surface=document.querySelector('.sf-skeleton').getBoundingClientRect();
    const panel=document.querySelector('.sf-skeleton-purchase').getBoundingClientRect();
    const controls=document.querySelector('.sf-skeleton-purchase .sf-skeleton-product-controls').getBoundingClientRect();
    return {top:surface.top,bottom:surface.bottom,panelBottom:panel.bottom,controlsBottom:controls.bottom,position:getComputedStyle(document.querySelector('.sf-skeleton-purchase')).position};
   });
   assert.equal(boxes.top,offsetTop);assert.equal(boxes.bottom,height+offsetTop);
   assert.equal(boxes.panelBottom,boxes.bottom-4,'Purchase panel stays above visible viewport bottom');
   assert(boxes.controlsBottom<=boxes.panelBottom,'Quantity and CTA are wholly inside the panel');
   assert.equal(boxes.position,'absolute','One viewport owner, no nested fixed purchase');
   if(height===650){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-skeleton-visible-viewport.png',clip:{x:0,y:0,width:390,height:650}});}
  }
  await page.evaluate(()=>{visualViewport.scale=2;visualViewport.dispatchEvent(new Event('resize'));});
  await page.waitForFunction(()=>!document.querySelector('.sf-skeleton').style.getPropertyValue('--sf-feedback-height'));
  assert.equal(await page.locator('.sf-skeleton').evaluate(el=>el.style.getPropertyValue('--sf-feedback-top')),'','Pinch zoom keeps native panning');
  await page.evaluate(()=>{visualViewport.scale=1;visualViewport.height=650;visualViewport.dispatchEvent(new Event('resize'));codelaSFFeedback.end(token);});
  await page.waitForTimeout(40);
  assert.equal(await page.locator('.sf-skeleton').count(),0,'Queued viewport updates cannot resurrect a finished transition');
  assert.equal(await page.evaluate(()=>visualViewport.listeners.size),0,'Viewport listeners released');
  await page.evaluate(()=>Object.defineProperty(window,'visualViewport',{value:null,configurable:true}));
  await page.evaluate(()=>{const link=document.querySelector('#product');codelaSFFeedback.begin({url:link.href,link});});
  assert.equal(await page.locator('.sf-skeleton').evaluate(el=>el.getBoundingClientRect().height),850,'CSS dynamic viewport fallback without VisualViewport');
  await page.setViewportSize({width:1280,height:800});
  assert.equal(await page.locator('.sf-skeleton-purchase').isVisible(),false,'Desktop retains inline summary layout');
  console.log('Visible viewport shrink/expand/offset, purchase clipping, zoom, cleanup and desktop fallback passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
