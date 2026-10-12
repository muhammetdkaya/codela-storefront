// Real PHP header and native Woo-style checkout fixture; styling only.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const php=process.env.PHP_BIN||'php';
const header=execFileSync(php,['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_CHECKOUT:'1'}});
const homeHeader=execFileSync(php,['tests/render-header.php'],{encoding:'utf8'});
assert(header.includes('class="sf-header"'));assert(!header.includes('class="sf-mobile-dock'));
assert(header.includes('has-checkout-header'),'Checkout uses compact shared Header composition');
assert(homeHeader.includes('has-mobile-dock'),'Home retains the original dock composition');
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/navigation.css','assets/styles/components.css','assets/styles/checkout.css'].map(p=>fs.readFileSync('theme/codela-storefront/'+p,'utf8')).join('\n');
const fixture=`<main class="wp-block-group sf-content sf-checkout-page" id="sf-content">
<h1 class="wp-block-post-title">Ödeme</h1><div class="wp-block-post-content"><div class="wp-block-woocommerce-checkout">
<form class="wc-block-checkout">
<div class="wc-block-checkout__main"><h2 class="wc-block-components-checkout-step__heading-title">Bilgiler</h2>
<div class="wc-block-components-form"><div class="wc-block-components-text-input"><label for="email">E-posta</label><input id="email" type="email"></div>
<div class="wc-block-components-text-input"><label for="address">Adres</label><input id="address" type="text"></div></div>
<div class="wc-block-checkout__actions_row"><button type="submit" class="wc-block-components-button wc-block-components-checkout-place-order-button">Sipariş ver</button></div></div>
<aside class="wc-block-checkout__sidebar"><div class="wc-block-components-order-summary"><h2>Sipariş özeti</h2></div></aside>
</form></div></div></main>`;
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--disable-dev-shm-usage','--no-zygote','--single-process']}:{} )});
try{
const page=await browser.newPage();
await page.route('**/*',route=>{
const url=route.request().url();
if(url.includes('/assets/icons/'))return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('theme/codela-storefront/assets/icons/'+new URL(url).pathname.split('/').at(-1),'utf8')});
const compareHome=url.includes('/compare-home-header');
return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body class="${compareHome?'home':'woocommerce-checkout'}">${compareHome?homeHeader:header}${fixture}</body></html>`});
});
await page.goto('https://store.test/checkout/');
for(const width of [320,390,700,1024,1360]){
await page.setViewportSize({width,height:844});
const actual=await page.evaluate(()=>{
 const input=document.querySelector('.wc-block-components-text-input input');
 const button=document.querySelector('.wc-block-components-checkout-place-order-button');
 const summary=document.querySelector('.wc-block-components-order-summary');
 return {overflow:document.documentElement.scrollWidth>innerWidth+1,header:document.querySelectorAll('.sf-header').length,
 dock:document.querySelectorAll('.sf-mobile-dock').length,inputHeight:input.getBoundingClientRect().height,
 inputRadius:getComputedStyle(input).borderRadius,buttonRadius:getComputedStyle(button).borderRadius,
 buttonBackground:getComputedStyle(button).backgroundColor,buttonHeight:button.getBoundingClientRect().height,
 summaryBackground:getComputedStyle(summary).backgroundColor,submit:button.type};
});
assert(!actual.overflow,'No horizontal overflow '+width+': '+JSON.stringify(actual));
assert.equal(actual.header,1);assert.equal(actual.dock,0);
assert(actual.inputHeight>=54,'Shared input height');
assert(actual.buttonHeight>=54,'Shared button action height');
assert.equal(actual.inputRadius,actual.buttonRadius,'Shared radius');
assert.equal(actual.buttonBackground,'color(srgb 0.133333 0.137255 0.121569 / 0.9)','Shared primary color');
assert.equal(actual.summaryBackground,'rgb(243, 243, 243)','Shared muted surface');
assert.equal(actual.submit,'submit','Native submit semantics');
const checkoutHeader=await page.locator('.sf-header').evaluate(el=>{
 const logo=el.querySelector('.sf-brand').getBoundingClientRect();
 const menu=el.querySelector('.sf-header-menu').getBoundingClientRect();
 const tools=el.querySelector('.sf-actions');
 return {logoX:logo.x,logoY:logo.y,logoWidth:logo.width,menuX:menu.x,menuY:menu.y,
  menuWidth:menu.width,toolsVisible:getComputedStyle(tools).display!=='none'};
});
await page.goto('https://store.test/compare-home-header');
const homeHeaderGeometry=await page.locator('.sf-header').evaluate(el=>{
 const logo=el.querySelector('.sf-brand').getBoundingClientRect();
 const menu=el.querySelector('.sf-header-menu').getBoundingClientRect();
 const tools=el.querySelector('.sf-actions');
 return {logoX:logo.x,logoY:logo.y,logoWidth:logo.width,menuX:menu.x,menuY:menu.y,
  menuWidth:menu.width,toolsVisible:getComputedStyle(tools).display!=='none'};
});
for(const prop of ['logoX','logoY','logoWidth','menuX','menuY','menuWidth'])
 assert(Math.abs(checkoutHeader[prop]-homeHeaderGeometry[prop])<1,
   'Checkout and Home share '+prop+' at '+width+'px: '+JSON.stringify({checkoutHeader,homeHeaderGeometry}));
assert.equal(checkoutHeader.toolsVisible,homeHeaderGeometry.toolsVisible,
 'Header action visibility is identical on Home and Checkout at '+width);
if(width<=700){
 assert.equal(checkoutHeader.toolsVisible,false,'Compact mobile checkout header keeps store tools in menu');
 assert(checkoutHeader.logoX<checkoutHeader.menuX,'Logo stays left and Menu stays right');
}else{
 assert.equal(checkoutHeader.toolsVisible,true,'Desktop tools remain in the desktop header');
}
await page.goto('https://store.test/checkout/');
}
await page.locator('#email').fill('example@test.com');
assert.equal(await page.locator('#email').inputValue(),'example@test.com');
assert.equal(await page.locator('[data-panel="menu"]').count(),1);
assert.equal(await page.locator('[data-panel="cart"]').count(),1);
console.log('Checkout header/no-dock, native fields, primary CTA, summary, 5 viewport sizes passed.');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

