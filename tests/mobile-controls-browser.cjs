// Real theme PHP, styles and controllers against controlled WordPress/Woo boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = 'theme/codela-storefront/';
const php = process.env.PHP_BIN || 'php';
const render = (file, env={}) => execFileSync(php, ['tests/'+file+'.php'], {encoding:'utf8',env:{...process.env,...env}});
const cssPaths = ['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css','assets/styles/account-overlay.css','assets/styles/gallery.css','assets/styles/sections.css','assets/styles/product.css','assets/styles/navigation-feedback.css'];
const css = cssPaths.map(path => {const old=process.env.MOBILE_CONTROLS_OLD_CSS && process.env.MOBILE_CONTROLS_OLD_CSS+'/'+path;return fs.readFileSync(old && fs.existsSync(old)?old:root+path,'utf8');}).join('\n');
const run = name => !process.env.MOBILE_CONTROLS_SCOPE || process.env.MOBILE_CONTROLS_SCOPE===name;
const moduleSource = name => fs.readFileSync(root+'assets/scripts/'+name+'.js','utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'');
const controllers = ['format','search-controller','cart-controller','overlay-controller','dock-controller'].map(moduleSource).join('\n');
const main = fs.readFileSync(root+'assets/storefront.js','utf8').replace(/^import .*from 'codela-storefront\/(?:search|cart|overlay|dock)';$/gm,'').replace("import { store } from '@wordpress/interactivity';",`function store(namespace, options) { window.sfActions = options.actions; return {state:{config:{api:'https://store.test/api/',search:'https://store.test/search-api',cart:'/cart/',shop:'/shop/',account:'https://store.test/myaccount/',labels:{}}}}; }`).replace('let menuPath = [];',controllers+'\nlet menuPath = [];');
const feedback = fs.readFileSync(root+'assets/scripts/navigation-feedback.js','utf8');
const hero = render('homepage',{RENDER_HOME:'1'});
const footers = {on:render('render-footer',{FOOTER_MOBILE_HIDDEN:'1',FOOTER_PRIVACY:'1',FOOTER_TERMS:'1'}),off:render('render-footer',{FOOTER_MOBILE_HIDDEN:'0',FOOTER_PRIVACY:'1',FOOTER_TERMS:'1'}),unset:render('render-footer',{FOOTER_PRIVACY:'1',FOOTER_TERMS:'1'})};
const headers = Object.fromEntries([0,1].map(dock=>[dock,render('render-header',{FIXTURE_MENU:'1',FIXTURE_DOCK:String(dock)})]));
const emptyCart = {items_count:0,items:[],totals:{total_items:'0',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}};
const filledCart = {items_count:1,items:[{key:'a',name:'Product',quantity:1,permalink:'/product/',images:[],variation:[],totals:{line_subtotal:'100',line_subtotal_tax:'0',currency_code:'TRY',currency_minor_unit:2}}],totals:{total_items:'100',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}};
const engine = process.env.TEST_WEBKIT ? 'webkit' : 'chromium';
const documentHTML = body => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif}.screen-reader-text{position:absolute!important;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}${css}</style></head><body class="home">${body}</body></html>`;
(async()=>{
 const browser = await (engine==='webkit'?webkit:chromium).launch();
 try {
  const page = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',hasTouch:true});
  page.setDefaultTimeout(5000);
  let cart = emptyCart;
  await page.route('https://store.test/**',route=>{
   const url = new URL(route.request().url());
   if(url.pathname==='/api/cart') return route.fulfill({json:cart,headers:{Nonce:'test'}});
   if(url.pathname.includes('/assets/icons/')) return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+url.pathname.split('/').at(-1))});
   if(url.pathname.includes('.svg')) return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900"><rect width="800" height="900" fill="#ddd"/></svg>'});
   return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Store</title>'});
  });
  await page.goto('https://store.test/');
  const install = async (html, scripts=[]) => {await page.goto('https://store.test/');await page.setContent(documentHTML(html));for(const script of scripts)await page.addScriptTag({content:script});};
  const flush = () => page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  // The real footer renderer preserves the old default and legal links. 700px is
  // the existing mobile breakpoint, including when the viewport is resized.
  if(run('footer')) {
  for(const width of [320,390,700,701,1280]){
   await page.setViewportSize({width,height:844});
   for(const setting of ['unset','off','on']){
    await install('<main>Content</main>'+footers[setting]);
    assert.equal(await page.locator('.sf-footer').isVisible(),setting!=='on'||width>700,`footer ${setting} at ${width}`);
    if(width>700||setting!=='on') assert.equal(await page.locator('.sf-footer-links a').count(),2,'Legal links retained whenever the footer is visible');
   }
  }
  await page.setViewportSize({width:390,height:844});
  await install('<main>Content</main>'+footers.on);
  assert(!(await page.locator('.sf-footer').isVisible()));
  await page.setViewportSize({width:701,height:844});
  assert(await page.locator('.sf-footer').isVisible(),'Resize restores the original desktop footer without reloading');
  }

  // Vitrin -> next section uses the same rhythm as all later sections; the
  // destination skeleton must use that exact gap as well.
  if(run('showcase')) {
  for(const width of [320,390,700,701,1280]){
   await page.setViewportSize({width,height:900});
   await install(headers[1]+'<main class="sf-content" id="sf-content">'+hero+'</main>',["window.codelaSFDocument={home:'https://store.test/'};",feedback]);
   const gaps=await page.evaluate(()=>{const sections=[...document.querySelectorAll('.codela-page-layout > .sf-section')];return {first:sections[1].getBoundingClientRect().top-sections[0].getBoundingClientRect().bottom,second:sections[2].getBoundingClientRect().top-sections[1].getBoundingClientRect().bottom};});
   assert(Math.abs(gaps.first-gaps.second)<1,`showcase spacing equals other sections at ${width}: ${JSON.stringify(gaps)}`);
   if(width<=700) assert(Math.abs(gaps.first-40)<1,`showcase mobile spacing is 40px at ${width}`);
   const token=await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://store.test/'}));
   const skeletonGap=await page.evaluate(()=>{const h=document.querySelector('.sf-skeleton-hero').getBoundingClientRect(),c=document.querySelector('.sf-skeleton-cards').getBoundingClientRect();return c.top-h.bottom;});
   assert(Math.abs(skeletonGap-gaps.first)<1,`home skeleton mirrors the first section gap at ${width}: ${skeletonGap} vs ${gaps.first}`);
   await page.evaluate(token=>window.codelaSFFeedback.end(token),token);
  }
  }

  // Check real panel controller from both header and dock modes, including
  // short menus, nested levels, long scrollable menus, and repeated transitions.
  if(run('panels')) {
  for(const dock of [0,1]) for(const width of [320,390,700,800]){
   await page.setViewportSize({width,height:844}); cart=emptyCart;
   await install(headers[dock]+'<main style="height:1200px">Content</main>'+footers.off,[main]);
   await page.evaluate(()=>document.addEventListener('click',event=>{const el=event.target.closest('[data-wp-on--click]');if(el)window.sfActions[el.getAttribute('data-wp-on--click').split('.')[1]](event);}));
   await page.evaluate(()=>{const list=document.querySelector('#sf-menu .sf-menu-list');for(let i=0;i<8;i++)list.appendChild(list.firstElementChild.cloneNode(true));});
   // Initiate with keyboard modality: WebKit and Chromium may both apply
   // :focus-visible to the programmatically focused X.
   await page.keyboard.press('Tab');
   await page.evaluate(()=>window.sfActions.menu());
   const verifyMenu = async label => {
    const s=await page.locator('#sf-menu').evaluate(el=>{
      const nav=el.querySelector('nav:not(.sf-menu-tools)'),r=el.getBoundingClientRect(),n=nav.getBoundingClientRect(),style=getComputedStyle(el);
      let expected=r.top+parseFloat(style.paddingTop);for(const child of el.children){if(child===nav)break;if(getComputedStyle(child).display!=='none')expected+=child.getBoundingClientRect().height+parseFloat(style.rowGap);}
      return {actual:n.top,expected,marginTop:getComputedStyle(nav).marginTop,overflow:el.scrollHeight>el.clientHeight};
    });
    if(width<=700){assert(Math.abs(s.actual-s.expected)<1,`${label} begins at top: ${JSON.stringify(s)}`);assert.equal(s.marginTop,'0px',`${label} has no vertical auto margin`);}
    else if(!s.overflow) assert.notEqual(s.marginTop,'0px',`${label} preserves desktop centering`);
   };
   await verifyMenu(`long menu dock=${dock} width=${width}`);
   if(width<=700){
    await page.locator('#sf-menu').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    assert(await page.locator('#sf-menu').evaluate(el=>el.scrollTop>0),'Long mobile menu remains scrollable');
   }
   await page.locator('#sf-menu .sf-submenu-toggle').click();
   await page.locator('#sf-menu').evaluate(el=>{el.scrollTop=0});
   await verifyMenu(`submenu dock=${dock} width=${width}`);
   await page.locator('#sf-menu .sf-back').click();
   await page.evaluate(()=>{const list=document.querySelector('#sf-menu .sf-menu-list');[...list.children].slice(1,-1).forEach(el=>el.remove());document.querySelector('#sf-menu').scrollTop=0;});
   await verifyMenu(`short menu dock=${dock} width=${width}`);
   if(dock===1&&width===390){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/mobile-menu-${engine}.png`});}

   const material=await page.locator('#sf-panel > .sf-menu-trigger').evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,shadow:s.boxShadow,radius:s.borderRadius};});
   assert.notEqual(material.shadow,'none','Menu keeps its own soft shadow on initial focus');
   for(const mode of ['search','cart','account','cart','search','account']){
    await page.evaluate(mode=>window.sfActions[mode](),mode);
    const close=page.locator(mode==='search'?'#sf-search .sf-search-cancel':'#sf-panel .sf-panel-top .sf-close');
    assert(await close.isVisible(),`${mode} close is visible`);
    const paint=await close.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {background:s.backgroundColor,shadow:s.boxShadow,radius:s.borderRadius,width:r.width,height:r.height,initial:el.classList.contains('sf-initial-focus'),focused:el===document.activeElement};});
    assert(paint.initial&&paint.focused,`${mode} keeps actual initial focus after switching`);
    assert.equal(paint.background,material.background,`${mode} close has shared surface at ${width}`);
    assert.equal(paint.shadow,material.shadow,`${mode} close keeps the surface shadow at ${width}`);
    assert.equal(paint.radius,material.radius,`${mode} close has shared round shape`);
    assert(paint.width>=44&&paint.height>=44,`${mode} close retains a 44px target`);
    if(mode==='cart'){
      await page.waitForSelector('#sf-cart .sf-cart-empty');
      if(dock===1&&width===390)await page.screenshot({path:`qa/mobile-empty-cart-${engine}.png`});
      assert.equal(await page.locator('#sf-cart .sf-cart-empty a,#sf-cart .sf-cart-empty button').count(),0,'Empty cart has no continue-shopping action');
      assert(!(await page.locator('.sf-cart-bottom').isVisible()),'Empty cart has no checkout total');
    }
   }
   await page.keyboard.press('Tab');
   assert.equal(await page.locator('#sf-panel .sf-initial-focus').count(),0,'Keyboard navigation restores ordinary focus indicator');
   await page.evaluate(()=>window.sfActions.close());
   // Populated cart still renders its rows and checkout action.
   cart=filledCart;
   await page.evaluate(()=>document.body.dispatchEvent(new Event('wc-blocks_added_to_cart')));
   await page.evaluate(()=>window.sfActions.cart());
   await page.waitForSelector('#sf-cart .sf-cart-row');
   assert(await page.locator('.sf-cart-bottom').isVisible(),'Populated cart retains checkout');
   await page.evaluate(()=>window.sfActions.close());
  }
  }
  // Product sheet uses the hidden footer's bottom clearance for related items.
  if(run('product')) {
  const {fixture}=require('./product-sheet-browser.cjs');
  for(const width of [320,390,700]){
   await page.setViewportSize({width,height:844});
   await page.setContent(fixture().replace('<footer class="sf-footer">','<footer class="sf-footer sf-footer--mobile-hidden">'));
   await page.evaluate(()=>{const link=document.createElement('a');link.href='/last-related';link.textContent='Last related product';link.id='last-related';link.style.display='block';link.style.marginTop='1000px';document.querySelector('.related').appendChild(link);});
   await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});
   await page.waitForSelector('body.sf-product-sheet-ready');
   await page.locator('#last-related').scrollIntoViewIfNeeded();
   await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
   await flush();
   const result=await page.evaluate(()=>({footer:getComputedStyle(document.querySelector('.sf-footer')).display,padding:parseFloat(getComputedStyle(document.body).paddingBottom),last:document.querySelector('#last-related').getBoundingClientRect().bottom,panel:document.querySelector('.sf-product-sheet').getBoundingClientRect().top}));
   assert.equal(result.footer,'none','Footer hidden on product');
   assert(result.padding>100,'Hidden footer preserves product bottom clearance');
   assert(result.last<=result.panel+1,`Last related action clears product sheet at ${width}: ${JSON.stringify(result)}`);
  }
  }
  console.log(`${engine}: responsive footer, showcase/skeleton spacing, menu levels/scroll, empty and filled cart, panel switching/focus and product clearance passed.`);
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
