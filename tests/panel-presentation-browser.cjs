const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const root='theme/codela-storefront/',php=process.env.PHP_BIN||'php',engine=process.env.TEST_WEBKIT?'webkit':'chromium';
const products=JSON.parse(execFileSync(php,['tests/search-price.php','--json'],{encoding:'utf8'}));
products.push({name:'Legacy &amp; safe',url:'/legacy/',image:'',price:'&lt;img src=x onerror=alert(1)&gt;',sku:'OLD'});
const header=execFileSync(php,['tests/render-header.php'],{encoding:'utf8'}).replaceAll('https://store.test','https://panel.test');
const linkDecoration=JSON.parse(fs.readFileSync(root+'theme.json','utf8')).styles.elements.link.typography.textDecoration;
const css=fs.readFileSync(root+'assets/styles/storefront-base.css','utf8')+`a{text-decoration:${linkDecoration}}`;
const modules=['format','search-controller','cart-controller','overlay-controller','dock-controller'].map(n=>fs.readFileSync(root+'assets/scripts/'+n+'.js','utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'')).join('\n');
const js=fs.readFileSync(root+'assets/storefront.js','utf8').replace(/^import .*from 'codela-storefront\/(?:search|cart|overlay|dock)';$/gm,'').replace("import { store } from '@wordpress/interactivity';",`function store(n,o){window.sfActions=o.actions;return {state:{config:{api:'https://panel.test/api/',search:'https://panel.test/search-api',cart:'/cart/',account:'/account/',labels:{}}}};}`).replace('let menuPath = [];',modules+'\nlet menuPath = [];');
(async()=>{const browser=await(engine==='webkit'?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{});try{
 fs.mkdirSync('qa/first-paint',{recursive:true});
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://panel.test/**',route=>{const path=new URL(route.request().url()).pathname;
   if(path==='/api/cart')return route.fulfill({json:{items:[],items_count:0,totals:{total_items:'0',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}},headers:{Nonce:'fixture'}});
   if(path==='/search-api')return route.fulfill({json:products});
   if(path.includes('/assets/icons/'))return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+path.split('/').pop())});
   return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><body>'+header+'<main style="height:2000px">Store</main></body></html>'});
  });
  await page.route('https://search.test/photo.svg',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect width="80" height="100" fill="tan"/></svg>'}));
  await page.goto('https://panel.test/');await page.addScriptTag({content:js});
  const searchEnter=await page.evaluate(()=>{window.sfActions.search();const el=document.querySelector(innerWidth>=901?'.sf-search-toolbar':'.sf-search-content');const duration=el.getAnimations()[0]?.effect.getTiming().duration;document.querySelector('#sf-query').value='vazo';document.querySelector('#sf-search form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return duration;});
  assert.equal(searchEnter,240,'Inline and fullscreen search use the shared enter token');
  await page.waitForFunction(()=>document.querySelectorAll('.sf-result').length===6);
  const range=page.locator('.sf-result').nth(0),sale=page.locator('.sf-result').nth(1);
  assert.equal(await range.locator('.screen-reader-text').count(),1,'One native accessible range');
  assert.equal(await range.locator('.screen-reader-text').evaluate(el=>getComputedStyle(el).clipPath),'inset(50%)','Accessible range is visually clipped by theme CSS');
  const accessible=await range.ariaSnapshot();assert.equal((accessible.split('\n')[0].match(/₺1\.290,00/g)||[]).length,1,'Link accessible name has one range: '+accessible);
  assert.equal(await sale.locator('del').count(),1);assert.equal(await sale.locator('ins').count(),1);
  assert.equal(await page.locator('.sf-result p img').count(),0,'Server allowlist and escaped legacy fallback reject injected images');
  assert.equal(await page.locator('.sf-result').nth(5).locator('p').textContent(),'<img src=x onerror=alert(1)>');
  await page.screenshot({path:`qa/first-paint/${engine}-search-${width}.png`});
  await page.evaluate(()=>window.sfActions.close());
  // Hold animations synchronously so elapsed tool latency cannot hide a timing failure.
  const menu=await page.evaluate(()=>{window.sfActions.menu();const a=document.querySelector('#sf-menu').getAnimations()[0];a?.pause();return a?.effect.getTiming().duration;});
  assert.equal(menu,240,'Menu enters with shared token');
  await page.evaluate(()=>document.querySelector('#sf-menu').getAnimations()[0].finish());
  const exit=await page.evaluate(()=>{window.sfActions.close();const a=document.querySelector('#sf-menu').getAnimations()[0];a?.pause();return a?.effect.getTiming().duration;});
  assert.equal(exit,180,'Menu closes with shared token');
  await page.evaluate(()=>window.sfActions.menu());
  assert(await page.locator('#sf-panel').evaluate(el=>el.open),'Reopen cancels pending close');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#sf-menu').getAnimations().length===0);
  await page.evaluate(()=>window.sfActions.close());assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Reduced motion closes immediately');
  await page.emulateMedia({reducedMotion:'no-preference'});
  if(width===1280){
   const enter=await page.evaluate(()=>{window.sfActions.cart();const a=document.querySelector('#sf-panel').getAnimations().find(a=>a.effect.target===document.querySelector('#sf-panel'));a?.pause();return a?.effect.getTiming().duration;});
   assert.equal(enter,240,'Drawer uses shared enter token');
   assert.equal(await page.locator('#sf-panel').evaluate(el=>getComputedStyle(el,'::backdrop').animationDuration),'0.24s','Backdrop shares enter duration');
   const close=await page.evaluate(()=>{window.sfActions.close();const a=document.querySelector('#sf-panel').getAnimations().find(a=>a.effect.target===document.querySelector('#sf-panel'));a?.pause();return a?.effect.getTiming().duration;});
   assert.equal(close,180,'Drawer uses shared exit token');
   assert.equal(await page.locator('#sf-panel').evaluate(el=>getComputedStyle(el,'::backdrop').animationDuration),'0.18s','Backdrop shares exit duration');
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>!document.querySelector('#sf-panel').open);
  }
  await page.evaluate(()=>window.sfActions.menu());
  await page.evaluate(()=>dispatchEvent(new Event('codela:before-route')));
  assert.equal(await page.locator('#sf-panel').evaluate(el=>el.open),false,'Navigation never waits for closing motion');
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Search presentation and shared panel motion passed: localized range/sale/suffix, KSES/fallback, rapid reversal, reduced-motion changes and navigation ('+engine+').');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
