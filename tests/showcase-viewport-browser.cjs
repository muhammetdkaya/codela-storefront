// Production PHP/CSS/adapter geometry in a real browser, not jsdom.
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
(async()=>{
 const browser=await (engine==='webkit'?webkit:chromium).launch(process.env.CHROMIUM_BIN&&engine==='chromium'?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  page.setDefaultTimeout(5000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://store.test/**',route=>{
   const url=new URL(route.request().url());
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
  async function check(label,{dock=true,admin=false,safe=0,single=false,noJS=false,exact=true}={}){
   const state=await page.locator('.sf-section--hero').evaluate(hero=>{
    const rect=el=>el?.getBoundingClientRect().toJSON();
    const slides=[...hero.querySelectorAll('.sf-section-slide')];
    return {viewport:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth},hero:rect(hero),header:rect(document.querySelector('.sf-header')),dock:rect(document.querySelector('.sf-mobile-dock')),dockVisible:!!document.querySelector('.sf-mobile-dock')&&getComputedStyle(document.querySelector('.sf-mobile-dock')).display!=='none',controls:rect(hero.querySelector('[data-gallery-controls]')),controlsVisible:!!hero.querySelector('[data-gallery-controls]')&&!hero.querySelector('[data-gallery-controls]').hidden,overflow:document.documentElement.scrollWidth,category:rect(hero.nextElementSibling),slides:slides.map(slide=>({box:rect(slide),art:rect(slide.querySelector('.sf-section-art')),copy:rect(slide.querySelector('.sf-section-copy')),button:rect(slide.querySelector('.sf-ui-button')),image:rect(slide.querySelector('img')),src:slide.querySelector('img').currentSrc,fit:getComputedStyle(slide.querySelector('img')).objectFit,position:slide.querySelector('img').style.objectPosition})),caption:parseFloat(hero.style.getPropertyValue('--sf-hero-caption-height'))||0};
   });
   const mobile=state.viewport.width<=700,toolbar=admin?(state.viewport.width<=782?46:32):0;
   const expected=Math.max(560,state.caption+120,...state.slides.map(slide=>slide.copy.height+120),state.viewport.height-toolbar);
   assert(Math.abs(state.hero.left)<1&&Math.abs(state.hero.width-state.viewport.clientWidth)<1,label+' full containing width '+JSON.stringify(state));
   assert(state.overflow<=state.viewport.width+1,label+' no horizontal overflow');
   assert(Math.abs(state.hero.top-toolbar)<1,label+' only admin toolbar reserves top space');
   assert(Math.abs(state.hero.height-expected)<2,label+' follows visible viewport or readable short-window minimum '+JSON.stringify(state));
   if(exact)assert(Math.abs(state.hero.bottom-state.viewport.height)<2,label+' next content starts below initial viewport');
   assert(state.category.top>=state.hero.bottom,label+' category never pulled under hero');
   assert(state.header.top>=0&&state.header.bottom<=state.slides[0].art.bottom,label+' header remains over image');
   for(const slide of state.slides){
    assert.equal(slide.fit,'cover',label+' preserves approved cover, not distortion');
    assert(Math.abs(slide.art.bottom-slide.copy.top)<1,label+' no media/caption gap');
    assert(Math.abs(slide.image.width-slide.art.width)<1&&Math.abs(slide.image.height-slide.art.height)<1,label+' image fills its frame');
    assert(slide.button.height>=44&&slide.button.bottom<=slide.box.bottom+1,label+' CTA fits with a full touch target');
    if(!noJS&&!single)assert(Math.abs(slide.art.height-state.slides[0].art.height)<1,label+' stable seam across slides');
   }
   assert.equal(state.slides[0].position,'25% 50%',label+' saved focal point retained');
   assert.match(state.slides[0].src,mobile?/image-11-/:/image-10/,label+' independent responsive source retained');
   if(mobile){
    const reserve=(dock?58+4:0)+safe;
    assert(Math.abs(state.hero.bottom-state.slides[0].button.bottom-(20+reserve))<2,label+' CTA bottom respects configured dock/safe area');
    if(state.controlsVisible){
     assert(Math.abs(state.hero.bottom-state.controls.bottom-(20+reserve))<2,label+' controls bottom respects configured dock/safe area');
     assert(state.slides[0].button.right<=state.controls.left+1,label+' CTA does not overlap controls');
    }
    assert.equal(state.dockVisible,dock,label+' never creates an absent dock');
    if(dock&&exact){assert(state.slides[0].button.bottom<=state.dock.top-19,label+' CTA clears actual PHP dock');if(state.controlsVisible)assert(state.controls.bottom<=state.dock.top-19,label+' navigation clears actual PHP dock');}
   }else assert(!state.dockVisible,label+' no desktop dock');
   results.push({label,width:state.viewport.width,height:state.viewport.height,hero:state.hero,caption:state.slides[0].copy.height});
  }
  for(const [width,height] of [[320,568],[390,844],[430,932],[700,900],[701,900],[782,900],[900,900],[1024,768],[1280,800],[1920,1080]])for(const dock of [false,true])for(const admin of [false,true]){
   await page.setViewportSize({width,height});await load({dock,admin});await check(`${width}x${height} dock=${dock} admin=${admin}`,{dock,admin,exact:height-(admin?(width<=782?46:32):0)>=560});
  }
  for(const height of [650,740,620,844,600,844]){await page.setViewportSize({width:390,height});await load({dock:true,safe:34});await check('toolbar-size/safe-area '+height,{safe:34});}
  // Keep the same DOM across breakpoint changes and repeated adapter execution.
  await load({dock:true});
  for(const width of [700,701,390,1280,320,701,390]){await page.setViewportSize({width,height:844});await settle();await page.addScriptTag({content:script});await settle();await check('repeat breakpoint '+width);}
  for(const size of [[390,350],[844,390],[1280,400]]){await page.setViewportSize({width:size[0],height:size[1]});await load({long:true});await check('short viewport '+size.join('x'),{exact:false});await page.locator('.sf-section--hero .sf-ui-button').first().scrollIntoViewIfNeeded();
   assert(await page.locator('.sf-section--hero .sf-ui-button').first().evaluate(button=>{const r=button.getBoundingClientRect(),dock=document.querySelector('.sf-mobile-dock');const visibleDock=dock&&getComputedStyle(dock).display!=='none';return r.top>=document.querySelector('.sf-header').getBoundingClientRect().bottom&&r.bottom<=(visibleDock?dock.getBoundingClientRect().top:innerHeight)&&button.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}),'Short-window CTA can be scrolled clear of fixed chrome and receives input');}
  for(const width of [320,390,1280])for(const single of [false,true])for(const noJS of [false,true]){
   await page.setViewportSize({width,height:900});await load({single,noJS,long:true});await check(`fallback ${width} single=${single} noJS=${noJS}`,{single,noJS});
  }
  for(const single of [false,true]){
   await page.setViewportSize({width:320,height:350});await load({single,noJS:true,long:true});
   await page.locator('.sf-section--hero .sf-ui-button-label').first().evaluate(el=>el.textContent='Uzun erişilebilir koleksiyon bağlantısı '.repeat(14));await settle();
   await check('extreme no-JS copy single='+single,{single,noJS:true,exact:false});
  }
  await page.setViewportSize({width:390,height:844});await load({dock:true});
  const hero=page.locator('.sf-section--hero'),track=hero.locator('.sf-ui-gallery-track');
  await hero.locator('[data-gallery-next]').click();await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='2 / 2');
  await track.focus();await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-count]').textContent==='1 / 2');
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('.sf-section--hero [data-gallery-next]').disabled);
  await page.keyboard.press('Home');await settle();
  fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-showcase-${engine}-390.png`});
  await page.setViewportSize({width:1280,height:900});await load({dock:false});await check('desktop screenshot',{dock:false});await page.screenshot({path:`qa/storefront-ui-kit-showcase-${engine}-1280.png`});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`qa/showcase-viewport-${engine}.json`,JSON.stringify(results,null,2));
  console.log(`${engine}: ${results.length} viewport/dock/admin/safe-area/resize/fallback cases; source/focus/navigation checks passed.`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
