// Real PHP header and native Woo-style checkout fixture; styling only.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_CHECKOUT:'1'}});
assert(header.includes('class="sf-header"'));assert(!header.includes('class="sf-mobile-dock'));
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
return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body class="woocommerce-checkout">${header}${fixture}</body></html>`});
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
assert.equal(actual.buttonBackground,'rgb(34, 35, 31)','Shared primary color');
assert.equal(actual.summaryBackground,'rgb(243, 243, 243)','Shared muted surface');
assert.equal(actual.submit,'submit','Native submit semantics');
}
await page.locator('#email').fill('example@test.com');
assert.equal(await page.locator('#email').inputValue(),'example@test.com');
assert.equal(await page.locator('[data-panel="menu"]').count(),1);
assert.equal(await page.locator('[data-panel="cart"]').count(),1);
console.log('Checkout header/no-dock, native fields, primary CTA, summary, 5 viewport sizes passed.');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
