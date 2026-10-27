// Destination bottom chrome with production markup/CSS; no live commerce.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const root='theme/codela-storefront/';
module.exports=async function destinationBottomBrowser(browser){
 const preview=execFileSync(process.env.PHP_BIN||'php',['tests/render-product-sheet.php','navigation'],{encoding:'utf8'});
 const css=fs.readFileSync(root+'assets/storefront.css','utf8')+['tokens','components','navigation','product','navigation-feedback'].map(name=>fs.readFileSync(root+'assets/styles/'+name+'.css','utf8')).join('\n');
 const script=fs.readFileSync(process.env.FEEDBACK_SCRIPT||root+'assets/scripts/navigation-feedback.js','utf8');
 const context=await browser.newContext({viewport:{width:390,height:850}});
 try{
  const page=await context.newPage();
  await page.route('https://store.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8">'}));
  await page.goto('https://store.test/');
  for(const width of [320,390,700,701,900,901,1280])for(const product of [false,true]){
   await page.setViewportSize({width,height:850});
   await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body class="${product?'single-product woocommerce':''}"><div class="sf-shell has-mobile-dock"><header class="sf-header"><div class="sf-actions"><a class="sf-cart-trigger">Cart</a></div></header><nav class="sf-mobile-dock" ${product?'hidden':''}><div class="sf-dock-surface"><a data-dock-view="home">Home</a></div></nav></div><main id="sf-content"><div class="product"><form class="cart"><div class="sf-product-purchase" style="position:fixed;bottom:12px;visibility:visible"><span data-old-price>42 ₺</span><input name="quantity" value="7"><button type="submit" name="add-to-cart" value="42">Old product</button></div></form></div></main><footer class="sf-footer"><a>Privacy</a></footer></body></html>`);
   await page.evaluate(preview=>{window.codelaSFDocument={home:'https://store.test/',productBase:'https://store.test/product/',purchasePreview:preview};window.originalForm=document.querySelector('form.cart');window.originalDock=document.querySelector('.sf-mobile-dock');window.submits=0;originalForm.addEventListener('submit',e=>{e.preventDefault();submits++});},preview);
   await page.addScriptTag({content:script});
   for(const target of ['product','home'])for(const owner of ['document','router']){
    const before=await page.locator('.sf-mobile-dock').evaluate(el=>el.outerHTML);
    await page.evaluate(({target,owner})=>window.token=codelaSFFeedback.begin({url:target==='home'?'https://store.test/':'https://store.test/product/new/',owner}),{target,owner});
    const state=await page.evaluate(()=>{
     const visible=el=>!!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getBoundingClientRect().height>0;
     const panel=document.querySelector('.sf-navigation-preview');
     const box=panel?.getBoundingClientRect();
     originalForm.requestSubmit();
     return{bottom:document.documentElement.dataset.sfNavigationBottom,dock:visible(originalDock),preview:visible(panel),old:visible(document.querySelector('[data-old-price]')),forms:document.querySelectorAll('form.cart').length,same:document.querySelector('form.cart')===originalForm,quantity:originalForm.elements.quantity.value,submits,locked:originalForm.closest('[inert]')!==null,footer:document.querySelector('.sf-footer').inert,buttonDisabled:panel?.querySelector('button')?.disabled,buttonHeight:panel?.querySelector('button')?.getBoundingClientRect().height,formInPreview:!!panel?.querySelector('form,input,[name="add-to-cart"]'),box:box&&{top:box.top,bottom:box.bottom,width:box.width}};
    });
    assert.equal(state.bottom,target==='product'?'product':'dock');
    assert.equal(state.preview,width<=700&&target==='product');
    if(width<=700)assert.equal(state.dock,target==='home','Bottom follows destination, never outgoing page');
    assert(!state.old,'Outgoing product data stays hidden');
    assert(state.same&&state.forms===1&&state.quantity==='7'&&state.submits===0&&state.locked&&state.footer);
    if(state.preview){assert(state.buttonDisabled&&!state.formInPreview);assert(state.buttonHeight>=44);assert(state.box.top>0&&state.box.bottom<=850&&state.box.width<=width-32,JSON.stringify({width,product,target,state}));}
    await page.evaluate(()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));});
    assert.equal(await page.locator('.sf-mobile-dock').evaluate(el=>el.outerHTML),before,'Cancel restores original dock exactly');
    assert.equal(await page.locator('.sf-navigation-preview').count(),0);
    assert.equal(await page.locator('form.cart input').inputValue(),'7');
   }
   // A stale completion cannot remove the newer destination's preview.
   assert(await page.evaluate(()=>{const old=codelaSFFeedback.begin({url:'https://store.test/'});const next=codelaSFFeedback.begin({url:'https://store.test/product/new/'});return !codelaSFFeedback.end(old)&&codelaSFFeedback.active(next)}));
   await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
   assert.equal(await page.locator('.sf-skeleton').count(),0);
  }
  await page.setViewportSize({width:390,height:850});
  await page.evaluate(()=>originalDock.remove());
  await page.evaluate(()=>codelaSFFeedback.begin({url:'https://store.test/'}));
  assert.equal(await page.locator('.sf-mobile-dock,.sf-navigation-preview').count(),0,'No configured dock is invented');
  await page.evaluate(()=>codelaSFFeedback.end());
  await page.evaluate(()=>{
   const timer=window.setTimeout;
   window.setTimeout=(fn,ms)=>ms===10000?(window.expire=fn,0):timer(fn,ms);
   codelaSFFeedback.begin({url:'https://store.test/product/new/'});
   window.setTimeout=timer;
  });
  assert(await page.locator('.sf-navigation-preview').isVisible(),'Product target works even without a normal dock');
  await page.evaluate(()=>expire());
  assert.equal(await page.locator('.sf-skeleton').count(),0,'Timeout cleans destination preview');
  await page.evaluate(()=>originalForm.requestSubmit());
  assert.equal(await page.evaluate(()=>submits),1,'The same native form works again after cancellation');
  await page.close();
  console.log('Destination bottom: home/product in both directions, seven widths, native form isolation, no stale price, cancel/history/token restoration passed.');
 }finally{await context.close()}
};
if(require.main===module){const{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');(async()=>{const b=await(process.env.TEST_WEBKIT?webkit:chromium).launch();try{await module.exports(b)}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});}
