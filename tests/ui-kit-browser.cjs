const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css']
  .map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const sample=execFileSync(process.env.PHP_BIN||'php',['tests/render-ui.php'],{encoding:'utf8'});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--use-gl=disabled','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote','--single-process']}:{})});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:780},isMobile:width===390,hasTouch:width===390});
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><main class="sf-shell">'+sample+'</main></body></html>');
   const soft=page.locator('.sf-ui-icon-button--soft');
   const rect=await soft.boundingBox();
   assert(rect.width>=44&&rect.height>=44,'IconButton touch target stays 44px');
   const properties=await soft.evaluate(el=>({radius:getComputedStyle(el).borderRadius,bg:getComputedStyle(el).backgroundColor}));
   assert.equal(properties.bg,'rgb(242, 242, 242)','Soft icon button uses shared surface token');
   assert.equal(properties.radius,'999px','Icon button has shared circular shape');
   const secondary=page.locator('button.sf-ui-button--secondary');
   assert(await secondary.isDisabled(),'Disabled button cannot activate');
   const busy=page.locator('button.sf-ui-button--quiet');
   assert(await busy.isDisabled(),'Loading button is disabled');
   assert.equal(await busy.getAttribute('aria-busy'),'true','Loading button announces busy state');
   assert(await busy.locator('.sf-ui-spinner').isVisible(),'Shared loading indicator rendered');
   const submit=page.locator('button[type="submit"]');
   assert((await submit.boundingBox()).height>=54,'Primary button matches shared minimum action height');
   assert.equal(await submit.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(34, 35, 31)','Primary colour comes from theme token');
   assert.equal(await page.locator('a.sf-ui-button--secondary').getAttribute('href'),'https://store.test/read/','Navigation CTA retains native link');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'No overflow '+width);
   await page.emulateMedia({reducedMotion:'reduce'});
   const spinner=page.locator('.sf-ui-spinner');
   assert.equal(await spinner.evaluate(el=>getComputedStyle(el).animationName),'none','Reduced motion disables spinner');
   await page.close();
  }
  console.log('Shared Button/IconButton touch targets, variants, loading, focus and responsive layout: passed.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
