const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const root='theme/codela-storefront/',php=process.env.PHP_BIN||'php';
const {fixture}=require('./product-sheet-browser.cjs');
const css=['overlay','account-overlay','navigation-feedback'].map(n=>fs.readFileSync(root+'assets/styles/'+n+'.css','utf8')).join('\n');
const modules=['format','search-controller','cart-controller','overlay-controller','dock-controller'].map(n=>fs.readFileSync(root+'assets/scripts/'+n+'.js','utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'')).join('\n');
const main=fs.readFileSync(root+'assets/storefront.js','utf8').replace(/^import .*from 'codela-storefront\/(?:search|cart|overlay|dock)';$/gm,'').replace("import { store } from '@wordpress/interactivity';",`function store(n,o){window.sfActions=o.actions;return {state:{config:{api:'https://store.test/api/',search:'https://store.test/search-api',cart:'/cart/',account:'/myaccount/',labels:{}}}};}`).replace('let menuPath = [];',modules+'\nlet menuPath = [];');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
(async()=>{const browser=await(engine==='webkit'?webkit:chromium).launch();try{
const page=await browser.newPage({reducedMotion:'reduce'});page.setDefaultTimeout(6000);
await page.route('https://store.test/**',r=>{const p=new URL(r.request().url()).pathname;if(p==='/api/cart')return r.fulfill({json:{items:[],items_count:0,totals:{total_items:'0',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2}},headers:{Nonce:'test'}});if(p.includes('/assets/icons/'))return r.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'assets/icons/'+p.split('/').pop())});return r.fulfill({contentType:'text/html',body:'<!doctype html><title>Store</title>'});});
async function hidden(label){assert.equal(await page.locator('.sf-mobile-dock').filter({visible:true}).count(),0,label+' product navigation remains hidden');}
for(const width of [320,390,700])for(const dock of ['0','1'])for(const kind of ['priced','variable','no-price','out-of-stock']){
await page.setViewportSize({width,height:844});await page.goto('https://store.test/');
const header=execFileSync(php,['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_PRODUCT:'1',FIXTURE_DOCK:dock,FIXTURE_MENU:'1'}});
let html=fixture({stock:kind==='priced'||kind==='variable',variable:kind==='variable'}).replace('<div class="sf-shell"><header class="sf-header"><span>Codela</span></header><nav class="sf-mobile-dock" hidden></nav><dialog id="sf-panel"></dialog></div>',header).replace('</head>','<style>'+css+'</style></head>').replace('<main class="sf-content">','<main class="sf-content" id="sf-content">');
if(kind==='no-price')html=html.replace('<p class="price">3.490 ₺</p>','').replace('<p class="stock out-of-stock">Stokta yok</p>','');
if(process.env.PRODUCT_OLD_CSS)html=html.replace('</head>','<style>'+fs.readFileSync(process.env.PRODUCT_OLD_CSS,'utf8')+'</style></head>');
await page.setContent(html);const label=width+'/'+dock+'/'+kind;
await hidden(label+' before scripts');assert(await page.locator('.sf-header .sf-cart-trigger').isVisible(),label+' header cart stays available');
await page.addScriptTag({content:main});await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});
await page.evaluate(()=>document.addEventListener('click',event=>{const el=event.target.closest('[data-wp-on--click]');if(el)window.sfActions[el.getAttribute('data-wp-on--click').split('.')[1]](event);}));
await page.waitForSelector('.sf-product-sheet');await hidden(label+' mounted');
const gap=await page.locator('.sf-product-sheet').evaluate(e=>innerHeight-e.getBoundingClientRect().bottom);assert(Math.abs(gap-12)<1,label+' panel has no phantom dock gap: '+gap);
await page.locator('.sf-product-sheet-toggle').click();await hidden(label+' expanded');await page.locator('.sf-product-sheet-toggle').click();
await page.locator('.sf-header .sf-cart-trigger').click();await hidden(label+' cart');await page.locator('.sf-panel-top .sf-close').click();
for(const mode of ['search','account']){await page.locator('.sf-header .sf-menu-trigger').click();await hidden(label+' menu');const link=page.locator('#sf-menu .sf-menu-tools [data-panel="'+mode+'"]');assert(await link.isVisible(),label+' '+mode+' accessible in menu');await link.click();await hidden(label+' '+mode);await page.locator(mode==='search'?'.sf-search-cancel':'.sf-panel-top .sf-close').click();await hidden(label+' closed');}
await page.evaluate(()=>{window.codelaSFDocument={home:'https://store.test/',productBase:'https://store.test/product/'};});await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/navigation-feedback.js','utf8')});
for(const target of ['home','product']){const token=await page.evaluate(t=>codelaSFFeedback.begin({url:t==='home'?'https://store.test/':'https://store.test/product/next/'}),target);assert.equal(await page.locator('.sf-mobile-dock').filter({visible:true}).count(),dock==='1'&&target==='home'?1:0,label+' destination navigation follows target');await page.evaluate(t=>codelaSFFeedback.end(t),token);await hidden(label+' cancelled');}
if(width===390&&dock==='1'&&kind==='no-price'){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/product-no-dock-'+engine+'.png'});}
}
assert.equal(await page.locator('.sf-mobile-dock').count(),1,'Configured node remains available for destination preview');
console.log(engine+': 24 product states; no-JS, header cart, expanded sheet, dialogs, menu tools, destination preview and cancel passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
