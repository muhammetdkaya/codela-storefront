const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {load}=require('./product-sheet-browser.cjs');
(async()=>{const browser=await chromium.launch();try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page);
 const cdp=await context.newCDPSession(page);
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:/End|Cancel/.test(type)?[]:[{x,y,id:1}]});
 await page.evaluate(()=>document.querySelector('.sf-product-discovery').scrollIntoView());
 await page.waitForFunction(()=>document.querySelector('.woocommerce-product-gallery').classList.contains('is-discovering'));
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight-innerHeight-60,behavior:'instant'}));
 const before=await page.locator('.sf-product-sheet').boundingBox();
 await touch('touchStart',180,360);await touch('touchMove',180,330);await touch('touchMove',180,270);await touch('touchMove',180,150);
 await page.waitForFunction(h=>document.querySelector('.sf-product-sheet').getBoundingClientRect().height>h+100,before.height);
 assert(await page.evaluate(()=>document.documentElement.scrollHeight-scrollY-innerHeight<3),'Same gesture consumes document tail');
 await touch('touchEnd');
 // Release MUST carry on from the finger's last paint without zeroing the
 // content or running a second, unsynchronised backdrop/handle transition.
 const release=await page.evaluate(()=>{
  const sheet=document.querySelector('.sf-product-sheet');
  const scrim=document.querySelector('.sf-product-sheet-scrim');
  const body=document.querySelector('.sf-product-sheet-body');
  const style=getComputedStyle(sheet);
  const min=parseFloat(style.getPropertyValue('--sf-product-closed-height'));
  const max=parseFloat(style.maxHeight);
  const height=sheet.getBoundingClientRect().height;
  const progress=(height-min)/(max-min);
  const y=Number(sheet.querySelector('.sf-product-sheet-handle path').getAttribute('d').match(/L14 ([0-9.]+)/)[1]);
  return {settling:sheet.classList.contains('is-settling'),visibility:getComputedStyle(body).visibility,
   bodyHeight:body.getBoundingClientRect().height,cssTransition:style.transitionDuration,
   height,progress,scrim:Number(getComputedStyle(scrim).opacity),midpoint:y};
 });
 assert.equal(release.settling,true,'Finger release starts a single JS settle, without removing the frozen body');
 assert.equal(release.visibility,'visible','Content survives the swipe-to-release handoff');
 assert(release.bodyHeight>0,'Content retains its full allocation while settling open');
 assert(Math.abs(release.scrim-release.progress)<.02,'Backdrop follows sheet progress on the same frame');
 assert(Math.abs(release.midpoint-(7+8*release.progress))<.08,'Handle follows the same progress');
 assert.equal(release.cssTransition,'0s','No conflicting CSS sheet transition during JS motion');
 await page.waitForTimeout(450);
 assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'true');
 // A real disclosure heading remains tappable; dragging it closes instead.
 const summary=page.locator('.sf-product-sheet-body details summary').first();
 await summary.tap();assert(await summary.evaluate(e=>e.parentElement.open));
 await page.evaluate(()=>{const body=document.querySelector('.sf-product-sheet-body');const extra=document.createElement('div');extra.id='handoff-content';extra.style.height='1800px';extra.textContent='Scrollable product details';body.prepend(extra);body.scrollTop=80;});
 const body=await page.locator('.sf-product-sheet-body').boundingBox();
 const full=await page.locator('.sf-product-sheet').boundingBox();
 await touch('touchStart',170,body.y+30);await touch('touchMove',170,body.y+90);await touch('touchMove',170,body.y+230);
 await page.waitForFunction(h=>document.querySelector('.sf-product-sheet').getBoundingClientRect().height<h-80,full.height);
 assert.equal(await page.locator('.sf-product-sheet-body').evaluate(e=>e.scrollTop),0);
 await touch('touchMove',170,body.y+450);await touch('touchEnd');
 const closing=await page.evaluate(()=>{
  const sheet=document.querySelector('.sf-product-sheet'),body=document.querySelector('.sf-product-sheet-body');
  return {settling:sheet.classList.contains('is-settling'),visibility:getComputedStyle(body).visibility,
   bodyHeight:body.getBoundingClientRect().height,headerPadding:getComputedStyle(sheet.querySelector('.sf-product-sheet-header')).paddingTop};
 });
 assert.equal(closing.settling,true,'Close keeps the same settling state as opening');
 assert.equal(closing.visibility,'visible','Closing never hides content before the edge reaches its resting height');
 assert(closing.bodyHeight>0,'Body geometry remains allocated through close easing');
 assert.equal(closing.headerPadding,'28px','Header padding never jumps between open and closed');
 await page.waitForTimeout(450);
 assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('.sf-product-sheet-body').evaluate(e=>getComputedStyle(e).visibility),'hidden','Compact resting sheet alone hides detail content');
 assert.equal(await page.locator('.sf-product-sheet').evaluate(e=>e.classList.contains('is-settling')),false,'Release finishes and removes its temporary layout lock');
 await page.locator('.sf-product-sheet-toggle').tap();await page.waitForTimeout(450);
 await page.evaluate(()=>document.querySelector('#handoff-content').remove());
 const label=await summary.boundingBox(),was=await summary.evaluate(e=>e.parentElement.open);
 await touch('touchStart',label.x+60,label.y+12);await touch('touchMove',label.x+60,label.y+180);await touch('touchMove',label.x+60,label.y+380);await touch('touchEnd');await page.waitForTimeout(450);
 assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'false');
 assert.equal(await summary.evaluate(e=>e.parentElement.open),was,'Drag release must not toggle disclosure');
 assert.equal(await page.locator('form#native-cart').count(),1);assert.deepEqual(errors,[]);
 console.log('Real touch: continuous footer handoff, content scroll handoff, disclosure tap/drag passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
