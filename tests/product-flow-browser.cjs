// Production adapters with real PHP markup; mock only commerce/network and PhotoSwipe boundary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium, webkit} = require('playwright');
const {fixture} = require('./product-sheet-browser.cjs');
const root = 'theme/codela-storefront/';
(async () => {
 const browser = await (process.env.TEST_WEBKIT ? webkit : chromium).launch();
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
  await page.evaluate(()=>window.scrollTo(0,300));
  await page.waitForFunction(()=>document.querySelector('.sf-product-gallery-glass').classList.contains('is-visible'));
  assert.equal(await images.count(),3);
  await page.waitForTimeout(2300);
  assert.equal(await page.locator('.sf-product-gallery-glass').evaluate(el=>getComputedStyle(el).opacity),'0');
  assert(await images.first().isVisible());
  assert(await page.locator('.sf-product-gallery-count').isVisible());
  await page.evaluate(()=>window.scrollTo(0,document.querySelector('.sf-product-discovery').offsetTop));
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'false','Last photo does not open panel ahead of related products/footer');
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-expanded'));
  assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-label'),'Close product details');
  await page.locator('.sf-product-sheet-toggle').click();
  await page.waitForTimeout(350);
  await page.evaluate(()=>dispatchEvent(new Event('scroll')));
  assert.equal(await page.locator('.sf-product-sheet-toggle').getAttribute('aria-expanded'),'false');
  await page.evaluate(()=>window.scrollTo(0,500));await page.waitForTimeout(100);
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForFunction(()=>document.querySelector('.sf-product-sheet').classList.contains('is-expanded'));
  await page.locator('.sf-product-sheet-toggle').click();
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(400);
  await page.evaluate(()=>{
   document.body.insertAdjacentHTML('beforeend','<div class="pswp"></div>');
   window.PhotoSwipeUI_Default=function(){};
   window.PhotoSwipe=function(template,ui,images,options){window.lightboxProbe={count:images.length,options};this.listen=()=>{};this.init=()=>{window.lightboxProbe.open=true;};};
  });
  await page.locator('.woocommerce-product-gallery__image a').first().click();
  assert.equal(await page.evaluate(()=>window.lightboxProbe.open),true);
  assert.equal(await page.evaluate(()=>window.lightboxProbe.count),3);
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
  });
  let source=fs.readFileSync(root+'assets/scripts/cart-controller.js','utf8').replace(/^import .*;$/m,'const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;"); const decode = value => value; const safeURL = value => value; const money = value => value;').replace('export function','function');
  source+='\nwindow.cartController=createCartController({$:selector=>window.cartNodes[selector]||document.querySelector(selector),config:()=>({api:"/api/",cart:"/cart"}),t:x=>x,getCurrent:()=>"",getDialog:()=>null,openCart:()=>{window.cartOpened++;}});window.cartController.bind();';
  await page.addScriptTag({content:source});
  const buy=page.locator('.single_add_to_cart_button');
  await buy.click();
  await page.waitForFunction(()=>window.requests.length===1);
  assert.equal(await buy.textContent(),'Adding…');assert(await buy.isDisabled());
  assert.equal(await page.evaluate(()=>window.requests[0].find(([key])=>key==='add-to-cart')[1]),'42');
  await page.evaluate(()=>window.responses.shift()({ok:true,text:async()=>'<div class="woocommerce-error">Stock changed. Try another quantity.</div>'}));
  await page.waitForFunction(()=>document.querySelector('.sf-purchase-status').textContent.includes('Stock changed'));
  assert.equal(await buy.isDisabled(),false);
  assert.equal(await buy.getAttribute('data-sf-cart-state'),'idle');
  await buy.click();await page.waitForFunction(()=>window.requests.length===2);
  await page.evaluate(()=>window.responses.shift()({ok:true,text:async()=>'<div class="woocommerce-message"><span data-sf-cart-added hidden></span></div>'}));
  await page.waitForFunction(()=>document.querySelector('.single_add_to_cart_button').dataset.sfCartState==='success');
  assert.equal(await buy.textContent(),'View cart');
  await buy.click();assert.equal(await page.evaluate(()=>window.cartOpened),1);
  assert.equal(await page.evaluate(()=>window.requests.length),2,'Success click opens existing cart without another POST');
  await page.locator('input.qty').fill('2');await page.locator('input.qty').dispatchEvent('change');
  assert.equal(await buy.getAttribute('data-sf-cart-state'),'idle');
  assert.deepEqual(errors,[]);
  console.log('Product flow: real page end/rearm, centered close, thumbnail material, live ETA, fullscreen mapping, server errors/success and cart action passed.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
