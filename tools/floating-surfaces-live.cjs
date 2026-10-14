// Read-only mobile WebKit regression: validate computed surface materials on live WordPress.
// Does not submit forms, alter cart state or mutate server content.
const {webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const pages=[
 {name:'home',url:'https://codela.dev/',selectors:['.sf-brand','.sf-header-menu .sf-menu-trigger','.sf-mobile-dock .sf-dock-surface']},
 {name:'product',url:'https://codela.dev/urun/demo-20-v-yaka-tisort-secki/',selectors:['.sf-brand','.sf-header-menu .sf-menu-trigger','.sf-header .sf-actions','.sf-product-purchase']},
];
const alpha=color=>{
 const parsed=color.match(/rgba?\(([^)]+)\)/);
 if(!parsed)return NaN;
 const values=parsed[1].split(/[\s,\/]+/).filter(Boolean);
 return values.length>=4?Number(values[3]):1;
};
(async()=>{
 const browser=await webkit.launch();
 const results=[];
 try{
  for(const check of pages){
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
   const page=await context.newPage();
   await page.goto(check.url,{waitUntil:'load',timeout:90000});
   const version=await page.locator('link[href*="styles/tokens.css"]').first().getAttribute('href');
   assert(version.includes('ver=0.1.81'),'Expected 0.1.81 CSS, got '+version);
   if(check.name==='product'){
     await page.evaluate(()=>{
       const tab=document.querySelector('.woocommerce-tabs');
       if(tab)window.scrollTo({top:Math.max(0,tab.getBoundingClientRect().top+scrollY-170),behavior:'instant'});
     });
   }
   const surfaces=[];
   for(const selector of check.selectors){
    const item=await page.locator(selector).first().evaluate(el=>{
      const s=getComputedStyle(el);const b=el.getBoundingClientRect();
      return {background:s.backgroundColor,image:s.backgroundImage,filter:s.webkitBackdropFilter||s.backdropFilter,shadow:s.boxShadow,bounds:{width:b.width,height:b.height},display:s.display};
    });
    const a=alpha(item.background);
    assert(Number.isFinite(a)&&a>=0.93,'Transparent '+selector+' on '+check.name+': '+JSON.stringify(item));
    assert.equal(item.image,'none','Stacked white material at '+selector);
    assert.notEqual(item.shadow,'none','No light-background separation at '+selector);
    assert(item.bounds.width>0&&item.bounds.height>0,'Missing visible surface at '+selector);
    surfaces.push({selector,alpha:a,...item});
   }
   if(check.name==='product'){
    const dock=await page.locator('.sf-shell > .sf-mobile-dock').evaluate(el=>getComputedStyle(el).display);
    assert.equal(dock,'none','No duplicate dock behind purchase bar');
   }
   fs.mkdirSync('qa/surfaces',{recursive:true});
   await page.screenshot({path:'qa/surfaces/'+check.name+'-webkit-390.png'});
   results.push({page:check.name,version,surfaces});
   console.log('SURFACE_WEBKIT '+JSON.stringify(results.at(-1)));
   await context.close();
  }
 }finally{
  fs.mkdirSync('qa/surfaces',{recursive:true});
  fs.writeFileSync('qa/surfaces/report.json',JSON.stringify(results,null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
