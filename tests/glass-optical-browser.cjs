'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base=fs.readFileSync('theme/codela-storefront/assets/styles/storefront-base.css','utf8');
const glass=fs.readFileSync('theme/codela-storefront/assets/styles/glass-v2.css','utf8');
const script='theme/codela-storefront/assets/scripts/glass-optical.js';
function fixture(agency=true){
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
   base+'\n'+glass+'</style></head><body class="sf-glass-v2 home"><div class="sf-shell">'+
   '<header class="sf-header"><nav class="sf-header-menu">'+
   '<button type="button" class="sf-ui-icon-button sf-ui-icon-button--soft sf-menu-trigger">Menu</button></nav>'+
   '<div class="sf-brand sf-ui-surface"><a href="/">CODELA</a></div>'+
   '<nav class="sf-actions sf-ui-surface"><button type="button">Search</button></nav></header>'+
   '<main>'+(agency?'<section class="sf-agency-widget sf-agency-widget--studio"></section>':'')+
   '</main></div></body></html>';
}
(async()=>{
 for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await driver.launch({headless:true});
  try{
   for(const width of [390,1280]){
    const page=await browser.newPage({viewport:{width,height:760}});
    await page.setContent(fixture());
    const before=await page.locator('.sf-brand').boundingBox();
    await page.addScriptTag({path:script});
    await page.waitForFunction(()=>document.body.classList.contains('sf-glass-optic-ready'));
    const result=await page.evaluate(()=>{
      const c=document.querySelector('.sf-glass-optical-canvas');
      const brand=document.querySelector('.sf-brand');
      const b=brand.getBoundingClientRect();
      const target=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
      const rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let painted=false;for(let i=3;i<rgba.length;i+=4){if(rgba[i]>0){painted=true;break}}
      return {w:c.width,h:c.height,painted,bg:getComputedStyle(brand).backgroundColor,
       pointer:getComputedStyle(c).pointerEvents,clickable:target===brand||brand.contains(target)};
    });
    assert(result.w>100&&result.h>25,engine+': canvas measured');
    assert(result.painted,engine+': optical material painted');
    assert.equal(result.pointer,'none',engine+': canvas never traps pointer');
    assert.equal(result.bg,'rgba(0, 0, 0, 0)',engine+': duplicate opaque fill cleared');
    assert(result.clickable,engine+': native brand remains interactive');
    const after=await page.locator('.sf-brand').boundingBox();
    assert(Math.abs(before.x-after.x)<.5&&Math.abs(before.y-after.y)<.5,engine+': placement unchanged');
    await page.close();
   }
   const page=await browser.newPage({viewport:{width:390,height:760}});
   await page.setContent(fixture(false));
   await page.addScriptTag({path:script});
   assert.equal(await page.locator('.sf-glass-optical-canvas').count(),0,engine+': non-agency keeps V2 CSS');
   await page.close();
   console.log(engine+': optical canvas, untouched hit targets and nonagency fallback OK');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exit(1)});
