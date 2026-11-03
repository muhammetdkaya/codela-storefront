const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright'),{load}=require('./product-sheet-browser.cjs');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
(async()=>{const browser=await(engine==='webkit'?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{});try{
 const observations=[];
 for(const width of [320,390,700])for(const end of ['up','cancel','blur','resize']){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await load(page);await page.evaluate(()=>document.addEventListener('pointerdown',e=>window.gestureId=e.pointerId,{once:true,capture:true}));
  const header=await page.locator('.sf-product-sheet-header').boundingBox();
  await page.mouse.move(header.x+header.width/2,header.y+12);await page.mouse.down();
  const result=await page.evaluate(async({end})=>{
   const sheet=document.querySelector('.sf-product-sheet'),start=parseFloat(sheet.style.height),x=sheet.getBoundingClientRect().x+sheet.clientWidth/2,y=sheet.getBoundingClientRect().y+12;
   const records=[],observer=new MutationObserver(items=>records.push(...items));observer.observe(sheet,{attributes:true,attributeFilter:['style']});
   for(let i=1;i<=30;i++)window.dispatchEvent(new PointerEvent('pointermove',{pointerId:gestureId,clientX:x,clientY:y-i*3,bubbles:true,cancelable:true}));
   const immediate=observer.takeRecords().length;
   if(end==='up')window.dispatchEvent(new PointerEvent('pointerup',{pointerId:gestureId,bubbles:true}));
   if(end==='cancel')window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:gestureId,bubbles:true}));
   if(end==='blur')window.dispatchEvent(new Event('blur'));
   const released=parseFloat(sheet.style.height);
   if(end==='resize')await new Promise(requestAnimationFrame);
   await Promise.resolve();const writes=records.length+observer.takeRecords().length;observer.disconnect();
   return {immediate,writes,start,released,max:parseFloat(getComputedStyle(sheet).maxHeight),height:parseFloat(sheet.style.height),open:document.querySelector('.sf-product-sheet-toggle').getAttribute('aria-expanded')};
  },{end});
  assert.equal(result.immediate,0,'Thirty moves do not synchronously write layout');
  if(end==='resize'){
   assert.equal(result.writes,1,'A burst paints once in the next frame');
   assert(Math.abs(result.height-Math.min(result.max,result.start+90))<1,'Frame paints latest sample');
   await page.setViewportSize({width:1000,height:844});
   await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet'));
   assert.equal(await page.locator('.sf-product-sheet').count(),0,'Resize unmounts the sheet');
   assert.equal(await page.locator('form#native-cart').count(),1,'Native form restored once');
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  }else{
   assert(Math.abs(result.released-Math.min(result.max,result.start+90))<1,'Release flushes latest sample before snap');
   assert.equal(result.open,end==='up'?'true':'false','Cancel restores original state');
   await page.waitForFunction(()=>!document.querySelector('.sf-product-sheet').style.height);
   assert.equal(await page.locator('.is-dragging,.is-holding').count(),0,'No stuck drag classes');
  }
  await page.mouse.up();assert.deepEqual(errors,[]);observations.push({width,end,...result});await page.close();
 }
 fs.mkdirSync('qa/interaction',{recursive:true});fs.writeFileSync(`qa/interaction/${engine}-drag-frame.json`,JSON.stringify(observations,null,2));
 console.log('Mobile sheet: pointer bursts, last-sample release, cancellation/blur and resize at 3 widths passed ('+engine+').');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
