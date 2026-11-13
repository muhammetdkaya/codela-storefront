// Real cart-controller source + real popup markup, mounted on a native Woo
// Cart document. Chromium/WebKit verify ONE DOM tree, Store API mutation
// semantics, mobile layout, REST fallback, and return to the dialog.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='theme/codela-storefront/assets/';
const css=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css','styles/components.css','styles/cart-page.css'].map(f=>fs.readFileSync(base+f,'utf8')).join('\n');
const source=fs.readFileSync(base+'scripts/cart-controller.js','utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'');
const harness=String.raw`
const escape = v => String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const decode = v => String(v??'');
const safeURL = v => String(v||'#');
const money = (n) => '₺'+new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)/100);
window.currentPanel=null;
window.__apiCalls=[];
window.__cartData={
  items_count:3,
  items:[
    {key:'a',name:'Yelken Seramik Dekoratif Vazo',quantity:2,permalink:'/yelken/',images:[{thumbnail:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'}],variation:[],quantity_limits:{minimum:1,maximum:10,multiple_of:1,editable:true},totals:{line_subtotal:'150000',line_subtotal_tax:'0',currency_code:'TRY',currency_minor_unit:2}},
    {key:'b',name:'Seramik Dekoratif Vazo Seti',quantity:1,permalink:'/set/',images:[{thumbnail:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'}],variation:[],quantity_limits:{minimum:1,maximum:10,multiple_of:1,editable:true},totals:{line_subtotal:'80000',line_subtotal_tax:'0',currency_code:'TRY',currency_minor_unit:2}}
  ],
  totals:{total_items:'230000',total_items_tax:'0',currency_code:'TRY',currency_minor_unit:2},
  extensions:{'codela-storefront-shipping':{html:'<div class="cdl-fsb"><div class="cdl-fsb-text"><span class="cdl-fsb-ico" aria-hidden="true">🚚</span><span>Ücretsiz kargo için ₺2.700 daha ekleyin.</span></div><div class="cdl-fsb-track"><span class="cdl-fsb-fill" style="width:46%"></span></div></div>'}}
};
window.__refreshTotals=()=>{
 const d=window.__cartData;
 d.items_count=d.items.reduce((n,i)=>n+i.quantity,0);
 let sum=0;
 for(const item of d.items){item.totals.line_subtotal=String((item.key==='a'?75000:80000)*item.quantity);sum+=Number(item.totals.line_subtotal);}
 d.totals.total_items=String(sum);
};
window.fetch=async(url,options={})=>{
 const urlText=String(url);
 window.__apiCalls.push({url:urlText,method:options.method||'GET',body:options.body||null});
 if(!window.__firstCartResolved && urlText.endsWith('/cart') && !options.body){
   return new Promise(resolve=>{window.__resolveCart=()=>{window.__firstCartResolved=true;resolve({ok:true,headers:{get:()=> 'nonce'},json:async()=>structuredClone(window.__cartData)});};});
 }
 if(options.body){
   const p=JSON.parse(options.body);
   if(urlText.endsWith('/remove-item'))window.__cartData.items=window.__cartData.items.filter(i=>i.key!==p.key);
   if(urlText.endsWith('/update-item'))window.__cartData.items.find(i=>i.key===p.key).quantity=p.quantity;
   window.__refreshTotals();
 }
 return {ok:true,headers:{get:()=> 'nonce'},json:async()=>structuredClone(window.__cartData)};
};
`;
const footer='<div class="sf-cart-bottom" hidden><div id="sf-cart-progress" class="sf-cart-progress" hidden></div>'
 +'<a class="sf-cart-checkout-command sf-ui-button sf-ui-button--primary sf-primary sf-ui-pressable" href="/odeme/">'
 +'<span class="sf-cart-checkout-total"><span>Ara toplam</span><strong id="sf-subtotal"></strong></span>'
 +'<span class="sf-cart-checkout-label">Ödemeye geç <span class="sf-icon">→</span></span></a></div>';
const html='<html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<style>body{margin:0;font-family:system-ui}button{font:inherit}[hidden]{display:none!important}</style><style>'+css+'</style></head>'
 +'<body class="woocommerce-cart"><div class="sf-shell"><dialog id="sf-panel" class="sf-panel is-cart-panel">'
 +'<section class="sf-panel-body" id="sf-cart" hidden><p class="sf-cart-count" id="sf-cart-count" hidden></p><div id="sf-cart-items"></div></section>'
 +footer+'<p id="sf-status" class="sf-status" role="status"></p></dialog></div>'
 +'<main id="sf-content" class="sf-content sf-cart-page"><div class="wp-block-post-content">'
 +'<div class="wc-block-cart"><h2>WooCommerce native fallback</h2><a class="wc-block-cart__submit-button" href="/odeme/">Native checkout</a></div>'
 +'</div></main></body></html>';
(async()=>{
const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
try{
for(const width of [390,1120]){
 const page=await browser.newPage({viewport:{width,height:844}});
 await page.setContent(html);
 await page.addScriptTag({content:harness+source+'\nwindow.controller=createCartController({$:s=>document.querySelector(s),config:()=>({api:"/wc/store/v1/",cart:"/sepet/",taxInclusive:false}),t:k=>({"Your cart":"Sepet","Items in cart: %d":"Sepetinizde %d ürün"}[k]||k),getCurrent:()=>window.currentPanel,getDialog:()=>document.getElementById("sf-panel")});window.originalCart=document.getElementById("sf-cart");window.controller.bind();document.addEventListener("click",e=>{let b=e.target.closest("#sf-cart button");if(!b)return;if(b.matches("[data-qty],[data-remove]"))window.controller.change(b);});'});
 await page.waitForFunction(()=>typeof window.__resolveCart==='function');
 assert(await page.locator('.wc-block-cart').isVisible(),'Native fallback remains before Store API resolves');
 assert.equal(await page.locator('#sf-cart').count(),1,'One DOM cart before enhancement');
 await page.evaluate(()=>window.__resolveCart());
 await page.waitForFunction(()=>document.body.classList.contains('sf-cart-page-enhanced'));
 assert.equal(await page.locator('.sf-cart-row').count(),2,'Shared popup renderer draws same two products');
 assert.equal(await page.locator('.sf-cart-page-panel #sf-cart').count(),1,'Original cart was moved into document');
 assert(await page.evaluate(()=>document.getElementById('sf-cart')===window.originalCart),'Actual node identity is retained');
 assert.equal(await page.locator('.sf-cart-checkout-command').count(),1,'Exactly one checkout CTA');
 assert.equal(await page.locator('.sf-cart-shipping-ring').count(),1,'Exactly one plugin-derived progress ring');
 assert.equal(await page.locator('.wc-block-cart').isVisible(),false,'Native fallback hidden after live session success');
 assert.equal(await page.locator('#sf-cart-count').innerText(),'Sepetinizde 3 ürün');
 assert.equal(await page.locator('#sf-subtotal').innerText(),'₺2.300,00');
 const computed=await page.locator('.sf-cart-checkout-command').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,r:getComputedStyle(el).borderTopLeftRadius,h:el.getBoundingClientRect().height}));
 assert(computed.bg==='rgb(34, 35, 31)'||computed.bg==='rgb(48, 49, 47)','Same dark popup checkout material '+JSON.stringify(computed));
 assert.equal(computed.r,'24px','Popup CTA 24px corner reused on page');
 assert(computed.h>=72,'Popup checkout button geometry used');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert(overflow<=2,'No horizontal overflow at '+width+'px');
 const plus=page.locator('.sf-cart-row[data-cart-key="a"] [data-qty="3"]');
 await plus.click();
 await page.waitForFunction(()=>document.querySelector('#sf-cart-count')?.textContent?.includes('4 ürün'));
 assert.equal(await page.locator('#sf-subtotal').innerText(),'₺3.050,00','One Store API mutation updates shared subtotal');
 await page.locator('.sf-cart-row[data-cart-key="b"] [data-remove="b"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.sf-cart-row').length===1);
 assert.equal(await page.locator('.sf-cart-checkout-command').count(),1,'Remove keeps sole CTA');
 assert.equal(await page.locator('.sf-cart-page-panel .sf-cart-bottom').count(),1,'No duplicate purchase bar after mutation');
 await page.evaluate(()=>{document.dispatchEvent(new Event('codela:before-route'));window.currentPanel='cart';});
 assert.equal(await page.locator('.sf-cart-page-panel').count(),0,'Unmount cleans up page host');
 assert.equal(await page.locator('#sf-panel #sf-cart').count(),1,'Same cart is restored to dialog');
 assert(await page.locator('.wc-block-cart').isVisible(),'Native Woo fallback available after unmount');
 assert(await page.evaluate(()=>document.getElementById('sf-cart')===window.originalCart),'Original popup node identity survives route');
 await page.close();
}
console.log('Shared popup/cart page DOM, Store API, controls, fallback and responsive visuals passed.');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
