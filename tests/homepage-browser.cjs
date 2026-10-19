const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root='theme/codela-storefront/';
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/catalog.css','styles/gallery.css','styles/sections.css'].map(p=>fs.readFileSync(root+'assets/'+p,'utf8')).join('\n');
(async()=>{const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{});try{
for(const width of [320,390,700,701,1023,1024,1280])for(const promos of ['split,inset','editorial,banner']){
 const html=execFileSync(process.env.PHP_BIN||'php',['tests/homepage.php'],{encoding:'utf8',env:{...process.env,RENDER_HOME:'1',PROMO_VARIANTS:promos}});assert(!html.includes('Fatal error'));
 const page=await browser.newPage({viewport:{width,height:844},hasTouch:true,isMobile:width===390,...(width===390?{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'}:{}),reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).pathname==='/'?route.fulfill({contentType:'text/html',body:'<html></html>'}):route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#cbbdad"/><circle cx="620" cy="440" r="230" fill="#e8dfcf"/></svg>'}));
 await page.goto('https://store.test/');
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="home"><main class="sf-content">'+html+'</main></body></html>');await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-horizontal.js','utf8')});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow '+width+' '+promos);assert.equal(await page.locator('.sf-section').count(),10);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('img[fetchpriority=high]').count(),1);
 if(width===390&&promos==='split,inset'&&!process.env.TEST_WEBKIT){
  const session=await page.context().newCDPSession(page);
  const swipe=async(x,y,dx,dy)=>{
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=15;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/15,y:y+dy*i/15}]});await page.waitForTimeout(20);}
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
  };
  await swipe(195,380,0,-260);
  if(await page.evaluate(()=>scrollY)<100){
   console.log('Hero gesture diagnostic',await page.evaluate(()=>{let e=document.elementFromPoint(195,300),chain=[];for(;e;e=e.parentElement){const s=getComputedStyle(e);chain.push({tag:e.tagName,cls:e.className,touch:s.touchAction,overscroll:s.overscrollBehaviorY,overflow:s.overflowY,height:e.clientHeight,scrollHeight:e.scrollHeight});}return{scrollY,scrolling:document.scrollingElement.tagName,chain};}));
   fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/storefront-ui-kit-hero-touch.png'});
  }
  assert(await page.evaluate(()=>scrollY)>100,'Vertical touch starting on the hero scrolls the document');
  await page.evaluate(()=>scrollTo(0,0));
  await swipe(320,180,-260,0);
  assert(await page.locator('.sf-section--hero .sf-ui-gallery-track').evaluate(el=>el.scrollLeft)>100,'Horizontal touch still moves the hero');
  await page.locator('.sf-section--hero .sf-ui-gallery-track').evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));
  await page.waitForTimeout(50);await session.detach();
 }
 if(width===390){const image=page.locator('.sf-categories--editorial img').first();await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.decode());assert.match(await image.evaluate(img=>img.currentSrc),/image-13-(160|320)\.svg$/,'Small mobile category selects a small responsive candidate');}
 const bands=page.locator('.sf-categories--bands .sf-category-story'),columns=width>=1024?4:width>700?2:1;
 const cards=await bands.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,bottom:r.bottom};}));
 assert.equal(cards.length,5);assert.equal(cards.filter(r=>Math.abs(r.y-cards[0].y)<1).length,columns,'Visual bands per row '+width);
 for(let i=1;i<columns;i++)assert(cards[i].x>=cards[i-1].x+cards[i-1].width,'Visual bands do not overlap '+width);
 assert(cards[columns].y>=cards[0].bottom,'Extra visual bands wrap to the next row '+width);
 if(width>700){
  await bands.first().locator('h3').evaluate(el=>el.textContent='Yaşam alanlarınıza özel aydınlatma ve dekorasyon koleksiyonları');
  await bands.first().locator('p').evaluate(el=>el.textContent='Doğal dokular ve zamansız tasarımlarla evinizin her köşesine ilham veren seçkiler. '.repeat(3));
  assert(await bands.first().evaluate(el=>{const card=el.getBoundingClientRect();return [...el.querySelectorAll('h3,p,.sf-category-explore')].every(child=>{const r=child.getBoundingClientRect();return r.top>=card.top&&r.bottom<=card.bottom+1&&r.left>=card.left&&r.right<=card.right+1;});}),'Long visual-band copy fits '+width);
 }
 const galleries=page.locator('[data-sf-gallery]');assert.equal(await galleries.count(),4);
 for(let i=0;i<await galleries.count();i++){const gallery=galleries.nth(i),track=gallery.locator('.sf-ui-gallery-track'),count=gallery.locator('[data-gallery-count]');assert((await count.textContent()).startsWith('1 / '));await gallery.locator('[data-gallery-next]').click();await page.waitForFunction(el=>!el.textContent.startsWith('1 / '),await count.elementHandle());await track.focus();await page.keyboard.press('End');await page.waitForFunction(el=>el.disabled,await gallery.locator('[data-gallery-next]').elementHandle());await page.keyboard.press('Home');await page.waitForFunction(el=>el.disabled,await gallery.locator('[data-gallery-prev]').elementHandle());}
 await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-horizontal.js','utf8')});
 const hero=page.locator('.sf-section--hero');await hero.locator('h1').evaluate(e=>e.textContent='Doğal dokularla yaşam alanınıza sıcaklık katan özel koleksiyonlardan seçmeler ve yeni ürünler');await hero.locator('.sf-section-copy p').first().evaluate(e=>e.textContent='Doğal taş ve sade çizgilerle yaşam alanınızı keşfedin. '.repeat(6));const bounds=await hero.evaluate(el=>{const r=el.getBoundingClientRect(),c=el.querySelector('.sf-section-copy').getBoundingClientRect(),b=el.querySelector('.sf-ui-button').getBoundingClientRect();return{top:c.top-r.top,bottom:b.bottom-r.top,height:r.height};});assert(bounds.top>=0&&bounds.bottom<=bounds.height,'Long copy '+JSON.stringify(bounds));
 assert.equal(await page.locator('.sf-categories--editorial .sf-category-story').first().evaluate(e=>getComputedStyle(e).display),'grid');assert(await page.locator('.sf-categories--carousel .sf-category-story').first().evaluate(e=>e.getBoundingClientRect().width<e.parentElement.getBoundingClientRect().width*.9),'Next card peeks');
 const contentHtml=execFileSync(process.env.PHP_BIN||'php',['tests/homepage.php'],{encoding:'utf8',env:{...process.env,RENDER_CONTENT:'1'}});
 await page.locator('main').evaluate((el,html)=>el.insertAdjacentHTML('beforeend',html),contentHtml);
 assert.equal(await page.locator('.sf-section--story,.sf-section--info,.sf-section--contact').count(),3);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Content module overflow '+width);
 const storyLayout=await page.locator('.sf-section--story .sf-content-card').evaluate(el=>{const image=el.querySelector('picture').getBoundingClientRect(),copy=el.querySelector('.sf-content-copy').getBoundingClientRect();return {imageLeft:image.left,copyLeft:copy.left,imageBottom:image.bottom,copyTop:copy.top};});
 assert(width<=700?storyLayout.copyTop>=storyLayout.imageBottom-1:storyLayout.imageLeft>storyLayout.copyLeft,'Responsive image-right composition '+width);
 assert.equal(await page.locator('.sf-section--contact a[href^="tel:"]').count(),1);
 if(process.env.SAVE_SCREENSHOT){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/sections-'+width+'-'+promos.split(',')[0]+'.png',fullPage:true});}assert.deepEqual(errors,[]);await page.close();
}console.log('10 sections, all variants, independent galleries, keyboard, LCP/H1 and long-copy checks passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
