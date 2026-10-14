const {chromium}=require('playwright');
const fs=require('node:fs');
const out='qa/performance';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true});const results=[];
try{for(let repeat=1;repeat<=3;repeat++){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
  window.__shifts=[];
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__shifts.push({time:e.startTime,value:e.value,sources:(e.sources||[]).map(s=>({node:s.node?.tagName,id:s.node?.id,class:s.node?.className,previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))});}).observe({type:'layout-shift',buffered:true});
 });
 const page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
 await page.goto('https://codela.dev/urun/demo-20-v-yaka-tisort-secki/',{waitUntil:'load'});await page.waitForTimeout(2000);
 const d=await page.evaluate(()=>({shifts:window.__shifts,hero:document.querySelector('img.wp-post-image')?.outerHTML,gallery:[...document.querySelectorAll('.woocommerce-product-gallery,.flex-viewport,.woocommerce-product-gallery__wrapper,.summary')].map(e=>({class:e.className,inline:e.getAttribute('style'),rect:e.getBoundingClientRect().toJSON(),css:{height:getComputedStyle(e).height,minHeight:getComputedStyle(e).minHeight,aspectRatio:getComputedStyle(e).aspectRatio,opacity:getComputedStyle(e).opacity}}))}));d.repeat=repeat;
 await page.locator('[data-panel="search"]:visible').first().click();await page.locator('#sf-panel[open]').waitFor();await page.locator('#sf-query').fill('tişört');await page.locator('#sf-results[aria-busy="true"]').waitFor();await page.locator('#sf-results[aria-busy="false"]').waitFor();
 await page.keyboard.press('Escape');await page.waitForTimeout(100);d.firstEscape=await page.evaluate(()=>({open:document.querySelector('#sf-panel').open,query:document.querySelector('#sf-query').value,focus:document.activeElement?.id}));
 if(d.firstEscape.open){await page.locator('.sf-search-cancel:visible').click();await page.locator('#sf-panel').waitFor({state:'hidden'});}d.closeButtonWorked=true;
 results.push(d);console.log('PERF_DIAGNOSE '+JSON.stringify(d));await page.screenshot({path:out+'/product-mobile-'+repeat+'.png'});await context.close();
}}finally{fs.writeFileSync(out+'/diagnosis.json',JSON.stringify(results,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
