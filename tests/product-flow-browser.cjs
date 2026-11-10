// Production adapters with real PHP markup; mock only commerce/network and PhotoSwipe boundary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium, webkit} = require('playwright');
const {fixture} = require('./product-sheet-browser.cjs');
const root = 'theme/codela-storefront/';
(async () => {
 const browser = await (process.env.TEST_WEBKIT ? webkit : chromium).launch(process.env.CHROMIUM_PATH && !process.env.TEST_WEBKIT ? {executablePath:process.env.CHROMIUM_PATH} : {});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.route('https://store.test/**', route=>route.fulfill({contentType:'text/html',body:fixture({})}));
  await page.goto('https://store.test/product');
  await page.locator('.summary').evaluate(summary=>summary.insertAdjacentHTML('beforeend','<div class="cdl-de"><div class="cdl-de-line">Ships <strong>tomorrow</strong><strong class="cdl-de-timer">2h</strong></div></div>'));
  await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});
  await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8')});
  assert.equal(await page.locator('.sf-product-shipping-summary').textContent(),'Ships tomorrow');
  await page.locator('.cdl-de-line strong').first().evaluate(el=>el.textContent='Wednesday');
  await page.waitForFunction(()=>document.querySelector('.sf-product-shipping-summary').textContent==='Ships Wednesday');
  const images=page.locator('.sf-product-gallery-thumb:not([hidden])');
  const rail=page.locator('.sf-product-gallery-rail');
  assert.equal(await images.count(),3);
  assert(await rail.isVisible(),'Compact light-glass rail is visible before scrolling');
  assert.equal(await page.locator('.sf-product-gallery-rail .sf-product-gallery-count').count(),1);
  assert.equal(await page.locator('.sf-product-gallery-rail-arrow').count(),2);
  const railMaterial=await rail.evaluate(el=>({h:el.getBoundingClientRect().height,w:el.getBoundingClientRect().width,bg:getComputedStyle(el).backgroundColor,panel:getComputedStyle(document.querySelector('.sf-product-sheet')).backgroundColor}));
  assert(railMaterial.h < 200 && railMaterial.w <= 50,'Small, three-thumb glass rail omits arrow slots: '+JSON.stringify(railMaterial));
  assert.equal(await rail.evaluate(el=>getComputedStyle(el,'::before').backgroundColor),railMaterial.panel,'Rail pseudo-surface uses identical glass color');
  assert.equal(await images.first().evaluate(el=>getComputedStyle(el).outlineWidth),'0px','No dark selected outline at rest');
  const centered=await rail.evaluate(el=>{const r=el.getBoundingClientRect(),h=document.querySelector('.sf-header').getBoundingClientRect(),p=document.querySelector('.sf-product-sheet').getBoundingClientRect();return Math.abs((r.top+r.bottom)/2-(Math.max(12,h.bottom)+p.top)/2);});
  assert(centered<2,'Rail is centered between actual header and purchase panel');
  assert(!(await page.locator('.sf-product-gallery-expand').isVisible()),'Fullscreen button is hidden until photo tap');
  const centerBefore=await rail.evaluate(el=>el.style.getPropertyValue('--sf-gallery-rail-center'));
  await page.mouse.move(190,350);await page.mouse.wheel(0,450);
  const centerAfter=await rail.evaluate(el=>el.style.getPropertyValue('--sf-gallery-rail-center'));
  assert.equal(centerBefore,centerAfter,'Rail stays anchored through vertical photo scroll');
  assert(await rail.isVisible(),'Previews stay visible while transient arrow/glass paint fades');
  assert(await images.first().isVisible());
  assert(await page.locator('.sf-product-gallery-count').isVisible());
  await page.evaluate(()=>window.scrollTo(0,document.querySelector('.sf-product-discovery').offsetTop));
  await page.waitForFunction(()=>document.querySelector('.sf-product-gallery-rail').classList.contains('is-outside-photos'));
  assert(!(await rail.isVisible()),'Photo rail and arrows disappear as related products enter view');
  assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'false','Last photo does not open panel ahead of related products/footer');
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-expanded'));
  assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-label'),'Close product details');
  await page.locator('.sf-product-sheet-toggle').click();
  await page.waitForTimeout(350);
  await page.evaluate(()=>dispatchEvent(new Event('scroll')));
  assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'false');
  await page.evaluate(()=>window.scrollTo({top:500,behavior:'instant'}));
  await page.waitForFunction(()=>scrollY < document.documentElement.scrollHeight-innerHeight-120 && !document.querySelector('.woocommerce-product-gallery').classList.contains('is-discovering'));
  // Traverse the native photo snap boundary before reaching the actual footer.
  await page.evaluate(()=>document.querySelector('.sf-product-discovery').scrollIntoView({block:'start',behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.woocommerce-product-gallery').classList.contains('is-discovering'));
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-expanded'));
  await page.locator('.sf-product-sheet-toggle').click();
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(400);
  await page.evaluate(()=>{
   const menu=document.createElement('button');menu.className='sf-menu-trigger';
   menu.style.cssText='position:fixed;right:14px;top:16px;width:44px;height:44px;z-index:20';
   document.querySelector('.sf-header').appendChild(menu);
  });
  await page.locator('.woocommerce-product-gallery__image a').first().click();
  await page.waitForFunction(()=>{
    const expand=document.querySelector('.sf-product-gallery-expand');
    const menu=document.querySelector('.sf-menu-trigger');
    return expand.classList.contains('is-visible') &&
      Math.abs(expand.getBoundingClientRect().top-menu.getBoundingClientRect().bottom-12)<2;
  });
  const expandPosition=await page.evaluate(()=>({
    menu:document.querySelector('.sf-menu-trigger').getBoundingClientRect().bottom,
    expand:document.querySelector('.sf-product-gallery-expand').getBoundingClientRect().top
  }));
  assert(Math.abs(expandPosition.expand-expandPosition.menu-12)<2,'Tap-revealed fullscreen sits immediately below menu');
  await page.evaluate(()=>{
   document.body.insertAdjacentHTML('beforeend','<div class="pswp"></div>');
   window.PhotoSwipeUI_Default=function(){};
   window.PhotoSwipe=function(template,ui,images,options){window.lightboxProbe={count:images.length,options};this.listen=()=>{};this.init=()=>{window.lightboxProbe.open=true;};};
  });
  await page.locator('.sf-product-gallery-expand').click();
  assert.equal(await page.evaluate(()=>window.lightboxProbe.open),true);
  assert.equal(await page.evaluate(()=>window.lightboxProbe.count),3);
  assert(!(await page.locator('.sf-product-gallery-expand').isVisible()),'Fullscreen affordance hides after opening native lightbox');
  await page.evaluate(()=>{
   window.requests=[];window.responses=[];window.cartOpened=0;
   window.fetch=(url,options={})=>{
    if(options.method==='POST')return new Promise(resolve=>{window.requests.push([...options.body.entries()]);window.responses.push(resolve);});
    return Promise.resolve({ok:true,headers:{get:()=>null},json:async()=>({items:[],items_count:0,totals:{}})});
   };
   const nodes={};
   for(const selector of ['#sf-cart-items','.sf-cart-bottom','#sf-subtotal','#sf-status','#sf-cart']){
    nodes[selector]=document.createElement('div');document.body.appendChild(nodes[selector]);
   }
   window.cartNodes=nodes;
   // Woo's native catalog script adds a second cart link when supplied a
   // $button in added_to_cart; native product confirmation must pass null.
   window.wooEventButton='unset';
   window.jQuery=function(target){return {
     0:target,
     on(){return this;},ajaxError(){return this;},
     trigger(name,args){
       if(name!=='added_to_cart')return this;
       window.wooEventButton=args[2];
       if(args[2]){
         const duplicate=document.createElement('a');
         duplicate.className='added_to_cart wc-forward';duplicate.textContent='Sepetim';
         document.querySelector('.sf-product-purchase').appendChild(duplicate);
       }
       return this;
     }
   };};
  });
  let source=fs.readFileSync(root+'assets/scripts/cart-controller.js','utf8').replace(/^import .*;$/m,'const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;"); const decode = value => value; const safeURL = value => value; const money = value => value;').replace('export function','function');
  source+='\nwindow.cartController=createCartController({$:selector=>window.cartNodes[selector]||document.querySelector(selector),config:()=>({api:"/api/",cart:"/cart"}),t:x=>x,getCurrent:()=>"",getDialog:()=>null,openCart:()=>{window.cartOpened++;}});window.cartController.bind();';
  await page.addScriptTag({content:source});
  const buy=page.locator('.single_add_to_cart_button');
  await buy.click();
  await page.waitForFunction(()=>window.requests.length===1);
  assert.equal(await buy.textContent(),'Adding…');assert(await buy.isDisabled());
  assert.equal(await page.evaluate(()=>window.requests[0].find(([key])=>key==='add-to-cart')[1]),'42');
  await page.evaluate(()=>window.responses.shift()({ok:false,text:async()=>JSON.stringify({codela_cart_result:true,added:false,message:'Stock changed. Try another quantity.'})}));
  await page.waitForFunction(()=>document.querySelector('.sf-purchase-status').textContent.includes('Stock changed'));
  assert.equal(await buy.isDisabled(),false);
  assert.equal(await buy.getAttribute('data-sf-cart-state'),'idle');
  assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'false','Cart failure cannot expand product details');
  assert(await page.locator('.sf-product-purchase .sf-purchase-status').isVisible(),'Error stays beside the CTA');
  await buy.click();await page.waitForFunction(()=>window.requests.length===2);
  // Woo may suppress HTML notices; the server's successful native cart hook
  // now confirms the POST as JSON before any page template/redirect.
  await page.evaluate(()=>window.responses.shift()({ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({codela_cart_result:true,added:true,message:''})}));
  await page.waitForFunction(()=>document.querySelector('.single_add_to_cart_button').dataset.sfCartState==='success');
  assert.equal(await buy.textContent(),'View cart');
  assert.equal(await page.evaluate(()=>window.wooEventButton),null,'Native add announces cart update without handing Woo a catalog button');
  assert.equal(await page.locator('.sf-product-purchase a.added_to_cart.wc-forward').count(),0,'No duplicate Sepetim link');
  assert.equal(await buy.evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap','Standard purchase pill stays on one line');
  await buy.click();assert.equal(await page.evaluate(()=>window.cartOpened),1);
  assert.equal(await page.evaluate(()=>window.requests.length),2,'Success click opens existing cart without another POST');
  await page.locator('input.qty').fill('2');await page.locator('input.qty').dispatchEvent('change');
  assert.equal(await buy.getAttribute('data-sf-cart-state'),'idle');
  assert.deepEqual(errors,[]);
  console.log('Product flow: compact fixed gallery, hidden related-section arrows, single Woo success CTA, native cart confirmation and fullscreen passed.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
