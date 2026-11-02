// Production PHP/JS/CSS; only WP/Woo boundaries are fixtures, not real-store acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright'),{snapshot}=require('./cart-race.cjs');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium',php=process.env.PHP_BIN||'php',root='theme/codela-storefront/';
const css=fs.readFileSync(root+'assets/styles/storefront-base.css','utf8')+fs.readFileSync(root+'assets/styles/catalog.css','utf8');
const theme=JSON.parse(fs.readFileSync(root+'theme.json','utf8'));
const typography=`body{font-family:${theme.settings.typography.fontFamilies[0].fontFamily};line-height:${theme.styles.typography.lineHeight}}`;
const header=execFileSync(php,['tests/render-header.php'],{encoding:'utf8'});
const cartSource=['format','cart-controller','overlay-controller'].map(n=>fs.readFileSync(root+'assets/scripts/'+n+'.js','utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'')).join('\n');
function cartData(quantity=1){
 const data=snapshot(quantity+1),item=data.items[0];
 data.items=[{...item,key:'one',name:'El yapımı seramik vazo',quantity,quantity_limits:{minimum:1,maximum:3,multiple_of:1,editable:true},images:[{thumbnail:'https://interaction.test/photo.svg'}]},
  {...item,key:'two',name:'Dekoratif kase',quantity:1,quantity_limits:{minimum:1,maximum:1,multiple_of:1,editable:false},images:[]}];
 return data;
}
async function cartChecks(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}}),requests=[],errors=[];page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://interaction.test/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.startsWith('/api/cart')){requests.push(route);return;}
  if(path.includes('/icons/'))return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+path.split('/').pop())});
  if(path.endsWith('.svg'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120"><rect width="100" height="120" fill="#d8cbbc"/></svg>'});
  return route.fulfill({contentType:'text/html',body:`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${typography}</style><body>${header.replaceAll('https://store.test','https://interaction.test')}<main>Store</main></body></html>`});
 });
 const next=async()=>{for(let n=0;n<100&&!requests.length;n++)await page.waitForTimeout(20);assert(requests.length,'Expected Store API request');return requests.shift();};
 const reply=async(data,options={})=>(await next()).fulfill({json:data,headers:{Nonce:'fixture'},...options});
 await page.goto('https://interaction.test/');
 await page.addScriptTag({content:cartSource+`
  const $=s=>document.querySelector(s);
  window.cart=createCartController({$,config:()=>({api:'https://interaction.test/api/',cart:'/cart/'}),t:s=>s,getCurrent:()=>overlay.getCurrent(),getDialog:()=>$('#sf-panel')});
  $('#sf-cart').addEventListener('click',e=>{const b=e.target.closest('[data-key],[data-remove]');if(b)cart.change(b);});
  window.overlay=createOverlayController({$,config:()=>({}),t:s=>s,cartFeature:cart,searchFeature:{cancel(){},start(){}},
   mountDock(){if(innerWidth<=900)$('#sf-panel').append($('.sf-mobile-dock'));},restoreDock(){ $('.sf-shell').append($('.sf-mobile-dock'));},
   setDockCollapsed(){},markDockActive(){},mobileDock:()=>$('.sf-mobile-dock'),dockScrollPositions:new Map(),onMenuOpen(){}});
  overlay.bind($('#sf-panel'));cart.bind();
 `});
 await page.evaluate(()=>overlay.open('cart'));
 await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));
 assert.equal(await page.locator('.sf-cart-skeleton-row').count(),2);assert.equal(await page.locator('#sf-cart').getAttribute('aria-busy'),'true');
 assert.equal(await page.locator('.sf-cart-skeleton [href],.sf-cart-skeleton button,.sf-cart-photo').count(),0,'Loading has no invented commerce action/photo');
 await page.screenshot({path:`qa/interaction/${engine}-cart-loading-${width}.png`});
 await reply(cartData());await page.locator('[data-cart-key="one"]').waitFor();assert.equal(await page.locator('#sf-cart').getAttribute('aria-busy'),'false');
 await page.locator('[data-key="one"][data-qty="2"]').focus();
 await page.evaluate(()=>{window.originalRow=document.querySelector('[data-cart-key="one"]');cart.refresh();});await reply(cartData());await page.waitForTimeout(30);
 assert(await page.evaluate(()=>originalRow===document.querySelector('[data-cart-key="one"]')),'Unchanged refresh retains actual rows/photos');
 assert(await page.locator('[data-key="one"][data-qty="2"]').evaluate(el=>el===document.activeElement),'Refresh preserves focus');
 const before=await page.locator('[data-cart-key="one"]').boundingBox();
 await page.locator('[data-key="one"][data-qty="2"]').click();await reply(cartData()); // Controlled nonce GET.
 const post=await next();assert.equal(post.request().method(),'POST');
 assert.equal(await page.locator('[data-cart-key="one"]').getAttribute('aria-busy'),'true');assert.equal(await page.locator('[data-cart-key="two"]').getAttribute('aria-busy'),'false');
 assert.equal(await page.locator('.sf-cart-busy:visible').count(),1);assert(await page.locator('.sf-cart-bottom').evaluate(el=>el.inert));
 assert.equal(await page.locator('#sf-cart button:enabled').count(),0,'Mutation remains serialized');
 const during=await page.locator('[data-cart-key="one"]').boundingBox();assert(Math.abs(before.height-during.height)<1,'Feedback does not move the row');
 assert.equal(await page.locator('[data-cart-key="one"] .sf-cart-quantity-current').textContent(),'1','No optimistic quantity');
 assert(await page.evaluate(()=>document.querySelector('#sf-cart').scrollWidth<=document.querySelector('#sf-cart').clientWidth+1),'No horizontal overflow');
 await page.screenshot({path:`qa/interaction/${engine}-cart-busy-${width}.png`});
 await post.fulfill({json:cartData(2),headers:{Nonce:'fixture'}});await page.waitForFunction(()=>document.querySelector('[data-cart-key="one"] .sf-cart-quantity-current').textContent==='2');
 assert.equal(await page.locator('.sf-cart-busy:visible').count(),0);assert.equal(await page.locator('[data-cart-key="two"] [data-key]:enabled').count(),0,'Server limits survive unlock');
 await page.locator('[data-key="one"][data-qty="3"]').click();await reply({message:'Stock unavailable',code:'stock_error'},{status:409});await reply({message:'Temporarily unavailable'},{status:503});
 await page.waitForFunction(()=>document.querySelector('#sf-cart').getAttribute('aria-busy')==='false');
 assert.equal(await page.locator('[data-cart-key="one"] .sf-cart-quantity-current').textContent(),'2');assert(await page.locator('[data-key="one"][data-qty="3"]').isEnabled(),'Failure restores controls');
 assert.equal(await page.locator('[data-cart-key="two"] [data-key]:enabled').count(),0);assert.equal(await page.locator('#sf-status').textContent(),'Stock unavailable');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion:reduce)').matches);
 assert.equal(await page.locator('.sf-cart-busy .sf-ui-spinner').first().evaluate(el=>getComputedStyle(el).animationName),'none');assert.deepEqual(errors,[]);await page.close();
}
const filters=(query,mode='category')=>JSON.parse(execFileSync(php,['tests/render-active-filters.php'],{encoding:'utf8',env:{...process.env,FIXTURE_CATALOG:mode,FIXTURE_FILTER_QUERY:query}}));
async function filterChecks(browser){
 const f=filters('min_price=0&max_price=500&filter_color=cream,black&query_type_color=or&filter_size=large&query_type_size=and&rating_filter=4,5&paged=3&product-page=2&orderby=price-desc&extension=keep%26this&add-to-cart=42');
 assert.equal(f.filters.length,7);assert(f.header.includes('Filters (7)'));
 for(const item of f.filters){const u=new URL(item.url);assert.equal(u.pathname,'/category/7/');assert.equal(u.searchParams.get('extension'),'keep&this');assert.equal(u.searchParams.get('orderby'),'price-desc');assert(!u.searchParams.has('paged')&&!u.searchParams.has('product-page')&&!u.searchParams.has('add-to-cart'));}
 const by=label=>new URL(f.filters.find(item=>item.label.includes(label)).url).searchParams;
 assert(!by('Minimum').has('min_price'));assert.equal(by('Minimum').get('max_price'),'500');assert.equal(by('Siyah').get('filter_color'),'cream');assert.equal(by('Siyah').get('query_type_color'),'or');
 assert(!by('Büyük').has('filter_size')&&!by('Büyük').has('query_type_size'));assert.equal(by('Rating: 4').get('rating_filter'),'5');
 assert.equal(filters('min_price[]=1&max_price=-2&filter_color[]=cream&rating_filter[]=5').filters.length,0);assert.equal(filters('filter_color=missing').filters.length,0);assert.equal(filters('').chips,'');
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/assets/icons/**',r=>r.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+new URL(r.request().url()).pathname.split('/').pop())}));
  await page.setContent(`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${typography}</style><body class="tax-product_cat">${f.header}<main class="sf-content"><p class="woocommerce-result-count">12 ürün</p>${f.chips}<p>Ürünler</p></main></body></html>`);
  const links=page.locator('.sf-active-filters a');assert.equal(await links.count(),7);
  for(const link of await links.all()){const box=await link.boundingBox();assert(box.height>=44&&box.x>=0&&box.x+box.width<=width+1,'44px chip, no overflow');assert((await link.getAttribute('aria-label')).startsWith('Remove filter:'));}
  assert.equal(await page.locator('.sf-filter-count').textContent(),'7');assert.equal(await page.locator('.sf-filter-count').evaluate(el=>el.closest('[data-panel]').dataset.panel),'filters');
  await links.first().focus();assert(await links.first().evaluate(el=>el===document.activeElement));await page.screenshot({path:`qa/interaction/${engine}-filters-${width}.png`});
  await page.route('https://store.test/category/7/**',r=>r.fulfill({contentType:'text/html',body:'Category response'}));
  await Promise.all([page.waitForURL(u=>u.hostname==='store.test'),page.keyboard.press('Enter')]);
  const target=new URL(page.url());assert(!target.searchParams.has('min_price'));assert.equal(target.searchParams.get('max_price'),'500');
  assert.equal(target.searchParams.get('extension'),'keep&this');await page.close();
 }
}
(async()=>{const browser=await(engine==='webkit'?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{});try{
 fs.mkdirSync('qa/interaction',{recursive:true});for(const width of [320,390,1280])await cartChecks(browser,width);await filterChecks(browser);
 console.log('Cart loading/busy, refresh identity/focus, error recovery and native filter removal/count at 3 widths passed ('+engine+').');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
