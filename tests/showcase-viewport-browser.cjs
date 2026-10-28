// Production PHP/CSS/adapter background coverage in a real browser, not jsdom.
// Native mobile toolbar/safe-area behavior still needs physical-device acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/assets/';
const css=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css','styles/components.css','styles/catalog.css','styles/gallery.css','styles/sections.css','styles/navigation-feedback.css'].map(p=>fs.readFileSync(process.env.SHOWCASE_CSS&&p==='styles/sections.css'?process.env.SHOWCASE_CSS:process.env.SHOWCASE_FEEDBACK_CSS&&p==='styles/navigation-feedback.css'?process.env.SHOWCASE_FEEDBACK_CSS:root+p,'utf8')).join('\n');
const php=process.env.PHP_BIN||'php';
const html=execFileSync(php,['tests/homepage.php'],{encoding:'utf8',env:{...process.env,RENDER_HOME:'1'}});
const headers=Object.fromEntries([false,true].map(dock=>[dock,execFileSync(php,['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_DOCK:dock?'1':'0'}})]));
const script=fs.readFileSync(root+'scripts/gallery-horizontal.js','utf8');
const feedbackScript=fs.readFileSync(root+'scripts/navigation-feedback.js','utf8');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
const results=[];
const realImage=process.env.SHOWCASE_REAL_IMAGE?fs.readFileSync(process.env.SHOWCASE_REAL_IMAGE):null;
const phase=process.env.SHOWCASE_PHASE||'after-refinement';
assert(/^[a-z0-9-]+$/.test(phase),'Screenshot phase is a safe filename label');
(async()=>{
 const browser=await (engine==='webkit'?webkit:chromium).launch(process.env.CHROMIUM_BIN&&engine==='chromium'?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  page.setDefaultTimeout(5000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://store.test/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/showcase-real-image.webp'&&realImage)return route.fulfill({contentType:'image/webp',body:realImage});
   if(url.pathname.startsWith('/theme/assets/icons/'))return route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'icons/'+url.pathname.split('/').pop())});
   return route.fulfill(url.pathname==='/'?{contentType:'text/html',body:'<!doctype html><title>Showcase geometry</title>'}:{contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#d8cbb9"/><circle cx="600" cy="450" r="220" fill="#f3e9d8"/></svg>'});
  });
  await page.goto('https://store.test/');
  async function settle(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
  async function load({dock=true,admin=false,safe=0,single=false,noJS=false,long=false}={}){
   // Controlled safe-area fixture only; do not label this as physical Safari.
   const styles=safe?css.replaceAll('env(safe-area-inset-bottom,0px)',safe+'px'):css;
   await page.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>'+styles+'\nhtml{margin:0}html:has(body.admin-bar){margin-top:32px!important}@media(max-width:782px){html:has(body.admin-bar){margin-top:46px!important}}</style></head><body class="home '+(admin?'admin-bar':'')+'">'+headers[dock]+'<main class="sf-content" id="sf-content">'+html+'</main></body></html>');
   await page.evaluate(({single,long})=>{
    const hero=document.querySelector('.sf-section--hero');
    hero.querySelector('img').style.objectPosition='25% 50%';
    if(single){hero.querySelectorAll('.sf-section-slide').forEach((el,i)=>{if(i)el.remove()});hero.querySelector('[data-gallery-controls]').remove();hero.removeAttribute('data-sf-gallery');hero.classList.remove('sf-ui-gallery');hero.querySelector('.sf-section-media-track').classList.remove('sf-ui-gallery-track');}
    if(long){hero.querySelector('h1').textContent='Tamamı El Yapımı, Özenle Üretilmiş doğal dokulardan ilham alan çok uzun koleksiyon başlığı';hero.querySelector('p').textContent='Doğal dokular ve el emeği ile özenle üretilen koleksiyonlarımızı keşfedin. '.repeat(6);hero.querySelector('.sf-ui-button-label').textContent='Yeni koleksiyonun bütün ürünlerini şimdi keşfet';}
   },{single,long});
   if(!noJS)await page.addScriptTag({content:script});
   await page.evaluate(()=>scrollTo(0,0));
   await settle();await settle();
  }
  async function check(label,{dock=true,admin=false,safe=0,single=false,noJS=false,extreme=false,real=false}={}){
   const state=await page.locator('.sf-section--hero').evaluate(hero=>{
    const rect=el=>el?.getBoundingClientRect().toJSON();
    const slides=[...hero.querySelectorAll('.sf-section-slide')];
    return {viewport:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth},hero:rect(hero),header:rect(document.querySelector('.sf-header')),dock:rect(document.querySelector('.sf-mobile-dock')),dockVisible:!!document.querySelector('.sf-mobile-dock')&&getComputedStyle(document.querySelector('.sf-mobile-dock')).display!=='none',controls:rect(hero.querySelector('[data-gallery-controls]')),controlsVisible:!!hero.querySelector('[data-gallery-controls]')&&!hero.querySelector('[data-gallery-controls]').hidden,arrows:hero.querySelectorAll('[data-gallery-prev],[data-gallery-next]').length,counter:hero.querySelector('[data-gallery-count]')?.textContent,overflow:document.documentElement.scrollWidth,category:rect(hero.nextElementSibling),slides:slides.map(slide=>({box:rect(slide),art:rect(slide.querySelector('.sf-section-art')),copy:rect(slide.querySelector('.sf-section-copy')),copyBackground:getComputedStyle(slide.querySelector('.sf-section-copy')).backgroundColor,copyOverflow:getComputedStyle(slide.querySelector('.sf-section-copy')).overflowY,copyScrollHeight:slide.querySelector('.sf-section-copy').scrollHeight,copyClientHeight:slide.querySelector('.sf-section-copy').clientHeight,button:rect(slide.querySelector('.sf-ui-button')),image:rect(slide.querySelector('img')),src:slide.querySelector('img').currentSrc,fit:getComputedStyle(slide.querySelector('img')).objectFit,position:slide.querySelector('img').style.objectPosition})),caption:parseFloat(hero.style.getPropertyValue('--sf-hero-caption-height'))||0};
   });
   assert.equal(state.arrows,0,label+' hero arrows are absent');
   if(!single)assert.equal(state.counter,'01 / '+String(state.slides.length).padStart(2,'0'),label+' counter is zero-padded and derives total from slides');
   const mobile=state.viewport.width<=700,toolbar=admin?(state.viewport.width<=782?46:32):0;
   const expected=mobile?Math.max(420,state.viewport.height*.75-51):Math.min(675,Math.max(510,state.viewport.height*.645));
   // Check the design contract first: the previous separate-band CSS must fail
   // here, not merely because its height differed from the requested frame.
   for(const slide of state.slides){
    for(const edge of ['left','top','right','bottom'])assert(Math.abs(slide.art[edge]-slide.box[edge])<1,label+' photo covers entire slide including caption ('+edge+') '+JSON.stringify(slide));
    for(const edge of ['left','top','right','bottom'])assert(Math.abs(slide.image[edge]-slide.box[edge])<1,label+' image fills full background ('+edge+')');
    assert.equal(slide.fit,'cover',label+' preserves cover without stretching');
    assert.equal(slide.copyBackground,'rgba(0, 0, 0, 0)',label+' caption does not restore an opaque band');
    assert(slide.copy.top>=slide.box.top-1&&slide.copy.bottom<=slide.box.bottom+1,label+' caption stays inside the existing slider');
    assert(slide.copy.bottom>slide.art.top&&slide.copy.top<slide.art.bottom,label+' caption overlays the photo');
    assert(slide.button.height>=44,label+' CTA preserves a full touch target');
    if(!extreme)assert(slide.button.top>=slide.copy.top-1&&slide.button.bottom<=slide.copy.bottom+1,label+' ordinary CTA fits within caption');
    if(mobile&&!noJS&&!single)assert(Math.abs(slide.copy.height-state.slides[0].copy.height)<1,label+' shared caption anchor across slides');
    if(state.controlsVisible){
     const c=state.controls,b=slide.button;
     // Compare each slide in its own horizontal coordinate space.
     const shift=slide.box.left-state.hero.left;
     assert(b.right<=c.left+shift+1||b.left>=c.right+shift-1||b.bottom<=c.top+1||b.top>=c.bottom-1,label+' CTA does not overlap gallery controls');
    }
   }
   assert(Math.abs(state.hero.left)<1&&Math.abs(state.hero.width-state.viewport.clientWidth)<1,label+' full containing width '+JSON.stringify(state));
   assert(state.overflow<=state.viewport.width+1,label+' no horizontal overflow');
   assert(Math.abs(state.hero.top-toolbar)<1,label+' admin toolbar keeps its original top reservation');
   assert(Math.abs(state.hero.height-expected)<2,label+' reduces the 0.1.183 frame height by 25% without changing background coverage '+JSON.stringify(state));
   assert(state.category.top>=state.hero.bottom,label+' category remains after the existing slider');
   assert(state.header.top>=0&&state.header.bottom<=state.slides[0].art.bottom,label+' header remains over the full background');
   assert.equal(state.slides[0].position,'25% 50%',label+' saved focal point retained');
   assert.match(state.slides[0].src,real?/showcase-real-image\.webp/:mobile?/image-11-/:/image-10/,label+' independent responsive source retained');
   if(mobile){
    const reserve=(dock?58+4:0)+safe;
    if(!extreme)assert(Math.abs(state.hero.bottom-state.slides[0].button.bottom-(20+reserve))<2,label+' CTA bottom respects configured dock/safe area');
    if(state.controlsVisible){
     assert(Math.abs(state.hero.bottom-state.controls.bottom-(20+reserve))<2,label+' controls bottom respects configured dock/safe area');
     assert(state.slides[0].button.right<=state.controls.left+1,label+' CTA does not overlap controls');
    }
    assert.equal(state.dockVisible,dock,label+' never creates an absent dock');
    if(dock&&state.hero.bottom<=state.viewport.height+1&&!extreme){assert(state.slides[0].button.bottom<=state.dock.top-19,label+' CTA clears actual PHP dock');if(state.controlsVisible)assert(state.controls.bottom<=state.dock.top-19,label+' navigation clears actual PHP dock');}
   }else assert(!state.dockVisible,label+' no desktop dock');
   results.push({label,width:state.viewport.width,height:state.viewport.height,hero:state.hero,caption:state.slides[0].copy.height});
  }
  async function checkHomeSkeleton({width,dock,admin,height=900}){
   await page.setViewportSize({width,height});await load({dock,admin});
   const before=await page.evaluate(()=>{
    const rect=el=>el?.getBoundingClientRect().toJSON();
    window.fixtureHeader=document.querySelector('.sf-header');window.fixtureDock=document.querySelector('.sf-mobile-dock');
    return {hero:rect(document.querySelector('.sf-section--hero')),header:rect(window.fixtureHeader),dock:rect(window.fixtureDock),headerInert:window.fixtureHeader.inert,dockInert:window.fixtureDock?.inert};
   });
   await page.evaluate(()=>{window.codelaSFDocument={home:'https://store.test/'};});
   await page.addScriptTag({content:feedbackScript});
   const token=await page.evaluate(()=>window.codelaSFFeedback.begin({url:'https://store.test/'}));
   assert(token,'Home navigation starts feedback synchronously');
   const pending=await page.evaluate(()=>{
    const rect=el=>el?.getBoundingClientRect().toJSON(),surface=document.querySelector('.sf-skeleton');
    const paint=el=>{const style=getComputedStyle(el);return {background:style.backgroundColor,opacity:Number(style.opacity),display:style.display,visibility:style.visibility};};
    const imagePaint=paint(surface.querySelector('.sf-skeleton-hero-image'));
    const captionPaint=['title','button','count'].map(name=>({name,...paint(surface.querySelector('.sf-skeleton-hero-'+name))}));
    return {imagePaint,captionPaint,surface:rect(surface),layout:rect(surface.querySelector('.sf-skeleton-layout')),layoutMaxHeight:getComputedStyle(surface.querySelector('.sf-skeleton-layout')).maxHeight,hero:rect(surface?.querySelector('.sf-skeleton-hero')),button:rect(surface?.querySelector('.sf-skeleton-hero-button')),count:rect(surface?.querySelector('.sf-skeleton-hero-count')),title:rect(surface?.querySelector('.sf-skeleton-hero-title')),surfaceCount:document.querySelectorAll('.sf-skeleton').length,headerCount:document.querySelectorAll('.sf-header').length,dockCount:document.querySelectorAll('.sf-mobile-dock').length,headerSame:window.fixtureHeader===document.querySelector('.sf-header'),dockSame:window.fixtureDock===document.querySelector('.sf-mobile-dock'),headerInert:window.fixtureHeader.inert,dockInert:window.fixtureDock?.inert,dock:rect(window.fixtureDock),busy:document.querySelector('#sf-content').getAttribute('aria-busy'),hasInteractivePreview:!!surface.querySelector('a,button,input,form'),target:document.documentElement.dataset.sfNavigationTarget};
   });
   const description='home skeleton '+width+'x'+height+' dock='+dock+' admin='+admin;
   assert.equal(pending.target,'home',description+' uses home silhouette');
   assert(pending.hero,description+' paints immediately without delay');
   for(const shape of pending.captionPaint){
    assert(shape.display!=='none'&&shape.visibility==='visible'&&shape.opacity>0,description+' '+shape.name+' placeholder is visibly painted');
    assert(shape.background!=='transparent'&&!/^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(shape.background)&&! /\/\s*0(?:\.0+)?\s*\)$/.test(shape.background),description+' '+shape.name+' placeholder fill is not transparent');
    assert.notEqual(shape.background,pending.imagePaint.background,description+' '+shape.name+' placeholder contrasts with the image skeleton fill');
   }
   assert.equal(pending.layoutMaxHeight,'none',description+' generic mobile content cap does not crop the home preview');
   assert(pending.layout.height>=pending.hero.height-1,description+' layout reserves the full hero height');
   assert(Math.min(pending.layout.bottom,pending.surface.bottom)>=Math.min(pending.hero.bottom,pending.surface.bottom)-1,description+' only viewport boundary may clip the intentionally taller short-window hero');
   for(const edge of ['left','top','right','bottom'])assert(Math.abs(pending.hero[edge]-before.hero[edge])<1,description+' matches real showcase '+edge+' '+JSON.stringify({before:before.hero,pending:pending.hero}));
   assert.equal(pending.surfaceCount,1,description+' one feedback owner');
   assert.equal(pending.headerCount,1,description+' does not clone the header');
   assert.equal(pending.dockCount,dock?1:0,description+' preserves configured dock presence');
   assert(pending.headerSame&&pending.dockSame,description+' retains original shell nodes');
   assert(pending.headerInert,description+' header is inert while loading');
   assert.equal(pending.busy,'true',description+' original main is busy');
   assert(!pending.hasInteractivePreview,description+' placeholders cannot activate controls');
   if(dock){assert(pending.dockInert,description+' actual dock is inert');for(const edge of ['left','top','right','bottom'])assert(Math.abs(pending.dock[edge]-before.dock[edge])<1,description+' actual dock position preserved '+edge);}
   assert(Math.abs(pending.button.height-44)<1,description+' compact CTA placeholder shares the touch-target height');
   assert(pending.button.right<=pending.count.left,description+' CTA and count do not overlap');
   assert(pending.button.bottom<=pending.hero.bottom&&pending.count.bottom<=pending.hero.bottom,description+' placeholders fit the reduced hero');
   if(width===390&&height===900&&dock&&!admin){
    fs.mkdirSync('qa',{recursive:true});
    await page.screenshot({path:'qa/storefront-ui-kit-showcase-'+engine+'-home-skeleton-390.png'});
    if(process.env.SHOWCASE_INLINE_VISUALS){const jpeg=await page.screenshot({type:'jpeg',quality:65});console.log('SHOWCASE_VISUAL:'+engine+':390-skeleton:'+jpeg.toString('base64'));}
   }
   assert(await page.evaluate(token=>window.codelaSFFeedback.end(token),token),description+' cancellation succeeds');
   const restored=await page.evaluate(()=>({surfaceCount:document.querySelectorAll('.sf-skeleton').length,headerSame:window.fixtureHeader===document.querySelector('.sf-header'),dockSame:window.fixtureDock===document.querySelector('.sf-mobile-dock'),headerInert:window.fixtureHeader.inert,dockInert:window.fixtureDock?.inert,busy:document.querySelector('#sf-content').getAttribute('aria-busy'),pending:document.documentElement.hasAttribute('data-sf-navigation-pending')}));
   assert.equal(restored.surfaceCount,0,description+' cancellation removes feedback');assert(!restored.pending,description+' cancellation clears pending state');
   assert(restored.headerSame&&restored.dockSame,description+' cancellation keeps original shell identity');assert.equal(restored.headerInert,before.headerInert);assert.equal(restored.dockInert,before.dockInert);assert.equal(restored.busy,null);
   results.push({label:description,width,height,hero:pending.hero,layout:pending.layout,layoutMaxHeight:pending.layoutMaxHeight,surface:pending.surface,imagePaint:pending.imagePaint,captionPaint:pending.captionPaint,kind:'home-skeleton'});
  }
  // Real public AZ banner and its visible copy, inside the deterministic PHP
  // fixture. These are before/after source previews, not live-site screenshots.
  async function captureRealPhotos({assertGeometry=true}={}){
   fs.mkdirSync('qa',{recursive:true});
   for(const width of [390,1280]){
    await page.setViewportSize({width,height:900});await load({dock:width<=700});
    await page.locator('.sf-section--hero .sf-section-slide').first().evaluate(slide=>{
     const picture=slide.querySelector('picture');picture.querySelectorAll('source').forEach(s=>s.remove());
     const img=picture.querySelector('img');img.removeAttribute('srcset');img.src='/showcase-real-image.webp';
     slide.querySelector('h1').textContent='Tamamı El Yapımı, Özenle Üretilmiş';
     slide.querySelector('p')?.remove();slide.querySelector('.sf-ui-button-label').textContent='Koleksiyonu keşfet';
    });
    await page.locator('.sf-section--hero img').first().evaluate(img=>img.decode());await settle();await settle();
    if(assertGeometry)await check('actual AZ photo fixture '+width,{dock:width<=700,real:true});
    await page.screenshot({path:`qa/storefront-ui-kit-showcase-${engine}-${phase}-az-${width}.png`});
    if(process.env.SHOWCASE_INLINE_VISUALS){const jpeg=await page.screenshot({type:'jpeg',quality:65});console.log('SHOWCASE_VISUAL:'+engine+':'+width+':'+jpeg.toString('base64'));}
   }
  }
  if(process.env.SHOWCASE_CONTRAST_ONLY){await checkHomeSkeleton({width:390,height:900,dock:true,admin:false});return;}
  if(process.env.SHOWCASE_SCREENSHOTS_ONLY){
   assert(realImage,'Before/after screenshots require SHOWCASE_REAL_IMAGE');
   await captureRealPhotos({assertGeometry:false});
   fs.writeFileSync(`qa/showcase-viewport-${engine}-${phase}-preview.json`,JSON.stringify({phase,engine,kind:'actual AZ image in isolated PHP fixture',geometryAssertionsRun:false},null,2));
   console.log(`${phase}: actual AZ-image fixture screenshots captured; geometry acceptance was not run.`);
   return;
  }
  for(const [width,height] of [[320,568],[390,844],[430,932],[700,900],[701,900],[782,900],[900,900],[1024,768],[1280,800],[1920,1080]])for(const dock of [false,true])for(const admin of [false,true]){
   await page.setViewportSize({width,height});await load({dock,admin});await check(`${width}x${height} dock=${dock} admin=${admin}`,{dock,admin});
  }
  for(const height of [650,740,620,844,600,844]){await page.setViewportSize({width:390,height});await load({dock:true,safe:34});await check('toolbar-size/safe-area '+height,{safe:34});}
  // Keep the same DOM across breakpoint changes and repeated adapter execution.
  await load({dock:true});
  for(const width of [700,701,390,1280,320,701,390]){await page.setViewportSize({width,height:844});await settle();await page.addScriptTag({content:script});await settle();await check('repeat breakpoint '+width);}
  for(const size of [[390,350],[844,390],[1280,400]]){
   await page.setViewportSize({width:size[0],height:size[1]});await load({long:true});await check('short viewport '+size.join('x'),{});
   const cta=page.locator('.sf-section--hero .sf-ui-button').first();
   const inspectCTA=()=>cta.evaluate(button=>{
    const rect=el=>el?.getBoundingClientRect().toJSON(),r=rect(button),header=rect(document.querySelector('.sf-header')),dock=document.querySelector('.sf-mobile-dock'),visibleDock=!!dock&&getComputedStyle(dock).display!=='none',dockRect=rect(dock),copy=button.closest('.sf-section-copy'),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {viewport:{width:innerWidth,height:innerHeight},scrollY,button:r,header,dock:dockRect,visibleDock,copy:{rect:rect(copy),scrollTop:copy.scrollTop,scrollHeight:copy.scrollHeight,clientHeight:copy.clientHeight,overflowY:getComputedStyle(copy).overflowY},hit:hit?{tag:hit.tagName,className:hit.className}:null,reachable:r.top>=header.bottom&&r.bottom<=(visibleDock?dockRect.top:innerHeight)&&button.contains(hit)};
   });
   await cta.scrollIntoViewIfNeeded();
   const before=await inspectCTA();
   const prefix='qa/storefront-ui-kit-showcase-short-'+engine+'-'+size.join('x');
   fs.mkdirSync('qa',{recursive:true});
   let wheel=null;
   if(!before.reachable){
    await page.screenshot({path:prefix+'-before-scroll.png'});
    // scrollIntoView only considers the viewport, not fixed header/dock
    // occlusion. Exercise the user's real page scroll before asserting access.
    const clearTop=before.header.bottom+16,clearBottom=(before.visibleDock?before.dock.top:before.viewport.height)-16;
    const delta=before.button.bottom>clearBottom?before.button.bottom-clearBottom:before.button.top<clearTop?before.button.top-clearTop:0;
    if(delta){
     const x=Math.min(before.viewport.width-24,Math.max(24,before.button.left+before.button.width/2));
     const imageBottom=Math.min(before.copy.rect.top,clearBottom);
     const y=before.header.bottom+Math.min(8,(imageBottom-before.header.bottom)/2);
     wheel={x,y,delta,target:await page.evaluate(({x,y})=>{const hit=document.elementFromPoint(x,y);return {tag:hit?.tagName,className:hit?.className,onImage:!!hit?.closest('.sf-section-art')};},{x,y})};
     if(wheel.target.onImage){await page.mouse.move(x,y);await page.mouse.wheel(0,delta);}
     else console.error('No unobstructed image wheel target',JSON.stringify({case:size.join('x'),before,wheel}));
     await page.waitForFunction(previous=>Math.abs(scrollY-previous)>.5,before.scrollY,{timeout:1500}).catch(()=>{});
     await settle();await settle();
    }
   }
   const after=await inspectCTA();
   const diagnostic={case:size.join('x'),engine,before,wheel,after};
   fs.writeFileSync('qa/showcase-viewport-short-'+engine+'-'+size.join('x')+'.json',JSON.stringify(diagnostic,null,2));
   if(!after.reachable){await page.screenshot({path:prefix+'-failure.png'});console.error('Short-window CTA diagnostic',JSON.stringify(diagnostic));}
   assert(after.reachable,'Short-window CTA can be scrolled clear of fixed chrome and receives input '+JSON.stringify(diagnostic));
  }
  for(const width of [320,390,1280])for(const single of [false,true])for(const noJS of [false,true]){
   await page.setViewportSize({width,height:900});await load({single,noJS,long:true});await check(`fallback ${width} single=${single} noJS=${noJS}`,{single,noJS});
  }
  for(const single of [false,true]){
   await page.setViewportSize({width:320,height:350});await load({single,noJS:true,long:true});
   await page.locator('.sf-section--hero .sf-ui-button-label').first().evaluate(el=>el.textContent='Uzun erişilebilir koleksiyon bağlantısı '.repeat(14));await settle();
   await check('extreme no-JS copy single='+single,{single,noJS:true,extreme:true});
   const copy=page.locator('.sf-section--hero .sf-section-copy').first();
   assert(await copy.evaluate(el=>el.scrollHeight>el.clientHeight+1&&getComputedStyle(el).overflowY==='auto'),'Extreme fallback content scrolls inside caption without enlarging slider');
   const scrolled=await copy.evaluate(el=>{el.scrollTop=el.scrollHeight;return el.scrollTop});
   assert(scrolled>0,'Extreme fallback caption can reach later content');
   await page.evaluate(()=>{const hero=document.querySelector('.sf-section--hero');scrollTo(0,hero.getBoundingClientRect().bottom+scrollY-innerHeight)});await settle();
   assert(await copy.evaluate(el=>{const button=el.querySelector('.sf-ui-button'),b=button.getBoundingClientRect(),c=el.getBoundingClientRect(),dock=document.querySelector('.sf-mobile-dock').getBoundingClientRect();const y=Math.min(b.bottom-8,c.bottom-20,dock.top-8,innerHeight-8),x=b.left+b.width/2;return y>Math.max(b.top,c.top,document.querySelector('.sf-header').getBoundingClientRect().bottom)&&button.contains(document.elementFromPoint(x,y));}),'Scrolled extreme CTA has a reachable hit area clear of fixed chrome');
  }
  await page.setViewportSize({width:390,height:844});await load({dock:true});
  const hero=page.locator('.sf-section--hero'),track=hero.locator('.sf-ui-gallery-track');
  assert.equal(await hero.locator('[data-gallery-prev],[data-gallery-next]').count(),0,'No hero arrow nodes');
  await track.focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='02 / 02');
  await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='01 / 02');
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='02 / 02');
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='01 / 02');
  await page.keyboard.press('Home');await settle();
  fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-showcase-${engine}-390.png`});
  await page.setViewportSize({width:1280,height:900});await load({dock:false});await check('desktop screenshot',{dock:false});await page.screenshot({path:`qa/storefront-ui-kit-showcase-${engine}-1280.png`});

  for(const width of [320,390,700,701,1280])for(const dock of [false,true])for(const admin of [false,true])await checkHomeSkeleton({width,dock,admin});
  for(const dock of [false,true])for(const admin of [false,true])await checkHomeSkeleton({width:390,height:350,dock,admin});

  if(realImage)await captureRealPhotos();else console.log('Actual AZ-photo fixture screenshots skipped: SHOWCASE_REAL_IMAGE was not supplied.');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`qa/showcase-viewport-${engine}.json`,JSON.stringify(results,null,2));
  console.log(`${engine}: ${results.length} background/frame-height/dock/admin/safe-area/resize/fallback cases; source/focus/navigation checks passed.`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
