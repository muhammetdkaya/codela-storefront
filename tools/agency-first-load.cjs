const { chromium }=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_BIN||undefined,args:['--no-sandbox']});
try{
for(const profile of ['desktop','mobile']){
 const context=await browser.newContext(profile==='mobile'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}:{viewport:{width:1440,height:900}});
 await context.addInitScript(()=>{window.__agencyAudit={lcp:0,long:[]};try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__agencyAudit.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())window.__agencyAudit.long.push(e.duration)}).observe({type:'longtask',buffered:true})}catch{}});
 const page=await context.newPage();
 if(profile==='mobile'){const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})}
 await page.goto('https://codela.dev/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(3500);
 const data=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];const round=x=>Math.round(x||0);return {version:[...document.querySelectorAll('link[href]')].map(x=>x.href).find(x=>x.includes('agency.css'))||'',entryStart:round(performance.getEntriesByName('codela-entry-start')[0]?.startTime),entryRevealed:round(performance.getEntriesByName('codela-entry-revealed')[0]?.startTime),pendingEntryStyles:document.querySelectorAll('link[data-cdl-entry-css]').length,ttfb:round(n.responseStart),serverWait:round(n.responseStart-n.requestStart),dom:round(n.domContentLoadedEventEnd),fcp:round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime),lcp:round(window.__agencyAudit.lcp),longTasks:window.__agencyAudit.long.map(round),resources:performance.getEntriesByType('resource').map(e=>({name:e.name.split('?')[0],type:e.initiatorType,duration:round(e.duration),bytes:e.transferSize})).sort((a,b)=>b.duration-a.duration).slice(0,10)}});
 console.log('AGENCY_AUDIT '+profile+' '+JSON.stringify(data));
 await context.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
