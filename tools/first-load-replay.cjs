// Isolated replay of a consented public-site capture, never a live commerce test.
// SF_REPLAY_DIR: index.json maps request path+query to {file,type}; bodies are
// stored beside it. Nothing from the capture is committed or sent to GitHub.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const dir=process.env.SF_REPLAY_DIR,sourceOrigin=process.env.SF_REPLAY_ORIGIN||'https://azseramik.com';
assert(dir,'Set SF_REPLAY_DIR to the captured public resources');
const index=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
const theme=path.resolve('theme/codela-storefront'),prefix='/wp-content/themes/codela-storefront';
const captured=entry=>fs.readFileSync(path.join(dir,entry.file));
const registrations=JSON.parse(execFileSync(process.env.PHP_BIN||'php',['tests/asset-loading.php'],{encoding:'utf8',env:{...process.env,SF_ASSET_CONTEXT:'home',SF_ASSET_DEBUG:'0'}}));
const styleURLs=new Map([...registrations.styles.matchAll(/<link\b[^>]*id='([^']+)'[^>]*href='([^']+)'[^>]*>/g)].map(m=>[m[1],m[2].replace('https://store.test/theme',sourceOrigin+prefix)]));
const scriptURLs=new Map([...registrations.scripts.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*id="([^"]+)"[^>]*>/g)].map(m=>[m[2],m[1].replace('https://store.test/theme',sourceOrigin+prefix)]));
let origin;const missing=[];
function documentHTML(phase){
 let html=captured(index['/']).toString();
 if(phase==='candidate'){
  html=html.replace(/<link\b[^>]*>/g,tag=>{const id=tag.match(/\bid=['"]([^'"]+)['"]/)?.[1];if(!id?.startsWith('codela-storefront-')||!id.endsWith('-css'))return tag;return styleURLs.has(id)?tag.replace(/\bhref=['"][^'"]+['"]/,'href="'+styleURLs.get(id)+'"'):'';});
  html=html.replace(/<script\b[^>]*\bsrc=['"][^'"]+['"][^>]*><\/script>/g,tag=>{const id=tag.match(/\bid=['"]([^'"]+)['"]/)?.[1];if(!['codela-storefront-navigation-feedback-js','codela-storefront-document-continuity-js'].includes(id))return tag;return scriptURLs.has(id)?tag.replace(/\bsrc=['"][^'"]+['"]/,'src="'+scriptURLs.get(id)+'"'):'';});
  html=html.replace(/(<script\b[^>]*\bid=['"]sf-media-loading['"][^>]*>)[\s\S]*?<\/script>/,(_,tag)=>tag+fs.readFileSync(path.join(theme,'assets/scripts/media-loading.js'),'utf8')+'</script>');
 }
 return html.replaceAll(sourceOrigin,origin).replaceAll(sourceOrigin.replaceAll('/','\\/'),origin.replaceAll('/','\\/'));
}
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,origin),phase=req.headers['x-sf-fixture-phase']||'baseline';
 let body,type;
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 if(url.pathname==='/'){body=Buffer.from(documentHTML(phase));type='text/html; charset=UTF-8';}
 else if(phase==='candidate'&&url.pathname.startsWith(prefix+'/assets/')){
  const relative=url.pathname.slice(prefix.length+1),file=path.resolve(theme,relative);
  if(!file.startsWith(theme+path.sep)||!fs.existsSync(file)){missing.push(req.url);res.writeHead(404);res.end();return;}
  body=fs.readFileSync(file);type=file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':'image/svg+xml';
 }else{
  const entry=index[url.pathname+url.search];
  if(!entry){missing.push(req.url);res.writeHead(404);res.end();return;}
  body=captured(entry);type=entry.type;
 }
 const compress=/javascript|json|text\/|svg/.test(type),payload=compress?zlib.gzipSync(body):body;
 res.writeHead(200,{'Content-Type':type,'Content-Length':payload.length,'Cache-Control':'public, max-age=3600',...(compress?{'Content-Encoding':'gzip'}:{})});res.end(payload);
});
const geometry=()=>[...document.querySelectorAll('.sf-header,.sf-brand,.sf-mobile-dock,.sf-section--hero,.sf-section--hero .sf-section-copy,.sf-section--hero .sf-ui-button,.sf-section--categories,.sf-product-card')].map(e=>{
 const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,class:e.className,rect:[r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100),color:s.color,background:s.backgroundColor,font:s.font,fontSize:s.fontSize,border:s.border,borderRadius:s.borderRadius,display:s.display};
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}: {})});
 const samples=[],layouts={};fs.mkdirSync('qa/first-load',{recursive:true});
 try{
  for(const width of [390,1280])for(let repeat=0;repeat<(width===390?3:1);repeat++)for(const phase of repeat%2?['candidate','baseline']:['baseline','candidate']){
   const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:width===390?3:1,isMobile:width===390,hasTouch:width===390,extraHTTPHeaders:{'X-SF-Fixture-Phase':phase}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const cdp=await context.newCDPSession(page);
   await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8,connectionType:'cellular4g'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   await page.addInitScript(()=>{window.firstLoad={lcp:0,cls:0,blocking:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>firstLoad.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)firstLoad.cls+=e.value})).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>firstLoad.blocking+=Math.max(0,e.duration-50))).observe({type:'longtask',buffered:true});});
   await page.goto(origin+'/?phase='+phase,{waitUntil:'networkidle',timeout:45000});
   const sample=await page.evaluate(()=>({navigation:performance.getEntriesByType('navigation')[0].toJSON(),...firstLoad,resources:performance.getEntriesByType('resource').map(e=>e.toJSON())}));
   const summary={phase,width,repeat,requests:sample.resources.length,bytes:sample.navigation.transferSize+sample.resources.reduce((s,r)=>s+r.transferSize,0),lcp:Math.round(sample.lcp),cls:sample.cls,blocking:Math.round(sample.blocking)};
   samples.push(summary);console.log(JSON.stringify(summary));
   assert.deepEqual(errors,[],'No runtime errors in '+phase);
   assert.equal(sample.cls,0,'No layout shifts in '+phase);
   if(repeat===0){layouts[phase+width]=await page.evaluate(geometry);await page.screenshot({path:'qa/first-load/'+phase+'-'+width+'.png'});}
   await context.close();
  }
  assert.deepEqual(layouts.candidate390,layouts.baseline390,'Mobile geometry, typography, surfaces unchanged');
  assert.deepEqual(layouts.candidate1280,layouts.baseline1280,'Desktop geometry, typography, surfaces unchanged');
  assert.deepEqual([...new Set(missing)],[],'Replay must contain every requested resource');
  for(const width of [390,1280]){const before=samples.find(s=>s.width===width&&s.phase==='baseline'),after=samples.find(s=>s.width===width&&s.phase==='candidate');assert(before.requests-after.requests>=6,'Critical asset request reduction is visible in the browser');assert(after.bytes<before.bytes,'First-load transfer decreases');}
  fs.writeFileSync('qa/first-load/results.json',JSON.stringify({conditions:{latency:150,mbps:1.6,cpu:4,origin:'isolated local replay; excludes live server generation'},samples,geometryEqual:true},null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
