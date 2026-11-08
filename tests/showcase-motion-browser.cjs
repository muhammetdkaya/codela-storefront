// Real rendered section markup, native scroll-snap and browser mouse input.
// TEST_BROWSER=chromium|webkit|firefox; no live store or network mutations.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const engines=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.TEST_BROWSER||'chromium',root='theme/codela-storefront/assets/';
const source=fs.readFileSync(process.env.GALLERY_SOURCE||root+'scripts/gallery-horizontal.js','utf8');
const css=['styles/tokens.css','storefront.css','styles/components.css','styles/gallery.css','styles/sections.css'].map(p=>fs.readFileSync(root+p,'utf8')).join('\n');
const render=execFileSync(process.env.PHP_BIN||'php',['-r',`ob_start();require 'tests/homepage.php';ob_end_clean();$items=[item(),item('Second',12),item('Third',13)];echo codela_sf_section_media(data('hero','showcase',$items),'hero',true).'<div class="spacer">After the slideshow</div>'.codela_sf_section_media(data('promo','split',[$items[0],$items[1]]),'promo',false);`],{encoding:'utf8'});
assert(!render.includes('Fatal error'));
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#ac967d"/><circle cx="640" cy="400" r="220" fill="#eee0cb"/></svg>';
const section=page=>page.locator('.sf-section--hero'),track=page=>section(page).locator('.sf-ui-gallery-track');
const count=page=>section(page).locator('[data-gallery-count]').textContent();
const waitCount=(page,text)=>page.waitForFunction(text=>document.querySelector('.sf-section--hero [data-gallery-count]')?.textContent===text,text,{timeout:9000});
const aligned=page=>page.waitForFunction(()=>{const t=document.querySelector('.sf-section--hero .sf-ui-gallery-track');return Math.abs(t.scrollLeft/t.clientWidth-Math.round(t.scrollLeft/t.clientWidth))<.002},null,{timeout:5000});
(async()=>{
 const browser=await engines[engine].launch(engine==='chromium'&&process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{ });
 const results=[];fs.mkdirSync('qa/slider',{recursive:true});
 const open=async({width=1280,reducedMotion='reduce'}={})=>{
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion,hasTouch:width<700});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!=='https://showcase.test')return route.abort();
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;font-family:Arial}.spacer{height:1100px}</style></head><body class="home"><main class="sf-content">${render.replaceAll('href="/shop/"','href="#clicked"')}</main><script>${source}</script></body></html>`});
   return route.fulfill({contentType:'image/svg+xml',body:svg});
  });
  await page.goto('https://showcase.test/');await page.waitForSelector('[data-sf-gallery-ready="1"]');
  await page.mouse.move(width-1,899);
  return {page,context,errors,close:async()=>{assert.deepEqual(errors,[]);await context.close()}};
 };
 const drag=async(page,from,to,y)=>{await page.mouse.move(from,y);await page.mouse.down();await page.mouse.move(to,y,{steps:18});await page.mouse.up();await aligned(page)};
 try{
  let test=await open({reducedMotion:'no-preference'}),page=test.page;
  assert.equal(await section(page).locator('[data-gallery-rotation],.sf-gallery-rotation').count(),0,'No start/pause button is rendered');
  assert.equal(await section(page).locator('[data-gallery-controls] button').count(),0,'Hero controls contain only the existing counter/progress');
  await waitCount(page,'02 / 03');await waitCount(page,'03 / 03');await waitCount(page,'01 / 03');
  assert.equal(await section(page).locator('[data-gallery-count]').getAttribute('aria-live'),'off');results.push('Autoplay advances every six seconds and wraps');
  await page.mouse.move(600,200);const paused=await count(page);await page.waitForTimeout(6500);assert.equal(await count(page),paused);
  await page.mouse.move(1279,899);await waitCount(page,'02 / 03');results.push('Hover pauses and leave resumes');
  await track(page).focus();await page.keyboard.press('Home');await waitCount(page,'01 / 03');
  await page.waitForTimeout(6500);assert.equal(await count(page),'01 / 03');results.push('Keyboard focus pauses rotation while inside the gallery');
  await page.evaluate(()=>{const outside=document.querySelector('.spacer');outside.tabIndex=-1;outside.focus({preventScroll:true})});
  await waitCount(page,'02 / 03');results.push('Leaving keyboard focus resumes automatically without a start button');
  await page.emulateMedia({reducedMotion:'reduce'});const reduced=await count(page);await page.waitForTimeout(6500);assert.equal(await count(page),reduced);results.push('Changed reduced-motion preference stops autoplay');
  await page.emulateMedia({reducedMotion:'no-preference'});await waitCount(page,'03 / 03');results.push('Restoring motion preference resumes without a button');await test.close();
  test=await open({width:390,reducedMotion:'no-preference'});page=test.page;await waitCount(page,'02 / 03');results.push('Mobile hero also advances automatically after six seconds');await test.close();

  test=await open();page=test.page;
  await drag(page,1000,450,200);await waitCount(page,'02 / 03');await drag(page,400,950,200);await waitCount(page,'01 / 03');
  await drag(page,800,785,200);await waitCount(page,'01 / 03');results.push('Desktop image drag works both directions; short drag snaps back');
  await track(page).focus();await page.keyboard.press('End');await waitCount(page,'03 / 03');await page.keyboard.press('ArrowRight');assert.equal(await count(page),'03 / 03');await page.keyboard.press('Home');await waitCount(page,'01 / 03');results.push('Keyboard navigation and manual endpoints remain bounded');
  const cta=section(page).locator('.sf-section-copy a').first();let rect=await cta.boundingBox();await drag(page,rect.x+rect.width*.6,rect.x-180,rect.y+rect.height/2);assert(!page.url().includes('#clicked'),'Drag starting on CTA never follows its link');
  await track(page).focus();await page.keyboard.press('Home');await waitCount(page,'01 / 03');await cta.click();assert(page.url().endsWith('#clicked'),'Ordinary CTA click still navigates');results.push('Drag click suppression preserves ordinary CTA activation');
  await page.goto('https://showcase.test/');await page.mouse.move(1279,899);await page.waitForTimeout(6500);assert.equal(await count(page),'01 / 03');results.push('Initial reduced-motion never auto-advances');
  await page.evaluate(()=>{window.removedHero=document.querySelector('.sf-section--hero');removedHero.remove()});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>removedHero.hasAttribute('data-sf-gallery-ready')),false);await page.waitForTimeout(6500);assert.equal(await page.evaluate(()=>removedHero.querySelector('[data-gallery-count]').textContent),'01 / 03');results.push('Removed gallery is disposed without stale repaint');await test.close();
  for(const width of [320,390,700,1280]){
   test=await open({width});page=test.page;
   const geometry=await section(page).evaluate(el=>{const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};return {hero:box(el),controls:box(el.querySelector('[data-gallery-controls]')),cta:box(el.querySelector('.sf-section-copy a')),overflow:document.documentElement.scrollWidth>innerWidth+1}});
   assert(!geometry.overflow);assert.equal(await section(page).locator('[data-gallery-rotation]').count(),0);assert(geometry.controls.right<=width+1);assert(geometry.controls.bottom<=geometry.hero.bottom+1);
   assert(geometry.controls.left>=geometry.cta.right||geometry.controls.top>=geometry.cta.bottom||geometry.controls.bottom<=geometry.cta.top,'CTA and controls never overlap at '+width);
   await page.screenshot({path:`qa/slider/${engine}-${width}.png`});await test.close();
  }
  results.push('320/390/700/1280 layout, no rotation button and CTA clearance');
  fs.writeFileSync(`qa/slider/browser-${engine}.json`,JSON.stringify({engine,passed:true,results},null,2));console.log(engine,results);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
