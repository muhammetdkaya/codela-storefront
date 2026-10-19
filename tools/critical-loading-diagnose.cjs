// Read-only, equal-content experiments against the live document. No writes.
const {chromium}=require('playwright');
const fs=require('node:fs');
const {liveProduct}=require('./live-product.cjs');
const attribute=(tag,name)=>tag.match(new RegExp('\\b'+name+'="([^"]*)"'))?.[1];
(async()=>{
 const browser=await chromium.launch();const results=[];
 const urls={home:'https://codela.dev/',product:(await liveProduct()).url};
 try{for(let repeat=1;repeat<=3;repeat++)for(const [pageName,url] of Object.entries(urls))for(const variant of ['baseline','gated']){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await context.route('**/*',async route=>{
   const req=route.request();if(req.resourceType()!=='document')return route.continue();
   const response=await route.fetch();let body=await response.text();
   const hero=body.match(pageName==='home'?/<picture class="sf-section-art">[\s\S]*?<img\b[^>]*>/ : /<img\b[^>]*class="[^"]*wp-post-image[^>]*>/)?.[0].match(/<img\b[^>]*>/)?.[0];
   if(variant==='gated'){
    const defer=html=>html.replace(/<source\b[^>]*>/g,tag=>tag.replace(/\bsrcset=/g,'data-sf-media-srcset=')).replace(/<img\b[^>]*>/g,tag=>tag.replace(/\b(src|srcset|sizes)=/g,'data-sf-media-$1=').replace(/>$/,' src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%221200%22%20height=%22900%22/%3E">'));
    body=body.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/g,picture=>/loading="lazy"/.test(picture)?defer(picture):picture);
    body=body.replace(/<img\b[^>]*class="[^"]*attachment-woocommerce_thumbnail[^>]*>/g,tag=>/loading="lazy"/.test(tag)?defer(tag):tag);
    body=body.replace('</head>','<script>'+fs.readFileSync('theme/codela-storefront/assets/scripts/media-loading.js','utf8')+'</script></head>');
   }
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
