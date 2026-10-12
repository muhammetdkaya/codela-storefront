const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css']
  .map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const sample=execFileSync(process.env.PHP_BIN||'php',['tests/render-ui.php'],{encoding:'utf8'});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--use-gl=disabled','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote','--single-process']}:{})});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:780},isMobile:width===390,hasTouch:width===390});
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><main class="sf-shell">'+sample+'</main></body></html>');
   const soft=page.locator('.sf-ui-icon-button--soft');
   const rect=await soft.boundingBox();
   assert(rect.width>=44&&rect.height>=44,'IconButton touch target stays 44px');
   const properties=await soft.evaluate(el=>({radius:getComputedStyle(el).borderRadius,bg:getComputedStyle(el).backgroundColor}));
   assert.equal(properties.bg,'rgba(250, 250, 252, 0.28)','Soft icon button uses shared floating surface token');
   assert.equal(properties.radius,'999px','Icon button has shared circular shape');
   assert.equal(await soft.evaluate(el=>getComputedStyle(el).borderTopColor),'rgba(0, 0, 0, 0)','Floating control has no solid perimeter stroke');
   const secondary=page.locator('button.sf-ui-button--secondary');
   assert(await secondary.isDisabled(),'Disabled button cannot activate');
   const busy=page.locator('button.sf-ui-button--quiet');
   assert(await busy.isDisabled(),'Loading button is disabled');
   assert.equal(await busy.getAttribute('aria-busy'),'true','Loading button announces busy state');
   assert(await busy.locator('.sf-ui-spinner').isVisible(),'Shared loading indicator rendered');
   const submit=page.locator('button[type="submit"]');
   assert((await submit.boundingBox()).height>=54,'Primary button matches shared minimum action height');
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),'color(srgb 0.133333 0.137255 0.121569 / 0.9)','Primary colour comes from theme token');
   assert.equal(await page.locator('a.sf-ui-button--secondary').getAttribute('href'),'https://store.test/read/','Navigation CTA retains native link');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'No overflow '+width);
   // Native pointer and keyboard feedback must never defer the actual action.
   await page.evaluate(()=>{
    window.clicks=0;
    document.querySelector('.ui-submit').addEventListener('click',()=>window.clicks++);
   });
   const scale=el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
   for(const [control,target] of [[submit,1.025],[soft,1.08]]){
    const before=await control.evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));
    const box=await control.boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.mouse.down();
    await page.waitForTimeout(150);
    assert(Math.abs(await control.evaluate(scale)-target)<.002,'Whole control expands on press');
    assert.deepEqual(await control.evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight})),before,'Transform preserves layout dimensions');
    assert.equal(await control.evaluate(el=>getComputedStyle(el).transitionProperty),'transform','Only transform animates');
    await page.mouse.up();
    await page.waitForTimeout(440);
    assert(Math.abs(await control.evaluate(scale)-1)<.001,'Release settles to original size');
   }
   assert.equal(await page.evaluate(()=>window.clicks),1,'One native activation per click');
   await submit.focus();
   await page.keyboard.down('Space');
   await page.waitForTimeout(150);
   assert(await submit.evaluate(scale)>1.02,'Keyboard press has the same feedback');
   await page.keyboard.up('Space');
   assert.equal(await page.evaluate(()=>window.clicks),2,'Keyboard activates exactly once');
   await page.waitForTimeout(440);
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).outlineStyle),'solid','Keyboard focus remains visible');
   assert((await soft.evaluate(el=>getComputedStyle(el).backdropFilter)).includes('blur(8px)'),'Material samples the backdrop');
   assert.notEqual(await submit.evaluate(el=>getComputedStyle(el).backgroundImage),'none','Surface has a light layer');
   await soft.evaluate(el=>{el.disabled=true;el.classList.add('is-pressed')});
   await page.waitForTimeout(440);
   assert.equal(await soft.evaluate(scale),1,'Disabled control cannot grow even with a stale pressed class');
   await soft.evaluate(el=>{el.disabled=false;el.classList.remove('is-pressed')});
   if(width===390){
    const session=await page.context().newCDPSession(page);
    const box=await submit.boundingBox();
    await submit.evaluate(el=>{
     window.touchPeak=1;window.touchSampling=true;
     const sample=()=>{window.touchPeak=Math.max(window.touchPeak,new DOMMatrixReadOnly(getComputedStyle(el).transform).a);if(window.touchSampling)requestAnimationFrame(sample)};
     requestAnimationFrame(sample);
    });
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
    await page.waitForTimeout(80);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(650);
    await page.evaluate(()=>window.touchSampling=false);
    assert(await page.evaluate(()=>window.touchPeak)>1.01,'Native touch activation gives expansion feedback');
    assert(Math.abs(await submit.evaluate(scale)-1)<.001,'Touch release settles');
    assert.equal(await page.evaluate(()=>window.clicks),3,'Touch activates once without a custom handler');
    await session.detach();
   }
   await page.emulateMedia({reducedMotion:'reduce'});
   const spinner=page.locator('.sf-ui-spinner');
   assert.equal(await spinner.evaluate(el=>getComputedStyle(el).animationName),'none','Reduced motion disables spinner');
   await submit.focus();await page.keyboard.down('Space');
   assert.equal(await submit.evaluate(scale),1,'Reduced motion disables press expansion');
   await page.keyboard.up('Space');
   const media=await page.context().newCDPSession(page);
   await media.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backdropFilter),'none','Reduced transparency disables blur');
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(34, 35, 31)','Reduced transparency provides an opaque primary');
   await media.detach();
   await page.emulateMedia({forcedColors:'active'});
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).boxShadow),'none','Forced colors remove decorative shadows');
   await page.close();
  }
  console.log('Shared Button/IconButton touch targets, variants, loading, focus and responsive layout: passed.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

