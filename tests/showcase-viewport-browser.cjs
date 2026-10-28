// Production PHP/CSS/adapter background coverage in a real browser, not jsdom.
// Native mobile toolbar/safe-area behavior still needs physical-device acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root='theme/codela-storefront/assets/';
const css=['styles/tokens.css','storefront.css','styles/overlay.css','styles/navigation.css','styles/components.css','styles/catalog.css','styles/gallery.css','styles/sections.css'].map(p=>fs.readFileSync(process.env.SHOWCASE_CSS&&p==='styles/sections.css'?process.env.SHOWCASE_CSS:root+p,'utf8')).join('\n');
const php=process.env.PHP_BIN||'php';
const html=execFileSync(php,['tests/homepage.php'],{encoding:'utf8',env:{...process.env,RENDER_HOME:'1'}});
const headers=Object.fromEntries([false,true].map(dock=>[dock,execFileSync(php,['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_DOCK:dock?'1':'0'}})]));
const script=fs.readFileSync(root+'scripts/gallery-horizontal.js','utf8');
const engine=process.env.TEST_WEBKIT?'webkit':'chromium';
const results=[];
const realImage=process.env.SHOWCASE_REAL_IMAGE?fs.readFileSync(process.env.SHOWCASE_REAL_IMAGE):null;
const phase=process.env.SHOWCASE_PHASE||'after-183';
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
    return {viewport:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth},hero:rect(hero),header:rect(document.querySelector('.sf-header')),dock:rect(document.querySelector('.sf-mobile-dock')),dockVisible:!!document.querySelector('.sf-mobile-dock')&&getComputedStyle(document.querySelector('.sf-mobile-dock')).display!=='none',controls:rect(hero.querySelector('[data-gallery-controls]')),controlsVisible:!!hero.querySelector('[data-gallery-controls]')&&!hero.querySelector('[data-gallery-controls]').hidden,overflow:document.documentElement.scrollWidth,category:rect(hero.nextElementSibling),slides:slides.map(slide=>({box:rect(slide),art:rect(slide.querySelector('.sf-section-art')),copy:rect(slide.querySelector('.sf-section-copy')),copyBackground:getComputedStyle(slide.querySelector('.sf-section-copy')).backgroundColor,copyOverflow:getComputedStyle(slide.querySelector('.sf-section-copy')).overflowY,copyScrollHeight:slide.querySelector('.sf-section-copy').scrollHeight,copyClientHeight:slide.querySelector('.sf-section-copy').clientHeight,button:rect(slide.querySelector('.sf-ui-button')),image:rect(slide.querySelector('img')),src:slide.querySelector('img').currentSrc,fit:getComputedStyle(slide.querySelector('img')).objectFit,position:slide.querySelector('img').style.objectPosition})),caption:parseFloat(hero.style.getPropertyValue('--sf-hero-caption-height'))||0};
   });
   const mobile=state.viewport.width<=700,toolbar=admin?(state.viewport.width<=782?46:32):0;
   const expected=mobile?Math.max(560,state.viewport.height-68):Math.min(900,Math.max(680,state.viewport.height*.86));
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
    if(!noJS&&!single)assert(Math.abs(slide.copy.height-state.slides[0].copy.height)<1,label+' shared caption anchor across slides');
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
   assert(Math.abs(state.hero.height-expected)<2,label+' preserves 0.1.181 slider height; background does not enlarge it '+JSON.stringify(state));
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
   }
  }
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
  for(const size of [[390,350],[844,390],[1280,400]]){await page.setViewportSize({width:size[0],height:size[1]});await load({long:true});await check('short viewport '+size.join('x'),{});await page.locator('.sf-section--hero .sf-ui-button').first().scrollIntoViewIfNeeded();
   assert(await page.locator('.sf-section--hero .sf-ui-button').first().evaluate(button=>{const r=button.getBoundingClientRect(),dock=document.querySelector('.sf-mobile-dock');const visibleDock=dock&&getComputedStyle(dock).display!=='none';return r.top>=document.querySelector('.sf-header').getBoundingClientRect().bottom&&r.bottom<=(visibleDock?dock.getBoundingClientRect().top:innerHeight)&&button.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}),'Short-window CTA can be scrolled clear of fixed chrome and receives input');}
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
  await hero.locator('[data-gallery-next]').click();await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='2 / 2');
  await track.focus();await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='1 / 2');
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-next]').disabled);
  await page.keyboard.press('Home');await settle();
  fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-showcase-${engine}-390.png`});
  await page.setViewportSize({width:1280,height:900});await load({dock:false});await check('desktop screenshot',{dock:false});await page.screenshot({path:`qa/storefront-ui-kit-showcase-${engine}-1280.png`});

  if(realImage)await captureRealPhotos();else console.log('Actual AZ-photo fixture screenshots skipped: SHOWCASE_REAL_IMAGE was not supplied.');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`qa/showcase-viewport-${engine}.json`,JSON.stringify(results,null,2));
  console.log(`${engine}: ${results.length} background/frame-height/dock/admin/safe-area/resize/fallback cases; source/focus/navigation checks passed.`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
