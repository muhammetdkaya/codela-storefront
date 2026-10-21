const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const rendered=path.join(os.tmpdir(),'sf-image-framing-'+process.pid+'.json');
execFileSync(process.env.PHP_BIN||'php',['tests/image-framing.php'],{env:{...process.env,RENDER_IMAGE_FRAMING:rendered}});
const fixture=JSON.parse(fs.readFileSync(rendered,'utf8'));
const root='theme/codela-storefront/';
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/gallery.css','styles/product.css'].map(p=>fs.readFileSync(root+'assets/'+p,'utf8')).join('\n');
const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1000"><path fill="#cd8d6d" d="M0 0h667v1000H0z"/><path fill="#c8cfac" d="M667 0h666v1000H667z"/><path fill="#9cbbd3" d="M1333 0h667v1000h-667z"/><path fill="#775740" d="M925 200h150v100l50 350q0 150-125 150t-125-150l50-350z"/></svg>');
const attributes=attrs=>Object.entries(attrs).map(([k,v])=>`${k}="${String(v).replaceAll('&','&amp;').replaceAll('"','&quot;')}"`).join(' ');
(async()=>{const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});try{
 const page=await browser.newPage();
 for(const width of [320,390,700,900,901,1280]){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css} .woocommerce div.product div.images img{height:auto}</style></head><body class="single-product"><div class="woocommerce"><div class="product"><div class="sf-product-overview"><div class="sf-product-media"><div class="woocommerce-product-gallery images sf-ui-gallery sf-ui-gallery--hero sf-ui-gallery--scroll"><div class="woocommerce-product-gallery__wrapper">${['cover','contain'].map(mode=>`<div class="woocommerce-product-gallery__image"><a href="${image}"><img src="${image}" width="2000" height="1000" alt="Product" ${attributes(fixture[mode])}></a></div>`).join('')}</div></div></div><div class="summary">Product</div></div></div></div></body></html>`);
  await page.locator('img').first().evaluate(img=>img.decode());
  const styles=await page.locator('.woocommerce-product-gallery__image > a > img').evaluateAll(images=>images.map(img=>{const s=getComputedStyle(img),r=img.getBoundingClientRect(),p=img.parentElement.getBoundingClientRect();return{fit:s.objectFit,position:s.objectPosition,width:r.width,height:r.height,parentWidth:p.width,parentHeight:p.height}}));
  assert.equal(styles[0].fit,width<=900?'cover':'contain','Mobile fill; desktop always shows the entire photo');
  assert.equal(styles[0].position,width<=900?'100% 0%':'50% 50%','Mobile focal point does not shift desktop');
  assert.equal(styles[1].fit,'contain','Per-image opt-out is retained');
  if(width<=900)for(const s of styles){assert(Math.abs(s.height-s.parentHeight)<1,'Native Woo auto-height cannot undo the frame');assert(Math.abs(s.width-s.parentWidth)<1,'Photo element fills frame width');}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow');
  if([390,1280].includes(width)){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-framing-${process.env.TEST_WEBKIT?'webkit':'chromium'}-${width}.png`,fullPage:true});}
 }
 await page.setViewportSize({width:390,height:900});
 await page.addScriptTag({content:`window.jQuery=()=>({on:(types,selector,fn)=>window.framingVariation=fn});window.jQuery.fn={};`});
 await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-defer.js','utf8')});
 await page.evaluate(()=>window.framingVariation({type:'found_variation'},{image:{codela_sf_mobile:{fit:'contain',position:'0% 100%'}}}));
 assert.equal(await page.locator('.woocommerce-product-gallery__image img').first().evaluate(img=>getComputedStyle(img).objectFit),'contain','Native variation changes its framing');
 await page.evaluate(()=>window.framingVariation({type:'reset_data'}));
 assert.equal(await page.locator('.woocommerce-product-gallery__image img').first().evaluate(img=>getComputedStyle(img).objectPosition),'100% 0%','Native reset restores the featured image focal point');
 console.log('Per-image mobile fill/focus, desktop contain, native Woo auto-height and variation/reset passed at six widths.');
}finally{await browser.close();fs.unlinkSync(rendered);}})().catch(e=>{console.error(e);process.exitCode=1});
