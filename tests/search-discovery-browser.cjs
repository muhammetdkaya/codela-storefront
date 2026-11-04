// Real Chromium and WebKit layout for the existing Codela search discovery panel.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const css = ['assets/styles/tokens.css','assets/storefront.css','assets/styles/overlay.css','assets/styles/components.css']
  .map(file => fs.readFileSync('theme/codela-storefront/'+file,'utf8')).join('\n');
const terms = ['Seramik','Porselen','Büyük Ebat','Yer Karosu'].map(term =>
  '<button type="button" class="sf-popular-term sf-ui-surface sf-ui-pressable">'+term+'</button>').join('');
const cards = Array.from({length:6},(_,i)=>'<a class="sf-explore-card" href="/product/'+i+'"><span class="sf-explore-photo"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="></span><span class="sf-explore-name">Uzun bir ürün adı ve yer karosu 120x120 yeni sezon '+i+'</span><strong class="sf-explore-price">2.400,00 ₺</strong></a>').join('');
const html = '<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head>'+
 '<body><main class="sf-shell" style="padding-top:0!important"><div id="sf-search" class="sf-search-body"><div class="sf-search-toolbar"><form class="sf-search-form"><input id="sf-query" placeholder="Ara"></form></div>'+
 '<div class="sf-search-content"><div class="sf-discovery"><section class="sf-discovery-section"><h3>Popüler aramalar</h3><div class="sf-popular-list">'+terms+'</div></section>'+
 '<section class="sf-discovery-section"><h3>Keşfet</h3><div class="sf-explore-list">'+cards+'</div></section></div></div></div></main></body></html>';
(async ()=>{
 const engine = process.env.TEST_WEBKIT ? webkit : chromium;
 const launchOpts = {headless:true,...(!process.env.TEST_WEBKIT && process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{})};
 const browser=await engine.launch(launchOpts);
 try{
  for(const [width,height,visibleCount] of [[390,900,4],[390,750,3],[390,620,2],[320,620,2]]){
   const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
   await page.setContent(html);
   const actual=await page.evaluate(()=>{
     const list=document.querySelector('.sf-popular-list');
     const buttons=[...list.children].filter(el=>getComputedStyle(el).display!=='none');
     const first=buttons[0], last=buttons[buttons.length-1];
     const shelf=document.querySelector('.sf-explore-list');
     const card=shelf.querySelector('.sf-explore-card');
     const title=card.querySelector('.sf-explore-name'),price=card.querySelector('.sf-explore-price');
     const firstBounds=first.getBoundingClientRect(),lastBounds=last.getBoundingClientRect();
     const photo=card.querySelector('.sf-explore-photo');
     return {
      count:buttons.length,vertical:lastBounds.top>firstBounds.top+30,
      width:Math.round(card.getBoundingClientRect().width),
      glass:getComputedStyle(first).boxShadow,
      titleFont:getComputedStyle(title).fontSize,titleWeight:getComputedStyle(title).fontWeight,
      priceFont:getComputedStyle(price).fontSize,priceWeight:getComputedStyle(price).fontWeight,
      whiteSpace:getComputedStyle(title).whiteSpace,overflow:getComputedStyle(title).textOverflow,
      titleFits:title.scrollWidth>title.clientWidth,
      scrollable:shelf.scrollWidth>shelf.clientWidth,
      bottom:price.getBoundingClientRect().bottom,
      photoHeight:photo.getBoundingClientRect().height,
     };
   });
   assert.equal(actual.count,visibleCount,'Viewport-adaptive keyword count '+height);
   assert(actual.vertical,'Keywords must be vertical '+height);
   assert(actual.glass!=='none','Existing glass surface applied');
   assert.equal(actual.titleFont,'13px');
   assert.equal(actual.titleWeight,'500');
   assert.equal(actual.priceFont,'16px');
   assert.equal(actual.priceWeight,'500');
   assert.equal(actual.whiteSpace,'nowrap');
   assert.equal(actual.overflow,'clip');
   assert(actual.titleFits,'Long product name clipped without appended ellipsis');
   assert(actual.scrollable,'Horizontal product shelf can swipe');
   assert(actual.width<width/2 && actual.width>width/3,'Two large cards per viewport');
   assert(actual.photoHeight>=95,'Product images remain readable');
   assert(actual.bottom<height-65,'First product and price visible above dock '+width+'x'+height+': '+JSON.stringify(actual));
   await page.close();
  }
 }finally{await browser.close();}
 console.log('Responsive glass search discovery and two-up catalog typography: passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
