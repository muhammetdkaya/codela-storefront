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
  assert.equal(data.session,'guest','Default unregistered browser is labeled guest');
  assert(data.events.some(x=>x.type==='input' && x.guest === true),
    'Guest flag is present in each sampled interaction');
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
  await page.goto('https://perf.test/?codela_debug=1');
  await page.addScriptTag({content:source});
  await page.waitForSelector('#sf-performance-debug');
  await page.evaluate(()=>document.body.classList.add('logged-in'));
  assert.equal(await page.evaluate(()=>window.codelaSFDebug.report().session),'signed-in',
    'Admin/customer comparison uses a coarse signed-in flag, never an account identifier');
  assert.deepEqual(errors,[]);
  // Exercise the exact opt-in script embedded by functions.php on guest pages,
  // rather than assuming an administrator is logged in.
  const php=fs.readFileSync('theme/codela-storefront/functions.php','utf8');
  const inline=php.match(/<script id="codela-storefront-guest-performance-optin">([\s\S]*?)<\/script>/);
  assert(inline,'Guest bootstrap emitted as a tiny, independent script');
  const guestScript=inline[1].replace(/<\?php[\s\S]*?\?>/,
    JSON.stringify('https://guest.test/assets/scripts/interaction-diagnostics.js'));
  assert(!guestScript.includes('<?php'),'PHP-generated script URL is syntactically replaced for the browser fixture');
  const guest=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  let loads=0;
  await guest.route('https://guest.test/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path.endsWith('/interaction-diagnostics.js')){
      loads++;
      return route.fulfill({contentType:'application/javascript',body:source});
    }
    return route.fulfill({contentType:'text/html',body:
      '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<script>'+guestScript+'</script></head><body>'+
      '<nav class="sf-mobile-dock"><div class="sf-dock-surface"><a class="sf-dock-item" data-dock-view="home" href="#home">Home</a></div></nav>'+
      '<button data-panel="menu">Menu</button><dialog id="sf-panel"></dialog></body></html>'});
  });
  await guest.goto('https://guest.test/');
  assert.equal(loads,0,'Ordinary guest browsing downloads no diagnostic JS');
  await guest.goto('https://guest.test/?codela_debug=1');
  await guest.locator('#sf-performance-debug').waitFor();
  assert.equal(loads,1,'Explicit guest opt-in loads diagnostic once');
  assert.equal(await guest.evaluate(()=>window.codelaSFDebug.report().session),'guest');
  await guest.goto('https://guest.test/catalog/');
  await guest.locator('#sf-performance-debug').waitFor();
  assert.equal(loads,2,'Guest trace continues across same-tab navigation without a query string');
  await guest.goto('https://guest.test/?codela_debug=0');
  assert.equal(await guest.locator('#sf-performance-debug').count(),0,'Guest opt-out disables the recorder');
  assert.equal(await guest.evaluate(()=>sessionStorage.getItem('codela-performance-debug')),null);
  await guest.goto('https://guest.test/catalog/');
  assert.equal(loads,2,'Opt-out prevents later guest pages from loading diagnostic JS');
  await guest.close();
  console.log('Opt-in mobile diagnostics and privacy passed ('+(process.env.TEST_WEBKIT?'WebKit':'Chromium')+')');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
