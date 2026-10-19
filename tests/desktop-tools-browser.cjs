// Actual PHP header and production controllers, with only WP directives/API boundaries supplied.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const css=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css','styles/components.css'].map(p=>fs.readFileSync(root+'assets/'+p,'utf8')).join('\n');
const controllers=['format','search-controller','cart-controller','overlay-controller','dock-controller'].map(name=>fs.readFileSync(root+'assets/scripts/'+name+'.js','utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'')).join('\n');
const js=fs.readFileSync(root+'assets/storefront.js','utf8').replace(/^import .*;$/gm,'');
const config={api:'https://store.test/api/',search:'https://store.test/search-api',cart:'/cart/',account:'/myaccount/',labels:{}};
const cart={items_count:1,items:[{key:'one',name:'Deneme ürünü',permalink:'/product/',images:[],quantity:1,totals:{line_subtotal:'1000',line_subtotal_tax:'0',currency_code:'TRY',currency_minor_unit:2}}],totals:{total_items:'1000',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}};
(async()=>{
 const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true,...(!process.env.TEST_WEBKIT&&process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 let lastPage;
 try{for(const assigned of ['0','1']){
 const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_MENU:assigned}});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 lastPage=page;
 page.on('pageerror',e=>errors.push(e.message));
 let failSearch=false;
 await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url.includes('/search-api'))return route.fulfill(failSearch?{status:500,body:'Error'}:{json:[{name:'Doğal dokular',url:'/product/',image:'',price:'10 ₺',sku:'CODELA'}]});
  if(url.includes('/api/cart'))return route.fulfill({json:cart,headers:{Nonce:'fixture'}});
  if(url.includes('/assets/icons/'))return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+new URL(url).pathname.split('/').at(-1),'utf8')});
  return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>.screen-reader-text{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}${css}</style></head><body>${header}<main id="sf-content" style="height:3200px;padding:32px">İçerik</main></body></html>`});
 });
 await page.goto('https://store.test/');
 await page.addScriptTag({content:`function store(name,options){window.sfActions=options.actions;return{state:{config:${JSON.stringify(config)}}};}\n${controllers}\n${js}`});
 await page.evaluate(()=>document.addEventListener('click',event=>{const trigger=event.target.closest('[data-wp-on--click]');if(trigger)window.sfActions[trigger.getAttribute('data-wp-on--click').split('.')[1]](event);}));
 const search=page.locator('.sf-header [data-panel=search]'),cartTrigger=page.locator('.sf-header [data-panel=cart]'),dialog=page.locator('#sf-panel');
 for(const width of [901,1024,1100,1280,1920]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,500));
  await search.click();await page.waitForTimeout(270);
  assert.equal(await dialog.evaluate(el=>el.open),false,'Desktop search has no modal');
  assert.equal(await page.locator('.sf-header #sf-query').count(),1,'Same form lives in header');
  assert.equal(await page.locator('#sf-query').count(),1,'No duplicate search');
  assert.equal(await page.evaluate(()=>document.body.style.position),'','Search never locks the document');
  assert.equal(await page.locator('#sf-query').evaluate(el=>el===document.activeElement),true,'Desktop focuses input');
  const form=await page.locator('.sf-header-search').boundingBox(),tools=await page.locator('.sf-actions').boundingBox();
  assert(form.width>200&&form.x+form.width<=tools.x,'Expanded form fits menu slot '+width);
  await page.locator('#sf-query').fill('doğal');await page.locator('.sf-result').waitFor();
  assert(await page.locator('.sf-result').isVisible());
  await page.keyboard.press('Escape');assert.equal(await page.locator('#sf-panel #sf-query').count(),1,'Original mobile slot restored');
  assert.equal(await search.getAttribute('aria-expanded'),'false');
  assert.equal(await search.evaluate(el=>el===document.activeElement),true,'Focus restored');
  assert.equal(await page.evaluate(()=>scrollY),500,'Search keeps page position');
  await cartTrigger.click();await page.waitForTimeout(320);
  const box=await dialog.boundingBox();assert(box.width<=460&&Math.abs(box.x+box.width-width)<1,'Cart is a right drawer '+width);
  assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
  await page.keyboard.press('Escape');
  assert(await dialog.evaluate(el=>el.open),'Drawer waits for exit animation');
  await dialog.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>scrollY),500,'Cart restores scroll');
 }
 await page.setViewportSize({width:1024,height:900});await search.click();
 await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(50);
 assert.equal(await page.locator('.sf-brand').evaluate(el=>el.inert),assigned==='0','Inline search re-evaluates header slots across desktop menu breakpoint');
 await page.keyboard.press('Escape');
 await search.click();await page.locator('#sf-query').fill('error');failSearch=true;
 await page.locator('.sf-retry-search').waitFor();failSearch=false;await page.locator('.sf-retry-search').click();await page.locator('.sf-result').waitFor();
 await page.mouse.click(20,180);assert.equal(await page.locator('.sf-header-search').isVisible(),false,'Outside closes inline search');
 await cartTrigger.click();await page.waitForTimeout(320);await page.mouse.click(20,180);await dialog.waitFor({state:'hidden'});
 await cartTrigger.click();await page.waitForTimeout(320);await page.keyboard.press('Escape');
 await page.evaluate(()=>window.sfActions.cart());await page.waitForTimeout(350);assert(await dialog.evaluate(el=>el.open),'Reopen cancels drawer exit');
 await page.evaluate(()=>window.sfActions.search());assert.equal(await dialog.evaluate(el=>el.open),false);assert.equal(await page.evaluate(()=>scrollY),500,'Cart to inline search preserves scroll');
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>document.querySelector('#sf-panel #sf-query')!==null,{},{timeout:2000});
 assert.equal(await page.locator('.sf-header-search').isVisible(),false,'Resize restores form');
 await page.locator('.sf-dock-item[data-panel=search]').click();assert(await dialog.evaluate(el=>el.open),'Mobile retains full screen search');
 assert.equal(Math.round((await dialog.boundingBox()).width),390);await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 await page.setViewportSize({width:1280,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await cartTrigger.click();await page.keyboard.press('Escape');assert.equal(await dialog.evaluate(el=>el.open),false,'Reduced motion closes immediately');
 await page.emulateMedia({reducedMotion:'no-preference'});await search.click();await page.locator('#sf-query').fill('doğal');await page.locator('.sf-result').waitFor();
 if(assigned==='1'){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-desktop-search.png'});await page.keyboard.press('Escape');await cartTrigger.click();await page.waitForTimeout(350);await page.screenshot({path:'qa/storefront-ui-kit-desktop-cart.png'});}
 assert.deepEqual(errors,[]);await page.close();
 }console.log('Desktop search/drawer: five widths, empty/assigned menu, retry, Escape/outside, resize, switching, animation/reopen, scroll and reduced motion passed.');
 }catch(error){if(lastPage&&!lastPage.isClosed()){fs.mkdirSync('qa',{recursive:true});await lastPage.screenshot({path:'qa/storefront-ui-kit-desktop-failure.png'});console.log(await lastPage.evaluate(()=>({width:innerWidth,queryParent:document.querySelector('#sf-search')?.parentElement?.className,header:document.querySelector('.sf-header')?.className,dialogOpen:document.querySelector('#sf-panel')?.open})));}throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
