// One card contract across native Woo loops, plus stable mobile header slots.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root='theme/codela-storefront/';
const css=['tokens','components','catalog','navigation','overlay','product'].map(n=>fs.readFileSync(root+'assets/styles/'+n+'.css','utf8'));
const styles=css[0]+fs.readFileSync(root+'assets/storefront.css','utf8')+css[4]+css[3]+css[1]+css[2]+css[5];
const header=mode=>execFileSync('php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_PRODUCT:mode==='product'?'1':'0',FIXTURE_CHECKOUT:mode==='checkout'?'1':'0',...(mode==='no-dock'?{FIXTURE_DOCK:'0'}:{})}});
const headers=Object.fromEntries(['home','product','checkout','no-dock'].map(m=>[m,header(m)]));
const image='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22%3E%3Crect width=%22400%22 height=%22500%22 fill=%22%23dfebe9%22/%3E%3C/svg%3E';
const card=(i)=>'<li class="product '+(i===3?'outofstock':'instock')+'"><a class="woocommerce-LoopProduct-link woocommerce-loop-product__link" href="/product/">'+(i===3?'<span class="sf-product-stock">Stokta yok</span>':'')+'<img width="400" height="500" src="'+image+'" alt="Ürün"><h2 class="woocommerce-loop-product__title">'+(i?'Kısa ürün':'İki satırı aşan çok uzun ürün başlığı taşma ve hizalama kontrolü')+'</h2></a><div class="sf-product-card-footer"><span class="price">'+(i===0?'<del>₺1.000</del><ins>₺850</ins>':'₺850')+'</span>'+(i===3?'':'<a class="button sf-ui-icon-button sf-ui-icon-button--soft sf-icon-button '+(i===2?'product_type_variable':'product_type_simple add_to_cart_button ajax_add_to_cart')+'" href="/?add-to-cart=1" data-product_id="1">'+'<img class="sf-icon" width="22" height="22" alt="" src="https://fixture.test/assets/icons/'+(i===2?'arrow-right':'shopping-bag')+'.svg"><span class="screen-reader-text">'+(i===2?'Seçenekler':'Ekle')+'</span></a>')+'</div></li>';
const cards='<ul class="products columns-4">'+[0,1,2,3].map(card).join('')+'</ul>';
(async()=>{const browser=await chromium.launch();
try{const page=await browser.newPage();await page.route('**/assets/icons/**',r=>r.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+new URL(r.request().url()).pathname.split('/').at(-1),'utf8')}));
for(const width of [320,390,700,900,1280]){
 await page.setViewportSize({width,height:900});let expectedPaint;
 for(const mode of ['home','shop','category','search','related']){
  const inside=mode==='related'?'<div class="product type-product"><section class="related products"><h2>İlgili Ürünler</h2>'+cards+'</section></div>':'<section class="sf-selection woocommerce"><h2>Koleksiyon</h2>'+cards+'</section>';
  await page.setContent('<style>.screen-reader-text{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.woocommerce ul.products li.product{float:left;width:22%;margin:0 3% 2em 0}.woocommerce ul.products::before{content:" ";display:table}'+styles+'</style><body class="woocommerce '+(mode==='home'?'home':mode==='related'?'single-product':'')+'"><main class="sf-content">'+inside+'</main></body>');
  const actual=await page.locator('ul.products').evaluate(el=>{const li=el.querySelector('li'),img=li.querySelector('img'),title=li.querySelector('h2'),price=li.querySelector('.price'),button=li.querySelector('.button');const a=getComputedStyle(img),b=getComputedStyle(title),c=getComputedStyle(price),d=getComputedStyle(button);
   return{columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth+1,paint:{fit:a.objectFit,ratio:a.aspectRatio,background:a.backgroundColor,radius:a.borderRadius,title:b.fontSize,lines:b.webkitLineClamp,price:c.fontSize,button:d.backgroundColor,transition:d.transitionProperty,card:getComputedStyle(li).backgroundColor,cardRadius:getComputedStyle(li).borderRadius},target:button.getBoundingClientRect().height,width:li.getBoundingClientRect().width};});
  assert(!actual.overflow,mode+' overflow at '+width);assert.equal(actual.columns,width>1024?4:width>700?3:2);assert(actual.target>=44,'Accessible card action');
  assert.equal(actual.paint.fit,'contain');assert.equal(actual.paint.ratio,'1 / 1');assert.equal(actual.paint.lines,'2');
  assert.equal(actual.paint.background,'rgba(0, 0, 0, 0)','No second image surface');
  assert.equal(actual.paint.card,'rgb(255, 255, 255)','Single light card shell');
  assert.equal(actual.paint.cardRadius,'20px','Integrated card corners');
  const detail=await page.locator('li.product').first().evaluate(el=>{
   const title=el.querySelector('h2'),footer=el.querySelector('.sf-product-card-footer'),price=footer.querySelector('.price'),button=footer.querySelector('.button');
   const p=price.getBoundingClientRect(),b=button.getBoundingClientRect();
   const footerStyle=getComputedStyle(footer),badge=getComputedStyle(button.querySelector('.sf-icon')),titleStyle=getComputedStyle(title);
   return{weight:getComputedStyle(title).fontWeight,buttonWidth:b.width,cardWidth:el.getBoundingClientRect().width,priceX:p.x,buttonX:b.x,footerChildren:footer.children.length,divider:footerStyle.borderTopWidth,dividerColor:footerStyle.borderTopColor,
     icon:button.querySelector('.sf-icon').src,iconWidth:badge.width,titleColor:titleStyle.color,titleFont:titleStyle.fontFamily,priceWeight:getComputedStyle(price).fontWeight,buttonBorder:getComputedStyle(button).borderTopColor,buttonShadow:getComputedStyle(button).boxShadow};
  });
  assert.equal(detail.weight,'500');assert(detail.buttonWidth<detail.cardWidth*.7,'Action does not dominate card');
  assert(detail.priceX<detail.buttonX,'Price left, shared action right');assert.equal(detail.footerChildren,2);
  assert(!/Georgia|Times/.test(detail.titleFont),'Product titles use the theme sans-serif family');
  assert.equal(detail.priceWeight,'500','Price hierarchy without heavy bold');
  assert.equal(detail.dividerColor,'rgb(243, 243, 243)','Quiet divider');
  assert.equal(detail.buttonBorder,'rgba(0, 0, 0, 0)','Shared floating surface has no raised ring');
  assert(!detail.buttonShadow.includes('inset'),'No second button rim');
  assert.equal(detail.divider,'1px','A subtle divider precedes the price/action row');
  assert.equal(detail.titleColor,'rgb(32, 32, 32)','Readable dark product names');
  assert(detail.icon.includes('shopping-bag.svg'),'Use the existing shopping-bag icon rather than a plus glyph');
  assert.equal(detail.iconWidth,'22px','Uniform shared icon sizing');
  assert(!await page.locator('.product_type_simple.add_to_cart_button').first().evaluate(e=>e.textContent.trim()===''),
    'Keep the Woo native accessible link name');
  assert.equal(await page.locator('li.outofstock .button').count(),0,'Out-of-stock has no purchase action');
  assert.equal(await page.locator('li.outofstock .sf-product-stock').count(),1);
  assert.equal(await page.locator('.product_type_variable').textContent(),'Seçenekler');
  if(expectedPaint)assert.deepEqual(actual.paint,expectedPaint,'Same card paint for '+mode+' at '+width);else expectedPaint=actual.paint;
  if(mode==='home'&&[390,1280].includes(width)){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-catalog-'+width+'.png',fullPage:true});}
 }
 await page.setContent('<style>.screen-reader-text{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}'+styles+'</style><body>'+headers.home+'<main class="sf-content">'+cards+'</main></body>');
 const parity=await page.evaluate(()=>{
  const a=document.querySelector('.sf-menu-trigger'),b=document.querySelector('.sf-product-card-footer .sf-ui-icon-button');
  const read=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{w:r.width,h:r.height,padding:s.padding,border:s.borderWidth,radius:s.borderRadius,background:s.backgroundColor,shadow:s.boxShadow,transition:s.transitionProperty};};
  const r=b.getBoundingClientRect(),g=b.querySelector('.sf-icon').getBoundingClientRect();
  return{header:read(a),card:read(b),glyph:{w:g.width,h:g.height,x:g.x+g.width/2-r.x-r.width/2,y:g.y+g.height/2-r.y-r.height/2}};
 });
 assert.deepEqual(parity.card,parity.header,'Catalog and Header share one soft IconButton');
 assert.equal(parity.glyph.w,22);assert.equal(parity.glyph.h,22);
 assert(Math.abs(parity.glyph.x)<.5 && Math.abs(parity.glyph.y)<.5,'Native glyph is centered in its shared target');
 await page.locator('.sf-menu-trigger,.sf-product-card-footer .sf-ui-icon-button').evaluateAll(els=>els.forEach(e=>e.classList.add('is-pressed')));
 await page.waitForTimeout(180);
 assert.equal(await page.locator('.sf-menu-trigger').evaluate(e=>getComputedStyle(e).transform),await page.locator('.sf-product-card-footer .sf-ui-icon-button').first().evaluate(e=>getComputedStyle(e).transform),'Same icon press scale');
 let anchor;
 for(const mode of ['home','product','checkout','no-dock']){
  const purchase=mode==='product'?'<main class="sf-content"><div class="product"><form class="cart"><div class="sf-product-purchase"><button class="button" type="submit">Sepete Ekle</button></div></form></div></main>':'<main class="sf-content"></main>';
  await page.setContent('<style>'+styles+'</style><body class="'+(mode==='product'?'single-product woocommerce':'')+'">'+headers[mode]+purchase+'</body>');
  const layout=await page.locator('.sf-header').evaluate(el=>({brand:el.querySelector('.sf-brand').getBoundingClientRect().toJSON(),menu:el.querySelector('.sf-header-menu').getBoundingClientRect().toJSON(),tools:[...el.querySelectorAll('.sf-actions a')].filter(x=>getComputedStyle(x).display!=='none'&&getComputedStyle(x.parentElement).display!=='none').map(x=>x.dataset.panel||'account'),overflow:document.documentElement.scrollWidth>innerWidth+1}));
  assert(!layout.overflow,mode+' header fits '+width);
  if(mode==='product'){
   const measure=()=>page.locator('.sf-header').evaluate(el=>{
    const read=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{width:r.width,height:r.height,background:s.backgroundColor,image:s.backgroundImage,radius:s.borderRadius,border:s.borderTopWidth,shadow:s.boxShadow,filter:s.backdropFilter,transition:s.transitionProperty,transform:s.transform,outline:s.outlineStyle};};
    return{menu:read(el.querySelector('.sf-menu-trigger')),cart:read(el.querySelector('.sf-cart-trigger')),group:read(el.querySelector('.sf-actions'))};
   });
   if(width<=700){
    for(const count of ['', '2', '99']){
     await page.locator('.sf-cart-trigger .sf-badge').evaluate((el,count)=>el.textContent=count,count);
     const v=await measure();
     assert.deepEqual(v.cart,v.menu,'Same soft IconButton geometry/material for cart count '+count+' at '+width);
     assert.equal(v.cart.width,44);assert.equal(v.cart.height,44);
     assert.equal(v.group.width,44,'No group padding enlarges the cart surface');
     assert.equal(v.group.background,'rgba(0, 0, 0, 0)');assert.equal(v.group.shadow,'none');assert.equal(v.group.border,'0px');
    }
    await page.locator('.sf-cart-trigger,.sf-menu-trigger').evaluateAll(els=>els.forEach(el=>el.classList.add('is-pressed')));
    await page.waitForTimeout(160);
    const pressed=await measure();assert.deepEqual(pressed.cart,pressed.menu,'Shared whole-control press feedback');
    assert(parseFloat(pressed.cart.transform.slice(7).split(',')[0])>1,'Same shared press scale');
    await page.locator('.sf-cart-trigger,.sf-menu-trigger').evaluateAll(els=>els.forEach(el=>el.classList.remove('is-pressed')));
    await page.waitForTimeout(440);
    for(const selector of ['.sf-cart-trigger','.sf-menu-trigger']){
     await page.locator(selector).focus();
     assert.equal(await page.locator(selector).evaluate(e=>getComputedStyle(e).outlineStyle),'solid','Shared keyboard focus');
    }
    await page.locator('.sf-menu-trigger').evaluate(e=>e.blur());
    if(width===390){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-header-single-390.png'});}
   }else{
    const v=await measure();assert.equal(v.cart.background,'rgba(0, 0, 0, 0)');assert.equal(v.cart.shadow,'none','No nested desktop cart surface');
    assert.equal(v.group.width,140,'Desktop retains its three-control shared island');
   }
  }
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
