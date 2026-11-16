/* Admin-only mobile debug: no implicit activation or network transmission. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const file='theme/codela-storefront/assets/scripts/interaction-diagnostics.js';
const source=fs.readFileSync(file,'utf8');
const browserType=process.env.TEST_WEBKIT?webkit:chromium;
(async()=>{
 const browser=await browserType.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://perf.test/**',route=>route.fulfill({contentType:'text/html',body:`
    <!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body><nav class="sf-mobile-dock"><div class="sf-dock-surface">
      <a href="#home" class="sf-dock-item" data-dock-view="home">Home</a>
      <a href="#search" class="sf-dock-item" data-dock-view="search">Search</a>
    </div></nav>
    <button data-panel="menu" id="menu">Menu</button>
    <dialog id="sf-panel"><button class="sf-close">Close</button></dialog>
    <input id="sensitive" value="SECRET-CUSTOMER-EMAIL"/>
    </body></html>`}));
  await page.goto('https://perf.test/');
  await page.addScriptTag({content:source});
  assert.equal(await page.locator('#sf-performance-debug').count(),0,'Disabled by default');
  assert.equal(await page.evaluate(()=>window.codelaSFDebug),undefined,'No public debug globals');
  await page.goto('https://perf.test/?codela_debug=1');
  await page.addScriptTag({content:source});
  await page.waitForSelector('#sf-performance-debug .sf-debug-toggle');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('codela-performance-debug')),'1','Explicit session opt-in');
  await page.locator('.sf-dock-item[data-dock-view="search"]').click();
  await page.locator('#menu').click();
  await page.evaluate(()=>{
    const dialog=document.querySelector('#sf-panel');
    dialog.showModal();
    window.codelaSFDebug.mark('overlay.open.begin',{panel:'menu',elapsed:12.345,ignored:'MY-PRIVATE-ID'});
    dialog.close();
  });
  await page.waitForTimeout(850);
  const data=await page.evaluate(()=>window.codelaSFDebug.report());
  assert.equal(data.tool,'codela-interaction-timing');
  assert(data.samples.some(x=>x.control==='dock.search'),'Dock timing sampled');
  assert(data.events.some(x=>x.type==='overlay.open.begin'),'Controller markers stored');
  assert(data.events.some(x=>x.type==='frames.summary'),'Frame spikes summarised');
  assert(data.events.some(x=>x.type==='dialog.state'),'Dialog state changes tracked');
  const json=JSON.stringify(data);
  assert(!/SECRET-CUSTOMER-EMAIL|MY-PRIVATE-ID|perf.test|https?:/.test(json),'PII and URL never leak into report');
  // A full document navigation must not discard the latest dock timings.
  await page.goto('https://perf.test/other/');
  await page.addScriptTag({content:source});
  await page.waitForSelector('#sf-performance-debug .sf-debug-toggle');
  const persisted=await page.evaluate(()=>window.codelaSFDebug.report());
  assert(persisted.pages>=2,'Timings persist across same-tab page loads');
  assert(persisted.events.some(x=>x.type==='overlay.open.begin'),'Whitelisted prior events restored');
  assert(persisted.samples.some(x=>x.control==='dock.search'),'Prior frame metrics survive navigation');
  await page.locator('.sf-debug-toggle').click();
  await page.evaluate(()=>{window.__copied=null;Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__copied=t;}},configurable:true});});
  await page.locator('[data-action="copy"]').click();
  await page.waitForFunction(()=>window.__copied!==null);
  assert((await page.evaluate(()=>window.__copied)).includes('codela-interaction-timing'),'Clipboard contains report');
  await page.locator('[data-action="clear"]').click();
  assert.equal(await page.evaluate(()=>window.codelaSFDebug.report().samples.length),0,'Clear resets samples');
  await page.locator('[data-action="stop"]').click();
  assert.equal(await page.locator('#sf-performance-debug').count(),0,'Stop removes UI');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('codela-performance-debug')),null,'Stop persists only a disabled flag');
  await page.goto('https://perf.test/?codela_debug=0');
  await page.addScriptTag({content:source});
  assert.equal(await page.locator('#sf-performance-debug').count(),0,'Explicit opt out');
  assert.deepEqual(errors,[]);
  console.log('Opt-in mobile diagnostics and privacy passed ('+(process.env.TEST_WEBKIT?'WebKit':'Chromium')+')');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
