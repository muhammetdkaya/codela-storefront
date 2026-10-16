// Read-only mobile WebKit regression: validate computed surface materials on live WordPress.
// Does not submit forms, alter cart state or mutate server content.
const {webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {liveProduct}=require('./live-product.cjs');
const pages=[
 {name:'home',url:'https://codela.dev/',selectors:['.sf-brand','.sf-header-menu .sf-menu-trigger','.sf-mobile-dock .sf-dock-surface']},
 {name:'product-search',url:'https://codela.dev/?s=Demo&post_type=product',selectors:['.sf-brand','.sf-header-menu .sf-menu-trigger','.sf-mobile-dock .sf-dock-surface']},
 {name:'product',url:'https://codela.dev/urun/demo-20-v-yaka-tisort-secki/',selectors:['.sf-brand','.sf-header-menu .sf-menu-trigger','.sf-header .sf-cart-trigger','.sf-product-sheet']},
];
const alpha=color=>{
 const parsed=color.match(/rgba?\(([^)]+)\)/);
 if(!parsed)return NaN;
 const values=parsed[1].split(/[\s,\/]+/).filter(Boolean);
 return values.length>=4?Number(values[3]):1;
};
(async()=>{
 const product=await liveProduct();pages.find(p=>p.name==='product').url=product.url;pages.find(p=>p.name==='product-search').url='https://codela.dev/?s=&post_type=product';
 const browser=await webkit.launch();
 const results=[];
 try{
  for(const check of pages){
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
   const page=await context.newPage();
   await page.goto(check.url,{waitUntil:'load',timeout:90000});
   const version=await page.locator('link[href*="styles/tokens.css"]').first().getAttribute('href');
   const parts=new URL(version).searchParams.get('ver')?.split('.').map(Number);
   assert(parts?.length===3 && parts.every(Number.isInteger) && (parts[0]>0 || parts[1]>1 || parts[2]>=81),'Expected 0.1.81 or newer CSS, got '+version);
   if(check.name==='product'){
     await page.locator('.woocommerce-product-gallery__image a > img:not(.zoomImg)').first().evaluate(img=>img.decode());
     await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.woocommerce-product-gallery')).opacity)>.99);
     await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
     const edges=await page.evaluate(()=>{const images=[...document.querySelectorAll('.woocommerce-product-gallery__image')],first=images[0].querySelector('img').getBoundingClientRect(),sheet=document.querySelector('.sf-product-sheet').getBoundingClientRect();return{gap:Math.max(0,...images.slice(1).map((node,i)=>Math.abs(node.getBoundingClientRect().top-images[i].getBoundingClientRect().bottom))),covered:first.bottom>=sheet.top,owner:getComputedStyle(images[0].parentElement).overflowY,refresh:getComputedStyle(document.documentElement).overscrollBehaviorY};});
     assert(edges.gap<1&&edges.covered,'Live WebKit gapless photographs reach sheet: '+JSON.stringify(edges));assert.equal(edges.owner,'visible');assert.equal(edges.refresh,'auto');
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
    assert(parts[0]>0||parts[1]>1||parts[2]>=87,'Single cart surface requires87');
    const parity=await page.locator('.sf-header').evaluate(el=>{
     const read=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{width:r.width,height:r.height,background:s.backgroundColor,image:s.backgroundImage,border:s.borderTopWidth,radius:s.borderRadius,shadow:s.boxShadow,filter:s.webkitBackdropFilter||s.backdropFilter};};
     return{menu:read(el.querySelector('.sf-menu-trigger')),cart:read(el.querySelector('.sf-cart-trigger')),group:read(el.querySelector('.sf-actions'))};
    });
    assert.deepEqual(parity.cart,parity.menu,'Live Cart and Menu use identical soft IconButton');
    assert.equal(parity.cart.width,44);assert.equal(parity.cart.height,44);
    assert.equal(parity.group.width,44);assert.equal(parity.group.background,'rgba(0, 0, 0, 0)');assert.equal(parity.group.shadow,'none');
    const dock=await page.locator('.sf-shell > .sf-mobile-dock').evaluate(el=>getComputedStyle(el).display);
    assert.equal(dock,'none','No duplicate dock behind purchase bar');
   }
   if(check.name==='product-search'){
    assert(parts[0]>0||parts[1]>1||parts[2]>=86,'Product search requires the86 native template');
    const grid=page.locator('.sf-content ul.products').first();
    assert(await grid.locator('li.product').count()>0,'Live product search uses shared native cards');
    await grid.locator('li.product').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const img=document.querySelector('.sf-content ul.products li.product img');return img?.complete&&img.naturalWidth>0;});
    const card=await grid.locator('li.product').first().evaluate(el=>{const img=getComputedStyle(el.querySelector('img')),title=getComputedStyle(el.querySelector('.woocommerce-loop-product__title'));return{fit:img.objectFit,ratio:img.aspectRatio,lines:title.webkitLineClamp};});
    assert(parts[0]>0||parts[1]>1||parts[2]>=88,'Refined native cards require88');
    assert.equal(card.fit,'contain');assert.equal(card.ratio,'1 / 1');assert.equal(card.lines,'2');
    assert(await grid.locator('.sf-product-card-footer').count()>0,'Native price/action footer');
    assert.equal(await grid.locator('li.outofstock .button').count(),0,'No stockless purchase action');
    const action=grid.locator('a.button').first();
    assert(await action.evaluate(e=>e.classList.contains('sf-ui-icon-button--soft') || e.classList.contains('sf-ui-button--secondary')),'Existing shared secondary Button');
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

