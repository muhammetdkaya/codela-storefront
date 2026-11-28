// Browser geometry for the MONA four-card reference, independent of WordPress database.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const doc=execFileSync(process.env.PHP_BIN||'php',['tests/agency-pages.php','--render=bento'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{
  const uri=new URL(req.url,'http://localhost').pathname;
  if(uri==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(doc);}
  const file=path.resolve(root,'.'+uri);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.svg')?'image/svg+xml':'text/plain');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
  try{
    fs.mkdirSync(path.join(root,'qa'),{recursive:true});
    for(const [width,height] of [[320,667],[390,844],[402,874],[768,1024],[1024,650],[1194,750],[1440,900]]){
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/');
      const hero=page.locator('.sf-agency-widget--bento');
      assert.equal(await hero.count(),1,'Bento is isolated in its own component');
      assert.equal(await hero.locator('h2').textContent(),'Uzmanlık Alanları');
      assert.equal(await hero.locator('.cdl-bento__card').count(),4,'Exactly 4 original services');
      assert.equal(await hero.getByRole('link').count(),4,'Four accessible native navigation links');
      await hero.locator('.cdl-reference-light').first().waitFor({state:'attached'});
      await page.waitForFunction(()=>[...document.querySelectorAll('.cdl-bento__photo,.cdl-bento__visual')].every(img=>img.complete&&img.naturalWidth>0));
      const snapshot=await hero.evaluate(el=>{
        const cards=[...el.querySelectorAll('.cdl-bento__card')].map(e=>({height:e.getBoundingClientRect().height,
          width:e.getBoundingClientRect().width,href:e.getAttribute('href'),text:e.innerText}));
        const photo=el.querySelector('.cdl-bento__photo');
        const illustrations=[...el.querySelectorAll('.cdl-bento__visual')];
        const section=el.querySelector('.cdl-bento').getBoundingClientRect();
        const art=[photo,...illustrations].map(img=>{
          const box=img.getBoundingClientRect(),card=img.parentElement.getBoundingClientRect(),style=getComputedStyle(img);
          const overlay=img.parentElement.querySelector('.cdl-reference-light');
          const fx=overlay.getBoundingClientRect();
          return {overlayFit:overlay.getAttribute('preserveAspectRatio'),
            overlayError:Math.max(Math.abs(fx.left-box.left),Math.abs(fx.top-box.top),Math.abs(fx.width-box.width),Math.abs(fx.height-box.height)),
            overlayMask:getComputedStyle(overlay).maskImage,
            fit:style.objectFit,position:style.objectPosition,width:box.width,cardWidth:card.width,
            right:card.right-box.right,mask:style.maskImage,aspect:img.naturalWidth/img.naturalHeight};
        });
        return {cards,art,photo:photo.complete&&photo.naturalWidth>0,illustrations:illustrations.map(img=>img.complete&&img.naturalWidth>0),background:getComputedStyle(el.querySelector('.cdl-bento')).backgroundColor,
          overflow:document.documentElement.scrollWidth-innerWidth,sectionWidth:section.width,
          viewportLeft:section.left,tagCount:el.querySelectorAll('.cdl-bento__card--support .cdl-bento__support-action').length,
          phoneChrome:el.querySelectorAll('.phone-frame,.status-bar,.bottom-nav').length
        };
      });
      assert(snapshot.photo,'Approved web design photograph loads');
      assert.deepEqual(snapshot.illustrations,[true,true],'Two photographic service visuals load; support remains image-free');
      for(const art of snapshot.art){
        if(width>=740){
          assert.equal(art.fit,'contain','Wide cards preserve the complete photo instead of cropping it');
          assert(Math.abs(art.right)<=2,'Artwork is anchored to the right side');
          assert(art.width<art.cardWidth*.74,'Text and image have distinct space');
          assert(art.mask.includes('linear-gradient'),'Artwork edge blends into glass');
          assert.equal(art.overlayFit,'xMaxYMid meet','SVG uses same image fit and anchor');
          assert(art.overlayError<=2,'Light overlay must exactly align to photograph: '+JSON.stringify(art));
          assert.equal(art.overlayMask,art.mask,'Matching image and light edge fade');
        }else{
          assert.equal(art.fit,'cover','Existing mobile image treatment is preserved');
          assert.equal(art.overlayFit,'xMidYMid slice','Mobile SVG matches full-bleed cover');
          assert(art.overlayError<=2,'Mobile overlay also matches photo');
        }
      }
      assert.equal(snapshot.background,'rgb(9, 9, 12)','Obsidian matches MONA welcome');
      assert(snapshot.overflow<=1,'No horizontal scrollbar at '+width);
      assert(Math.abs(snapshot.viewportLeft)<=1 && Math.abs(snapshot.sectionWidth-width)<=1,'Full-width handoff from hero');
      assert(snapshot.cards.every(card=>card.height>=70&&card.width>=100&&card.href&&card.href.includes('hizmetler')),'Every bento service has a usable destination');
      assert.equal(snapshot.phoneChrome,0,'No fake prototype phone chrome or duplicated native dock');
      assert.equal(snapshot.tagCount,1,'One reference support CTA');
      const support=hero.locator('.cdl-bento__card--support');
      assert(await support.locator('.cdl-bento__support-action').isVisible(),'Support CTA visible at rest at '+width);
      assert.equal(await support.locator('.cdl-bento__light--right').count(),0,'No warm glow layer');
      assert.equal(await support.evaluate(el=>getComputedStyle(el).backgroundImage),await hero.locator('.cdl-bento__card--software').evaluate(el=>getComputedStyle(el).backgroundImage),'Support uses shared card material');
      assert.deepEqual(errors,[],'No browser exceptions');
      await page.screenshot({path:path.join(root,'qa','agency-bento-'+width+'.png'),fullPage:true});
      await page.close();
    }
    const hover=await browser.newPage({viewport:{width:1194,height:750}});
    await hover.goto('http://127.0.0.1:'+server.address().port+'/');
    await hover.waitForFunction(()=>document.querySelectorAll('.cdl-reference-light').length===3);
    for(const variant of ['web','commerce','software']){
      const card=hover.locator('.cdl-bento__card--'+variant);
      await card.hover();
      await hover.waitForTimeout(520);
      const result=await card.evaluate(el=>{
        const photo=el.querySelector('.cdl-bento__photo,.cdl-bento__visual'),fx=el.querySelector('.cdl-reference-light');
        const a=photo.getBoundingClientRect(),b=fx.getBoundingClientRect();
        return {delta:Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height)),
          transform:getComputedStyle(fx).transform};
      });
      assert(result.delta<=2,'Hover cannot move the light off its artwork: '+variant);
      assert.equal(result.transform,'none','No independent overlay zoom');
    }
    await hover.mouse.move(0,0);
    await hover.waitForFunction(()=>document.querySelector('[data-bento-select-ready="1"]'));
    const desktopCards=hover.locator('.cdl-bento__card');
    await hover.evaluate(()=>{window.serviceNavigation=0;document.addEventListener('click',e=>{if(e.target.closest('.cdl-bento__card')){window.serviceNavigation++;e.preventDefault();}});});
    await desktopCards.nth(0).click();
    assert.equal(await hover.locator('.is-bento-selected').count(),1,'Desktop click selects');
    await hover.waitForFunction(()=>getComputedStyle(document.querySelector('.cdl-bento__circle-arrow')).opacity==='1');
    assert.equal(await hover.evaluate(()=>window.serviceNavigation),0,'Desktop first click stays on page');
    await desktopCards.nth(0).click();
    assert.equal(await hover.evaluate(()=>window.serviceNavigation),1,'Desktop second click opens');
    await hover.close();
    const preview=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
    await preview.goto('http://127.0.0.1:'+server.address().port+'/');
    const cards=preview.locator('.cdl-bento__card');
    await preview.waitForFunction(()=>document.querySelector('[data-bento-select-ready="1"]'));
    assert.equal(await cards.nth(0).locator('.cdl-bento__circle-arrow').isVisible(),false,'Arrow hidden at rest');
    await preview.evaluate(()=>{window.nativeServiceClicks=0;document.addEventListener('click',e=>{if(e.target.closest('.cdl-bento__card')){window.nativeServiceClicks++;e.preventDefault();}});});
    await cards.nth(0).tap();
    assert(await cards.nth(0).evaluate(el=>el.classList.contains('is-bento-selected')));
    assert(await cards.nth(0).locator('.cdl-bento__circle-arrow').isVisible());
    assert.equal(await preview.evaluate(()=>window.nativeServiceClicks),0,'First tap does not navigate');
    await cards.nth(1).tap();
    assert.equal(await preview.locator('.is-bento-selected').count(),1,'Single selected card');
    assert(await cards.nth(1).locator('.cdl-bento__minor-arrow').isVisible());
    assert.equal(await cards.nth(0).locator('.cdl-bento__circle-arrow').isVisible(),false);
    await cards.nth(1).tap();
    assert.equal(await preview.evaluate(()=>window.nativeServiceClicks),1,'Second tap reaches native navigation');
    await cards.nth(2).focus();
    await cards.nth(2).press('Enter');
    assert.equal(await preview.evaluate(()=>window.nativeServiceClicks),2,'Keyboard activation remains direct');
    assert(await cards.nth(3).locator('.cdl-bento__support-action').isVisible(),'Support action visible before interaction');
    await cards.nth(3).tap();
    assert.equal(await preview.evaluate(()=>window.nativeServiceClicks),3,'Support opens directly on first tap');
    assert.equal(await cards.nth(3).evaluate(el=>el.classList.contains('is-bento-selected')),false,'Support does not require selection');
    await cards.nth(3).press('Escape');
    assert.equal(await preview.locator('.is-bento-selected').count(),0,'Escape clears selection');
    await preview.close();
    const fallback=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await fallback.goto('http://127.0.0.1:'+server.address().port+'/');
    assert(await fallback.locator('.cdl-bento__circle-arrow').isVisible(),'No-JS native link stays explicit');
    await fallback.close();
    console.log('MONA Services Bento: three photographic visuals, an image-free support strip, links and seven responsive widths passed.');
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(err=>{console.error(err);server.close();process.exitCode=1;});
