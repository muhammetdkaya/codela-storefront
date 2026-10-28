const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root='theme/codela-storefront/';
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/catalog.css','styles/gallery.css','styles/sections.css'].map(p=>fs.readFileSync(root+'assets/'+p,'utf8')).join('\n');
(async()=>{const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch(process.env.CHROMIUM_BIN&&!process.env.TEST_WEBKIT?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{});try{
for(const width of [320,390,700,701,1023,1024,1280])for(const promos of ['split,inset','editorial,banner']){
 const html=execFileSync(process.env.PHP_BIN||'php',['tests/homepage.php'],{encoding:'utf8',env:{...process.env,RENDER_HOME:'1',PROMO_VARIANTS:promos}});assert(!html.includes('Fatal error'));
 const page=await browser.newPage({viewport:{width,height:844},hasTouch:true,isMobile:width===390,...(width===390?{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'}:{}),reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).pathname==='/'?route.fulfill({contentType:'text/html',body:'<html></html>'}):route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#cbbdad"/><circle cx="620" cy="440" r="230" fill="#e8dfcf"/></svg>'}));
 await page.goto('https://store.test/');
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body class="home"><main class="sf-content">'+html+'</main></body></html>');
 if(width<=700)await page.locator('.sf-section--hero .sf-section-slide').nth(1).locator('.sf-section-copy p').evaluate(el=>el.textContent='Özenle üretilen, doğal dokularla yaşam alanınızı zenginleştiren özel koleksiyonlarımızı keşfedin.');
 await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-horizontal.js','utf8')});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow '+width+' '+promos);assert.equal(await page.locator('.sf-section').count(),10);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('img[fetchpriority=high]').count(),1);
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
 const vitrin=await page.locator('.sf-section--hero .sf-section-slide').first().evaluate(el=>{const art=el.querySelector('picture').getBoundingClientRect(),copy=el.querySelector('.sf-section-copy').getBoundingClientRect();const slide=el.getBoundingClientRect();return {imageTop:art.top,imageBottom:art.bottom,imageLeft:art.left,imageRight:art.right,slideTop:slide.top,slideBottom:slide.bottom,slideLeft:slide.left,slideRight:slide.right,copyTop:copy.top,copyBottom:copy.bottom,fit:getComputedStyle(el.querySelector('picture img')).objectFit};});
 assert(['Top','Bottom','Left','Right'].every(edge=>Math.abs(vitrin['image'+edge]-vitrin['slide'+edge])<1),'Vitrin photo covers the entire slide, including behind caption');
 assert(vitrin.copyTop>=vitrin.imageTop&&vitrin.copyBottom<=vitrin.imageBottom+1,'Caption overlays the existing photo frame');
 assert.equal(vitrin.fit,'cover','Landscape and portrait photos fill the frame without letterboxing');
 const frames=await page.locator('.sf-section--hero .sf-section-slide').evaluateAll(els=>els.map(el=>{const a=el.querySelector('picture').getBoundingClientRect();return {top:a.top,height:a.height};}));
 assert(frames.every(r=>Math.abs(r.height-frames[0].height)<1),'Every slide has the same image height regardless of copy');
 if(width<=700){
  const layout=await page.locator('.sf-section--hero').evaluate(el=>{
   const hero=el.getBoundingClientRect(),image=el.querySelector('.sf-section-art').getBoundingClientRect();
   const caption=el.querySelector('.sf-section-copy').getBoundingClientRect();
   const button=el.querySelector('.sf-section-copy .sf-ui-button').getBoundingClientRect();
   const controls=el.querySelector('.sf-section-gallery-controls').getBoundingClientRect();
   const headline=el.querySelector('.sf-section-copy h1,.sf-section-copy h2').getBoundingClientRect();
   const seams=[...el.querySelectorAll('.sf-section-slide')].map(slide=>{
     const copy=slide.querySelector('.sf-section-copy'),style=copy&&getComputedStyle(copy);
     const children=copy?[...copy.children].filter(child=>getComputedStyle(child).display!=='none'):[];
     const requiredHeight=copy?parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+parseFloat(style.rowGap)*Math.max(0,children.length-1)+children.reduce((sum,child)=>sum+child.getBoundingClientRect().height,0):0;
     return copy?{requiredHeight,imageBottom:slide.querySelector('.sf-section-art').getBoundingClientRect().bottom,
       firstChildGap:copy.firstElementChild.getBoundingClientRect().top-copy.getBoundingClientRect().top,
       ctaBottom:slide.getBoundingClientRect().bottom-copy.querySelector('.sf-ui-button').getBoundingClientRect().bottom}:null;
   }).filter(Boolean);
   return{heroHeight:hero.height,imageHeight:image.height,captionHeight:caption.height,
     buttonRight:button.right,buttonBottom:button.bottom,controlsLeft:controls.left,
     controlsBottom:controls.bottom,heroBottom:hero.bottom,headlineTop:headline.top,captionTop:caption.top,seams};
  });
  assert(Math.abs(layout.heroHeight-Math.max(420,844*.75-51))<2,'Mobile Vitrin is 25% shorter '+width+' '+JSON.stringify(layout));
  assert(Math.abs(layout.imageHeight-layout.heroHeight)<1,'Mobile photo fills the entire existing slider height '+width);
  assert(Math.abs(layout.captionHeight-Math.max(...layout.seams.map(s=>s.requiredHeight)))<2,'Mobile caption equals rendered copy rather than an arbitrary fixed-height cap '+width+' '+JSON.stringify(layout));
  assert(layout.seams.every(s=>Math.abs(s.firstChildGap-18)<1),'Mobile overlaid caption keeps its 18px top padding '+width+' '+JSON.stringify(layout.seams));
  assert(layout.seams.every(s=>Math.abs(s.ctaBottom-20)<2),'Every CTA shares the bottom anchor with navigation '+width);
  assert(layout.seams.every(s=>Math.abs(s.imageBottom-layout.seams[0].imageBottom)<1),'Different subtitles do not change full-background image bounds '+width);
  const categoryGap=await page.locator('.sf-section--hero').evaluate(el=>el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom);
  assert(categoryGap>=11&&categoryGap<=14,'First category retains existing compact spacing '+width+' '+categoryGap);
  assert(layout.buttonRight<=layout.controlsLeft+1,'CTA remains left of counter and progress '+width+' '+JSON.stringify(layout));
  assert(Math.abs(layout.heroBottom-layout.buttonBottom-20)<2,'CTA bottom anchor stable '+width+' '+JSON.stringify(layout));
  assert(Math.abs(layout.heroBottom-layout.controlsBottom-20)<2,'Slider controls align with CTA bottom '+width);
 }

 assert.equal(await page.locator('.sf-section--hero [data-gallery-prev],.sf-section--hero [data-gallery-next]').count(),0,'Hero arrows are removed, not merely hidden');
 const label=page.locator('.sf-section--hero .sf-section-slide').first().locator('.sf-hero-eyebrow');
 assert.equal(await label.count(),1,'Optional label is rendered for the configured first hero');
 assert(await label.evaluate(el=>el.nextElementSibling.matches('h1,h2')),'Label precedes the headline');
 assert.equal(await page.locator('.sf-section--hero .sf-section-slide').nth(1).locator('.sf-hero-eyebrow').count(),0,'Empty label produces no spacer');
 assert(await page.locator('.sf-section--hero .sf-ui-button').first().evaluate(el=>el.getBoundingClientRect().height>=44),'Compact CTA retains a 44px hit area');
 const progress=page.locator('.sf-section--hero .sf-hero-progress > span');
 assert.equal(await progress.count(),await page.locator('.sf-section--hero .sf-section-slide').count(),'One progress segment per hero slide');
 const galleries=page.locator('[data-sf-gallery]');assert.equal(await galleries.count(),4);
 for(let i=0;i<await galleries.count();i++){
  const gallery=galleries.nth(i),track=gallery.locator('.sf-ui-gallery-track'),count=gallery.locator('[data-gallery-count]');
  const isHero=await gallery.evaluate(el=>el.classList.contains('sf-section--hero'));
  const total=await track.locator(':scope > *').count(),format=n=>isHero?String(n).padStart(2,'0'):String(n);
  assert.equal(await count.textContent(),format(1)+' / '+format(total));
  if(isHero){await track.focus();await page.keyboard.press('ArrowRight');}
  else await gallery.locator('[data-gallery-next]').click();
  await page.waitForFunction(({el,text})=>el.textContent===text,{el:await count.elementHandle(),text:format(2)+' / '+format(total)});
  await track.focus();await page.keyboard.press('End');
  await page.waitForFunction(({el,text})=>el.textContent===text,{el:await count.elementHandle(),text:format(total)+' / '+format(total)});
  if(!isHero)assert(await gallery.locator('[data-gallery-next]').isDisabled(),'Nonhero next control still reaches its boundary');
  await page.keyboard.press('Home');
  await page.waitForFunction(({el,text})=>el.textContent===text,{el:await count.elementHandle(),text:format(1)+' / '+format(total)});
  if(!isHero)assert(await gallery.locator('[data-gallery-prev]').isDisabled(),'Nonhero previous control still reaches its boundary');
 }
 assert.equal(await progress.locator('..').locator('.is-current').count(),1);
 await page.addScriptTag({content:fs.readFileSync(root+'assets/scripts/gallery-horizontal.js','utf8')});
 const hero=page.locator('.sf-section--hero');await hero.locator('h1').evaluate(e=>e.textContent='Doğal dokularla yaşam alanınıza sıcaklık katan özel koleksiyonlardan seçmeler ve yeni ürünler');await hero.locator('.sf-section-copy p').first().evaluate(e=>e.textContent='Doğal taş ve sade çizgilerle yaşam alanınızı keşfedin. '.repeat(6));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const bounds=await hero.evaluate(el=>{const r=el.getBoundingClientRect(),c=el.querySelector('.sf-section-copy').getBoundingClientRect(),b=el.querySelector('.sf-ui-button').getBoundingClientRect();return{top:c.top-r.top,bottom:b.bottom-r.top,height:r.height};});assert(bounds.top>=0&&bounds.bottom<=bounds.height-(width<=700?16:20),'Long copy stays in caption '+JSON.stringify(bounds));const fullBackground=await hero.locator('.sf-section-slide').first().evaluate(el=>{const slide=el.getBoundingClientRect(),art=el.querySelector('picture').getBoundingClientRect();return Math.abs(art.top-slide.top)<1&&Math.abs(art.bottom-slide.bottom)<1;});assert(fullBackground,'Long copy never changes full-background coverage');
 assert.equal(await page.locator('.sf-categories--editorial .sf-category-story').first().evaluate(e=>getComputedStyle(e).display),'grid');assert(await page.locator('.sf-categories--carousel .sf-category-story').first().evaluate(e=>e.getBoundingClientRect().width<e.parentElement.getBoundingClientRect().width*.9),'Next card peeks');
 const contentHtml=execFileSync(process.env.PHP_BIN||'php',['tests/homepage.php'],{encoding:'utf8',env:{...process.env,RENDER_CONTENT:'1'}});
 await page.locator('main').evaluate((el,html)=>el.insertAdjacentHTML('beforeend',html),contentHtml);
 assert.equal(await page.locator('.sf-section--story,.sf-section--info,.sf-section--contact').count(),3);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Content module overflow '+width);
 const storyLayout=await page.locator('.sf-section--story .sf-content-card').evaluate(el=>{const image=el.querySelector('picture').getBoundingClientRect(),copy=el.querySelector('.sf-content-copy').getBoundingClientRect();return {imageLeft:image.left,copyLeft:copy.left,imageBottom:image.bottom,copyTop:copy.top};});
 assert(width<=700?storyLayout.copyTop>=storyLayout.imageBottom-1:storyLayout.imageLeft>storyLayout.copyLeft,'Responsive image-right composition '+width);
 assert.equal(await page.locator('.sf-section--contact a[href^="tel:"]').count(),1);
 if(width===390&&promos==='split,inset'&&!process.env.TEST_WEBKIT){
  await page.evaluate(()=>scrollTo(0,0));
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
  await session.detach();
 }
 if(process.env.SAVE_SCREENSHOT){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:'qa/sections-'+width+'-'+promos.split(',')[0]+'.png',fullPage:true});}assert.deepEqual(errors,[]);await page.close();
}console.log('10 sections, all variants, independent galleries, keyboard, LCP/H1 and long-copy checks passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
