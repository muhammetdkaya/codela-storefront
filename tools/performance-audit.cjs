// Read-only lab audit of public storefront pages. No order, login or cart writes.
const {chromium}=require('playwright');
const fs=require('node:fs');
const OUT='qa/performance';fs.mkdirSync(OUT,{recursive:true});
const pages={home:'https://codela.dev/',product:'https://codela.dev/urun/demo-20-v-yaka-tisort-secki/'};
const profiles=[{name:'desktop',viewport:{width:1280,height:900},cpu:1},{name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,cpu:4,latency:150,download:1600000/8,upload:750000/8}];
const report={date:new Date().toISOString(),source:process.env.GITHUB_SHA,method:'Chromium on GitHub hosted Ubuntu; 3 independent contexts per page/profile; cold visit then same-context reload. Mobile 4x CPU, 150ms added latency, 1.6Mbps down/0.75Mbps up. Not physical Safari or field INP. HTTP cache only, no server cache purge.',samples:[],interactions:[]};
const save=()=>fs.writeFileSync(OUT+'/results.json',JSON.stringify(report,null,2));
const safe=u=>{try{const x=new URL(u);for(const k of [...x.searchParams.keys()])if(/nonce|token|key|auth/i.test(k))x.searchParams.set(k,'REDACTED');return x.href;}catch{return u;}};
async function instrument(context){await context.addInitScript(()=>{
  window.__audit={lcp:null,shifts:[],longTasks:[],events:[],click:null};
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__audit.lcp={startTime:e.startTime,size:e.size,url:e.url,tag:e.element?.tagName,element:e.element?.className};}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__audit.shifts.push({startTime:e.startTime,value:e.value});}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__audit.longTasks.push({startTime:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)window.__audit.events.push({name:e.name,startTime:e.startTime,duration:e.duration,processingStart:e.processingStart,processingEnd:e.processingEnd,interactionId:e.interactionId});}).observe({type:'event',buffered:true,durationThreshold:16});
  document.addEventListener('click',e=>{const target=e.target.closest('[data-panel],.sf-close');if(target)window.__audit.click={at:performance.now(),panel:target.dataset.panel||'close'};},true);
  document.addEventListener('DOMContentLoaded',()=>{const dialog=document.querySelector('#sf-panel');if(dialog)new MutationObserver(()=>{const c=window.__audit.click;if(c&&!c.paint&&dialog.open)requestAnimationFrame(()=>requestAnimationFrame(()=>{c.paint=performance.now()-c.at;}));}).observe(dialog,{attributes:true,attributeFilter:['open','class']});});
});}
async function snapshot(page){return page.evaluate(()=>{
  const n=performance.getEntriesByType('navigation')[0];const a=window.__audit;
  let cls=0,session=0,first=0,last=0;for(const s of a.shifts){if(s.startTime-last>1000||s.startTime-first>5000){session=0;first=s.startTime;}session+=s.value;last=s.startTime;cls=Math.max(cls,session);}
  const resources=performance.getEntriesByType('resource').map(e=>({url:e.name,type:e.initiatorType,start:e.startTime,duration:e.duration,ttfb:e.responseStart?e.responseStart-e.requestStart:null,transfer:e.transferSize,encoded:e.encodedBodySize,decoded:e.decodedBodySize}));
  const fcp=performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
  return {url:location.href,title:document.title,ttfb:n.responseStart,serverWait:n.responseStart-n.requestStart,domReady:n.domContentLoadedEventEnd,load:n.loadEventEnd,fcp,lcp:a.lcp,cls,longTasks:a.longTasks,blockingAfterFCP:a.longTasks.filter(e=>e.startTime>=(fcp||0)).reduce((s,e)=>s+Math.max(e.duration-50,0),0),htmlBytes:n.transferSize,resources,images:[...document.images].map(e=>({src:e.currentSrc,naturalWidth:e.naturalWidth,width:e.clientWidth,loading:e.loading,priority:e.fetchPriority})),themeVersion:document.querySelector('link[href*="styles/tokens.css"]')?.href,domNodes:document.querySelectorAll('*').length,
  hero:(()=>{const img=document.querySelector('.woocommerce-product-gallery__image img.wp-post-image');
    return img?{loading:img.loading,priority:img.fetchPriority,width:img.clientWidth}:null;})()};
});}
(async()=>{const browser=await chromium.launch({headless:true});report.browser=browser.version();
 try{for(const profile of profiles){for(const [name,url] of Object.entries(pages)){for(let repeat=1;repeat<=3;repeat++){
  const {cpu,latency,download,upload,name:profileName,...options}=profile;
  const context=await browser.newContext(options);await instrument(context);const page=await context.newPage();const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  if(latency)await cdp.send('Network.emulateNetworkConditions',{offline:false,latency,downloadThroughput:download,uploadThroughput:upload});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const cache of ['cold','warm']){
   const response=cache==='cold'?await page.goto(url,{waitUntil:'load',timeout:90000}):await page.reload({waitUntil:'load',timeout:90000});
   await page.waitForTimeout(2000);
   const sample=await snapshot(page);sample.profile=profileName;sample.page=name;sample.repeat=repeat;sample.cache=cache;sample.status=response.status();sample.errors=[...errors];
   const headers=await response.allHeaders();sample.headers=Object.fromEntries(['cache-control','age','content-encoding','server','x-litespeed-cache','x-cache','cf-cache-status','vary','server-timing'].filter(k=>headers[k]).map(k=>[k,headers[k]]));
   sample.resources=sample.resources.map(e=>({...e,url:safe(e.url)}));report.samples.push(sample);save();
   console.log('PERF_SAMPLE '+JSON.stringify({profile:profileName,page:name,repeat,cache,status:sample.status,ttfb:sample.ttfb,fcp:sample.fcp,lcp:sample.lcp?.startTime,cls:sample.cls,blocking:sample.blockingAfterFCP,requests:sample.resources.length,hero:sample.hero,cssVersion:sample.themeVersion,bytes:sample.htmlBytes+sample.resources.reduce((s,r)=>s+r.transfer,0),errors}));
  }
  // Three warm-page interaction samples per profile. Actual user click; empty cart.
  if(name==='home')for(const panel of ['menu','cart','search']){
   try{
    const trigger=page.locator('[data-panel="'+panel+'"]:visible').first();
    await trigger.click({timeout:10000});await page.locator('#sf-panel[open]').waitFor({timeout:10000});await page.waitForTimeout(600);
    const interaction=await page.evaluate(()=>({click:window.__audit.click,events:window.__audit.events.slice(-12),cartText:document.querySelector('#sf-cart-items')?.innerText}));
    interaction.profile=profileName;interaction.repeat=repeat;interaction.panel=panel;
    if(panel==='search'){
      const start=Date.now();await page.locator('#sf-query').fill('tişört');await page.locator('#sf-results[aria-busy="true"]').waitFor({timeout:10000});await page.locator('#sf-results[aria-busy="false"]').waitFor({timeout:30000});interaction.searchResultsWallMs=Date.now()-start;interaction.resultCount=await page.locator('#sf-results .sf-result').count();
      interaction.searchRequests=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.initiatorType==='fetch').map(r=>({url:r.name,start:r.startTime,duration:r.duration,transfer:r.transferSize})));interaction.searchRequests=interaction.searchRequests.map(r=>({...r,url:safe(r.url)}));
    }
    report.interactions.push(interaction);console.log('PERF_INTERACTION '+JSON.stringify(interaction));save();
     // Search Escape clears its query first; use the actual visible close button.
     if(panel==='search')await page.locator('#sf-panel button.sf-search-cancel:visible').click({timeout:10000});
     else await page.keyboard.press('Escape');
     await page.locator('#sf-panel').waitFor({state:'hidden',timeout:10000});
   }catch(e){report.interactions.push({profile:profileName,repeat,panel,error:e.message});save();console.log('PERF_INTERACTION_ERROR '+e.message);break;}
  }
  await context.close();
 }}}}finally{save();await browser.close();}
 console.log('PERF_RESULT '+JSON.stringify(report));
})().catch(e=>{console.error(e);save();process.exitCode=1;});
