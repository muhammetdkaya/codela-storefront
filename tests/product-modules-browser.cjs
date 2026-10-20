// Layout contract for existing plugin HTML in the theme-owned composition.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/';
const css=['assets/styles/tokens.css','assets/storefront.css','assets/styles/components.css','assets/styles/gallery.css','assets/styles/product.css'].map(x=>fs.readFileSync(root+x,'utf8')).join('\n');
const svg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18"/></svg>';
function fixture(enabled){const trust=enabled?'<div class="cdl-tb">'+['Güvenli ödeme','Kapıda ödeme','Kolay iade','Hızlı kargo'].map(label=>`<div class="cdl-tb-item"><span class="cdl-tb-ico">${svg}</span><span class="cdl-tb-label">${label}</span></div>`).join('')+'</div>':'';return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body class="single-product woocommerce"><main class="sf-content"><div class="product">
<div class="sf-product-overview"><div class="sf-product-media"><div class="woocommerce-product-gallery sf-ui-gallery"><div class="woocommerce-product-gallery__wrapper"><div class="woocommerce-product-gallery__image"></div></div><ol class="flex-control-thumbs"><li><img alt="Ön" class="flex-active"></li><li><img alt="Arka"></li></ol></div>${enabled?'<div id="codela-live-visitor-container" class="sf-product-visitor"><div class="cdl-lv"><span class="cdl-lv-dot"></span><span>8 kişi bu ürünü inceliyor</span></div></div>':''}
</div><div class="summary"><h1 class="product_title">Uzun ürün başlığı — Rahat Kesim Pamuklu V Yaka Tişört Seçki</h1><div class="sf-product-price-row"><p class="price">₺1.250,00</p>${enabled?'<div class="cdl-ub"><div class="cdl-ub-item">Son 3 ürün</div></div>':''}</div><p>Ürün hakkında kısa açıklama.</p>
${enabled?`<div class="cdl-de"><span class="cdl-de-mark">${svg}</span><div class="cdl-de-body"><div class="cdl-de-eta">Tahmini teslimat <strong>19–21 Ekim</strong></div><div class="cdl-de-line">Kesim saatinden önce siparişlerde bugün kargoda</div></div></div><div class="cdl-fsb-live cdl-fsb-live--product"><div class="cdl-fsb cdl-fsb--product"><div class="cdl-fsb-text"><span class="cdl-fsb-ico">${svg}</span><span>Ücretsiz kargo için ₺150 daha ekle</span></div><div class="cdl-fsb-track"><span class="cdl-fsb-fill" style="width:65%"></span></div></div></div><div class="cdl-wa"><a class="cdl-wa-button" href="https://wa.me/905000000000"><span class="cdl-wa-ico sf-ui-icon-button sf-ui-icon-button--soft">${svg}</span><span>Ürün hakkında sor</span></a></div>`:''}${trust}</div>
</div><div class="sf-product-information"><details class="sf-product-information-section" open><summary>Ürün açıklaması</summary><div class="sf-product-information-content">Uzun açıklama metni, içerik doğal olarak kayar.</div></details><details class="sf-product-information-section" id="sf-product-section-additional_information"><summary>Ek bilgi</summary><div class="sf-product-information-content">Ölçüler ve bakım</div></details><details class="sf-product-information-section" id="sf-product-section-reviews"><summary>Değerlendirmeler (0)</summary><div class="sf-product-information-content"><div id="reviews">Değerlendirme alanı</div><a id="review_form"></a></div></details></div>
<section class="related"><h2>İlgili ürünler</h2></section></div></main></body></html>`;}
(async()=>{const browser=await chromium.launch({headless:true});try{const page=await browser.newPage();
for(const width of [320,390,700,900,1280]){await page.goto('about:blank');await page.setViewportSize({width,height:844});await page.setContent(fixture(true));
assert.equal(await page.locator('div.product .sf-product-media > #codela-live-visitor-container').count(),1,'Woo thumbnails hook emits original visitor AFTER gallery, not inside its track');
await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/product-information.js','utf8')});
assert.equal(await page.locator('.woocommerce-product-gallery > .sf-product-visitor').count(),1,'Original Woo sibling counter is adopted by the gallery frame');
const result=await page.evaluate(()=>{const rect=x=>document.querySelector(x).getBoundingClientRect().toJSON();return {overflow:document.documentElement.scrollWidth>innerWidth+1,summary:rect('.summary'),bar:rect('.cdl-fsb-track'),text:rect('.cdl-fsb-text'),counter:rect('.sf-product-visitor'),rail:rect('.flex-control-thumbs'),info:rect('.sf-product-information'),trust:rect('.cdl-tb'),related:rect('.related'),contact:rect('.cdl-wa-button')};});
assert(!result.overflow,'No horizontal overflow '+width);
assert(Math.abs(result.bar.left-result.text.left)<1&&Math.abs(result.bar.width-result.text.width)<1,'Shipping track covers full text/content width without icon indent '+width);
assert(result.counter.bottom<=result.rail.top,'Visitor does not overlap gallery rail '+width);
// The counter is information, not a third floating Header button. Use the
// original plugin node, but none of the shared soft-button glass treatment.
const visitor=await page.locator('.sf-product-visitor .cdl-lv').evaluate(el=>{
 const style=getComputedStyle(el),dot=getComputedStyle(el.querySelector('.cdl-lv-dot'));
 return {width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
   background:style.backgroundColor,color:style.color,border:style.borderTopWidth,position:getComputedStyle(el.parentElement).position,
   shadow:style.boxShadow,blur:style.backdropFilter,dotWidth:dot.width,dotHeight:dot.height,
   dotShadow:dot.boxShadow,dotAnimation:dot.animationName};
});
assert.equal(visitor.position,'absolute','Desktop visitor belongs to gallery frame '+width);
assert(visitor.height<=30,'Visitor label is smaller than a button '+width+' '+JSON.stringify(visitor));
assert(visitor.width<=Math.min(width*.68,240)+1,'Visitor label cannot cover the photograph '+width);
assert.equal(visitor.background,'rgba(0, 0, 0, 0)','Photo metadata has absolutely no background '+width);
assert.equal(visitor.border,'0px','No button border '+width);
assert.equal(visitor.shadow,'none','No floating shadow '+width);
assert.equal(visitor.blur,'none','No interactive glass effect '+width);
assert.equal(await page.locator('.sf-product-visitor .cdl-lv-dot').count(),1,'Original plugin icon node is preserved '+width);
assert.equal(visitor.dotAnimation,'none','Visitor icon does not pulse '+width);
assert.equal(visitor.dotShadow,'none','No animated glowing dot '+width);
assert.equal(await page.locator('.sf-product-visitor .cdl-lv-dot').evaluate(el=>getComputedStyle(el).display),'none','Visitor matches the text-only gallery counter '+width);
await page.evaluate(()=>document.body.classList.add('sf-product-sheet-open'));
assert.equal(await page.locator('.sf-product-visitor').evaluate(e=>getComputedStyle(e).visibility),'hidden','Visitor disappears behind expanded details '+width);
await page.evaluate(()=>document.body.classList.remove('sf-product-sheet-open'));
assert(result.trust.top>=result.contact.bottom-1&&result.trust.bottom<=result.summary.bottom+1,'Original trust belongs to purchase summary after contact '+width);assert(result.related.top>=result.info.bottom-1,'Native information remains immediately before recommendations '+width);
assert(result.contact.height>=44,'Contact touch target '+width);
assert.equal(await page.locator('.cdl-wa-ico').evaluate(el=>getComputedStyle(el).color),'rgb(31, 168, 85)','Shared IconButton retains WhatsApp semantic color');
await page.locator('#sf-product-section-reviews > summary').click();await page.locator('#reviews').waitFor({state:'visible',timeout:3000});assert(await page.locator('#reviews').isVisible(),'Native disclosure opens reviews '+width);
await page.locator('#sf-product-section-reviews > summary').press('Enter');await page.locator('#reviews').waitFor({state:'hidden',timeout:3000});assert(!(await page.locator('#reviews').isVisible()),'Native disclosure keyboard closes reviews '+width);
await page.evaluate(()=>{location.hash='review_form'});await page.waitForFunction(()=>document.querySelector('#sf-product-section-reviews').open);assert(await page.locator('#reviews').isVisible(),'Review hash opens containing disclosure');
if(width===390){
  // The real plugin initializes the host as hidden and later replaces its
  // content when a successful REST ping reaches the configured threshold.
  // Moving the one host must retain that delayed visibility, without cloning.
  await page.locator('#codela-live-visitor-container').evaluate(el=>{el.hidden=true;el.replaceChildren();});
  assert.equal(await page.locator('.sf-product-visitor').isVisible(),false,'Plugin host remains hidden before first live ping');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
    const host=document.getElementById('codela-live-visitor-container');
    const row=document.createElement('div');
    row.className='cdl-lv';
    const text=document.createElement('span');
    text.className='cdl-lv-text';
    text.textContent='Şu an 2 kişi bakıyor';
    row.append(text);host.replaceChildren(row);host.hidden=false;resolve();
  })));
  assert(await page.locator('.woocommerce-product-gallery > #codela-live-visitor-container .cdl-lv-text').isVisible(),'Live REST result reveals original gallery-framed host');
  assert.equal(await page.locator('#codela-live-visitor-container').count(),1,'No duplicated host after delayed plugin update');
  fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-product-modules.png',fullPage:true});
}
// Real expanded-sheet composition: reuse the live plugin nodes, not facsimiles
// of the contact link or the four reassurance entries.
if(width<=700){
const presentation=await page.evaluate(()=>{
  document.body.classList.add('sf-product-sheet-ready');
  const sheet=document.createElement('section');sheet.className='sf-product-sheet is-expanded';
  const content=document.createElement('div');content.className='sf-product-sheet-body';
  ['.sf-product-information','.cdl-wa','.cdl-tb'].forEach(selector=>content.append(document.querySelector(selector)));
  sheet.append(content);document.querySelector('div.product').append(sheet);
  const contact=content.querySelector('.cdl-wa-button'),trust=content.querySelector('.cdl-tb'),items=[...trust.children];
  const a=contact.getBoundingClientRect(),b=trust.getBoundingClientRect(),first=items[0].getBoundingClientRect(),second=items[1].getBoundingClientRect(),third=items[2].getBoundingClientRect();
  const arrow=getComputedStyle(contact,'::after');
  return {
    contactWidth:a.width,trustWidth:b.width,contactLeft:a.left,trustLeft:b.left,
    contactHeight:a.height,contactHref:contact.getAttribute('href'),contactTarget:contact.getAttribute('target'),
    linkCount:content.querySelectorAll('a.cdl-wa-button').length,
    iconColor:getComputedStyle(contact.querySelector('.cdl-wa-ico')).color,
    arrowContent:arrow.content,arrowMask:arrow.maskImage||arrow.webkitMaskImage,
    columns:getComputedStyle(trust).gridTemplateColumns.split(' ').length,
    gap:getComputedStyle(trust).gap,radius:getComputedStyle(trust).borderTopLeftRadius,
    firstHeight:first.height,secondLeft:second.left,firstRight:first.right,
    thirdTop:third.top,firstBottom:first.bottom,
    labels:items.map(item=>item.querySelector('.cdl-tb-label').textContent),
    overflow:document.documentElement.scrollWidth>innerWidth+1
  };
});
assert.equal(presentation.linkCount,1,'Original WhatsApp link remains unique '+width);
assert.equal(presentation.contactHref,'https://wa.me/905000000000','WhatsApp href unchanged '+width);
assert(presentation.contactHeight>=64,'Entire contact row has generous touch area '+width);
assert(Math.abs(presentation.contactLeft-presentation.trustLeft)<1&&Math.abs(presentation.contactWidth-presentation.trustWidth)<1,'Contact and guarantees share panel inset '+width);
assert.equal(presentation.iconColor,'rgb(31, 168, 85)','WhatsApp icon retains brand green '+width);
assert(presentation.arrowMask.includes('arrow-right.svg')&&presentation.arrowContent==='""','Local SVG arrow replaces emoji '+width);
assert.equal(presentation.columns,2,'Exactly two reassurance columns '+width);
assert.equal(presentation.gap,'0px','Single grouped reassurance layout without floating gaps '+width);
assert(presentation.radius!=='0px'&&presentation.firstHeight>=60,'Trust container and minimum row height '+width);
assert(Math.abs(presentation.firstRight-presentation.secondLeft)<2&&presentation.thirdTop>=presentation.firstBottom-1,'Two by two grouped grid '+width);
assert.deepEqual(presentation.labels,['Güvenli ödeme','Kapıda ödeme','Kolay iade','Hızlı kargo'],'Merchant-supplied labels retained');
assert(!presentation.overflow,'No horizontal overflow in expanded sheet '+width);
}
await page.setContent(fixture(false));assert.equal(await page.locator('.cdl-tb,.cdl-fsb-live,.sf-product-visitor,.cdl-wa,.cdl-ub').count(),0,'Disabled modules reserve no hosts');
}
console.log('Product module layout: five widths, full-width track, gallery overlap, trust order, native details and disabled states passed.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
