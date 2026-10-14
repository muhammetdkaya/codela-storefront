// One card contract across native Woo loops, plus stable mobile header slots.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root='theme/codela-storefront/';
const css=['tokens','components','catalog','navigation','overlay','product'].map(n=>fs.readFileSync(root+'assets/styles/'+n+'.css','utf8'));
const styles=css[0]+fs.readFileSync(root+'assets/storefront.css','utf8')+css[4]+css[3]+css[1]+css[2]+css[5];
const header=mode=>execFileSync('php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_PRODUCT:mode==='product'?'1':'0',FIXTURE_CHECKOUT:mode==='checkout'?'1':'0',...(mode==='no-dock'?{FIXTURE_DOCK:'0'}:{})}});
const headers=Object.fromEntries(['home','product','checkout','no-dock'].map(m=>[m,header(m)]));
const image='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22%3E%3Crect width=%22400%22 height=%22500%22 fill=%22%23dfebe9%22/%3E%3C/svg%3E';
const card=(i)=>'<li class="product"><a class="woocommerce-LoopProduct-link woocommerce-loop-product__link" href="/product/"><img width="400" height="500" src="'+image+'" alt="Ürün"><h2 class="woocommerce-loop-product__title">'+(i?'Kısa ürün':'İki satırı aşan çok uzun ürün başlığı taşma ve hizalama kontrolü')+'</h2><span class="price"><del>₺1.000</del><ins>₺850</ins></span></a><a class="button product_type_simple add_to_cart_button ajax_add_to_cart" href="/?add-to-cart=1" data-product_id="1">Sepete Ekle</a></li>';
const cards='<ul class="products columns-4">'+[0,1,2,3].map(card).join('')+'</ul>';
(async()=>{const browser=await chromium.launch();
try{const page=await browser.newPage();await page.route('**/assets/icons/**',r=>r.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+new URL(r.request().url()).pathname.split('/').at(-1),'utf8')}));
for(const width of [320,390,700,900,1280]){
 await page.setViewportSize({width,height:900});let expectedPaint;
 for(const mode of ['home','shop','category','search','related']){
  const inside=mode==='related'?'<div class="product type-product"><section class="related products"><h2>İlgili Ürünler</h2>'+cards+'</section></div>':'<section class="sf-selection woocommerce"><h2>Koleksiyon</h2>'+cards+'</section>';
  await page.setContent('<style>.woocommerce ul.products li.product{float:left;width:22%;margin:0 3% 2em 0}.woocommerce ul.products::before{content:" ";display:table}'+styles+'</style><body class="woocommerce '+(mode==='home'?'home':mode==='related'?'single-product':'')+'"><main class="sf-content">'+inside+'</main></body>');
  const actual=await page.locator('ul.products').evaluate(el=>{const li=el.querySelector('li'),img=li.querySelector('img'),title=li.querySelector('h2'),price=li.querySelector('.price'),button=li.querySelector('.button');const a=getComputedStyle(img),b=getComputedStyle(title),c=getComputedStyle(price),d=getComputedStyle(button);
   return{columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth+1,paint:{fit:a.objectFit,ratio:a.aspectRatio,background:a.backgroundColor,radius:a.borderRadius,title:b.fontSize,lines:b.webkitLineClamp,price:c.fontSize,button:d.backgroundColor,transition:d.transitionProperty},target:button.getBoundingClientRect().height,width:li.getBoundingClientRect().width};});
  assert(!actual.overflow,mode+' overflow at '+width);assert.equal(actual.columns,width>1024?4:width>700?3:2);assert(actual.target>=44,'Accessible card action');
  assert.equal(actual.paint.fit,'contain');assert.equal(actual.paint.ratio,'4 / 5');assert.equal(actual.paint.lines,'2');
  if(expectedPaint)assert.deepEqual(actual.paint,expectedPaint,'Same card paint for '+mode+' at '+width);else expectedPaint=actual.paint;
  if(mode==='home'&&[390,1280].includes(width)){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-catalog-'+width+'.png',fullPage:true});}
 }
 let anchor;
 for(const mode of ['home','product','checkout','no-dock']){
  const purchase=mode==='product'?'<main class="sf-content"><div class="product"><form class="cart"><div class="sf-product-purchase"><button class="button" type="submit">Sepete Ekle</button></div></form></div></main>':'<main class="sf-content"></main>';
  await page.setContent('<style>'+styles+'</style><body class="'+(mode==='product'?'single-product woocommerce':'')+'">'+headers[mode]+purchase+'</body>');
  const layout=await page.locator('.sf-header').evaluate(el=>({brand:el.querySelector('.sf-brand').getBoundingClientRect().toJSON(),menu:el.querySelector('.sf-header-menu').getBoundingClientRect().toJSON(),tools:[...el.querySelectorAll('.sf-actions a')].filter(x=>getComputedStyle(x).display!=='none'&&getComputedStyle(x.parentElement).display!=='none').map(x=>x.dataset.panel||'account'),overflow:document.documentElement.scrollWidth>innerWidth+1}));
  assert(!layout.overflow,mode+' header fits '+width);
  if(width<=700){assert(layout.brand.x<layout.menu.x,'Logo stays left');if(anchor)assert(Math.abs(layout.menu.x-anchor)<1,'Menu never changes slot');else anchor=layout.menu.x;
   assert.deepEqual(layout.tools,mode==='product'?['cart']:mode==='no-dock'?['search','cart','account']:[]);
  }else{assert.equal(layout.tools.length,3,'Desktop keeps all tools');assert(layout.menu.x<layout.brand.x);}
 }
}
await page.setContent('<style>'+styles+'</style><body class="codela-my-account-layout"><main class="sf-content">'+cards+'</main></body>');
assert.notEqual(await page.locator('ul.products').evaluate(e=>getComputedStyle(e).display),'grid','Plugin account does not inherit catalog grid');
assert((await page.locator('li.product img').first().evaluate(e=>getComputedStyle(e).aspectRatio)).startsWith('auto'),'Plugin images retain their native intrinsic aspect ratio');
console.log('Shared Woo cards across five contexts/widths and stable Header slots: passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
