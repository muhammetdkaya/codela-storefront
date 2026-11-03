/** Real Embla v8 + production PHP/CSS/adapter. No engine mock for movement. */
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,firefox,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
// TEST_BROWSER is the explicit three-engine interface; retain older CI flags.
const browserName=process.env.TEST_BROWSER||(process.env.TEST_WEBKIT?'webkit':process.env.TEST_FIREFOX?'firefox':'chromium');
assert(['chromium','firefox','webkit'].includes(browserName),'TEST_BROWSER must be chromium, firefox or webkit');
const root='theme/codela-storefront/assets/';
const source=fs.readFileSync(root+'scripts/gallery-horizontal.js','utf8');
const vendor=fs.readFileSync(root+'vendor/embla-carousel.js','utf8');
const media=fs.readFileSync(root+'scripts/media-loading.js','utf8');
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/gallery.css','styles/sections.css'].map(path=>fs.readFileSync(root+path,'utf8')).join('\n');
const fixture=JSON.parse(execFileSync(process.env.PHP_BIN||'php',['tests/embla-showcase-fixture.php'],{encoding:'utf8'}));
const wrapVendor=`import EmblaCarousel from '/vendor-core.js';
export default function(root,options){
 const api=EmblaCarousel(root,options),destroy=api.destroy;
 window.__engines.push(api);window.__created++;
 api.destroy=()=>{window.__destroyed++;return destroy();};return api;
}`;
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#cbbdad"/><circle cx="620" cy="440" r="230" fill="#e8dfcf"/></svg>';
const bounded=async(promise,milliseconds,label)=>{
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out after '+milliseconds+'ms')),milliseconds);})]);}
 finally{clearTimeout(timer);}
};
(async()=>{
 const browser=await({chromium,firefox,webkit}[browserName]).launch(process.env.CHROMIUM_BIN&&browserName==='chromium'?{timeout:15000,executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{timeout:15000});
 const active=new Set(),started=Date.now();let lastStage=null;
 const stage=(name,detail={})=>{
  const record={browser:browserName,stage:name,elapsed_ms:Date.now()-started,detail,active:[...active].map(entry=>entry.info)};
  lastStage=record;fs.mkdirSync('qa',{recursive:true});
  fs.writeFileSync(`qa/embla-${browserName}-progress.json`,JSON.stringify(record,null,2));
  fs.appendFileSync(`qa/embla-${browserName}-progress.ndjson`,JSON.stringify(record)+'\n');
  console.log('Embla stage',browserName,name,JSON.stringify(detail));
 };
 const watchdog=setTimeout(()=>{
  const interrupted=lastStage;stage('suite-timeout',{interrupted});
  const exit=setTimeout(()=>process.exit(1),8000);exit.unref();
  void(async()=>{try{let index=0;for(const entry of active)await diagnose(entry,++index);await bounded(browser.close(),3000,'Watchdog browser close');}catch(error){console.error(error);}finally{process.exit(1);}})();
 },Number(process.env.EMBLA_TEST_TIMEOUT_MS||240000));
 const open=async({width=390,mode='embla',reducedMotion='reduce',single=false,wheel=false,javaScriptEnabled=true}={})=>{
  const context=await bounded(browser.newContext({viewport:{width,height:900},hasTouch:true,reducedMotion,javaScriptEnabled}),15000,'Create browser context');
  context.setDefaultTimeout(10000);context.setDefaultNavigationTimeout(15000);
  const page=await context.newPage(),requests=[],errors=[];
  const info={width,mode,reducedMotion,single,wheel,javaScriptEnabled,phase:'open'},entry={page,info,requests,errors};active.add(entry);
  await page.addInitScript(()=>{
   window.__inputLog=[];
   for(const type of ['pointerdown','pointerup','pointercancel','touchstart','touchmove','touchend','wheel'])document.addEventListener(type,event=>{
    const point=event.touches?.[0]||event.changedTouches?.[0]||event;
    window.__inputLog.push({type,x:point.clientX,y:point.clientY,scrollY,deltaX:event.deltaX,deltaY:event.deltaY,shift:event.shiftKey,cancelable:event.cancelable,prevented:event.defaultPrevented,target:event.target.tagName+'.'+event.target.className});
    if(window.__inputLog.length>100)window.__inputLog.shift();
   },{passive:true,capture:true});
   document.addEventListener('touchmove',event=>{
    const point=event.touches[0];window.__inputLog.push({type:'touchmove:after',x:point?.clientX,y:point?.clientY,scrollY,cancelable:event.cancelable,prevented:event.defaultPrevented});
    if(window.__inputLog.length>100)window.__inputLog.shift();
   },{passive:true});
  });
  let pending;
  page.on('pageerror',error=>errors.push(error.message));
  const config=mode==='native'?'':`window.codelaSfVendors={embla:'/vendor.js?ver=fixture-v8'};`;
  const body=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css} body{margin:0;font-family:Arial,sans-serif}.spacer{height:1200px}</style><script>${media}</script><noscript><style>img[data-sf-media-src]{display:none!important}picture:has(>img[data-sf-media-src]){display:none!important}</style></noscript></head><body class="home"><main class="sf-content">${single?fixture.single:wheel?fixture.wheel:fixture.hero}<div class="spacer"></div>${fixture.promo}${fixture.category}<div class="woocommerce-product-gallery sf-ui-gallery"><div class="woocommerce-product-gallery__wrapper"><a href="#product">Product gallery is not a section gallery</a></div></div></main><script>window.__engines=[];window.__created=0;window.__destroyed=0;window.__intents=[];document.addEventListener('codela:media-intent',e=>window.__intents.push(e.target.getAttribute('aria-label')));${config}</script><script src="/gallery.js"></script></body></html>`;
  await page.route('https://showcase.test/**',async route=>{
   const path=new URL(route.request().url()).pathname;requests.push(path);
   if(path==='/')return route.fulfill({contentType:'text/html',body});
   if(path==='/gallery.js')return route.fulfill({contentType:'text/javascript',body:source});
   if(path==='/vendor-core.js')return route.fulfill({contentType:'text/javascript',body:vendor});
   if(path==='/vendor.js'){
    if(mode==='fail')return route.abort('failed');
    if(mode==='deferred'){pending=route;return;}
    return route.fulfill({contentType:'text/javascript',body:mode==='constructor-fail'?'export default function(){window.__constructorAttempted=true;throw new Error("fixture constructor failure");}':wrapVendor});
   }
   return route.fulfill({contentType:'image/svg+xml',body:svg});
  });
  await page.goto('https://showcase.test/',{waitUntil:'domcontentloaded'});
  if(javaScriptEnabled&&!single){
   await page.waitForSelector('.sf-section--hero[data-sf-gallery-ready="1"]');
   if(mode==='embla')await page.waitForSelector('.sf-section--hero[data-sf-gallery-engine="embla"]');
  }
  const firstImage=await page.locator('.sf-section--hero picture img').first().elementHandle();
  // decode() can remain pending in a failing browser. A finite load/dimension
  // check is sufficient here; screenshot/geometry checks remain independent.
  await page.waitForFunction(image=>image.complete&&image.naturalWidth>0,firstImage,{timeout:10000});
  const release=async({fail=false}={})=>{assert(pending,'Deferred import request was made');const route=pending;pending=null;await route.fulfill({contentType:'text/javascript',body:fail?'export default function(){window.__constructorAttempted=true;throw new Error("fixture constructor failure");}':wrapVendor});};
  return{page,context,info,requests,errors,release,close:async()=>{assert.deepEqual(errors,[]);await bounded(context.close(),8000,'Close '+browserName+' '+info.phase+' context');active.delete(entry);}};
 };
 const diagnose=async({page,info,requests,errors},index)=>{
  try{
   const state=await bounded(page.evaluate(()=>{
    const section=document.querySelector('.sf-section--hero'),track=section?.querySelector('.sf-ui-gallery-track'),clip=section?.querySelector('.sf-gallery-viewport');
    const rect=element=>{if(!element)return null;const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    const style=element=>{if(!element)return null;const s=getComputedStyle(element);return {transform:s.transform,overflowX:s.overflowX,overflowY:s.overflowY,snap:s.scrollSnapType,touchAction:s.touchAction};};
    let engine=null;try{const api=window.__engines?.at(-1);if(api)engine={selected:api.selectedScrollSnap(),progress:api.scrollProgress(),pointerDown:api.internalEngine().dragHandler.pointerDown()};}catch{}
    return {scrollX,scrollY,width:innerWidth,height:innerHeight,hero:rect(section),track:rect(track),clip:rect(clip),slides:[...section?.querySelectorAll('.sf-section-slide')||[]].map(rect),
     images:[...section?.querySelectorAll('picture img')||[]].map(image=>({src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,deferred:!!image.dataset.sfMediaSrc})),trackStyle:style(track),clipStyle:style(clip),nativeOffset:track?.scrollLeft,engineMode:section?.dataset.sfGalleryEngine,count:section?.querySelector('[data-gallery-count]')?.textContent,
     focus:document.activeElement?.tagName+'.'+document.activeElement?.className,created:window.__created,destroyed:window.__destroyed,engine,wheels:window.__wheelEvents||[],input:window.__inputLog||[]};
   }),5000,'Failure snapshot');
   fs.mkdirSync('qa',{recursive:true});const path=`qa/embla-failure-${browserName}-${index}`;
   fs.writeFileSync(path+'.json',JSON.stringify({browser:browserName,info,requests,errors,state},null,2));
   await page.screenshot({path:path+'.png',timeout:5000});
   console.error('Embla failure context',JSON.stringify({browser:browserName,info,errors,state:{...state,input:state.input.slice(-20)}}));
  }catch(error){console.error('Embla diagnostic capture failed',error.message);}
 };
 const hero=page=>page.locator('.sf-section--hero').first();
 const track=page=>hero(page).locator('.sf-ui-gallery-track');
 const waitCount=(page,value)=>page.waitForFunction(value=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent===value,value);
 const flush=async page=>{
  await page.evaluate(()=>{window.__emblaFramesReady=false;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__emblaFramesReady=true;}));});
  await page.waitForFunction(()=>window.__emblaFramesReady,null,{timeout:5000});
 };
 const geometry=page=>hero(page).evaluate(section=>{
  const selectors=['','.sf-section-slide','.sf-section-art','.sf-section-art img','.sf-section-copy','.sf-ui-button','[data-gallery-controls]'];
  return selectors.map(selector=>{const element=selector?section.querySelector(selector):section,rect=element.getBoundingClientRect();return {selector,x:rect.x,y:rect.y,width:rect.width,height:rect.height};});
 });
 const wheelState=page=>page.evaluate(()=>{
  const track=document.querySelector('.sf-section--hero .sf-ui-gallery-track');
  return {left:track.scrollLeft,scrollY,scrollX,count:document.querySelector('.sf-section--hero [data-gallery-count]').textContent};
 });
 const settledWheel=async(page,before)=>{
  await page.waitForFunction(before=>{
   const track=document.querySelector('.sf-section--hero .sf-ui-gallery-track');
   const left=track.scrollLeft,count=document.querySelector('.sf-section--hero [data-gallery-count]').textContent;
   const signature=[left,scrollY,scrollX,count].join('|'),now=performance.now();
   if(window.__stableWheel?.signature!==signature)window.__stableWheel={signature,since:now};
   const moved=Math.abs(left-before.left)>1||Math.abs(scrollY-before.scrollY)>1||Math.abs(scrollX-before.scrollX)>1;
   const snapped=Math.abs(left/track.clientWidth-Math.round(left/track.clientWidth))<.005;
   return moved&&snapped&&now-window.__stableWheel.since>=150;
  },before,{polling:25,timeout:10000});
  return wheelState(page);
 };
 const sameWheel=(expected,actual,label)=>{
  assert.equal(actual.count,expected.count,label+' count');
  for(const key of ['left','scrollY','scrollX'])assert(Math.abs(actual[key]-expected[key])<1,label+' '+key+': '+expected[key]+' / '+actual[key]);
 };
 const aligned=page=>page.waitForFunction(()=>{
  const section=document.querySelector('.sf-section--hero'),engine=window.__engines.at(-1);
  const selected=section.querySelectorAll('.sf-section-slide')[engine.selectedScrollSnap()].getBoundingClientRect();
  return Math.abs(selected.left-section.getBoundingClientRect().left)<.5;
 });
 try{
  for(const width of [320,390,700,701,1280]){
   stage('geometry-media-keyboard',{width});
   const native=await open({width,mode:'native'}),pilot=await open({width});
   await flush(native.page);await flush(pilot.page);
   const before=await geometry(native.page),after=await geometry(pilot.page);
   before.forEach((rect,index)=>['x','y','width','height'].forEach(key=>assert(Math.abs(rect[key]-after[index][key])<.5,`Unchanged ${rect.selector} ${key} at ${width}: ${rect[key]} / ${after[index][key]}`)));
   assert.equal(await track(pilot.page).locator(':scope > .sf-section-slide').count(),3,'No clones; original direct children retained');
   assert.equal(await track(pilot.page).evaluate(el=>getComputedStyle(el).scrollSnapType),'none','Embla exclusively owns movement');
   assert.equal(await hero(pilot.page).locator('img[fetchpriority=high][loading=eager]').count(),1,'Native priority image stays discoverable');
   assert.equal(await hero(pilot.page).getAttribute('aria-label'),'Featured collections','Existing accessible name retained');
   await pilot.page.waitForTimeout(120);
   assert(!pilot.requests.some(path=>/image-(12|13)(-|\.)/.test(path)),'Invisible slide images not fetched at mount');
   assert.equal(await pilot.page.locator('.sf-section--promo[data-sf-gallery-engine="native"]').count(),1,'Promo stays native in hero pilot');
   assert.equal(await pilot.page.locator('.woocommerce-product-gallery [data-sf-gallery-ready],.woocommerce-product-gallery .sf-gallery-viewport').count(),0,'Product gallery is untouched');
   assert.equal(await track(pilot.page).getAttribute('tabindex'),'-1','Moving transport is not in the sequential tab order');
   await pilot.page.keyboard.press('Tab');assert(await pilot.page.evaluate(()=>document.activeElement.classList.contains('sf-gallery-viewport')),'Keyboard focus stays on the fixed visible viewport');
   await track(pilot.page).focus();await pilot.page.keyboard.press('End');await waitCount(pilot.page,'03 / 03');await aligned(pilot.page);
   assert.equal(await hero(pilot.page).locator('.sf-hero-progress > .is-current').count(),1);
   assert.equal(await hero(pilot.page).locator('.sf-section-slide').nth(1).locator('img[data-sf-media-src]').count(),1,'Reduced-motion jump does not preload skipped slide');
   await pilot.page.keyboard.press('Home');await waitCount(pilot.page,'01 / 03');await aligned(pilot.page);
   await pilot.page.keyboard.press('ArrowRight');await waitCount(pilot.page,'02 / 03');await aligned(pilot.page);
   await pilot.page.keyboard.press('ArrowLeft');await waitCount(pilot.page,'01 / 03');await aligned(pilot.page);
   await hero(pilot.page).locator('.sf-section-slide .sf-ui-button').nth(2).focus();await waitCount(pilot.page,'03 / 03');await aligned(pilot.page);
   assert.equal(await pilot.page.evaluate(()=>window.__created),1);
   assert.equal(await pilot.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   if(process.env.SAVE_SCREENSHOT){fs.mkdirSync('qa',{recursive:true});await native.page.screenshot({path:`qa/embla-${browserName}-native-${width}.png`});await track(pilot.page).focus();await pilot.page.keyboard.press('Home');await aligned(pilot.page);await pilot.page.screenshot({path:`qa/embla-${browserName}-pilot-${width}.png`});}
   await native.close();await pilot.close();
  }
  for(const reducedMotion of ['reduce','no-preference']){
   stage('pointer-reversal-focus-resize',{reducedMotion});
   const test=await open({reducedMotion}),{page}=test;
   await track(page).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Home');await waitCount(page,'01 / 03');await aligned(page);
   // Real mouse drag, interrupted direction, and a second drag use Embla v8.
   await page.mouse.move(335,180);await page.mouse.down();await page.mouse.move(70,180,{steps:12});await flush(page);
   assert(await track(page).evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m41<-20),'Track follows pointer before release');
   await page.mouse.up();await waitCount(page,'02 / 03');await aligned(page);
   await page.mouse.move(65,180);await page.mouse.down();await page.mouse.move(340,180,{steps:12});await page.mouse.up();await waitCount(page,'01 / 03');await aligned(page);
   await hero(page).locator('.sf-section-slide .sf-ui-button').nth(2).focus();await waitCount(page,'03 / 03');await aligned(page);
   assert.equal(await hero(page).locator('.sf-gallery-viewport').evaluate(el=>el.scrollLeft),0,'Focused slide does not create a second native scroll offset');
   await track(page).focus();await page.keyboard.press('Home');await waitCount(page,'01 / 03');await aligned(page);
   await page.keyboard.press('End');await waitCount(page,'03 / 03');
   await page.emulateMedia({reducedMotion:'reduce'});await aligned(page);
   await page.setViewportSize({width:1280,height:900});await waitCount(page,'03 / 03');await aligned(page);
   await page.waitForTimeout(200);assert.equal(await hero(page).locator('[data-gallery-count]').textContent(),'03 / 03','No autoplay or looping');
   await test.close();
  }
  {
   const measurements=[];
   for(const mode of ['native','embla']){
    stage('desktop-mouse-comparison',{mode});
    const test=await open({width:1280,mode}),{page}=test;test.info.phase='desktop-mouse-comparison';
    await page.mouse.move(1050,180);await page.mouse.down();
    for(let i=1;i<=15;i++){await page.mouse.move(1050-820*i/15,180);await page.waitForTimeout(15);}
    await page.mouse.up();await flush(page);await page.waitForTimeout(250);
    if(mode==='embla'){await waitCount(page,'02 / 03');await aligned(page);}
    measurements.push(await hero(page).evaluate((section,mode)=>{
     const track=section.querySelector('.sf-ui-gallery-track');return {mode,count:section.querySelector('[data-gallery-count]').textContent,nativeOffset:track.scrollLeft,transform:getComputedStyle(track).transform};
    },mode));
    await test.close();
   }
   fs.mkdirSync('qa',{recursive:true});fs.writeFileSync(`qa/embla-${browserName}-mouse-comparison.json`,JSON.stringify({browser:browserName,viewport:{width:1280,height:900},gesture:{from:[1050,180],to:[230,180],samples:15},measurements},null,2));
   console.log('Desktop mouse comparison (one fixture, not adoption/performance evidence)',JSON.stringify({browser:browserName,measurements}));
  }
  if(browserName==='chromium')for(const gesture of ['vertical','horizontal']){
   stage('touch',{gesture});
   // Each genuine touch gesture starts in a fresh viewport. Momentum from a
   // completed vertical document swipe must not mask the next horizontal test.
   const test=await open(),{page}=test,cdp=await page.context().newCDPSession(page);test.info.phase='touch-'+gesture;
   const frame=await hero(page).boundingBox();assert(frame&&Math.abs(frame.y)<1,'Touch fixture starts at its actual hero frame');
   const x=gesture==='vertical'?frame.x+frame.width/2:frame.x+frame.width-60;
   const y=frame.y+(gesture==='vertical'?Math.min(380,frame.height*.65):Math.min(180,frame.height*.4));
   assert(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('.sf-section--hero'),{x,y}),'Touch begins on the rendered hero, not a stale page coordinate');
   const swipe=async(dx,dy)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/15,y:y+dy*i/15}]});await page.waitForTimeout(15);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   };
   if(gesture==='vertical'){await swipe(0,-260);await page.waitForFunction(()=>scrollY>60);}
   else{await swipe(-(frame.width-120),0);await waitCount(page,'02 / 03');await aligned(page);}
   await cdp.detach();await test.close();
  }
  for(const mode of ['native','fail','constructor-fail']){
   stage('native-fallback',{mode});
   const test=await open({mode}),{page}=test;
   await page.waitForTimeout(120);
   assert.equal(await hero(page).locator('.sf-gallery-viewport').count(),0,mode+' restores original DOM');
   assert.equal(await track(page).evaluate(el=>getComputedStyle(el).scrollSnapType),'x mandatory');
   await track(page).focus();await page.keyboard.press('End');await waitCount(page,'03 / 03');
   assert(await track(page).evaluate(el=>el.scrollLeft>el.clientWidth),mode+' native scrolling remains usable');
   await test.close();
  }
  // Native horizontal wheel is preserved by handing off before the first
  // default action, never by approximating a trackpad with discrete JS snaps.
  for(const shifted of [false,true])for(const focus of ['viewport','link']){
   stage('wheel-parity',{shifted,focus});
   const baseline=await open({mode:'native',wheel:true}),pilot=await open({wheel:true});let expected;
   for(const test of [baseline,pilot]){
    test.info.phase=`wheel-${shifted?'shift':'horizontal'}-${focus}`;stage('wheel-gesture',{mode:test.info.mode,shifted,focus});
    await track(test.page).focus();await test.page.keyboard.press('ArrowRight');await waitCount(test.page,'02 / 05');
    const focusTarget=focus==='link'?hero(test.page).locator('.sf-section-slide .sf-ui-button').nth(1):test===pilot?hero(test.page).locator('.sf-gallery-viewport'):track(test.page);
    await focusTarget.focus();
    await test.page.evaluate(()=>{
     const section=document.querySelector('.sf-section--hero'),track=section.querySelector('.sf-ui-gallery-track');
     window.__wheelParent=track.parentElement;
     window.__wantedWheelFocus=document.activeElement.classList.contains('sf-gallery-viewport')?track:document.activeElement;
     window.__wheelEvents=[];
     // Document bubble runs after the adapter's track capture listener, but
     // before wheel's default scroll. It proves the handoff is synchronous.
     document.addEventListener('wheel',event=>{
      const index=Number(section.querySelector('[data-gallery-count]').textContent.split('/')[0])-1;
      const selected=section.querySelectorAll('.sf-section-slide')[index],style=getComputedStyle(track);
      window.__wheelEvents.push({trusted:event.isTrusted,shift:event.shiftKey,prevented:event.defaultPrevented,deltaX:event.deltaX,deltaY:event.deltaY,
       engine:section.dataset.sfGalleryEngine,left:track.scrollLeft,width:track.clientWidth,selectedOffset:selected.getBoundingClientRect().left-track.getBoundingClientRect().left,
       transform:style.transform,overflow:style.overflowX,snap:style.scrollSnapType,sameParent:track.parentElement===window.__wheelParent,focus:document.activeElement===window.__wantedWheelFocus});
     },{passive:true});
    });
    const before=await wheelState(test.page);
    await test.page.mouse.move(200,180);
    if(shifted)await test.page.keyboard.down('Shift');
    await test.page.mouse.wheel(shifted?0:350,shifted?350:0);
    if(shifted)await test.page.keyboard.up('Shift');
    const actual=await settledWheel(test.page,before);
    if(test===baseline){
     expected=actual;
     if(!shifted){assert.equal(actual.count,'03 / 05');assert(Math.abs(actual.left-780)<1,'Unmodified native horizontal wheel advances exactly one slide');assert.equal(actual.scrollY,0);}
     // Shift+wheel is browser-specific: WebKit scrolls the document vertically
     // here. Preserve its measured native outcome rather than imposing Chrome.
     console.log('Native wheel oracle',JSON.stringify({browser:browserName,shifted,focus,before,expected}));
    }else sameWheel(expected,actual,'First genuine native/pilot wheel parity');
    const events=await test.page.evaluate(()=>window.__wheelEvents);assert.equal(events.length,1,'One real first wheel event');
    const event=events[0];assert.equal(Math.abs(event.deltaX)+Math.abs(event.deltaY),350,'The first native delta is neither duplicated nor rescaled');assert.equal(event.trusted,true);assert.equal(event.shift,shifted);assert.equal(event.prevented,false,'Native delta is not intercepted or synthesized');
    assert.equal(event.engine,'native');assert.equal(event.transform,'none');assert.equal(event.overflow,'auto');assert.equal(event.snap,'x mandatory');
    assert(Math.abs(event.left-event.width)<1,'Selected native offset is restored before default scroll');
    assert(Math.abs(event.selectedOffset)<1,'Selected slide is exactly aligned before default scroll');
    assert.equal(event.sameParent,true,'First wheel keeps the original event ancestry');assert.equal(event.focus,true,'Handoff retains viewport or nested CTA keyboard focus');
    assert(await test.page.evaluate(()=>document.activeElement===window.__wantedWheelFocus),'Focus remains after native wheel settles');
   }
   assert.equal(await hero(pilot.page).getAttribute('data-sf-gallery-engine'),'native');
   assert.equal(await pilot.page.evaluate(()=>window.__destroyed),1,'Wheel destroys the transform owner once');
   sameWheel(await wheelState(baseline.page),await wheelState(pilot.page),'Settled native/pilot wheel parity');
   await pilot.page.addScriptTag({content:source});await pilot.page.evaluate(()=>dispatchEvent(new Event('codela:route-committed')));
   assert.equal(await pilot.page.evaluate(()=>window.__created),1,'Wheel fallback is permanent until new DOM');
   const reversed=[];
   for(const test of [baseline,pilot]){
    const before=await wheelState(test.page),frame=await hero(test.page).boundingBox();
    await test.page.mouse.move(200,Math.min(180,frame.y+frame.height-30));
    await test.page.mouse.wheel(-350,0);reversed.push(await settledWheel(test.page,before));
   }
   sameWheel(reversed[0],reversed[1],'Reversed native/pilot wheel parity');
   await baseline.close();await pilot.close();
  }
  {
   stage('vertical-wheel');const test=await open();await test.page.mouse.move(200,180);await test.page.mouse.wheel(0,260);await test.page.waitForFunction(()=>scrollY>60);
   assert.equal(await hero(test.page).getAttribute('data-sf-gallery-engine'),'embla','Vertical wheel scrolls page without destroying pointer engine');await test.close();
  }
  stage('single-slide');const single=await open({single:true});assert(!single.requests.includes('/vendor.js'),'Single-slide hero never imports engine');assert.equal(await single.page.locator('.sf-section--hero [data-gallery-controls]').count(),0);await single.close();
  stage('no-script');const noScript=await open({javaScriptEnabled:false});assert(!noScript.requests.includes('/vendor.js'));assert.equal(await track(noScript.page).evaluate(el=>getComputedStyle(el).overflowX),'auto');assert.equal(await hero(noScript.page).locator('.sf-section-slide').count(),3);await noScript.close();
  {
   stage('router-disposal');const test=await open(),{page}=test;
   await page.evaluate(()=>{window.__oldHero=document.querySelector('.sf-section--hero');window.__oldTrack=window.__oldHero.querySelector('.sf-ui-gallery-track');});
   await page.locator('main').evaluate((main,html)=>{main.innerHTML=html;dispatchEvent(new Event('codela:route-committed'));},fixture.hero);
   await page.waitForFunction(()=>window.__created===2&&window.__destroyed===1);
   await page.addScriptTag({content:source});await page.evaluate(()=>{for(let i=0;i<5;i++)dispatchEvent(new Event('codela:route-committed'));});
   await flush(page);assert.equal(await page.evaluate(()=>window.__created),2,'Repeated route/script mounts are idempotent');
   assert.equal(await page.evaluate(()=>window.__destroyed),1,'Old instance destroyed exactly once');
   await page.evaluate(()=>window.__oldTrack.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true})));
   assert.equal(await page.evaluate(()=>window.__oldHero.querySelector('[data-gallery-count]').textContent),'01 / 03','Detached listeners disposed');
   assert.equal(await page.evaluate(()=>window.__oldHero.querySelectorAll('.sf-gallery-viewport').length),0,'Old DOM restored');
   await track(page).focus();await page.keyboard.press('ArrowRight');await waitCount(page,'02 / 03');
   await page.locator('main').evaluate(main=>main.replaceChildren());await page.waitForFunction(()=>window.__destroyed===2);
   await test.close();
  }
  for(const focus of ['viewport','link'])for(const fail of [false,true]){
   stage('deferred-focus',{focus,fail});
   const test=await open({mode:'deferred'}),{page}=test;
   await track(page).focus();await page.keyboard.press('End');await waitCount(page,'03 / 03');
   if(focus==='link')await hero(page).locator('.sf-section-slide .sf-ui-button').nth(2).focus();
   await page.evaluate(()=>window.__focusBeforeImport=document.activeElement);
   await test.release({fail});
   if(fail){await page.waitForFunction(()=>window.__constructorAttempted);assert.equal(await hero(page).getAttribute('data-sf-gallery-engine'),'native');}
   else{await page.waitForSelector('[data-sf-gallery-engine="embla"]');await aligned(page);}
   await waitCount(page,'03 / 03');
   assert(await page.evaluate(({fail,focus})=>!fail&&focus==='viewport'?document.activeElement.classList.contains('sf-gallery-viewport'):document.activeElement===window.__focusBeforeImport,{fail,focus}),'Delayed success/failure preserves the exact control or visible root focus');
   if(focus==='viewport'){await page.keyboard.press('Home');await waitCount(page,'01 / 03');if(!fail)await aligned(page);}
   else{await page.keyboard.press('ArrowLeft');assert.equal(await hero(page).locator('[data-gallery-count]').textContent(),'03 / 03','Gallery keys do not override nested CTA keys');}
   await test.close();
  }
  {
   stage('deferred-wheel');const test=await open({mode:'deferred'}),{page}=test;
   await track(page).focus();await page.keyboard.press('ArrowRight');await waitCount(page,'02 / 03');
   await page.mouse.move(200,180);await page.mouse.wheel(350,0);await waitCount(page,'03 / 03');
   await test.release();await page.waitForTimeout(120);
   assert.equal(await page.evaluate(()=>window.__created),0,'Late module cannot take over an active native wheel lifecycle');
   assert.equal(await hero(page).getAttribute('data-sf-gallery-engine'),'native');await test.close();
  }
  {
   stage('stale-import');const test=await open({mode:'deferred'}),{page}=test;
   await page.locator('main').evaluate((main,html)=>main.innerHTML=html,fixture.single);await flush(page);await test.release();await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>window.__created),0,'Stale import cannot mount a removed gallery');
   await page.locator('main').evaluate((main,html)=>main.innerHTML=html,fixture.hero);await page.waitForSelector('[data-sf-gallery-engine="embla"]');
   assert.equal(await page.evaluate(()=>window.__created),1,'Fresh router content mounts once after delayed import');
   await test.close();
  }
  stage('passed');console.log(browserName+' Embla hero: geometry/media isolation, real pointer/reversal, keyboard/focus, reduced-motion, resize, wheel/Shift+wheel/native/no-script/single fallback and router disposal passed.');
 }catch(error){const interrupted=lastStage;stage('failed',{message:error.message,interrupted});let index=0;for(const entry of active)await diagnose(entry,++index);throw error;}
 finally{
  try{await bounded(browser.close(),10000,'Close '+browserName+' browser');}
  catch(error){stage('browser-close-failed',{message:error.message});console.error(error);process.exit(1);}
  finally{clearTimeout(watchdog);}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
