const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium',php=process.env.PHP_BIN||'php';
const fixture=name=>JSON.parse(execFileSync(php,['tests/section-priority.php'],{encoding:'utf8',env:{...process.env,SF_PRIORITY_CASE:name}}));
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;');
const styles=['styles/tokens.css','storefront.css','styles/components.css','styles/sections.css'].map(name=>fs.readFileSync('theme/codela-storefront/assets/'+name,'utf8')).join('\n');
(async()=>{const browser=await(engine==='webkit'?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{});try{
 fs.mkdirSync('qa/interaction',{recursive:true});const observations=[];
 for(const name of ['story','hero','promo','empty-first','disabled-first','text-first','text-card-first','mixed']){
  const data=fixture(name),critical=!['text-first','text-card-first','mixed'].includes(name);
  assert.equal((data.html.match(/fetchpriority="high"/g)||[]).length,critical?1:0,name+' has at most one early image');
  assert.equal(data.preloads.length,critical?2:0,name+' responsive preload pair');
  if(critical){assert.equal(data.preloads[0].media,'(max-width:700px)');assert.equal(data.preloads[1].media,'(min-width:701px)');assert(data.html.includes('loading="eager"'));}
 }
 const data=fixture('story');
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),requests=[];
  await page.route('https://priority.test/**',async route=>{
   const path=new URL(route.request().url()).pathname;requests.push(path);
   if(path==='/styles.css'){await new Promise(r=>setTimeout(r,300));return route.fulfill({contentType:'text/css',body:styles});}
   if(path.endsWith('.svg'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#d1c2b0"/></svg>'});
   const preloads=data.preloads.map(p=>'<link rel="preload" '+Object.entries(p).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')+'>').join('');
   return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${preloads}<link rel="stylesheet" href="/styles.css"></head><body><main class="sf-content"><div class="codela-page-layout">${data.html}</div></main></body></html>`});
  });
  await page.goto('https://priority.test/');
  const image=page.locator('.sf-section--story img').first();await image.evaluate(el=>el.decode());
  const photo=await image.evaluate(el=>({source:new URL(el.currentSrc).pathname,loading:el.loading,priority:el.fetchPriority,y:el.getBoundingClientRect().y,height:el.getBoundingClientRect().height}));
  assert.equal(photo.source,width<=700?'/image-11.svg':'/image-10.svg');assert.equal(photo.loading,'eager');
  assert(photo.y>=0&&photo.y<900&&photo.height>0,'First story image is on screen');
  assert.equal(requests.filter(p=>p===photo.source).length,1,'Preload and img share one request');
  const timings=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,start:r.startTime,end:r.responseEnd})));
  const picture=timings.find(r=>r.path===photo.source),css=timings.find(r=>r.path==='/styles.css');
  assert(picture.start<css.end,'Critical picture starts before CSS finishes');
  observations.push({width,...photo,imageStartMs:picture.start,cssEndMs:css.end});
  await page.screenshot({path:`qa/interaction/${engine}-story-${width}.png`});await page.close();
 }
 fs.writeFileSync(`qa/interaction/${engine}-section-priority.json`,JSON.stringify(observations,null,2));
 console.log('Section priority: 8 content orders, responsive preloads and early single image request at 390/1280 passed ('+engine+').');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
