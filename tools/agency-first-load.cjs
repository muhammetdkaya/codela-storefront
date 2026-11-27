const { chromium }=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_BIN||undefined,args:['--no-sandbox']});
const mobile=[];
try{
for(const profile of ['desktop','mobile']){
 for(let repeat=0;repeat<(profile==='mobile'?3:1);repeat++){
 const context=await browser.newContext(profile==='mobile'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}:{viewport:{width:1440,height:900}});
 await context.addInitScript(()=>{window.__agencyAudit={lcp:0,long:[],cls:0,clsWindow:0,clsFirst:0,clsLast:0};try{new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.hadRecentInput)continue;const a=window.__agencyAudit;if(!a.clsFirst||e.startTime-a.clsLast>1000||e.startTime-a.clsFirst>5000){a.clsFirst=e.startTime;a.clsWindow=0;}a.clsLast=e.startTime;a.clsWindow+=e.value;a.cls=Math.max(a.cls,a.clsWindow);}}).observe({type:'layout-shift',buffered:true});}catch{}try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__agencyAudit.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())window.__agencyAudit.long.push(e.duration)}).observe({type:'longtask',buffered:true})}catch{}});
 const page=await context.newPage();
 if(profile==='mobile'){const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})}
 const errors=[];page.on('pageerror',()=>errors.push('page error'));
 const response=await page.goto('https://codela.dev/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(3500);
 const data=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];const round=x=>Math.round(x||0);return {version:[...document.querySelectorAll('link[href]')].map(x=>x.href).find(x=>x.includes('agency.css'))||'',entryStart:round(performance.getEntriesByName('codela-entry-start')[0]?.startTime),entryHoldStart:round(performance.getEntriesByName('codela-entry-hold-start')[0]?.startTime),entryRevealed:round(performance.getEntriesByName('codela-entry-revealed')[0]?.startTime),ttfb:round(n.responseStart),serverWait:round(n.responseStart-n.requestStart),dom:round(n.domContentLoadedEventEnd),fcp:round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime),lcp:round(window.__agencyAudit.lcp),cls:window.__agencyAudit.cls,longTasks:window.__agencyAudit.long.map(round),resources:performance.getEntriesByType('resource').map(e=>({name:e.name.split('?')[0],type:e.initiatorType,duration:round(e.duration),bytes:e.transferSize})).sort((a,b)=>b.duration-a.duration).slice(0,10)}});
 data.status=response?.status()||0;data.errors=errors;
 console.log('AGENCY_AUDIT '+profile+' '+JSON.stringify(data));
 if(profile==='mobile')mobile.push(data);
 await context.close();
 }
}
const median=xs=>xs.slice().sort((a,b)=>a-b)[1];
if(mobile.length!==3||mobile.some(s=>s.status!==200||s.errors.length||s.lcp<=0||!Number.isFinite(s.cls)))throw Error('Incomplete agency performance samples');
const lcp=median(mobile.map(s=>s.lcp)),cls=median(mobile.map(s=>s.cls));
console.log('AGENCY_MOBILE_BUDGET '+JSON.stringify({lcp,cls,limits:{lcp:2500,cls:0.1}}));
if(lcp>2500||cls>0.1)throw Error('Agency cold mobile performance budget exceeded');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
