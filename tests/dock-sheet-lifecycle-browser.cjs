// Real browser DOM/capture/focus with production controllers and CSS. Only the
// dock dwell timers and stale focus callback delivery are controlled boundaries.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit,firefox}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {load}=require('./product-sheet-browser.cjs');
const root='theme/codela-storefront/';
const engine=process.env.TEST_WEBKIT?'webkit':process.env.TEST_FIREFOX?'firefox':'chromium';
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/components.css','assets/styles/navigation.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const dockSource=fs.readFileSync(process.env.DOCK_SOURCE||root+'assets/scripts/dock-controller.js','utf8').replace(/^export /gm,'');
(async()=>{const browser=await({chromium,webkit,firefox}[engine]).launch();try{
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [320,390,700]){
 await page.setViewportSize({width,height:844});await page.goto('about:blank');
 await page.setContent(`<style>${css}body{min-height:3000px}</style><div class="sf-shell"><nav class="sf-mobile-dock"><div class="sf-dock-surface">${['home','search','cart','account'].map(name=>`<button class="sf-dock-item" data-dock-view="${name}" ${name==='home'?'aria-current="page"':''}><span class="sf-icon"></span><span>${name}</span></button>`).join('')}</div><button class="sf-dock-handle"></button></nav><dialog id="sf-panel"></dialog></div>`);
 await page.addScriptTag({content:`
  const __timers=new Map();let __timerId=0;
  window.setTimeout=callback=>{const id=++__timerId;__timers.set(id,callback);return id;};
  window.clearTimeout=id=>__timers.delete(id);
  window.__pendingDockTimers=()=>__timers.size;
  ${dockSource}
  window.__dock=createDockController({getDialog:()=>document.querySelector('#sf-panel'),getCurrent:()=>null,open:()=>{throw new Error('Cancelled gesture activated a panel');},close:()=>{}});
  __dock.init(document.querySelector('#sf-panel'));
  document.querySelector('.sf-mobile-dock').addEventListener('pointerdown',event=>window.__pointerId=event.pointerId,{capture:true});
 `});
 const dock=page.locator('.sf-mobile-dock'),bounds=await dock.boundingBox();
 for(const kind of ['pointercancel','lostpointercapture']){
  await page.mouse.move(bounds.x+bounds.width/8,bounds.y+24);await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width*.65,bounds.y+24);
  assert(await dock.evaluate(el=>el.classList.contains('is-scrubbing')),'Native mouse capture starts a scrub '+width);
  await dock.evaluate((el,kind)=>el.dispatchEvent(new PointerEvent(kind,{pointerType:'mouse',pointerId:window.__pointerId+100,bubbles:true})),kind);
  assert(await dock.evaluate(el=>el.classList.contains('is-scrubbing')),kind+' ignores unrelated pointer '+width);
  await dock.evaluate((el,kind)=>el.dispatchEvent(new PointerEvent(kind,{pointerType:'mouse',pointerId:window.__pointerId,bubbles:true})),kind);
  assert(!(await dock.evaluate(el=>el.classList.contains('is-scrubbing'))),kind+' cancels active pointer '+width);
  await page.mouse.up();
 }
 const pending=await page.evaluate(async()=>{
  scrollTo(0,0);window.dispatchEvent(new Event('pageshow'));
  __dock.setDockCollapsed(true);__dock.setDockCollapsed(false);
  scrollTo(0,180);window.dispatchEvent(new Event('scroll'));
  await new Promise(requestAnimationFrame);return __pendingDockTimers();
 });
 assert.equal(pending,1,'Hide waits for dwell before breakpoint change '+width);
 await page.setViewportSize({width:701,height:844});
 await page.waitForFunction(()=>window.__pendingDockTimers()===0);
 assert(!(await dock.evaluate(el=>el.classList.contains('is-collapsed'))),'Queued mobile hide cancelled on desktop '+width);
 await page.setViewportSize({width,height:844});
 await page.evaluate(async()=>{scrollTo(0,182);window.dispatchEvent(new Event('scroll'));await new Promise(requestAnimationFrame);});
 assert(!(await dock.evaluate(el=>el.classList.contains('is-collapsed'))),'Returning mobile starts fresh scroll intent '+width);
}
for(const end of ['close','unmount']){
 await page.setViewportSize({width:390,height:844});await load(page,{variable:true});
 await page.evaluate(()=>{
  const input=document.querySelector('#color'),nativeFocus=input.focus.bind(input),nativeScroll=input.scrollIntoView.bind(input);
  window.__originalCart=document.querySelector('#native-cart');
  window.__staleFocusCalls=[];
  input.focus=options=>{__staleFocusCalls.push('focus');nativeFocus(options);};
  input.scrollIntoView=options=>{__staleFocusCalls.push('scroll');nativeScroll(options);};
  // Hold the exact production callback, including a delivery after cancellation.
  // Native visible-layout/focus behavior is still exercised when it is invoked.
  const nativeRAF=window.requestAnimationFrame;
  window.requestAnimationFrame=callback=>{window.__staleProductFocus=callback;return 1073741823;};
  input.dispatchEvent(new Event('invalid',{cancelable:true}));
  window.requestAnimationFrame=nativeRAF;
 });
 assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'true','Validation reveals original form');
 if(end==='close')await page.locator('.sf-product-sheet-toggle').evaluate(el=>el.click());
 else {await page.setViewportSize({width:701,height:844});await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet'));}
 const result=await page.evaluate(()=>{
  const owner=document.createElement('button');owner.id='current-focus-owner';owner.textContent='Current focus';document.body.append(owner);owner.focus({preventScroll:true});
  __staleProductFocus();return {calls:__staleFocusCalls,active:document.activeElement.id,forms:document.querySelectorAll('#native-cart').length,sameForm:document.querySelector('#native-cart')===__originalCart};
 });
 assert.deepEqual(result.calls,[],end+' blocks stale focus and scroll work');
 assert.equal(result.active,'current-focus-owner',end+' retains current native focus');
 assert.equal(result.forms,1,end+' preserves the one native Woo form');
 assert(result.sameForm,end+' preserves original form identity');
}
assert.deepEqual(errors,[]);console.log('Dock/sheet lifecycle passed ('+engine+'): native pointer capture identity, 3-width breakpoint dwell cancellation, stale focus close/unmount and one form.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1)});
