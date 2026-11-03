/** Production native gallery acceptance against immutable, pre-pilot JS.
 * Real PHP/CSS/media and browser input. No gallery/scroll engine mock.
 * TEST_BROWSER=chromium|webkit|firefox; all three are required in CI.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium,firefox,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browserName=process.env.TEST_BROWSER||'chromium';
assert(['chromium','firefox','webkit'].includes(browserName),'TEST_BROWSER must be chromium, firefox or webkit');
const root='theme/codela-storefront/assets/',scriptPath=root+'scripts/gallery-horizontal.js';
const source=fs.readFileSync(scriptPath,'utf8');
const baselineCommit='687ef83e13621f6117264d04f220fa13c8836bb4';
const baselineSource=execFileSync('git',['show',baselineCommit+':'+scriptPath],{encoding:'utf8',timeout:10000});
const media=fs.readFileSync(root+'scripts/media-loading.js','utf8');
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/gallery.css','styles/sections.css'].map(path=>fs.readFileSync(root+path,'utf8')).join('\n');
const fixture=JSON.parse(execFileSync(process.env.PHP_BIN||'php',['tests/embla-showcase-fixture.php'],{encoding:'utf8',timeout:15000}));
const provenance={baselineCommit,baselineSha256:crypto.createHash('sha256').update(baselineSource).digest('hex'),candidateSha256:crypto.createHash('sha256').update(source).digest('hex')};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#cbbdad"/><circle cx="620" cy="440" r="230" fill="#e8dfcf"/></svg>';
const bounded=async(promise,milliseconds,label)=>{
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out after '+milliseconds+'ms')),milliseconds);})]);}
 finally{clearTimeout(timer);}
};
// evaluate() has no Playwright timeout. Every evaluation is synchronous and
// independently bounded; animation/load waits use finite waitForFunction calls.
const read=(target,fn,arg)=>bounded(target.evaluate(fn,arg),5000,'Browser state evaluation');
const pause=(page,ms)=>bounded(page.waitForTimeout(ms),ms+3000,'Browser settling pause');
// Script-disabled pages can suppress page rAF/timers. Poll synchronous browser
// observations from Node instead; a timeout remains a failure, never a skip.
const pollNode=async(observe,accept,label,timeout=10000)=>{
 const deadline=Date.now()+timeout;let state;
 do{state=await observe();if(accept(state))return state;await new Promise(resolve=>setTimeout(resolve,50));}while(Date.now()<deadline);
 throw new Error(label+' timed out; last state '+JSON.stringify(state));
};
const hero=page=>page.locator('.sf-section--hero').first();
const track=page=>hero(page).locator('.sf-ui-gallery-track');
const waitCount=(page,value)=>page.waitForFunction(value=>document.querySelector('.sf-section--hero [data-gallery-count]')?.textContent===value,value,{timeout:10000});
const flush=async page=>{
 await read(page,()=>{window.__nativeFramesReady=false;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__nativeFramesReady=true;}));});
 await page.waitForFunction(()=>window.__nativeFramesReady,null,{timeout:5000});
};
const aligned=page=>page.waitForFunction(()=>{
 const section=document.querySelector('.sf-section--hero'),track=section?.querySelector('.sf-ui-gallery-track');
 const index=Number(section?.querySelector('[data-gallery-count]')?.textContent.split('/')[0])-1;
 const item=track?.children[index];
 return item&&Math.abs(item.getBoundingClientRect().left-track.getBoundingClientRect().left)<.5;
},null,{timeout:10000});
const geometry=page=>read(hero(page),section=>{
 const selectors=['','.sf-section-slide','.sf-section-art','.sf-section-art img','.sf-section-copy','.sf-section-copy h1','.sf-section-copy p','.sf-ui-button','[data-gallery-controls]'];
 return selectors.map(selector=>{const element=selector?section.querySelector(selector):section,rect=element.getBoundingClientRect();return {selector,x:rect.x,y:rect.y,width:rect.width,height:rect.height};});
});
const mediaState=page=>read(hero(page),section=>[...section.querySelectorAll('picture source,picture img')].map(element=>({tag:element.tagName,attrs:Object.fromEntries(['src','srcset','sizes','media','loading','fetchpriority','decoding','width','height','data-sf-media-src','data-sf-media-srcset','data-sf-media-sizes'].map(key=>[key,element.getAttribute(key)]))})));
const scrollState=page=>read(page,()=>{
 const track=document.querySelector('.sf-section--hero .sf-ui-gallery-track');
 return {left:track.scrollLeft,scrollY,scrollX,count:document.querySelector('.sf-section--hero [data-gallery-count]').textContent};
});
const sameScroll=(expected,actual,label)=>{
 assert.equal(actual.count,expected.count,label+' count');
 for(const key of ['left','scrollY','scrollX'])assert(Math.abs(actual[key]-expected[key])<1,label+' '+key+': '+expected[key]+' / '+actual[key]);
};
// A genuine Shift+wheel may scroll vertically, horizontally, or not at all on
// a platform. Settling must allow every observable native outcome. Comparing
// the candidate with the baseline then catches a lost first delta without a
// false universal Shift expectation or a swallowed timeout.
const settleScroll=async page=>{
 await read(page,()=>{window.__nativeSettle={start:performance.now(),signature:null,since:performance.now()};});
 await page.waitForFunction(()=>{
  const track=document.querySelector('.sf-section--hero .sf-ui-gallery-track');
  const count=document.querySelector('.sf-section--hero [data-gallery-count]').textContent;
  const signature=[track.scrollLeft,scrollY,scrollX,count].join('|'),now=performance.now(),state=window.__nativeSettle;
  if(state.signature!==signature){state.signature=signature;state.since=now;}
  const snapped=Math.abs(track.scrollLeft/track.clientWidth-Math.round(track.scrollLeft/track.clientWidth))<.005;
  return snapped&&now-state.start>=400&&now-state.since>=180;
 },null,{polling:25,timeout:10000});
 return scrollState(page);
};
(async()=>{
 const started=Date.now(),active=new Set();let browser,lastStage=null;
 fs.mkdirSync('qa',{recursive:true});
 const prefix=`qa/native-showcase-${browserName}`;
 fs.writeFileSync(prefix+'-progress.ndjson','');
 const stage=(name,detail={})=>{
  const record={browser:browserName,stage:name,elapsed_ms:Date.now()-started,provenance,detail,active:[...active].map(entry=>entry.info)};
  lastStage=record;fs.writeFileSync(prefix+'-progress.json',JSON.stringify(record,null,2));fs.appendFileSync(prefix+'-progress.ndjson',JSON.stringify(record)+'\n');
  console.log('Native showcase stage',browserName,name,JSON.stringify(detail));
 };
 const diagnose=async({page,info,requests,errors},index)=>{
  if(!page)return;
  try{
   const state=await read(page,()=>{
    const section=document.querySelector('.sf-section--hero'),track=section?.querySelector('.sf-ui-gallery-track');
    const rect=element=>{if(!element)return null;const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    const style=element=>{if(!element)return null;const s=getComputedStyle(element);return {transform:s.transform,overflowX:s.overflowX,overflowY:s.overflowY,snap:s.scrollSnapType,touchAction:s.touchAction};};
    return {scrollX,scrollY,width:innerWidth,height:innerHeight,hero:rect(section),track:rect(track),slides:[...track?.children||[]].map(rect),trackStyle:style(track),nativeOffset:track?.scrollLeft,
     engineMode:section?.dataset.sfGalleryEngine,wrapperCount:document.querySelectorAll('.sf-gallery-viewport').length,count:section?.querySelector('[data-gallery-count]')?.textContent,
     images:[...section?.querySelectorAll('picture img')||[]].map(image=>({src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,deferred:!!image.dataset.sfMediaSrc})),
     focus:document.activeElement?.tagName+'.'+document.activeElement?.className,vendorConfigReads:window.__vendorConfigReads,wheelBefore:window.__wheelBefore,wheels:window.__wheelEvents||[],input:window.__inputLog||[],countChanges:window.__countChanges,routeScrollCalls:window.__routeScrollCalls};
   });
   const path=prefix+'-failure-'+index;
   fs.writeFileSync(path+'.json',JSON.stringify({browser:browserName,provenance,info,requests,errors,state},null,2));
   await bounded(page.screenshot({path:path+'.png',timeout:5000}),6000,'Failure screenshot');
   console.error('Native showcase failure context',JSON.stringify({browser:browserName,info,errors,state:{...state,input:state.input.slice(-20)}}));
  }catch(error){console.error('Native diagnostic capture failed',error.message);}
 };
 const watchdog=setTimeout(()=>{
  const interrupted=lastStage;stage('suite-timeout',{interrupted});
  const exit=setTimeout(()=>process.exit(1),10000);exit.unref();
  void(async()=>{try{let index=0;for(const entry of active)await diagnose(entry,++index);if(browser)await bounded(browser.close(),3000,'Watchdog browser close');}catch(error){console.error(error);}finally{process.exit(1);}})();
 },Number(process.env.NATIVE_TEST_TIMEOUT_MS||240000));
 const noVendor=test=>{
  assert(!test.requests.some(request=>/vendor|embla/i.test(request.url)),test.info.mode+' makes no vendor request');
  assert.deepEqual(test.unexpected,[],test.info.mode+' makes no unexpected network request');
 };
 const open=async({width=390,mode='candidate',reducedMotion='reduce',single=false,wheel=false,javaScriptEnabled=true,poison='value'}={})=>{
  const context=await bounded(browser.newContext({viewport:{width,height:900},hasTouch:true,reducedMotion,javaScriptEnabled}),15000,'Create browser context');
  const info={width,mode,reducedMotion,single,wheel,javaScriptEnabled,poison,phase:'open'};
  const requests=[],unexpected=[],errors=[],entry={context,page:null,info,requests,unexpected,errors};active.add(entry);
  context.setDefaultTimeout(10000);context.setDefaultNavigationTimeout(15000);
  const page=entry.page=await bounded(context.newPage(),10000,'Create browser page');
  await page.addInitScript(({poison})=>{
   window.__inputLog=[];window.__mediaIntents=[];window.__vendorConfigReads=0;
   if(poison==='throw')Object.defineProperty(window,'codelaSfVendors',{get(){window.__vendorConfigReads++;throw new Error('Native gallery read obsolete vendor configuration');}});
   else window.codelaSfVendors={embla:'https://vendor-poison.invalid/embla-must-not-load.js'};
   for(const type of ['pointerdown','pointerup','pointercancel','touchstart','touchmove','touchend','wheel'])document.addEventListener(type,event=>{
    const point=event.touches?.[0]||event.changedTouches?.[0]||event;
    window.__inputLog.push({type,x:point.clientX,y:point.clientY,scrollY,deltaX:event.deltaX,deltaY:event.deltaY,shift:event.shiftKey,cancelable:event.cancelable,prevented:event.defaultPrevented,target:event.target.tagName+'.'+event.target.className});
    if(window.__inputLog.length>100)window.__inputLog.shift();
   },{passive:true,capture:true});
   document.addEventListener('codela:media-intent',event=>window.__mediaIntents.push({section:event.target.closest('[data-sf-gallery]')?.className,index:[...event.target.parentElement.children].indexOf(event.target)}));
  },{poison});
  page.on('pageerror',error=>errors.push(error.message));
  const body=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css} body{margin:0;font-family:Arial,sans-serif}.spacer{height:1200px}</style><script>${media}</script><noscript><style>img[data-sf-media-src]{display:none!important}picture:has(>img[data-sf-media-src]){display:none!important}</style></noscript></head><body class="home"><main class="sf-content">${single?fixture.single:wheel?fixture.wheel:fixture.hero}<div class="spacer"></div>${fixture.promo}${fixture.category}<div class="woocommerce-product-gallery sf-ui-gallery"><div class="woocommerce-product-gallery__wrapper"><a href="#product">Product gallery is not a section gallery</a></div></div></main><script src="/gallery.js"></script></body></html>`;
  await page.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),path=url.pathname;requests.push({url:request.url(),type:request.resourceType()});
   if(url.origin==='https://showcase.test'){
    if(path==='/')return route.fulfill({contentType:'text/html',body});
    if(path==='/gallery.js')return route.fulfill({contentType:'text/javascript',body:mode==='baseline'?baselineSource:source});
    if(request.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:svg});
   }
   unexpected.push(request.url());return route.abort('failed');
  });
  await page.goto('https://showcase.test/',{waitUntil:'domcontentloaded'});
  if(javaScriptEnabled&&!single)await page.waitForSelector('.sf-section--hero[data-sf-gallery-ready="1"]');
  const firstImage=await hero(page).locator('picture img').first().elementHandle();
  if(javaScriptEnabled){
   await page.waitForFunction(image=>image.complete&&image.naturalWidth>0,firstImage,{timeout:10000});
   await flush(page);
  }else await pollNode(()=>read(firstImage,image=>({complete:image.complete,width:image.naturalWidth})),state=>state.complete&&state.width>0,'No-JS priority image');
  const test={...entry,page,close:async()=>{
   noVendor(test);assert.deepEqual(errors,[],info.phase+' has no page error');
   if(javaScriptEnabled)assert.equal(await read(page,()=>window.__vendorConfigReads),0,'Obsolete vendor configuration is not read');
   await bounded(context.close(),8000,'Close '+browserName+' '+info.phase+' context');active.delete(entry);
  }};
  return test;
 };
 const assertNative=async page=>{
  assert.equal(await page.locator('.sf-gallery-viewport,[data-sf-gallery-engine]').count(),0,'No transform wrapper or alternate engine mode');
  assert.deepEqual(await read(track(page),element=>({transform:getComputedStyle(element).transform,overflow:getComputedStyle(element).overflowX,snap:getComputedStyle(element).scrollSnapType,tabindex:element.getAttribute('tabindex'),direct:element.parentElement.classList.contains('sf-section--hero')})),{transform:'none',overflow:'auto',snap:'x mandatory',tabindex:'0',direct:true},'Original focusable native track and ancestry retained');
 };
 try{
  stage('launch');
  browser=await bounded(({chromium,firefox,webkit}[browserName]).launch(process.env.CHROMIUM_BIN&&browserName==='chromium'?{timeout:15000,executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{timeout:15000}),20000,'Launch '+browserName);
  for(const width of [320,390,700,701,900,901,1280,1440]){
   stage('geometry-media-keyboard',{width});
   const baseline=await open({width,mode:'baseline'}),candidate=await open({width});
   for(const test of [baseline,candidate])test.info.phase='geometry-media-keyboard';
   const before=await geometry(baseline.page),after=await geometry(candidate.page);
   before.forEach((rect,index)=>['x','y','width','height'].forEach(key=>assert(Math.abs(rect[key]-after[index][key])<.5,`Unchanged ${rect.selector} ${key} at ${width}: ${rect[key]} / ${after[index][key]}`)));
   const baselineMedia=await mediaState(baseline.page),candidateMedia=await mediaState(candidate.page);
   assert.deepEqual(candidateMedia,baselineMedia,'Image priority, lazy sources and responsive markup match native baseline');
   fs.writeFileSync(`${prefix}-geometry-${width}.json`,JSON.stringify({browser:browserName,width,provenance,baseline:before,candidate:after,baselineMedia,candidateMedia},null,2));
   for(const test of [baseline,candidate]){
    const {page}=test;await assertNative(page);
    assert.equal(await track(page).locator(':scope > .sf-section-slide').count(),3,'Three original direct slides, no clones');
    assert.equal(await hero(page).locator('img[fetchpriority=high][loading=eager]').count(),1,'Priority image remains discoverable');
    assert.equal(await hero(page).getAttribute('aria-label'),'Featured collections');
    await pause(page,120);
    assert(!test.requests.some(request=>/image-(12|13)(-|\.)/.test(request.url)),'Invisible hero/isolated below-fold images not fetched at mount');
    assert.equal(await page.locator('.woocommerce-product-gallery [data-sf-gallery-ready],.woocommerce-product-gallery .sf-gallery-viewport').count(),0,'Woo product gallery is untouched');
    await page.keyboard.press('Tab');assert(await read(page,()=>document.activeElement===document.querySelector('.sf-section--hero .sf-ui-gallery-track')),'Native track remains the first keyboard focus target');
    await page.keyboard.press('End');await waitCount(page,'03 / 03');await aligned(page);
    assert.equal(await hero(page).locator('.sf-hero-progress > .is-current').count(),1);
    assert.equal(await hero(page).locator('.sf-section-slide').nth(1).locator('img[data-sf-media-src]').count(),1,'Reduced-motion End does not preload the skipped slide');
    for(const [key,count] of [['Home','01 / 03'],['ArrowRight','02 / 03'],['ArrowLeft','01 / 03']]){await page.keyboard.press(key);await waitCount(page,count);await aligned(page);}
    await hero(page).locator('.sf-section-slide .sf-ui-button').nth(2).focus();await waitCount(page,'03 / 03');await aligned(page);
    const nested=await read(page,()=>{const event=new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true});document.activeElement.dispatchEvent(event);return event.defaultPrevented;});
    assert.equal(nested,false,'Gallery does not hijack a nested CTA key');
    assert.equal(await hero(page).locator('[data-gallery-count]').textContent(),'03 / 03');
    assert(await read(page,()=>document.documentElement.scrollWidth<=innerWidth+1),'No document horizontal overflow');
    if(process.env.SAVE_SCREENSHOT){await track(page).focus();await page.keyboard.press('Home');await aligned(page);await bounded(page.screenshot({path:`${prefix}-${test.info.mode}-${width}.png`,timeout:5000}),6000,'Geometry screenshot');}
   }
   await baseline.close();await candidate.close();
  }
  for(const reducedMotion of ['reduce','no-preference']){
   stage('reduced-motion-focus-resize',{reducedMotion});
   const states=[];
   for(const mode of ['baseline','candidate']){
    const test=await open({mode,reducedMotion}),{page}=test;test.info.phase='reduced-motion-focus-resize';
    await track(page).focus();await page.keyboard.press('ArrowRight');await waitCount(page,'02 / 03');await aligned(page);
    await page.keyboard.press('Home');await waitCount(page,'01 / 03');await aligned(page);
    await hero(page).locator('.sf-section-slide .sf-ui-button').nth(2).focus();await waitCount(page,'03 / 03');await aligned(page);
    await page.emulateMedia({reducedMotion:'reduce'});await track(page).focus();await page.keyboard.press('Home');await waitCount(page,'01 / 03');await aligned(page);
    await page.keyboard.press('End');await waitCount(page,'03 / 03');await aligned(page);
    await page.setViewportSize({width:1280,height:900});await waitCount(page,'03 / 03');await aligned(page);await pause(page,200);
    states.push(await scrollState(page));assert.equal(states.at(-1).count,'03 / 03','No autoplay or looping');
    await assertNative(page);await test.close();
   }
   sameScroll(states[0],states[1],'Reduced-motion preference change and resize parity');
  }
  const wheelEvidence=[];
  for(const shifted of [false,true])for(const focus of ['track','link']){
   stage('wheel-parity',{shifted,focus});const measurements=[];
   for(const mode of ['baseline','candidate']){
    const test=await open({mode,wheel:true}),{page}=test;test.info.phase=`wheel-${shifted?'shift':'horizontal'}-${focus}`;
    await track(page).focus();await page.keyboard.press('ArrowRight');await waitCount(page,'02 / 05');await aligned(page);
    await (focus==='link'?hero(page).locator('.sf-section-slide .sf-ui-button').nth(1):track(page)).focus();
    await read(page,()=>{
     const section=document.querySelector('.sf-section--hero'),track=section.querySelector('.sf-ui-gallery-track');
     window.__wheelParent=track.parentElement;window.__wantedWheelFocus=document.activeElement;window.__wheelEvents=[];
     document.addEventListener('wheel',event=>{
      const index=Number(section.querySelector('[data-gallery-count]').textContent.split('/')[0])-1,selected=track.children[index],style=getComputedStyle(track);
      window.__wheelEvents.push({phase:'passive-document-bubble',cancelable:event.cancelable,trusted:event.isTrusted,shift:event.shiftKey,prevented:event.defaultPrevented,deltaX:event.deltaX,deltaY:event.deltaY,left:track.scrollLeft,width:track.clientWidth,selectedOffset:selected.getBoundingClientRect().left-track.getBoundingClientRect().left,transform:style.transform,overflow:style.overflowX,snap:style.scrollSnapType,sameParent:track.parentElement===window.__wheelParent,focus:document.activeElement===window.__wantedWheelFocus});
     },{passive:true});
    });
    await page.mouse.move(200,180);
    if(shifted)await page.keyboard.down('Shift');
    const preInput=await read(page,()=>{
     const section=document.querySelector('.sf-section--hero'),track=section.querySelector('.sf-ui-gallery-track'),selected=track.children[1];
     return window.__wheelBefore={left:track.scrollLeft,width:track.clientWidth,selectedOffset:selected.getBoundingClientRect().left-track.getBoundingClientRect().left,scrollY,scrollX,count:section.querySelector('[data-gallery-count]').textContent,focus:document.activeElement===window.__wantedWheelFocus,sameParent:track.parentElement===window.__wheelParent};
    });
    assert.equal(preInput.count,'02 / 05');assert(Math.abs(preInput.left-preInput.width)<1,'Before input, native offset is exactly the second slide');
    assert(Math.abs(preInput.selectedOffset)<1,'Before input, selected slide is aligned');assert.equal(preInput.scrollY,0);assert.equal(preInput.scrollX,0);assert(preInput.focus&&preInput.sameParent);
    const before=await scrollState(page);
    await page.mouse.wheel(shifted?0:350,shifted?350:0);
    if(shifted)await page.keyboard.up('Shift');
    const first=await settleScroll(page),events=await read(page,()=>window.__wheelEvents);
    assert.equal(events.length,1,'Exactly one real first wheel event');const event=events[0];
    assert.equal(event.trusted,true);assert.equal(event.shift,shifted);assert.equal(event.prevented,false,'Native wheel delta is not intercepted');
    assert.equal(Math.abs(event.deltaX)+Math.abs(event.deltaY),350,'Native delta is not duplicated or rescaled');
    assert.equal(event.transform,'none');assert.equal(event.overflow,'auto');assert.equal(event.snap,'x mandatory');
    // A passive event may arrive after compositor scrolling (CI5 baseline:
    // left=741 at bubble, then780 settled). Offset/alignment are asserted above
    // before input; bubble geometry is diagnostic, not a pre-default barrier.
    assert.equal(event.sameParent,true);assert.equal(event.focus,true);
    assert(await read(page,()=>document.activeElement===window.__wantedWheelFocus),'Exact track/CTA focus survives first wheel');
    if(!shifted&&mode==='baseline')assert(first.left>before.left+50,'The real native horizontal baseline visibly consumes its first wheel delta');
    const frame=await hero(page).boundingBox(),y=Math.min(frame.y+frame.height-30,Math.max(30,frame.y+180));
    assert(y>0&&y<900,'Hero remains visible for reverse wheel');await page.mouse.move(200,y);await page.mouse.wheel(-350,0);
    const reverse=await settleScroll(page);
    assert(await read(page,()=>document.activeElement===window.__wantedWheelFocus),'Exact focus survives reverse wheel');
    await assertNative(page);measurements.push({mode,preInput,before,first,reverse,events:await read(page,()=>window.__wheelEvents)});await test.close();
   }
   sameScroll(measurements[0].first,measurements[1].first,'First native/candidate wheel parity');
   sameScroll(measurements[0].reverse,measurements[1].reverse,'Reverse native/candidate wheel parity');
   wheelEvidence.push({shifted,focus,measurements});
   fs.writeFileSync(prefix+'-wheel-parity.json',JSON.stringify({browser:browserName,provenance,measurements:wheelEvidence},null,2));
  }
  {
   stage('vertical-wheel');const outcomes=[];
   for(const mode of ['baseline','candidate']){
    const test=await open({mode}),{page}=test;test.info.phase='vertical-wheel';
    await page.mouse.move(200,180);await page.mouse.wheel(0,260);await page.waitForFunction(()=>scrollY>60,null,{timeout:10000});
    outcomes.push(await settleScroll(page));assert.equal(outcomes.at(-1).left,0,'Vertical wheel does not move the gallery');await test.close();
   }
   sameScroll(outcomes[0],outcomes[1],'Vertical document wheel parity');
  }
  if(browserName==='chromium')for(const gesture of ['vertical','horizontal']){
   const outcomes=[];
   for(const mode of ['baseline','candidate']){
    stage('genuine-touch',{gesture,mode});
    // Fresh contexts prevent vertical momentum from masking horizontal input.
    const test=await open({mode}),{page}=test;test.info.phase='touch-'+gesture;
    const cdp=await bounded(page.context().newCDPSession(page),5000,'Create touch CDP session');
    const frame=await hero(page).boundingBox();assert(frame&&Math.abs(frame.y)<1,'Touch starts at the actual initial hero frame');
    const x=gesture==='vertical'?frame.x+frame.width/2:frame.x+frame.width-60;
    const y=frame.y+(gesture==='vertical'?Math.min(380,frame.height*.65):Math.min(180,frame.height*.4));
    assert(await read(page,({x,y})=>!!document.elementFromPoint(x,y)?.closest('.sf-section--hero'),{x,y}),'Genuine touch begins on rendered hero');
    try{
     await bounded(cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]}),5000,'Touch start');
     const dx=gesture==='horizontal'?-(frame.width-120):0,dy=gesture==='vertical'?-260:0;
     for(let i=1;i<=15;i++){await bounded(cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/15,y:y+dy*i/15}]}),5000,'Touch move');await pause(page,15);}
     await bounded(cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}),5000,'Touch end');
     if(gesture==='vertical')await page.waitForFunction(()=>scrollY>60,null,{timeout:10000});
     else{await waitCount(page,'02 / 03');await aligned(page);}
     const state=await settleScroll(page);
     if(gesture==='vertical'){assert(state.scrollY>60);assert.equal(state.left,0,'Vertical swipe retains horizontal selection');}
     else{assert(Math.abs(state.left-390)<1,'Native horizontal touch lands on the next real slide');assert.equal(state.scrollY,0,'Horizontal swipe does not scroll the document');}
     const input=await read(page,()=>window.__inputLog);assert(input.some(event=>event.type==='touchstart')&&input.some(event=>event.type==='touchmove'),'Browser receives actual touch events');
     outcomes.push({mode,state,input});await assertNative(page);
    }finally{await bounded(cdp.detach(),5000,'Detach touch CDP session');}
    await test.close();
   }
   // Vertical momentum distance depends on input scheduling; compare direction
   // and ownership, not a fictitious identical inertial pixel distance.
   if(gesture==='horizontal')sameScroll(outcomes[0].state,outcomes[1].state,'Horizontal native touch parity');
   fs.writeFileSync(prefix+'-touch-'+gesture+'.json',JSON.stringify({browser:browserName,provenance,outcomes},null,2));
  }
  for(const poison of ['value','throw']){
   stage('vendor-config-ignored',{poison});const test=await open({poison});test.info.phase='vendor-config-ignored';
   await track(test.page).focus();await test.page.keyboard.press('End');await waitCount(test.page,'03 / 03');await aligned(test.page);await test.close();
  }
  {
   stage('single-slide');const test=await open({single:true});test.info.phase='single-slide';
   assert.equal(await hero(test.page).getAttribute('data-sf-gallery'),null,'Production single slide has no gallery marker');
   assert.equal(await hero(test.page).getAttribute('data-sf-gallery-ready'),null,'Single slide is not mounted');
   assert.equal(await hero(test.page).locator('[data-gallery-controls],.sf-gallery-viewport').count(),0);await test.close();
  }
  {
   stage('no-javascript');const test=await open({javaScriptEnabled:false});test.info.phase='no-javascript';
   assert.equal(await hero(test.page).getAttribute('data-sf-gallery-ready'),null);
   assert.equal(await read(track(test.page),element=>getComputedStyle(element).overflowX),'auto');
   assert.equal(await hero(test.page).locator('.sf-section-slide').count(),3);
   // Inspect real no-script layout, then use actual wheel input. No assigned
   // scrollLeft or page scheduling can manufacture a passing movement result.
   const layout=await read(hero(test.page),section=>{
    const image=section.querySelector('picture img'),heading=section.querySelector('h1'),imageRect=image.getBoundingClientRect(),headingRect=heading.getBoundingClientRect();
    return {image:{width:imageRect.width,height:imageRect.height,complete:image.complete,naturalWidth:image.naturalWidth},heading:{text:heading.textContent,width:headingRect.width,height:headingRect.height},overflow:document.documentElement.scrollWidth-innerWidth};
   });
   assert(layout.image.complete&&layout.image.naturalWidth>0&&layout.image.width>0&&layout.image.height>0,'No-JS priority image is loaded and laid out');
   assert(layout.heading.text.trim()&&layout.heading.width>0&&layout.heading.height>0,'No-JS caption remains readable');assert(layout.overflow<=1);
   const position=()=>read(track(test.page),element=>({left:element.scrollLeft,width:element.clientWidth,scrollY,scrollX,secondOffset:element.children[1].getBoundingClientRect().left-element.getBoundingClientRect().left}));
   const initial=await position();assert.equal(initial.left,0);assert.equal(initial.scrollY,0);
   const settleNoScript=async(target,label)=>{
    const started=Date.now();let signature,since=started;
    return pollNode(position,state=>{
     const next=JSON.stringify(state),now=Date.now();if(next!==signature){signature=next;since=now;}
     return Math.abs(state.left-target*state.width)<1&&now-started>=400&&now-since>=180;
    },label);
   };
   await test.page.mouse.move(200,180);await test.page.mouse.wheel(350,0);
   const moved=await settleNoScript(1,'No-JS native first wheel');assert(Math.abs(moved.secondOffset)<1);
   assert.equal(moved.scrollY,0);assert.equal(moved.scrollX,0);
   const revealed=await pollNode(()=>read(track(test.page),element=>[...element.children[1].querySelectorAll('picture img:not([data-sf-media-src])')].map(image=>{const rect=image.getBoundingClientRect();return {src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,width:rect.width,height:rect.height};}).find(image=>image.width>0&&image.height>0&&!image.src.startsWith('data:'))),image=>image?.complete&&image.naturalWidth>0,'No-JS revealed real image');
   await test.page.mouse.wheel(-350,0);await settleNoScript(0,'No-JS native reverse wheel');
   fs.writeFileSync(prefix+'-no-javascript.json',JSON.stringify({browser:browserName,provenance,layout,initial,moved,revealed,restored:await position()},null,2));
   assert.equal(await hero(test.page).locator('[data-gallery-controls]:visible').count(),0,'No-JS controls stay hidden');await test.close();
  }
  {
   stage('promo-category-isolation');const states=[];
   for(const mode of ['baseline','candidate']){
    const test=await open({mode}),{page}=test;test.info.phase='promo-category-isolation';
    const promo=page.locator('.sf-section--promo'),category=page.locator('.sf-categories--carousel');
    assert.equal(await promo.getAttribute('data-sf-gallery-ready'),'1');assert.equal(await category.getAttribute('data-sf-gallery-ready'),'1');
    const categoryState=element=>({count:element.querySelector('[data-gallery-count]').textContent,left:element.querySelector('.sf-ui-gallery-track').scrollLeft,items:[...element.querySelector('.sf-ui-gallery-track').children].map(item=>({tag:item.tagName,className:item.className,text:item.textContent}))});
    const before=await read(category,categoryState);
    await read(category,element=>{window.__isolatedCategory={section:element,track:element.querySelector('.sf-ui-gallery-track'),items:[...element.querySelector('.sf-ui-gallery-track').children]};});
    await promo.locator('[data-gallery-next]').click();
    await page.waitForFunction(()=>document.querySelector('.sf-section--promo [data-gallery-count]').textContent==='2 / 2',null,{timeout:10000});
    assert.equal(await hero(page).locator('[data-gallery-count]').textContent(),'01 / 03','Promo input does not advance hero');
    assert.deepEqual(await read(category,categoryState),before,'Promo input does not change the independent category gallery selection/structure');
    assert(await read(category,element=>{const original=window.__isolatedCategory,track=element.querySelector('.sf-ui-gallery-track');return element===original.section&&track===original.track&&[...track.children].every((item,index)=>item===original.items[index]);}),'Independent category retains its original nodes and native transport');
    await category.locator('.sf-ui-gallery-track').focus();await page.keyboard.press('End');
    await page.waitForFunction(()=>document.querySelector('.sf-categories--carousel .sf-ui-gallery-track').scrollLeft>1,null,{timeout:10000});await flush(page);
    // Category cards are narrower than the viewport. Compare the browser's
    // baseline End outcome rather than imposing hero full-width geometry.
    states.push(await read(page,()=>[...document.querySelectorAll('[data-sf-gallery]')].map(section=>({name:section.className,count:section.querySelector('[data-gallery-count]').textContent,left:section.querySelector('.sf-ui-gallery-track').scrollLeft}))));
    assert.equal(await hero(page).locator('[data-gallery-count]').textContent(),'01 / 03');await test.close();
   }
   assert.deepEqual(states[1],states[0],'Promo/category native behavior is unchanged');
  }
  {
   stage('counter-silent-reexecution');const test=await open(),{page}=test;test.info.phase='counter-silent-reexecution';
   await read(page,()=>{
    const track=document.querySelector('.sf-section--hero .sf-ui-gallery-track'),count=document.querySelector('.sf-section--hero [data-gallery-count]');
    window.__countChanges=0;window.__countObserver=new MutationObserver(records=>window.__countChanges+=records.length);window.__countObserver.observe(count,{childList:true,characterData:true,subtree:true});
    window.__routeScrollCalls=0;const original=track.scrollTo;track.scrollTo=function(...args){window.__routeScrollCalls++;return original.apply(this,args);};
   });
   for(let i=0;i<3;i++)await bounded(page.addScriptTag({content:source}),10000,'Reexecute native gallery script');
   await read(page,()=>{for(let i=0;i<5;i++){dispatchEvent(new Event('codela:route-committed'));document.querySelector('.sf-section--hero .sf-ui-gallery-track').dispatchEvent(new Event('scroll'));}dispatchEvent(new Event('resize'));});
   await flush(page);assert.equal(await read(page,()=>window.__countChanges),0,'Unchanged scroll/route/resize and script execution never rewrite live count');
   await track(page).focus();await page.keyboard.press('ArrowRight');await waitCount(page,'02 / 03');await aligned(page);await flush(page);
   assert.equal(await read(page,()=>window.__routeScrollCalls),1,'Repeated scripts/routes retain one real key handler');
   assert.equal(await read(page,()=>window.__countChanges),1,'One changed slide produces exactly one live-region mutation');
   await read(page,()=>{for(let i=0;i<5;i++)document.querySelector('.sf-section--hero .sf-ui-gallery-track').dispatchEvent(new Event('scroll'));});await flush(page);
   assert.equal(await read(page,()=>window.__countChanges),1,'Same settled slide does not announce again');await test.close();
  }
  for(const notifyRoute of [false,true]){
   stage('router-dom-replacement',{notifyRoute});const test=await open(),{page}=test;test.info.phase='router-dom-replacement';
   await read(page,()=>{
    window.__oldHero=document.querySelector('.sf-section--hero');window.__oldTrack=window.__oldHero.querySelector('.sf-ui-gallery-track');
    window.__oldPromo=document.querySelector('.sf-section--promo');window.__oldPromoTrack=window.__oldPromo.querySelector('.sf-ui-gallery-track');window.__oldCalls=0;
    for(const track of [window.__oldTrack,window.__oldPromoTrack]){const original=track.scrollTo;track.scrollTo=function(...args){window.__oldCalls++;return original.apply(this,args);};}
    window.__oldTrack.dispatchEvent(new Event('scroll'));
   });
   await read(page,({html,notifyRoute})=>{document.querySelector('main').innerHTML=html;if(notifyRoute)dispatchEvent(new Event('codela:route-committed'));},{html:fixture.hero+'<div class="spacer"></div>'+fixture.promo+fixture.category,notifyRoute});
   await page.waitForFunction(()=>!window.__oldHero.hasAttribute('data-sf-gallery-ready')&&!window.__oldPromo.hasAttribute('data-sf-gallery-ready')&&document.querySelector('.sf-section--hero')?.dataset.sfGalleryReady==='1',null,{timeout:10000});
   const old=await read(page,()=>{
    const key=new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true});window.__oldTrack.dispatchEvent(key);window.__oldTrack.dispatchEvent(new Event('scroll'));window.__oldPromo.querySelector('[data-gallery-next]').click();
    return {prevented:key.defaultPrevented,calls:window.__oldCalls,count:window.__oldHero.querySelector('[data-gallery-count]').textContent,controls:window.__oldHero.querySelector('[data-gallery-controls]').hidden,caption:window.__oldHero.style.getPropertyValue('--sf-hero-caption-height')};
   });
   assert.deepEqual(old,{prevented:false,calls:0,count:'01 / 03',controls:true,caption:''},'Detached tracks/controls are disposed and caption style is restored');
   await flush(page);assert.equal(await read(page,()=>window.__oldHero.querySelector('[data-gallery-count]').textContent),'01 / 03','Detached pending scroll cannot repaint');
   await page.setViewportSize({width:700,height:900});await flush(page);await page.setViewportSize({width:390,height:900});await flush(page);
   assert.deepEqual(await read(page,()=>({caption:window.__oldHero.style.getPropertyValue('--sf-hero-caption-height'),count:window.__oldHero.querySelector('[data-gallery-count]').textContent})),{caption:'',count:'01 / 03'},'Resize after removal never mutates stale caption or count');
   await bounded(page.addScriptTag({content:source}),10000,'Reexecute after DOM replacement');
   await track(page).focus();await page.keyboard.press('ArrowRight');await waitCount(page,'02 / 03');await aligned(page);
   // Replace only the transport inside a still-connected section, then change
   // its children. Reconciliation must notice identities, not just section ID.
   await read(page,()=>{window.__replacedTrack=document.querySelector('.sf-section--hero .sf-ui-gallery-track');window.__replacedTrack.replaceWith(window.__replacedTrack.cloneNode(true));});
   await flush(page);
   assert.equal(await read(page,()=>{const event=new KeyboardEvent('keydown',{key:'End',cancelable:true});window.__replacedTrack.dispatchEvent(event);return event.defaultPrevented;}),false,'Partial transport replacement disposes the previous listener');
   await track(page).focus();await page.keyboard.press('Home');await waitCount(page,'01 / 03');await page.keyboard.press('End');await waitCount(page,'03 / 03');await aligned(page);
   await read(page,()=>{const track=document.querySelector('.sf-section--hero .sf-ui-gallery-track');track.lastElementChild.remove();});
   await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent.endsWith(' / 02'),null,{timeout:10000});
   await track(page).focus();await page.keyboard.press('Home');await waitCount(page,'01 / 02');await aligned(page);
   await read(page,()=>{window.__lastHero=document.querySelector('.sf-section--hero');document.querySelector('main').replaceChildren();});
   await page.waitForFunction(()=>!window.__lastHero.hasAttribute('data-sf-gallery-ready'),null,{timeout:10000});
   await test.close();
  }
  stage('passed');
  console.log(browserName+' native showcase: immutable-baseline geometry/media/keyboard/focus, native first wheel/Shift/reverse parity, native touch (Chromium), isolated galleries, no vendor/no-JS/single, silent counts and router lifecycle passed.');
 }catch(error){const interrupted=lastStage;stage('failed',{message:error.message,interrupted});let index=0;for(const entry of active)await diagnose(entry,++index);throw error;}
 finally{
  try{
   for(const entry of active){try{await bounded(entry.context.close(),5000,'Final context close');}catch(error){console.error('Context teardown failed',error.message);}}
   if(browser)await bounded(browser.close(),10000,'Close '+browserName+' browser');
  }catch(error){stage('browser-close-failed',{message:error.message});console.error(error);process.exit(1);}
  finally{clearTimeout(watchdog);}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
