// Read-only measurements of the CURRENT public Agency and Commerce sites.
// No login, form submissions, cart mutations, cache purge, or production deployment.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const OUT='qa/profile-performance';
const sites={agency:'https://codela.dev',commerce:'https://azseramik.com'};
const profiles=[
 {name:'desktop',viewport:{width:1280,height:900},cpu:1},
 {name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,cpu:4,latency:150,download:200000,upload:93750},
];
const report={date:new Date().toISOString(),source:process.env.GITHUB_SHA||null,method:'3 independent Chromium contexts per page/profile; first visit and same-context reload, mobile 4x CPU / 150ms added latency / 1.6Mbps down. No server cache purge. Current deployments only; not field CWV or physical Safari.',samples:[],errors:[],sites:{}};
fs.mkdirSync(OUT,{recursive:true});
const save=()=>fs.writeFileSync(OUT+'/results.json',JSON.stringify(report,null,2));
const safeOrigin=(url,origin)=>{const x=new URL(url,origin);assert.equal(x.origin,origin);return x.href;};
async function version(origin){
 const response=await fetch(origin+'/wp-content/themes/codela-storefront/style.css',{signal:AbortSignal.timeout(20000),cache:'no-store'});
 if(!response.ok)throw Error('Theme stylesheet HTTP '+response.status);
 const text=await response.text();
 const match=text.match(/^Version:\s*(\S+)/m);
 if(!match)throw Error('Theme version not found');
 return match[1];
}
async function product(origin){
 const response=await fetch(origin+'/wp-json/wc/store/v1/products?per_page=30',{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Public product discovery HTTP '+response.status);
 const products=await response.json();
 if(!Array.isArray(products))throw Error('Invalid Store API product list');
 const eligible=products.filter(p=>p.is_purchasable&&p.is_in_stock&&p.images?.length);
 const selected=eligible.find(p=>p.images.length>1)||eligible[0];
 if(!selected)throw Error('No published purchasable product with image');
 return safeOrigin(selected.permalink,origin);
}
async function instrument(context){
 await context.addInitScript(()=>{
  const metrics=window.__cdlAudit={lcp:null,shifts:[],tasks:[]};
  new PerformanceObserver(list=>{for(const e of list.getEntries())metrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)metrics.shifts.push([e.startTime,e.value]);}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())metrics.tasks.push([e.startTime,e.duration]);}).observe({type:'longtask',buffered:true});
 });
}
async function snapshot(page){return page.evaluate(()=>{
 const n=performance.getEntriesByType('navigation')[0],m=window.__cdlAudit;
 const resources=performance.getEntriesByType('resource');
 let cls=0,session=0,first=0,last=0;
 for(const [time,value] of m.shifts){if(time-last>1000||time-first>5000){session=0;first=time;}session+=value;last=time;cls=Math.max(cls,session);}
 const css=document.querySelector('link[href*="/assets/styles/storefront-base.css"],link[href*="/assets/styles/tokens.css"]');
 const themeVersion=css?new URL(css.href).searchParams.get('ver'):null;
 const own=resources.filter(e=>{try{return new URL(e.name).pathname.includes('/themes/codela-storefront/');}catch{return false;}});
 const count=regex=>own.filter(e=>regex.test(new URL(e.name).pathname)).length;
 const sum=(arr,key)=>arr.reduce((total,e)=>total+(e[key]||0),0);
 return {themeVersion,ttfb:n.responseStart,serverWait:n.responseStart-n.requestStart,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null,lcp:m.lcp,cls,
  domReady:n.domContentLoadedEventEnd,entryRevealed:performance.getEntriesByName('codela-entry-revealed')[0]?.startTime??null,
  longTaskBlocking:m.tasks.reduce((total,[,duration])=>total+Math.max(0,duration-50),0),
  requests:resources.length,transferBytes:n.transferSize+sum(resources,'transferSize'),themeRequests:own.length,themeTransferredBytes:sum(own,'transferSize'),themeJsDecodedBytes:sum(own.filter(e=>/\.js$/.test(new URL(e.name).pathname)),'decodedBodySize'),themeCssDecodedBytes:sum(own.filter(e=>/\.css$/.test(new URL(e.name).pathname)),'decodedBodySize'),themeJsFiles:count(/\.js$/),themeCssFiles:count(/\.css$/),cartReads:resources.filter(e=>/\/wc\/store\/v1\/cart(?:[/?]|$)/.test(e.name)).length,domNodes:document.querySelectorAll('*').length};
 });}
