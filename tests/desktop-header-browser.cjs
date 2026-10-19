// Native PHP menu projection, real shared CSS and pointer/keyboard navigation.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const styles=['tokens','overlay','navigation','components'].map(name=>fs.readFileSync(`theme/codela-storefront/assets/styles/${name}.css`,'utf8'));
styles.splice(1,0,fs.readFileSync('theme/codela-storefront/assets/storefront.css','utf8'));
(async()=>{
 const browser=await (process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true,...(!process.env.TEST_WEBKIT&&process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 try{
  for(const assigned of ['0','1']){
   const header=execFileSync(process.env.PHP_BIN||'php',['tests/render-header.php'],{encoding:'utf8',env:{...process.env,FIXTURE_MENU:assigned}});
   const page=await browser.newPage();
   await page.route('https://store.test/**',route=>route.fulfill({body:'Menu destination',contentType:'text/html'}));
   await page.goto('https://store.test/');
   await page.setContent(`<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles.join('\n')}</style></head><body>${header}<main id="sf-content">Content</main></body></html>`);
   for(const width of [320,700,900,1099,1100,1280,1440,1920]){
    await page.setViewportSize({width,height:900});
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),`No overflow, menu ${assigned}, width ${width}`);
    assert.equal(await page.locator('.sf-desktop-navigation').count(),Number(assigned),'No fabricated menu when location is empty');
    if(assigned==='1'){
     assert.equal(await page.locator('.sf-desktop-navigation').isVisible(),width>=1100,'Desktop-only native links');
     if(width>=1100){
      const nav=await page.locator('.sf-desktop-navigation').boundingBox(),brand=await page.locator('.sf-brand').boundingBox(),tools=await page.locator('.sf-actions').boundingBox();
      assert(nav.x>=brand.x+brand.width,'Menu cannot cover brand');assert(nav.x+nav.width<=tools.x,'Menu cannot cover tools');
      assert.equal(await page.locator('.sf-desktop-menu .sub-menu').count(),0,'Submenus stay in the existing complete Menu');
      assert.equal(await page.locator('#sf-menu .sub-menu').count(),1,'Nested menu still available');
      // Exercise real sequential keyboard navigation. Re-focusing the already
      // active last link after a viewport resize is a no-op in the browser and
      // does not trigger native scroll-to-focus.
      const links=page.locator('.sf-desktop-menu a'),last=links.last();
      await links.first().focus();
      for(let i=1;i<await links.count();i++) await page.keyboard.press('Tab');
      assert(await last.evaluate(el=>document.activeElement===el),'Tab reaches the final desktop menu link');
      // Keyboard-triggered native scrolling can settle on the next frame.
      // Report scroll geometry if the focused item remains clipped.
      await page.waitForTimeout(150);
      const visible=await last.evaluate(el=>{
       const nav=el.closest('nav'),r=el.getBoundingClientRect(),n=nav.getBoundingClientRect(),style=getComputedStyle(nav),list=nav.querySelector('ul');
       return {visible:r.left>=n.left-1&&r.right<=n.right+1,link:[r.left,r.right],nav:[n.left,n.right],scroll:nav.scrollLeft,scrollWidth:nav.scrollWidth,clientWidth:nav.clientWidth,overflowX:style.overflowX,scrollBehavior:style.scrollBehavior,listWidth:list.getBoundingClientRect().width,active:document.activeElement===el};
      });
      assert(visible.visible,`Keyboard focus reveals the last item at ${width}px: ${JSON.stringify(visible)}`);
     }
    }
   }
   if(assigned==='1'){
    await page.setViewportSize({width:1440,height:900});
    const link=page.locator('.sf-desktop-menu a').first();await Promise.all([page.waitForURL('https://store.test/shop/'),link.click()]);
   }
   await page.close();
  }
  console.log('Desktop header: assigned/empty WordPress menu, 8 widths, nested-menu ownership, long-menu keyboard reachability and direct pointer navigation passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
