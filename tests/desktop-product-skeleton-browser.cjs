const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const root='theme/codela-storefront/assets/';
const css=['storefront.css','styles/tokens.css','styles/components.css','styles/navigation.css','styles/gallery.css','styles/product.css','styles/navigation-feedback.css'].map(x=>fs.readFileSync(root+x,'utf8')).join('\n');
const script=fs.readFileSync(root+'scripts/navigation-feedback.js','utf8');
(async()=>{const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch();try{
 const page=await browser.newPage();
 for(const width of [901,1024,1280,1600]){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<style>${css}</style><body class="single-product"><div class="sf-shell"></div><main id="sf-content" class="sf-content"><div class="product"><div class="sf-product-overview"><div class="sf-product-media"><div class="woocommerce-product-gallery"><div class="woocommerce-product-gallery__wrapper"></div></div></div><div class="summary"><h1>Title</h1></div></div></div></main></body>`);
  const native=await page.evaluate(()=>{const box=s=>{let r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return{media:box('.woocommerce-product-gallery__wrapper'),summary:box('.summary')}});
  await page.evaluate(()=>window.codelaSFDocument={productBase:'https://store.test/product/'});
  await page.addScriptTag({content:script});
  await page.evaluate(()=>codelaSFFeedback.begin({url:'https://store.test/product/example/'}));
  const feedback=await page.evaluate(()=>{const box=s=>{let r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return{media:box('.sf-skeleton-gallery'),summary:box('.sf-skeleton-product-summary')}});
  for(const key of ['x','y','width','height'])assert(Math.abs(native.media[key]-feedback.media[key])<1,`${width} media ${key}: ${JSON.stringify({native,feedback})}`);
  for(const key of ['x','y','width'])assert(Math.abs(native.summary[key]-feedback.summary[key])<1,`${width} summary ${key}: ${JSON.stringify({native,feedback})}`);
  assert(await page.locator('.sf-skeleton-product-title').isVisible());assert(await page.locator('.sf-skeleton-product-button').isVisible());
  assert.equal(await page.locator('.sf-skeleton-product form, .sf-skeleton-product button, .sf-skeleton-product input').count(),0);
  if(width===1280){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/desktop-product-skeleton-${process.env.TEST_WEBKIT?'webkit':'chromium'}.png`});}
  await page.evaluate(()=>codelaSFFeedback.end());assert.equal(await page.locator('.sf-skeleton').count(),0);
 }
 console.log('Desktop product skeleton matches real gallery and summary geometry at 901, 1024, 1280 and 1600.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