const median=values=>{const a=values.slice().sort((a,b)=>a-b);return a.length?a[Math.floor(a.length/2)]:null;};
function summarize(){
 const groups={};
 for(const sample of report.samples){const key=[sample.site,sample.page,sample.profile,sample.cache].join('/');(groups[key]??=[]).push(sample);}
 const summary={date:report.date,sites:report.sites,errors:report.errors,groups:{}};
 for(const [key,rows] of Object.entries(groups)){
  const valid=rows.filter(s=>s.status===200&&s.themeVersion&&Number.isFinite(s.lcp)&&Number.isFinite(s.cls)&&s.pageErrors===0);
  const versions=[...new Set(rows.map(s=>s.themeVersion))];
  const result={count:rows.length,valid:valid.length,versions,comparable:valid.length===3&&versions.length===1};
  for(const metric of ['ttfb','serverWait','fcp','lcp','cls','entryRevealed','longTaskBlocking','requests','transferBytes','themeRequests','themeTransferredBytes','themeJsDecodedBytes','themeCssDecodedBytes','cartReads'])result[metric]=median(valid.map(s=>s[metric]).filter(Number.isFinite));
  summary.groups[key]=result;
 }
 return summary;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 report.browser=browser.version();
 try{
  for(const [site,origin] of Object.entries(sites)){
   const meta=report.sites[site]={origin,startVersion:null,endVersion:null};
   try{meta.startVersion=await version(origin);}catch(e){report.errors.push({site,stage:'version-before',error:e.message});}
   const pages={home:origin+'/'};
   if(site==='agency')pages.services=origin+'/hizmetler/';
   else try{pages.product=await product(origin);}catch(e){report.errors.push({site,stage:'product-discovery',error:e.message});}
   for(const [name,url] of Object.entries(pages))for(const profile of profiles)for(let repeat=1;repeat<=3;repeat++){
    const {name:profileName,cpu,latency,download,upload,...options}=profile;
    const context=await browser.newContext(options);
    try{
     await instrument(context);
     const page=await context.newPage(),cdp=await context.newCDPSession(page);
     await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
     if(latency)await cdp.send('Network.emulateNetworkConditions',{offline:false,latency,downloadThroughput:download,uploadThroughput:upload});
     let pageErrors=0;page.on('pageerror',()=>pageErrors++);
     for(const cache of ['cold','warm']){
      pageErrors=0;
      try{
       const response=cache==='cold'?await page.goto(url,{waitUntil:'load',timeout:45000}):await page.reload({waitUntil:'load',timeout:45000});
       await page.waitForTimeout(2500);
       assert.equal(new URL(page.url()).origin,origin,'Unexpected document origin');
       const s={site,page:name,profile:profileName,cache,repeat,status:response?.status()??0,pageErrors,...await snapshot(page)};
       report.samples.push(s);console.log('PROFILE_SAMPLE '+JSON.stringify(s));save();
      }catch(e){report.errors.push({site,page:name,profile:profileName,cache,repeat,error:String(e.message).slice(0,300)});save();if(cache==='cold')break;}
     }
    }finally{await context.close();}
   }
   try{meta.endVersion=await version(origin);}catch(e){report.errors.push({site,stage:'version-after',error:e.message});}
   meta.versionStable=!!meta.startVersion&&meta.startVersion===meta.endVersion;
   save();
  }
 }finally{await browser.close();save();}
 const summary=summarize();fs.writeFileSync(OUT+'/summary.json',JSON.stringify(summary,null,2));console.log('PROFILE_SUMMARY '+JSON.stringify(summary));
 const incomplete=Object.keys(summary.groups).length!==16||Object.values(summary.groups).some(g=>!g.comparable)||Object.values(report.sites).some(s=>!s.versionStable)||report.errors.length;
 if(incomplete){console.error('Incomplete or mixed-version measurement; do not compare as a verified benchmark');process.exitCode=1;}
})().catch(e=>{console.error(e);save();process.exitCode=1;});
