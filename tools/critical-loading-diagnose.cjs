// Read-only, equal-content experiments against the live document. No writes.
const {chromium}=require('playwright');
const fs=require('node:fs');
const {liveProduct}=require('./live-product.cjs');
const attribute=(tag,name)=>tag.match(new RegExp('\\b'+name+'="([^"]*)"'))?.[1];
(async()=>{
 const browser=await chromium.launch();const results=[];
 const urls={home:'https://codela.dev/',product:(await liveProduct()).url};
 try{for(let repeat=1;repeat<=3;repeat++)for(const [pageName,url] of Object.entries(urls))for(const variant of ['baseline','priority','lean']){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await context.route('**/*',async route=>{
   const req=route.request();if(req.resourceType()!=='document')return route.continue();
   const response=await route.fetch();let body=await response.text();
   const hero=body.match(pageName==='home'?/<picture class="sf-section-art">[\s\S]*?<img\b[^>]*>/ : /<img\b[^>]*class="[^"]*wp-post-image[^>]*>/)?.[0].match(/<img\b[^>]*>/)?.[0];
   if(variant!=='baseline'&&hero){const src=attribute(hero,'src'),srcset=attribute(hero,'srcset'),sizes=attribute(hero,'sizes');body=body.replace('</title>','</title><link rel="preload" as="image" fetchpriority="high" href="'+src+'"'+(srcset?' imagesrcset="'+srcset+'"':'')+(sizes?' imagesizes="'+sizes+'"':'')+'>');}
   if(variant!=='baseline'){
    body=body.replace(/<(script|link)\b[^>]*>/g,tag=>{
     if(/rel="modulepreload"|type="module"/.test(tag)||/<script/.test(tag)&&/jquery|woocommerce\/assets\/js\//.test(tag))return tag.replace(/\sfetchpriority="[^"]*"/g,'').replace(/>$/,' fetchpriority="low">');
     return tag;
    });
   }
   if(variant==='lean')body=body.replace(/<script\b[^>]*src="[^"]*(?:flexslider|photoswipe)[^"]*"[^>]*><\/script>/g,'');
   await route.fulfill({response,body});
  });
  await context.addInitScript(()=>{window.__critical={lcp:[],cls:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>__critical.lcp.push({time:e.startTime,url:e.url}))).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)__critical.cls+=e.value})).observe({type:'layout-shift',buffered:true});});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
  await page.goto(url,{waitUntil:'load',timeout:90000});await page.waitForTimeout(2200);
  const sample=await page.evaluate(()=>({...__critical,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,resources:performance.getEntriesByType('resource').map(e=>({url:e.name,start:e.startTime,end:e.responseEnd,bytes:e.transferSize})),images:[...document.images].filter(e=>e.closest('.sf-section,.woocommerce-product-gallery')).slice(0,3).map(e=>({src:e.currentSrc,html:e.outerHTML})),navigation:performance.getEntriesByType('navigation')[0].toJSON()}));
  Object.assign(sample,{page:pageName,variant,repeat,errors});results.push(sample);console.log('CRITICAL_SAMPLE '+JSON.stringify({page:pageName,variant,repeat,lcp:sample.lcp.at(-1),cls:sample.cls,fcp:sample.fcp,errors}));await context.close();
 }}finally{fs.mkdirSync('qa/performance',{recursive:true});fs.writeFileSync('qa/performance/critical-loading.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
