// Real PHP components and production assets; deterministic WP/API boundaries.
// Run from the baseline checkout with UI_BASELINE=1 for comparable screenshots.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.TEST_WEBKIT?'webkit':process.env.TEST_FIREFOX?'firefox':'chromium';
const baseline=process.env.UI_BASELINE==='1',root='theme/codela-storefront/';
const read=p=>fs.readFileSync(root+p,'utf8');
const render=(p,env={})=>execFileSync(process.env.PHP_BIN||'php',['tests/'+p],{encoding:'utf8',env:{...process.env,...env}});
const css=['storefront-base','account-overlay','account','catalog','gallery','sections','product','document-navigation'].map(n=>read('assets/styles/'+n+'.css')).join('\n');
const header=render('render-header.php',{FIXTURE_MENU:'1'});
const home=render('homepage.php',{RENDER_HOME:'1',PROMO_VARIANTS:'split,inset'});
const {fixture}=require('./product-sheet-browser.cjs');
const modules=['format','search-controller','cart-controller','overlay-controller','dock-controller'].map(name=>require('./helpers/inline-storefront.cjs').moduleSource(name)).join('\n');
const config={api:'https://store.test/api/',search:'https://store.test/search-api',cart:'/cart/',account:'/myaccount/',labels:{}};
const js=`function store(name,options){window.sfActions=options.actions;return {state:{config:${JSON.stringify(config)}}};}\n${modules}\n`+read('assets/storefront.js').replace(/^import .*;$/gm,'');
const picture='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#cbbdad"/><circle cx="620" cy="440" r="230" fill="#e8dfcf"/></svg>';
const cart={items_count:1,items:[{key:'one',name:'Doğal taş dekoratif obje',permalink:'/product/',images:[{thumbnail:'https://store.test/image.svg'}],quantity:1,totals:{line_subtotal:'349000',line_subtotal_tax:'0',currency_code:'TRY',currency_minor_unit:2}}],totals:{total_items:'349000',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}};
const out=`qa/framework7/${engine}`;fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await pw[engine].launch();const results=[];try{
 for(const width of [320,390,430,700,701,900,901,1100,1280]){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.pathname.includes('/assets/icons/'))return r.fulfill({contentType:'image/svg+xml',body:read('assets/icons/'+u.pathname.split('/').pop())});
   if(u.pathname.startsWith('/api/cart'))return r.fulfill({json:cart,headers:{Nonce:'fixture'}});
   if(u.pathname.startsWith('/search-api'))return r.fulfill({json:[{name:'Doğal taş koleksiyonu',url:'/product/',image:'https://store.test/image.svg',price:'3.490 ₺',sku:'DOĞAL'}]});
   if(/\.(svg|png|jpg)$/.test(u.pathname))return r.fulfill({contentType:'image/svg+xml',body:picture});
   return r.fulfill({contentType:'text/html',body:`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:14px system-ui}.screen-reader-text{position:absolute!important;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}${css}</style></head><body class="home">${header}<main class="sf-content">${home}</main></body></html>`});
  });
  await page.goto('https://store.test/');
  await page.addScriptTag({content:js});
  await page.evaluate(()=>document.addEventListener('click',event=>{const t=event.target.closest('[data-wp-on--click]');if(t)window.sfActions[t.getAttribute('data-wp-on--click').split('.')[1]](event)}));
  await page.addScriptTag({content:read('assets/scripts/gallery-horizontal.js')});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow '+width);
  const snap=async name=>{if([390,1280].includes(width))await page.screenshot({path:`${out}/${name}-${width}.png`,animations:'disabled'});};
  await snap('home');
  if(!baseline){
   const cta=page.locator('.sf-section--hero .sf-ui-button--secondary').first();
   assert.equal(await cta.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(237, 237, 237)','Tonal CTA remains opaque over dark photography');
  }
  const dock=page.locator('.sf-mobile-dock');
  assert.equal(await dock.isVisible(),width<=700,'Existing dock breakpoint');
  if(width<=700){
   const b=await dock.boundingBox();
   // Read the pressed paint before the 240ms hold timer switches to scrubbing.
    await page.mouse.move(b.x+b.width/8,b.y+24);await page.mouse.down();await page.waitForTimeout(160);
   const material=await dock.locator('.sf-dock-surface').evaluate(el=>{const a=getComputedStyle(el,'::before'),b=getComputedStyle(el,'::after');return{normal:a.opacity,pressed:b.opacity,shadow:b.boxShadow,position:a.transform,thumbPosition:b.transform}});
   if(!baseline){assert.equal(material.pressed,'1');assert.equal(material.normal,'0');assert.notEqual(material.shadow,'none');assert.equal(material.position,material.thumbPosition,'Paints share relocation geometry');}
   await snap('dock-pressed');await page.mouse.up();
  }
  for(const panel of ['search','cart','account']){
   if(panel==='account'&&width>700)continue;
   const trigger=width<=700?dock.locator(`[data-panel=${panel}]`):page.locator(`.sf-header [data-panel=${panel}]`).first();
   await trigger.click();
   if(panel==='search'){await page.locator('#sf-query').fill('doğal');await page.locator('.sf-result').first().waitFor();}
   if(panel==='cart')await page.locator('.sf-cart-row').first().waitFor();
   await page.waitForTimeout(350);await snap(panel);
   if(width<=700)assert.equal(await page.locator('#sf-panel .sf-mobile-dock').count(),1,'Same dock in dialog');
   // Use the real close control; Escape on a populated native search input
   // can first clear the input in Chromium before reaching dialog cancel.
   await page.locator('[data-wp-on--click="actions.close"]:visible').last().click();
   await page.waitForTimeout(250);
  }
  if([390,1280].includes(width)){
   const productHeader=render('render-header.php',{FIXTURE_PRODUCT:'1',FIXTURE_MENU:'1'});
   let html=fixture({noUrgency:true}).replace(/<div class="sf-shell">[\s\S]*?<\/dialog><\/div>/,productHeader).replace('</head>',`<style>${css}</style></head>`);
   await page.setContent(html);await page.addScriptTag({content:read('assets/scripts/product-information.js')});await page.addScriptTag({content:read('assets/scripts/gallery-defer.js')});
   await snap('product');
   assert.equal(await page.locator('.sf-mobile-dock:visible').count(),0,'Product never exposes normal dock');
   if(!baseline)assert.equal(await page.locator('.single_add_to_cart_button').evaluate(e=>getComputedStyle(e).borderRadius),'999px');
  }
  assert.deepEqual(errors,[]);results.push({width,passed:true});await page.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify({engine,version:browser.version(),baseline,results},null,2));
 console.log(`Shared UI acceptance: ${engine} ${browser.version()}, nine widths, real header/home/panels/product, ${baseline?'baseline':'candidate'}.`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
