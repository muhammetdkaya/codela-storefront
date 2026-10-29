// Production header markup and CSS, compared across the actual transition.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const root='theme/codela-storefront/assets/';
const stylesheet=name=>fs.readFileSync(root+name,'utf8');
const catalog=fs.readFileSync(process.env.HEADER_CATALOG_CSS||root+'styles/catalog.css','utf8');
const feedback=fs.readFileSync(process.env.HEADER_FEEDBACK_SCRIPT||root+'scripts/navigation-feedback.js','utf8');
const css=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css','styles/components.css'].map(stylesheet).join('\n')+catalog+stylesheet('styles/product.css')+stylesheet('styles/navigation-feedback.css');
const render=env=>execFileSync('php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,...env}});
const scope=process.env.HEADER_TEST_SCOPE||'all';
const nativeContent='<div class="product"><form class="cart"><div class="sf-product-purchase"><button type="submit">Add</button></div></form></div>';
const headerBox=()=>{
 const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
 const paint=el=>{const s=getComputedStyle(el);return {display:s.display,background:s.backgroundColor,backgroundImage:s.backgroundImage,border:s.borderTopWidth,borderColor:s.borderTopColor,radius:s.borderRadius,shadow:s.boxShadow,filter:s.backdropFilter}};
 const group=document.querySelector('.sf-header .sf-actions'), cart=group.querySelector('.sf-cart-trigger'),icon=cart.querySelector('.sf-icon'),badge=cart.querySelector('.sf-badge');
 return {group:box(group),cart:box(cart),icon:box(icon),badge:box(badge),groupPaint:paint(group),cartPaint:paint(cart),iconFilter:getComputedStyle(icon).filter,visibleTools:[...group.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.classList.contains('sf-cart-trigger')?'cart':'other')};
};
(async()=>{
 const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch();
 try{
  const page=await browser.newPage();
  await page.route('https://store.test/theme/assets/icons/**',r=>r.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'icons/'+new URL(r.request().url()).pathname.split('/').pop())}));
  async function load(env,bodyClass,content=''){
   await page.goto('about:blank');
   const html=render(env);
   await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body class="${bodyClass}">${html}<main id="sf-content" class="sf-content">${content}</main></body></html>`);
   await page.locator('.sf-cart-trigger .sf-badge').evaluate(el=>{el.textContent='9'});
  }
  if(scope!=='cart'){
   for(const width of [320,390,1280])for(const kind of ['shop','category','tag'])for(const description of [false,true]){
    await page.setViewportSize({width,height:850});
    const className=kind==='shop'?'woocommerce-shop post-type-archive-product':'tax-product_'+(kind==='category'?'cat':'tag');
    await load({FIXTURE_CATALOG:kind},className,`<div class="woocommerce"><header class="woocommerce-products-header"><h1 class="woocommerce-products-header__title page-title">Archive heading</h1>${description?'<div class="term-description"><p>Category description</p></div>':''}</header><p class="woocommerce-result-count">Showing 1 result</p></div>`);
    const title=page.locator('.woocommerce-products-header__title');
    const h=await title.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {width:r.width,height:r.height,clip:s.clipPath}});
    assert(h.width<=1 && h.height<=1 && h.clip==='inset(50%)',`duplicate archive title visually hidden: ${kind}/${width} ${JSON.stringify(h)}`);
    assert.equal(await page.getByRole('heading',{level:1,name:'Archive heading'}).count(),1,'Native H1 remains accessible');
    assert(await page.locator('.woocommerce-result-count').isVisible());
    if(description){assert(await page.locator('.term-description').isVisible());assert.equal(await page.locator('.woocommerce-products-header').evaluate(el=>getComputedStyle(el).marginBottom),'20px');}
    else assert.equal(await page.locator('.woocommerce-products-header').evaluate(el=>getComputedStyle(el).marginBottom),'0px','Empty archive header has no phantom gap');
   }
   // If shop is also the homepage, its header is the logo, so its native H1 stays visible.
   await load({FIXTURE_CATALOG:'shop',FIXTURE_CATALOG_FRONT:'1'},'home woocommerce-shop post-type-archive-product','<header class="woocommerce-products-header"><h1 class="woocommerce-products-header__title">Home shop</h1></header>');
   assert((await page.locator('.woocommerce-products-header__title').boundingBox()).width>1,'Homepage shop retains its only visible title');
   await load({FIXTURE_PAGE:'1'},'page','<h1 class="woocommerce-products-header__title">Other page</h1>');
   assert((await page.locator('#sf-content h1').boundingBox()).width>1,'Other pages retain their headings');
  }
  if(scope!=='heading'){
   for(const width of [320,390,700])for(const dock of ['0','1']){
    await page.setViewportSize({width,height:850});
    await load({FIXTURE_PRODUCT:'1',FIXTURE_DOCK:dock},'single-product woocommerce',nativeContent);
    const actual=await page.evaluate(headerBox);
    assert.equal(Math.round(actual.cart.width),44);assert.equal(Math.round(actual.cart.height),44);assert.equal(Math.round(actual.icon.width),22);
    for(const [source,env,body] of [
     ['home',{FIXTURE_DOCK:dock},'home'],
     ['page',{FIXTURE_PAGE:'1',FIXTURE_DOCK:dock},'page'],
     ['shop',{FIXTURE_CATALOG:'shop',FIXTURE_DOCK:dock},'woocommerce-shop post-type-archive-product'],
     ['category',{FIXTURE_CATALOG:'category',FIXTURE_DOCK:dock},'tax-product_cat'],
     ['product',{FIXTURE_PRODUCT:'1',FIXTURE_DOCK:dock},'single-product woocommerce'],
    ]){
     await load(env,body,nativeContent);
     await page.evaluate(()=>{window.codelaSFDocument={productBase:'https://store.test/product/'};window.original={shell:document.querySelector('.sf-shell').getAttribute('class'),group:document.querySelector('.sf-actions').getAttribute('class'),cart:document.querySelector('.sf-cart-trigger').getAttribute('class')};});
     await page.addScriptTag({content:feedback});
     await page.evaluate(()=>codelaSFFeedback.begin({url:'https://store.test/product/example/'}));
     const preview=await page.evaluate(headerBox);
     for(const object of ['group','cart','icon','badge'])for(const property of ['x','y','width','height'])assert(Math.abs(preview[object][property]-actual[object][property])<0.6,`cart header geometry should match actual product: ${source}/${dock}/${width} ${object}.${property} ${JSON.stringify({actual,preview})}`);
     for(const object of ['groupPaint','cartPaint'])assert.deepEqual(preview[object],actual[object],`cart header surface should match actual product: ${source}/${dock}/${width} ${object}`);
     assert.equal(preview.iconFilter,actual.iconFilter);assert.deepEqual(preview.visibleTools,['cart']);
     assert.equal(await page.locator('.sf-cart-trigger').count(),1,'No duplicate cart control');
     assert(await page.locator('.sf-header').evaluate(el=>el.inert),'Pending header cannot trigger actions');
     if(source==='home'&&dock==='1'&&width===390){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/product-header-skeleton-${process.env.TEST_WEBKIT?'webkit':'chromium'}.png`});}
     await page.evaluate(()=>codelaSFFeedback.end());
     const restored=await page.evaluate(()=>({shell:document.querySelector('.sf-shell').getAttribute('class'),group:document.querySelector('.sf-actions').getAttribute('class'),cart:document.querySelector('.sf-cart-trigger').getAttribute('class')}));
     assert.deepEqual(restored,await page.evaluate(()=>original),'Cancel restores original classes and cart node');
     assert(!await page.locator('.sf-header').evaluate(el=>el.inert));
    }
   }
  }
  console.log('Archive accessible H1 and descriptions; real product-cart header geometry, material and restore across three mobile widths, five sources and both dock settings passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
