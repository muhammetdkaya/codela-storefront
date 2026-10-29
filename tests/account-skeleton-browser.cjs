// Production feedback/CSS: responsive destination layouts and cancellation.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/assets/';
const css=fs.readFileSync(root+'storefront.css','utf8')+['tokens','components','navigation','account','navigation-feedback'].map(x=>fs.readFileSync(root+'styles/'+x+'.css','utf8')).join('\n');
const script=fs.readFileSync(root+'scripts/navigation-feedback.js','utf8');
(async()=>{
 const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN}:{});
 let count=0;
 try{
 const page=await browser.newPage();
 await page.route('https://store.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>'}));
 await page.goto('https://store.test/');
 for(const width of [320,390,700,800,801,1280])for(const loggedIn of [false,true])for(const plain of [false,true]){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body class="${loggedIn?'logged-in':''}"><div class="sf-shell has-mobile-dock"><header class="sf-header"><div class="sf-brand sf-ui-surface">Codela</div></header><nav class="sf-mobile-dock"><div class="sf-dock-surface">Dock</div></nav></div><main id="sf-content"><section>Outgoing</section></main></body></html>`);
  const base=plain?'https://store.test/?page_id=8':'https://store.test/account/';
  await page.evaluate(base=>window.codelaSFDocument={account:base,accountLabel:'My account',backIcon:'<svg></svg>'},base);
  await page.addScriptTag({content:script});
  const original=await page.locator('.sf-brand').evaluate(el=>el.outerHTML);
  for(const endpoint of ['', 'orders', 'edit-account']){
   const url=plain?base+(endpoint?'&'+endpoint+'=1':''):base+(endpoint?endpoint+'/':'');
   await page.evaluate(url=>codelaSFFeedback.begin({url}),url);
   const mode=!loggedIn?'guest':endpoint?'endpoint':'dashboard';
   const layout=page.locator('.sf-skeleton-account--'+mode);
   assert(await layout.isVisible());
   const menu=page.locator('.sf-skeleton-account-menu'),content=page.locator('.sf-skeleton-account-content');
   const c=await content.boundingBox();
   assert(c.x>=0&&c.x+c.width<=width+1,'Content stays in viewport');
   if(loggedIn){
    if(width<=800&&endpoint)assert(!await menu.isVisible(),'Mobile endpoints omit menu');
    else{
     const m=await menu.boundingBox();
     if(width<=800)assert(c.y+c.height<=m.y,'Mobile dashboard summary precedes menu');
     else {assert.equal(Math.round(m.width),220);assert.equal(Math.round(c.x-m.x-m.width),32);}
    }
    if(endpoint){assert.equal((await page.locator('[data-sf-account-back]').innerText()).trim(),'');assert(await page.locator('[data-sf-account-back]').getAttribute('aria-label'));}
   }else assert.equal(await menu.count(),0,'Guest has form rather than account navigation');
   assert.equal(await layout.locator('input,button,a,form').count(),0,'Skeleton contains no active controls or private data');
   if(width===390||width===1280){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/account-skeleton-${width}-${loggedIn?'member':'guest'}-${endpoint||'dashboard'}-${process.env.TEST_WEBKIT?'webkit':'chromium'}.png`});}
   await page.evaluate(()=>codelaSFFeedback.end());
   assert.equal(await page.locator('.sf-brand').evaluate(el=>el.outerHTML),original,'Cancel restores exact header class and nodes');
   assert(!await page.locator('#sf-content section').evaluate(el=>el.inert));count++;
  }
 }
 console.log(`Account skeleton: ${count} responsive/auth/permalink/endpoint and cancellation cases passed.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
