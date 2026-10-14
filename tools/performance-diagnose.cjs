const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();const results=[];
 try{for(const variant of ['baseline','bounded'])for(let repeat=1;repeat<=3;repeat++){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 if(variant==='bounded')await context.route('**/assets/styles/gallery.css*',async route=>{
 const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\n.woocommerce div.product .sf-ui-gallery{height:var(--sf-gallery-height);overflow:hidden}\n'});});
 await context.addInitScript(()=>{
 window.__diag={frames:[],shifts:[],lcp:[]};let last='',stop=false;
 new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)__diag.shifts.push({t:e.startTime,value:e.value,sources:e.sources.map(s=>({class:s.node?.className,previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))});}).observe({type:'layout-shift',buffered:true});
 new PerformanceObserver(l=>{for(const e of l.getEntries())__diag.lcp.push({t:e.startTime,tag:e.element?.className});}).observe({type:'largest-contentful-paint',buffered:true});
 function frame(){
 const els=[...document.querySelectorAll('.woocommerce-product-gallery,.flex-viewport,.woocommerce-product-gallery__wrapper,.summary.entry-summary,.woocommerce-product-gallery__image')];
 const rects=els.map(e=>({class:e.className,y:e.offsetTop,h:e.offsetHeight,w:e.offsetWidth,display:getComputedStyle(e).display,opacity:getComputedStyle(e).opacity,inline:e.getAttribute('style')}));
 const key=JSON.stringify(rects);if(key!==last){__diag.frames.push({t:performance.now(),rects});last=key;}
 if(!stop)requestAnimationFrame(frame);
 }requestAnimationFrame(frame);addEventListener('load',()=>setTimeout(()=>{stop=true},2500));
 });
 const page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
 await page.goto('https://codela.dev/urun/demo-20-v-yaka-tisort-secki/',{waitUntil:'load'});await page.waitForTimeout(2800);
 const d=await page.evaluate(()=>({...__diag,images:[...document.querySelectorAll('.woocommerce-product-gallery img')].map(e=>({src:e.currentSrc,html:e.outerHTML})),resources:performance.getEntriesByType('resource').filter(e=>/\.(jpg|webp|avif|png)/.test(e.name)).map(e=>({url:e.name,bytes:e.transferSize,start:e.startTime}))}));
 d.variant=variant;d.repeat=repeat;results.push(d);console.log('CLS_DIAG '+JSON.stringify(d));await context.close();
 }}finally{fs.mkdirSync('qa/performance',{recursive:true});fs.writeFileSync('qa/performance/cls-diagnosis.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
