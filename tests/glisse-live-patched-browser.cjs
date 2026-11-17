/**
 * Read-only live codela.dev smoke test with the CURRENT BRANCH Glisse bundle
 * swapped into the response. Never writes to WordPress or FTP.
 */
const {webkit,chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const bridge=fs.readFileSync('theme/codela-storefront/assets/scripts/glisse-bridge.js','utf8');
(async()=>{
  for(const [engine,launcher] of Object.entries({webkit,chromium})){
    const browser=await launcher.launch({headless:true});
    const context=await browser.newContext({
      viewport:{width:402,height:666},isMobile:true,hasTouch:true,deviceScaleFactor:3
    });
    const page=await context.newPage();
    const errors=[];let intercepted=0;
    page.on('pageerror',err=>errors.push(err.message));
    await page.route('**/assets/scripts/glisse-bridge.js*',async route=>{
      intercepted++;
      await route.fulfill({status:200,contentType:'application/javascript',body:bridge});
    });
    try{
      const response=await page.goto('https://codela.dev/?codela_glisse_dock=1',{waitUntil:'domcontentloaded',timeout:55000});
      assert.equal(response.status(),200,'Live homepage returns 200');
      await page.waitForSelector('.sf-mobile-dock.sf-glisse-ready .lg-tab-bar',{timeout:20000});
      await page.waitForTimeout(1000); // catch delayed WP/Preact hydration/removal
      const state=await page.evaluate(()=>{
        const dock=document.querySelector('.sf-mobile-dock');
        const root=dock?.querySelector('.sf-glisse-dock-root');
        const bar=root?.querySelector('.lg-tab-bar');
        const rect=dock?.getBoundingClientRect();
        return{
          ready:dock?.classList.contains('sf-glisse-ready'),
          dockDisplay:dock&&getComputedStyle(dock).display,
          dockHidden:dock?.hidden,
          dockCollapsed:dock?.classList.contains('is-collapsed'),
          rootCount:document.querySelectorAll('.sf-glisse-dock-root').length,
          tabCount:bar?.querySelectorAll('.lg-tab').length||0,
          lens:!!bar?.querySelector('.lg-tab-lens'),
          dockRect:{y:rect?.y,width:rect?.width,height:rect?.height},
          nativeItems:[...(dock?.querySelectorAll('.sf-dock-item')||[])].map(a=>{
            const icon=a.querySelector('.sf-icon');
            const label=a.querySelector(':scope > span:last-child');
            return {view:a.dataset.dockView,iconOpacity:icon&&getComputedStyle(icon).opacity,
              labelOpacity:label&&getComputedStyle(label).opacity,
              width:a.getBoundingClientRect().width};
          })
        }
      });
      console.log('GLISSE_PATCHED_LIVE '+JSON.stringify({engine,intercepted,errors,state}));
      assert(intercepted>=1,'Local Glisse bundle replaced the live script');
      assert.equal(state.dockDisplay,'block');
      assert.equal(state.dockHidden,false);
      assert.equal(state.rootCount,1);
      assert.equal(state.tabCount,4,'WP hydration did NOT remove Glisse TabBar after delay');
      assert.equal(state.lens,true);
      assert(state.dockRect.height>=40&&state.dockRect.y>=0,'Dock must be on screen');
      assert(state.nativeItems.length===4&&state.nativeItems.every(x=>
        x.iconOpacity==='1'&&x.labelOpacity==='1'&&x.width>=45),'Native dock remains usable');
      assert.deepEqual(errors,[],'No page JavaScript error during Glisse hydration');
      // Specifically verify the native input target can still open Search and
      // WordPress does not remove the TabBar during modal relocation.
      await page.locator('.sf-dock-item[data-dock-view="search"]').click();
      await page.waitForSelector('#sf-panel[open]',{timeout:10000});
      await page.waitForTimeout(300);
      assert.equal(await page.locator('.sf-mobile-dock .lg-tab-bar').count(),1,
        'Glisse remains mounted when the real dock moves into native dialog');
      await page.locator('#sf-panel .sf-search-cancel').click();
      await page.waitForFunction(()=>!document.querySelector('#sf-panel')?.open);
      assert.equal(await page.locator('.sf-mobile-dock .lg-tab-bar').count(),1,
        'Glisse remains mounted after Search dialog closes');
      console.log('GLISSE_PATCHED_LIVE_PASS '+engine);
    }finally{
      await context.close();
      await browser.close();
    }
  }
})().catch(e=>{console.error(e);process.exitCode=1});
