// Actual rendered PHP + full storefront JS. Only WP action binding and API responses
// are supplied at the integration boundary; production DOM is never recreated here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const php = process.env.PHP_BIN || 'php';
const googleDisabled=JSON.parse(execFileSync(php,['tests/google-auth.php'],{encoding:'utf8'})).disabled_button;
const header = execFileSync(php, ['tests/render-header.php'], {encoding:'utf8'});
const noDockHeader = execFileSync(php, ['tests/render-header.php'], {encoding:'utf8',env:{...process.env,FIXTURE_DOCK:'0'}});
assert(!noDockHeader.includes('class="sf-mobile-dock'), 'Disabled setting omits dock');
assert.equal(header,execFileSync(php,['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_DOCK:'1'}}),'Unset defaults to enabled');
const accountHeader=execFileSync(php,['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_ACCOUNT:'1'}});
let activeHeader=header;
const checkout = execFileSync(php, ['tests/render-header.php'], {encoding:'utf8',env:{...process.env,FIXTURE_CHECKOUT:'1'}});
const footer = execFileSync(php, ['tests/render-footer.php'], {encoding:'utf8',env:{...process.env,FOOTER_PRIVACY:'1',FOOTER_TERMS:'1',FOOTER_NOTE:'1'}});
assert(!checkout.includes('class="sf-mobile-dock'), 'Checkout omits the dock');
const css = ['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css','assets/styles/account-overlay.css'].map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const moduleSource = name => fs.readFileSync(
 'theme/codela-storefront/assets/scripts/'+name+'.js','utf8'
 ).replace(/^import .*;$/gm,'').replace(/^export /gm,'');
const inlineControllers = ['format','search-controller','cart-controller','overlay-controller','dock-controller']
 .map(moduleSource).join('\n');
const js = fs.readFileSync('theme/codela-storefront/assets/storefront.js','utf8')
 .replace(/^import .*from 'codela-storefront\/(?:search|cart|overlay|dock)';$/gm,'')
 .replace("import { store } from '@wordpress/interactivity';",`
function store(namespace, options) {
 window.sfActions = options.actions;
 return {state:{config:{api:'https://store.test/api/', search:'https://store.test/search-api', cart:'/cart/',account:'https://store.test/myaccount/', labels:{}}}};
}
`)
 .replace("let menuPath = [];",inlineControllers + '\nlet menuPath = [];');
const cart = {items_count:1, items:[{key:'one',name:'Codela Demo Tote Bag',permalink:'/product/',images:[{thumbnail:'https://store.test/fixture-product.svg'}],quantity:1,totals:{line_subtotal:'1000',line_subtotal_tax:'0',currency_code:'TRY',currency_minor_unit:2}}],totals:{total_items:'1000',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}};
(async()=>{
 const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN ? {executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--use-gl=disabled','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote','--single-process']} : {})});
 try {
 const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 let cartRequests=0, searchRequests=0;
 await page.route('**/*', async route=>{
  const url=route.request().url();
  if(url.includes('/api/cart')) {cartRequests++;return route.fulfill({json:cart,headers:{Nonce:'test'}});}
  if(url.endsWith('/fixture-product.svg'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect width="80" height="100" fill="#eeeae4"/></svg>'});
  if(url.includes('/search-api')) {searchRequests++;const q=new URL(url).searchParams.get('q');await new Promise(r=>setTimeout(r,q==='old'?180:10));return route.fulfill({json:[{name:q,url:'/product/',image:'',price:'10',sku:q}]});}
  if(url.includes('/assets/icons/')) return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('theme/codela-storefront/assets/icons/'+new URL(url).pathname.split('/').at(-1),'utf8')});
  return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>.screen-reader-text{position:absolute!important;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}${css}</style></head><body>${activeHeader}<main style="height:3200px;padding:30px">Store content</main>${footer}</body></html>`});
 });
 await page.goto('https://store.test/');
 const surfaces=await page.locator('.sf-header').evaluate(header=>{
   const brand=header.querySelector('.sf-brand');
   const menu=header.querySelector('.sf-header-menu .sf-ui-icon-button');
   const a=getComputedStyle(brand),b=getComputedStyle(menu);
   return {brandRadius:a.borderRadius,menuRadius:b.borderRadius,
     brandBg:a.backgroundColor,menuBg:b.backgroundColor,
     brandHeight:brand.getBoundingClientRect().height,menuHeight:menu.getBoundingClientRect().height,
     menuVariant:menu.classList.contains('sf-ui-icon-button--soft'),
     headerBorder:getComputedStyle(header).borderBottomWidth};
 });
 assert(surfaces.menuVariant,'Header menu uses shared soft control');
 assert.equal(surfaces.brandRadius,'999px');
 assert.equal(surfaces.menuRadius,'999px');
 assert(surfaces.brandHeight>=44&&surfaces.menuHeight>=44,'Independent surfaces keep touch target');
 assert.notEqual(surfaces.brandBg,'rgba(0, 0, 0, 0)');
 assert.equal(surfaces.brandBg,surfaces.menuBg,'Brand and menu share header surface');
 assert.equal(surfaces.headerBorder,'0px','Header background is not one solid bar');

 // Fixed header leaves text clearance, while the home hero begins at the top.
 assert.equal(await page.locator('.sf-header').evaluate(el=>getComputedStyle(el).position),'fixed');
 assert.equal(surfaces.menuBg,'rgba(247, 247, 249, 0.96)','Header material must obscure text beneath');
 const materials=await page.locator('.sf-brand,.sf-header-menu .sf-ui-icon-button,.sf-header .sf-actions,.sf-dock-surface').evaluateAll(nodes=>nodes.map(el=>({name:el.className,bg:getComputedStyle(el).backgroundColor,image:getComputedStyle(el).backgroundImage,blur:getComputedStyle(el).backdropFilter,shadow:getComputedStyle(el).boxShadow})));
 for(const material of materials){
   assert.equal(material.bg,surfaces.brandBg,'Floating surfaces must share one tint: '+material.name);
   assert.equal(material.image,'none','No stacked white gradient on '+material.name);
   assert(material.blur.includes('blur(10px)'),'Shared subtle blur survives on '+material.name);
   assert.notEqual(material.shadow,'none','Shadow separates surface from white content: '+material.name);
 }
 assert.equal(await page.locator('.sf-dock-surface').evaluate(el=>getComputedStyle(el).borderTopColor),'rgba(0, 0, 0, 0)','Dock has no solid perimeter stroke');
 const dockLabels=await page.locator('.sf-dock-item>span:last-child').evaluateAll(xs=>xs.map(el=>({font:getComputedStyle(el).fontSize,weight:getComputedStyle(el).fontWeight,color:getComputedStyle(el).color,clipped:el.scrollWidth>el.clientWidth})));
 for(const label of dockLabels){
  assert.equal(label.font,'11px','Dock label is readable');
  assert.equal(label.weight,'600','Dock label has sufficient stroke weight');
  assert.equal(label.color,'rgb(28, 28, 30)','Dock foreground uses shared dark ink');
  assert(!label.clipped,'Dock label fits its layout slot');
 }
 await page.evaluate(()=>{
   document.body.classList.add('home');
   const main=document.querySelector('main');main.classList.add('sf-content');main.style.padding='0';
   main.innerHTML='<div class="sf-hero"><div class="sf-hero-art" style="height:500px;background:#ddd"></div></div>';
   const link=document.querySelector('.sf-brand a');
   link.innerHTML='<img class="custom-logo" alt="Brand" width="95" height="28" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2295%22 height=%2228%22/%3E">';
 });
 assert.equal(await page.locator('.sf-hero').evaluate(el=>el.getBoundingClientRect().top),0,'Hero reaches page top');
 const logoGeometry=await page.locator('.sf-brand').evaluate(el=>{
   const box=el.getBoundingClientRect(),img=el.querySelector('img').getBoundingClientRect();
   return {delta:Math.abs(box.top+box.height/2-img.top-img.height/2),filter:getComputedStyle(el.querySelector('img')).filter};
 });
 assert(logoGeometry.delta<1,'Logo is vertically centered without inline baseline gap');
 assert.equal(logoGeometry.filter,'none','Custom logo colors are preserved');
 const brandPadding=await page.locator('.sf-brand').evaluate(el=>getComputedStyle(el).paddingLeft);
 assert.equal(brandPadding,'8px','Brand surface uses compact symmetric horizontal padding');
 await page.evaluate(()=>window.scrollTo(0,200));
 assert.equal(await page.locator('.sf-header').evaluate(el=>el.getBoundingClientRect().top),0,'Header stays fixed on scroll');
 await page.evaluate(()=>{window.scrollTo(0,0);document.body.classList.remove('home');});
 assert.equal(await page.locator('main').evaluate(el=>el.getBoundingClientRect().top),68,'Text pages retain header clearance');

 const footerMetrics = await page.locator('.sf-footer').evaluate(root => {
   const inner = root.querySelector('.sf-footer-inner');
   const copy = root.querySelector('.sf-footer-copy').getBoundingClientRect();
   const links = root.querySelector('.sf-footer-links').getBoundingClientRect();
   return {topDifference:Math.abs(copy.top-links.top),overlaps:copy.right > links.left,
     nowrap:getComputedStyle(inner).flexWrap,rows:root.querySelectorAll('.sf-footer-inner').length};
 });
 assert.equal(footerMetrics.rows,1,'One-line footer wrapper');
 assert.equal(footerMetrics.nowrap,'nowrap','Footer must not wrap on mobile screen');
 assert.ok(footerMetrics.topDifference<3,'Copyright and legal links share the same mobile row');
 assert.equal(footerMetrics.overlaps,false,'Mobile footer text must not collide with legal links');
 await page.addScriptTag({content:js});
 await page.evaluate(()=>{
   document.addEventListener('click',event=>{const trigger=event.target.closest('[data-wp-on--click]');if(trigger)window.sfActions[trigger.getAttribute('data-wp-on--click').split('.')[1]](event);});
   window.focusLog=[];document.addEventListener('focusin',e=>window.focusLog.push(e.target.id));
 });
 // Read the cart count on Home without first opening the cart.
 await page.waitForFunction(()=>document.querySelector('.sf-mobile-dock .sf-badge')?.textContent==='1');
 assert.equal(await page.locator('.sf-header .sf-badge').textContent(),'1','Header and dock share count');
 assert.equal(await page.locator('#sf-panel').getAttribute('open'),null,'Count arrives while Cart remains closed');
 const badgePosition=await page.locator('.sf-mobile-dock .sf-ui-icon-badged').evaluate(root=>{
  const icon=root.querySelector('.sf-icon').getBoundingClientRect(),badge=root.querySelector('.sf-badge').getBoundingClientRect();
  return {x:Math.abs(badge.left+badge.width/2-icon.right),y:badge.top-icon.top};
 });
 assert(badgePosition.x<4 && badgePosition.y<0,'Badge is anchored to the bag glyph');
 cart.items_count=3;
 await page.evaluate(()=>document.body.dispatchEvent(new Event('wc-blocks_added_to_cart')));
 await page.waitForFunction(()=>document.querySelector('.sf-mobile-dock .sf-badge')?.textContent==='3');
 assert.equal(await page.locator('.sf-header .sf-badge').textContent(),'3','Woo events refresh both counters');
 cart.items_count=1;
 await page.evaluate(()=>document.body.dispatchEvent(new Event('wc-blocks_added_to_cart')));
 await page.waitForFunction(()=>document.querySelector('.sf-mobile-dock .sf-badge')?.textContent==='1');
 const dock=page.locator('.sf-mobile-dock');
 assert.deepEqual(await dock.locator('a').evaluateAll(xs=>xs.map(x=>x.dataset.dockView)),['home','search','cart','account']);
 const click=async view=>page.locator(`.sf-mobile-dock [data-dock-view="${view}"]`).click();
 // Moving the same dock into/out of the native modal must not teleport selection.
 const capsule=()=>page.locator('.sf-dock-surface').evaluate(el=>{
  const style=getComputedStyle(el,'::before');return {x:new DOMMatrix(style.transform).e,width:parseFloat(style.width)};
 });
 await page.evaluate(()=>window.sfActions.search());
 await page.waitForTimeout(55);
 const openingSlide=await capsule();
 assert(openingSlide.x>0 && openingSlide.x<openingSlide.width-1,'Opening popup slides through an intermediate position');
 await page.waitForTimeout(280);
 assert(Math.abs((await capsule()).x-openingSlide.width)<1,'Popup selection settles at Search');
 await page.evaluate(()=>window.sfActions.close());
 await page.waitForTimeout(55);
 const closingSlide=await capsule();
 assert(closingSlide.x>0 && closingSlide.x<closingSlide.width-1,'Returning dock slides toward the page selection');
 await page.waitForTimeout(280);
 assert(Math.abs((await capsule()).x)<1,'Return settles at Home');
 // Moving inside one icon slot also moves the capsule; it is not an integer hop.
 for(const [fraction,type] of [[.43,'touchstart'],[.46,'touchmove']]){
  await page.evaluate(({fraction,type})=>{
   const dock=document.querySelector('.sf-mobile-dock'),bounds=dock.getBoundingClientRect();
   const target=dock.querySelector('[data-dock-view="home"]'),box=target.getBoundingClientRect();
   const emit=(type,x)=>{const touch=new Touch({identifier:81,target,clientX:x,clientY:box.top+box.height/2});target.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:[touch],changedTouches:[touch]}));};
   if(type==='touchstart')emit('touchstart',box.left+box.width/2);
   emit('touchmove',bounds.left+bounds.width*fraction);
  },{fraction,type});
  const tracked=await capsule();
  assert(Math.abs(tracked.x/tracked.width-(fraction*4-.5))<.02,'Capsule continuously follows finger position');
 }
 await page.locator('[data-dock-view="home"]').evaluate(el=>el.dispatchEvent(new TouchEvent('touchcancel',{bubbles:true})));
 await page.waitForTimeout(280);
 assert(Math.abs((await capsule()).x)<1,'Cancel slides back without navigating');
 // A physical touch previews the touched capsule immediately; cancelling restores the active tab.
 await page.evaluate(()=>{
  const target=document.querySelector('[data-dock-view="search"]'), b=target.getBoundingClientRect();
  const touch=new Touch({identifier:71,target,clientX:b.left+b.width/2,clientY:b.top+b.height/2});
  target.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[touch],changedTouches:[touch]}));
 });
 await page.waitForTimeout(140);
 const pressed=await page.locator('.sf-dock-surface').evaluate(el=>{
  const dock=el.closest('.sf-mobile-dock'),s=getComputedStyle(el,'::before');
  return {scale:new DOMMatrix(s.transform).a,wholeScale:parseFloat(getComputedStyle(el).scale),index:dock.style.getPropertyValue('--sf-dock-index'),blur:getComputedStyle(el).backdropFilter,bg:getComputedStyle(el).backgroundColor};
 });
 assert(pressed.scale>1.02 && pressed.scale<1.08,'Touch expands the background capsule');
 assert(Math.abs(pressed.wholeScale-1.018)<.001,'Touch also expands the whole floating surface');
 assert.equal(pressed.bg,surfaces.menuBg,'Dock shares the transparent Header material');
 assert.equal(pressed.index,'1','Touch previews the touched tab before navigation');
 assert.equal(await page.locator('#sf-panel').getAttribute('open'),null,'Press alone never opens a panel');
 assert(pressed.blur.includes('blur('),'Glass surface uses one backdrop blur layer');
 if(process.env.DOCK_QA)await page.screenshot({path:process.env.DOCK_QA});
 await page.evaluate(()=>document.querySelector('[data-dock-view="search"]').dispatchEvent(new TouchEvent('touchcancel',{bubbles:true})));
 await page.waitForTimeout(240);
 await page.waitForTimeout(220);
 const released=await page.locator('.sf-dock-surface').evaluate(el=>({scale:new DOMMatrix(getComputedStyle(el,'::before').transform).a,wholeScale:parseFloat(getComputedStyle(el).scale),index:el.closest('.sf-mobile-dock').style.getPropertyValue('--sf-dock-index')}));
 assert.equal(released.scale,1,'Cancel releases capsule expansion');
 assert.equal(released.wholeScale,1,'Cancel settles the whole surface');
 assert.equal(released.index,'0','Cancel restores the original active tab');
 // mobile browser can delay its native click after touchend. The capsule must not return home in that gap.
 for(const [view,index] of [['cart','2'],['search','1']]){
  await page.evaluate(view=>{
   const target=document.querySelector(`[data-dock-view="${view}"]`), b=target.getBoundingClientRect();
   const touch=new Touch({identifier:72,target,clientX:b.left+b.width/2,clientY:b.top+b.height/2});
   target.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[touch],changedTouches:[touch]}));
   target.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:[touch]}));
  },view);
  await page.waitForTimeout(100);
  assert.equal(await dock.evaluate(el=>el.style.getPropertyValue('--sf-dock-index')),index,'Release retains destination before native click');
  assert.equal(await dock.evaluate(el=>el.classList.contains('is-pressing')),false,'Release clears only press expansion');
  await page.locator(`[data-dock-view="${view}"]`).evaluate(el=>el.click());
  assert.equal(await dock.evaluate(el=>el.style.getPropertyValue('--sf-dock-index')),index,'Panel opens without bouncing the capsule back');
 }
 await page.locator('.sf-search-cancel').click();


 await click('search');
 assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('sf-search-cancel')),true);
 assert.equal(await page.locator('#sf-panel .sf-mobile-dock').count(),1);
 assert.equal(await page.locator('.sf-dock-item.is-active').getAttribute('data-dock-view'),'search');
 await page.locator('#sf-query').fill('old');
 await page.waitForTimeout(190);
 await page.locator('#sf-query').fill('new');
 await page.waitForTimeout(400);
 assert.equal(await page.locator('.sf-result h3').innerText(),'new','Latest result wins');
 await click('cart');
 await page.waitForTimeout(50);
 assert.equal(await page.locator('.sf-dock-item.is-active').getAttribute('data-dock-view'),'cart');
 assert.equal(await page.locator('.sf-cart-bottom').isVisible(),true);
 assert.equal(await page.locator('.sf-cart-row .sf-cart-price').count(),1,'Cart price has a layout hook');
 assert.equal(await page.locator('.sf-cart-bottom .sf-ui-button--primary').count(),1,'Checkout uses shared Button');
 const checkoutWidth=await page.locator('.sf-cart-bottom .sf-ui-button').evaluate(el=>{
  const parent=el.parentElement,style=getComputedStyle(parent);
  return {
   width:el.getBoundingClientRect().width,
   contentWidth:parent.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),
   fontSize:parseFloat(getComputedStyle(el).fontSize)
  };
 });
 assert(Math.abs(checkoutWidth.width-checkoutWidth.contentWidth)<2,'Checkout fills its summary content area');
 assert(checkoutWidth.fontSize<=16,'Compact checkout uses shared typography');
 // Cart content and summary share an axis, including the centered desktop CTA.
 await page.waitForTimeout(350);
 const title=await page.locator('.sf-cart-row h3 a').innerText();
 for(const width of [320,390,700,1280]){
  await page.setViewportSize({width,height:844});
  await page.locator('.sf-cart-row h3 a').evaluate(el=>el.textContent='Uzun ürün adı / Natural Canvas Everyday Collection '+ 'ABC'.repeat(30));
  const layout=await page.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   const body=document.querySelector('#sf-cart');
   return {row:rect('.sf-cart-row'),summary:rect('.sf-subtotal'),cta:rect('.sf-cart-bottom .sf-ui-button'),
    stepper:rect('.sf-stepper'),remove:rect('.sf-remove'),detail:rect('.sf-cart-detail'),photo:rect('.sf-cart-photo'),
    buttons:[...document.querySelectorAll('.sf-stepper button,.sf-remove')].map(el=>el.getBoundingClientRect().toJSON()),
    overflow:body.scrollWidth>body.clientWidth};
  });
  assert(Math.abs(layout.photo.y-layout.detail.y)<1&&Math.abs(layout.photo.height-layout.detail.height)<1,'Product image and content share top and bottom at '+width);
  assert(!layout.overflow,'Long cart title does not cause horizontal scrolling at '+width);
  assert(Math.abs(layout.row.x-layout.summary.x)<1,'List and summary share left edge at '+width);
  assert(Math.abs(layout.row.x-layout.cta.x)<1,'Checkout is centered on list axis at '+width);
  assert(Math.abs(layout.row.width-layout.cta.width)<1,'Checkout and list share width at '+width);
  assert(Math.abs(layout.stepper.y+layout.stepper.height/2-layout.remove.y-layout.remove.height/2)<1,'Quantity and removal share baseline at '+width);
  for(const button of layout.buttons)assert(button.width>=43.99&&button.height>=43.99,'Cart touch targets remain at least 44px');
  assert(layout.remove.x+layout.remove.width<=layout.detail.x+layout.detail.width+1,'Actions stay inside item');
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('.sf-cart-row h3 a').evaluate((el,title)=>el.textContent=title,title);
 if(process.env.QA_CART)await page.screenshot({path:process.env.QA_CART});
 // A long list scrolls behind neither the summary nor the dock, even on short screens.
 await page.evaluate(()=>{
  const root=document.querySelector('#sf-cart-items'),row=root.firstElementChild;
  for(let i=0;i<8;i++)root.append(row.cloneNode(true));
 });
 await page.setViewportSize({width:390,height:568});
 const scrolling=await page.evaluate(()=>{
  const body=document.querySelector('#sf-cart'),summary=document.querySelector('.sf-cart-bottom');
  body.scrollTop=body.scrollHeight;
  const last=body.querySelector('.sf-cart-row:last-child').getBoundingClientRect();
  const cta=summary.querySelector('.sf-ui-button').getBoundingClientRect();
  const dock=document.querySelector('.sf-dock-surface').getBoundingClientRect();
  return {scrollable:body.scrollHeight>body.clientHeight,lastBottom:last.bottom,
   bodyBottom:body.getBoundingClientRect().bottom,summaryTop:summary.getBoundingClientRect().top,
   ctaBottom:cta.bottom,dockTop:dock.top};
 });
 assert(scrolling.scrollable,'Long cart retains an independent scroll area');
 assert(scrolling.lastBottom<=scrolling.bodyBottom+1&&scrolling.bodyBottom<=scrolling.summaryTop+1,'Last item remains reachable above summary');
 assert(scrolling.ctaBottom<scrolling.dockTop,'Dock does not cover checkout');
 await page.evaluate(()=>{const root=document.querySelector('#sf-cart-items');while(root.children.length>1)root.lastElementChild.remove();});
 await page.setViewportSize({width:390,height:844});
 const fetched=cartRequests;
 await click('cart');
 assert.equal(cartRequests,fetched,'Current tab is a no-op');
 await click('search');
 await page.locator('#sf-query').focus();
 await page.locator('.sf-search-cancel').click();
 await page.evaluate(()=>{window.focusLog=[]});
 await click('search');
 assert(!(await page.evaluate(()=>window.focusLog)).includes('sf-query'),'Reopening must never briefly focus query');
 await page.locator('.sf-search-cancel').click();
 // Guest Account shares Search/Cart's native modal and Woo form.
 await click('account');
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true,'Guest Account opens dialog');
 assert.equal(await page.locator('#sf-account').isVisible(),true,'WooCommerce login is the active section');
 assert.equal(await page.locator('#sf-account form.woocommerce-form-login').count(),1,'Native login form retained');
 const compactAuth=await page.locator('#sf-account').evaluate(root=>{
  const input=root.querySelector('#test-login-username').getBoundingClientRect();
  const label=root.querySelector('label[for="test-login-username"]').getBoundingClientRect();
  const remember=root.querySelector('.woocommerce-form-login__rememberme').getBoundingClientRect();
  const forgot=root.querySelector('.lost_password').getBoundingClientRect();
  const submit=root.querySelector('button[type=submit]');
  return {inlineLabel:label.top>=input.top && label.bottom<input.bottom-12,
   sameLine:Math.abs(remember.top+remember.height/2-forgot.top-forgot.height/2)<10,
   submitBg:getComputedStyle(submit).backgroundColor,
   fieldHeight:input.height,
   fieldBackground:getComputedStyle(root.querySelector('#test-login-username')).backgroundColor,
   submitHeight:submit.getBoundingClientRect().height,
   submitMinHeight:getComputedStyle(submit).minHeight,
   toolbarTitleSize:getComputedStyle(document.querySelector('#sf-panel-title')).fontSize,
   bodyPaddingTop:parseFloat(getComputedStyle(root).paddingTop),
   toolbarBottom:document.querySelector('#sf-panel .sf-panel-top').getBoundingClientRect().bottom,
   formTop:root.querySelector('form.woocommerce-form-login').getBoundingClientRect().top,
   subtitle:root.textContent.includes('Manage your orders and account details.')};
 });
 assert(compactAuth.inlineLabel,'Modal native field label stays inside input');
 assert(compactAuth.sameLine,'Modal remember and password recovery share a row');
 assert.equal(compactAuth.submitBg,'color(srgb 0.145098 0.152941 0.164706 / 0.9)','Native modal submit uses shared primary Button');
 assert(compactAuth.fieldHeight>=54&&compactAuth.fieldHeight<=56,'Popup fields preserve the shared 54px input height');
 assert.equal(compactAuth.fieldBackground,'rgb(255, 255, 255)','Actual guest modal fields are clean and white');
 assert.equal(compactAuth.submitMinHeight,'52px','Popup submit uses shared compact 52px Button token');
 assert(compactAuth.submitHeight>=52&&compactAuth.submitHeight<=54,'Popup submit keeps accessible compact touch target');
 assert.equal(compactAuth.toolbarTitleSize,'23px','Existing popup title uses the agreed 23px type');
 assert(compactAuth.bodyPaddingTop<=20,'Login form stays close to the shared dialog toolbar');
 assert(compactAuth.formTop-compactAuth.toolbarBottom<70,'Popup form avoids oversized blank space below toolbar');
 assert.equal(compactAuth.subtitle,false,'Account popup has no descriptive subtitle');
 assert.equal(await page.locator('#sf-account form.woocommerce-form-login').getAttribute('action'),'https://store.test/myaccount/','Login submits to genuine Account URL');
 assert.equal(page.url(),'https://store.test/','Guest Account does not reload');
 await page.locator('#sf-account .sf-overlay-auth').evaluate((element,markup)=>element.insertAdjacentHTML('beforeend',markup),googleDisabled);
 const visualGoogle=await page.locator('#sf-account .sf-auth-google').evaluate(el=>{
  const button=el.getBoundingClientRect(),label=el.querySelector('.sf-ui-button-label').getBoundingClientRect();
  const glyph=el.querySelector('.sf-google-glyph').getBoundingClientRect();
  return {mode:getComputedStyle(el).display,centerError:Math.abs((label.left+label.width/2)-(button.left+button.width/2)),
   iconGap:label.left-glyph.right,buttonHeight:button.height};
 });
 assert.equal(visualGoogle.mode,'grid','Live Account panel applies shared Google grid alignment');
 assert(visualGoogle.centerError<1,'Google label is precisely centered in actual dialog');
 assert(visualGoogle.iconGap>=7&&visualGoogle.iconGap<=14,'Google icon and text have consistent nonoverlapping gap');
 assert(visualGoogle.buttonHeight>=52&&visualGoogle.buttonHeight<=54,'Google retains shared compact touch target');
 await page.locator('#sf-account .sf-auth-google').click();
 assert.equal(await page.locator('#sf-google-setup-notice').evaluate(el=>el.matches(':popover-open')),true,
  'Setup notice is visible inside the actual Account dialog');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#sf-google-setup-notice').evaluate(el=>el.matches(':popover-open')),false,
  'Setup notice closes without closing the Account dialog');
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true,'Account dialog remains open after dismissing Google tip');

 await click('search');
 assert.equal(await page.locator('#sf-account').isVisible(),false,'Search hides Account in same dialog');
 await click('account');
 assert.equal(await page.locator('#sf-account').isVisible(),true,'Account returns without page load');
 await click('home');
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Home dismisses guest Account');
 // On the already-rendered Home page, Search/Cart -> Home must just close.
 await page.evaluate(()=>{window.samePageDocumentMarker='home';});
 for(const popup of ['search','cart']){
  await click(popup);
  assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true);
  await click('home');
  assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Current Home closes '+popup);
  assert.equal(await page.evaluate(()=>window.samePageDocumentMarker),'home','Current Home must not reload after '+popup);
  assert.equal(page.url(),'https://store.test/');
  assert.equal(await page.locator('.sf-dock-item.is-active').getAttribute('data-dock-view'),'home');
 }
 // Gesture dispatch uses real DOM listeners and actual layout, not mock tabs.
 async function scrub(from,to,outside=false,hold=false){
  await page.evaluate(async ({from,to,outside,hold})=>{
   const tabs=[...document.querySelectorAll('.sf-dock-item')];const a=tabs[from].getBoundingClientRect(), b=tabs[to].getBoundingClientRect();
   const x=a.left+a.width/2,y=a.top+a.height/2;const target=tabs[from];
   const emit=(type,cx,cy,end=false)=>{const touch=new Touch({identifier:42,target,clientX:cx,clientY:cy});target.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:end?[]:[touch],changedTouches:[touch],targetTouches:end?[]:[touch]}));};
   emit('touchstart',x,y);if(hold)await new Promise(r=>setTimeout(r,260));emit('touchmove',b.left+b.width/2,y);emit('touchend',b.left+b.width/2,outside?y-130:y,true);
  },{from,to,outside,hold});
 }
 await scrub(0,3);
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true,'Account gesture opens modal');
 assert.equal(await page.locator('#sf-account').isVisible(),true,'Scrub displays native Woo login');
 await scrub(3,0);
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Home gesture closes Account');
 await scrub(0,2);
 assert.equal(await page.locator('#sf-panel').getAttribute('open'),'','Scrub opens modal instead of leaving page');
 assert.equal(page.url(),'https://store.test/');
 assert.equal(await page.locator('.sf-dock-item.is-active').getAttribute('data-dock-view'),'cart');
 await scrub(2,1,false,true);
 assert.equal(await page.locator('.sf-dock-item.is-active').getAttribute('data-dock-view'),'search');
 await scrub(1,2,true);
 assert.equal(await page.locator('.sf-dock-item.is-active').getAttribute('data-dock-view'),'search','Outside release cancels');
 await page.locator('.sf-search-cancel').click();
 await click('search');
 await scrub(1,0);
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Scrubbing to current Home closes popup');
 assert.equal(await page.evaluate(()=>window.samePageDocumentMarker),'home','Scrub close never reloads Home');
 // Freeze the real CSS transition mid-flight: it must move AND shrink while still visible.
 await page.evaluate(()=>document.querySelector('.sf-mobile-dock').classList.add('is-collapsed'));
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 const shrinking=await page.locator('.sf-dock-surface').evaluate(el=>{
  for(const a of el.getAnimations()){a.pause();a.currentTime=150;}
  const style=getComputedStyle(el), matrix=new DOMMatrix(style.transform);
  return {scale:matrix.a,y:matrix.f,opacity:Number(style.opacity)};
 });
 assert(shrinking.scale<.99 && shrinking.scale>.48 && shrinking.y>0 && shrinking.opacity>.9,'Visible downward shrinking phase');
 await page.locator('.sf-dock-surface').evaluate(el=>el.getAnimations().forEach(a=>a.finish()));
 await page.evaluate(()=>document.querySelector('.sf-mobile-dock').classList.remove('is-collapsed'));
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 const growing=await page.locator('.sf-dock-surface').evaluate(el=>{
  for(const a of el.getAnimations()){a.pause();a.currentTime=180;}
  const s=getComputedStyle(el),m=new DOMMatrix(s.transform);
  return {scale:m.a,y:m.f,opacity:Number(s.opacity)};
 });
 assert(growing.scale>.48 && growing.scale<1 && growing.y>0 && growing.opacity>.9,'Visible upward growing phase');
 await page.locator('.sf-dock-surface').evaluate(el=>el.getAnimations().forEach(a=>a.finish()));
 // Safe-area travel, cumulative slow scroll, native scroll restoration, resize.
 await page.evaluate(()=>{document.activeElement.blur();document.querySelector('.sf-mobile-dock').style.setProperty('--sf-dock-bottom','46px');window.scrollTo(0,100)});
 await page.waitForTimeout(50);
 await page.evaluate(()=>document.querySelector('.sf-dock-handle').click());
 for(let y=102;y<=190;y+=2){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(20);}
 await page.waitForTimeout(760);
 assert(await dock.evaluate(el=>el.classList.contains('is-collapsed')),'Slow scroll accumulates after minimum rest time');
 await page.waitForTimeout(520);
 assert(await dock.locator('a').evaluateAll(xs=>xs.every(x=>x.getBoundingClientRect().top>=innerHeight)),'All tabs move beyond safe-area viewport');
 assert(await page.locator('.sf-dock-handle').isVisible(),'Only reveal handle remains');
 const handleGeometry=await page.locator('.sf-dock-handle').evaluate(el=>{
  const box=el.getBoundingClientRect(), line=getComputedStyle(el,'::after');
  return {height:box.height,bottom:box.bottom,lineY:new DOMMatrix(line.transform).f};
 });
 assert(handleGeometry.height>=44 && handleGeometry.bottom<=844,'Reveal touch target stays within viewport');
 assert.equal(handleGeometry.lineY,12,'Reveal line sits 12px lower without moving the touch target');
 await page.locator('.sf-dock-handle').click();
 assert(!(await dock.evaluate(el=>el.classList.contains('is-collapsed'))));
 await click('search');
 await page.locator('.sf-search-cancel').click();
 assert.equal(await page.evaluate(()=>scrollY),190,'Close restores exact scroll');
 await page.evaluate(()=>window.scrollTo(0,0));
 // The same button is reparented at an identical viewport position while it morphs.
 for(const width of [320,390,700,1024]){
  await page.setViewportSize({width,height:844});
  const trigger=page.locator('.sf-header-menu .sf-menu-trigger'),box=await trigger.boundingBox();
  await trigger.evaluate(el=>el.dataset.testIdentity='original-control');
  await trigger.click();
  const moved=page.locator('#sf-panel > .sf-menu-trigger'),x=await moved.boundingBox();
  assert.equal(await moved.getAttribute('data-test-identity'),'original-control','The original node enters the dialog');
  assert(Math.abs(box.x-x.x)<1&&Math.abs(box.y-x.y)<1,'Menu/X stay at the same point at '+width);
  assert.equal(await page.locator('.sf-panel-top .sf-close').isVisible(),false,'The menu has no second X');
  assert.equal(await moved.getAttribute('aria-expanded'),'true');
  await page.waitForTimeout(310);
  const strokes=await moved.locator('.sf-menu-mark > span').evaluateAll(xs=>xs.map(el=>getComputedStyle(el).transform));
  assert(strokes.every(x=>x!=='none'),'The two lines turn into an X');
  assert.equal(await dock.isVisible(),false,'Menu hides the dock');
  await moved.click();
  assert.equal(await moved.getAttribute('aria-expanded'),'false','Tapping X reverses its motion');
  await page.locator('#sf-panel').waitFor({state:'hidden'});
  assert.equal(await trigger.count(),1,'The node returns to the header');
  assert.equal(await page.locator('.sf-menu-trigger').count(),1,'Never duplicate the menu button');
  if(width<=700){await click('search');const searchX=await page.locator('.sf-search-cancel').boundingBox();assert(Math.abs(box.x-searchX.x)<1);assert(Math.abs(box.y-searchX.y)<1);await page.locator('.sf-search-cancel').click();}
  assert.equal(await page.evaluate(()=>scrollY),0);
 }
 await page.setViewportSize({width:390,height:844});
 // Menu opening/closing is animated; reopening cancels a pending close.
 await page.evaluate(()=>window.sfActions.menu());
 assert(await page.locator('#sf-menu').evaluate(el=>el.getAnimations().length>0),'Menu content has opening animation');
 await page.waitForTimeout(280);
 await page.evaluate(()=>window.sfActions.close());
 assert(await page.locator('#sf-panel').evaluate(el=>el.open),'Menu stays open during icon reverse morph');
 await page.evaluate(()=>window.sfActions.menu());
 await page.waitForTimeout(220);
 assert(await page.locator('#sf-panel').evaluate(el=>el.open),'Reopen cancels pending menu close');
 await page.evaluate(()=>window.sfActions.close());
 await page.locator('#sf-panel').waitFor({state:'hidden'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await dock.evaluate(el=>el.classList.add('is-pressing'));
 assert.equal(await page.locator('.sf-dock-surface').evaluate(el=>getComputedStyle(el).scale),'1','Reduced motion disables whole-dock expansion');
 await dock.evaluate(el=>el.classList.remove('is-pressing'));
 await page.evaluate(()=>window.sfActions.menu());
 assert.equal(await page.locator('#sf-menu').evaluate(el=>el.getAnimations().length),0);
 await page.evaluate(()=>window.sfActions.close());
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Reduced motion closes immediately');
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Rapid switching cancels old animation, leaves one active section, no modal flicker.
 await page.evaluate(()=>{for(let i=0;i<12;i++)window.sfActions[i%2?'cart':'search']();});
 await page.waitForTimeout(180);
 assert.equal(await page.locator('.sf-panel-body:not([hidden])').count(),1);
 assert.equal(await page.locator('#sf-panel .sf-mobile-dock').count(),1);
 await page.emulateMedia({reducedMotion:'reduce'});
 await click('search');
 assert.equal(await page.locator('.sf-search-content').evaluate(el=>el.getAnimations().length),0);
 await page.locator('.sf-search-cancel').click();
 // Simulate WordPress mobile admin toolbar and verify lock/restore at a scrolled offset.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{
  const bar=document.createElement('div');bar.id='wpadminbar';bar.style.cssText='position:absolute;top:0;left:0;height:46px;width:100%;background:#222;z-index:99999';document.body.prepend(bar);
  document.documentElement.style.marginTop='46px';window.scrollTo(0,20);
 });
 await page.waitForTimeout(40);
 const before=await page.locator('#wpadminbar').boundingBox();
 await click('search');
 const during=await page.locator('#wpadminbar').boundingBox();
 assert(Math.abs(before.y-during.y)<1,'Admin bar stays put while body locks');
 assert.equal(await page.locator('#sf-panel').evaluate(el=>el.getBoundingClientRect().top),26);
 // Panel scrolling must also hide/reveal dock; bounce at the bottom cannot reverse it.
 await page.evaluate(()=>{document.querySelector('#sf-results').style.height='2400px';document.querySelector('#sf-search').scrollTop=40});
 await page.waitForTimeout(30);
 await page.evaluate(()=>document.querySelector('#sf-search').scrollTop=150);
 await page.waitForTimeout(520);
 assert(await dock.evaluate(el=>el.classList.contains('is-collapsed')));
 await page.evaluate(()=>document.querySelector('#sf-search').scrollTop=110);
 await page.waitForTimeout(760);
 assert(!(await dock.evaluate(el=>el.classList.contains('is-collapsed'))));
 if(process.env.QA_SCREENSHOT) await page.screenshot({path:process.env.QA_SCREENSHOT});
 await page.locator('.sf-search-cancel').click();
 assert.equal(await page.evaluate(()=>scrollY),20);
 assert.equal(await page.locator('#wpadminbar').evaluate(el=>el.style.position),'absolute');
 // Disabled mobile dock uses the very same three header tools as desktop.
 // Full page loads start at their server-rendered selection, before any JavaScript.
 assert.equal(accountHeader.includes('data-panel="account"'),false,'Logged-in account remains real page link');
 for(const [markup,path,index] of [[accountHeader,'myaccount/edit-address',3],[header,'home',0]]){
  activeHeader=markup;
  await page.goto('https://store.test/'+path);
  const initial=await page.locator('.sf-dock-surface').evaluate(el=>{
   const style=getComputedStyle(el,'::before');
   return {x:new DOMMatrix(style.transform).e,width:parseFloat(style.width),opacity:Number(style.opacity)};
  });
  assert(Math.abs(initial.x-initial.width*index)<1,'Capsule is already on the correct tab before JS');
  assert.equal(initial.opacity,1,'Initial selection is visible immediately');
  await page.addScriptTag({content:js});
  await page.waitForFunction(()=>document.querySelector('.sf-mobile-dock .sf-badge')?.textContent==='1');
  assert.equal(await page.locator('#sf-panel').getAttribute('open'),null,'Badge starts on other pages without Cart');
  await page.waitForTimeout(30);
  assert.equal(await page.locator('.sf-dock-surface').evaluate(el=>el.getAnimations().filter(a=>a.transitionProperty==='transform').length),0,'JS hydration must not slide the capsule from the left');
  if(index===3){
   await page.evaluate(()=>window.samePageDocumentMarker='account-subpage');
   for(const popup of ['search','cart']){
    await page.evaluate(popup=>window.sfActions[popup](),popup);
    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),true);
    await page.locator('[data-dock-view="account"]').click();
    assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Current Account closes '+popup);
    assert.equal(await page.evaluate(()=>window.samePageDocumentMarker),'account-subpage','Account subpage must not reload');
    assert.equal(page.url(),'https://store.test/myaccount/edit-address');
    assert.equal(await page.locator('.sf-dock-item.is-active').getAttribute('data-dock-view'),'account');
   }
  }
 }
 activeHeader=noDockHeader;
 await page.goto('https://store.test/no-dock');
 await page.addScriptTag({content:js});
 await page.evaluate(()=>document.addEventListener('click',event=>{const el=event.target.closest('[data-wp-on--click]');if(el)window.sfActions[el.getAttribute('data-wp-on--click').split('.')[1]](event);}));
 for(const width of [320,390,700,1024]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.locator('.sf-mobile-dock').count(),0);
  assert.equal(await page.locator('.sf-actions a:visible').count(),3);
  if(width===390 && process.env.QA_HEADER)await page.screenshot({path:process.env.QA_HEADER});
  assert.equal(await page.locator('.sf-account-link').getAttribute('href'),'https://store.test/myaccount/');
  const layout=await page.locator('.sf-header').evaluate(el=>{
   const boxes=[...el.querySelectorAll('a')].map(x=>x.getBoundingClientRect());
   return {fits:boxes.every(b=>b.left>=0&&b.right<=innerWidth&&b.width>=44),overflow:document.documentElement.scrollWidth>innerWidth,padding:parseFloat(getComputedStyle(document.body).paddingBottom)};
  });
  assert(layout.fits && !layout.overflow,'No-dock tools fit even 320px');assert.equal(layout.padding,0);
  for(const mode of ['search','cart']){
   await page.locator('.sf-header [data-panel="'+mode+'"]').click();
   assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),mode!=='search'||width<901);
   if(mode==='cart')await page.waitForTimeout(40);
   assert.equal(await page.locator('.sf-mobile-dock').count(),0);
   if(mode==='cart') assert(parseFloat(await page.locator('.sf-cart-bottom').evaluate(el=>getComputedStyle(el).paddingBottom))<80,'No phantom dock clearance');
   await page.locator(mode==='search'?'.sf-search-cancel':'.sf-panel-top .sf-close').click();
   if(mode==='cart'&&width>=901)await page.locator('#sf-panel').waitFor({state:'hidden'});
  }
 }
 assert.deepEqual(errors,[]);
 assert(searchRequests>0);
 console.log('Browser navigation: real PHP markup, 4 viewport sizes, touch/hold/outside release, scroll/safe-area, focus/reopen, API race, rapid switching and reduced motion passed.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});


