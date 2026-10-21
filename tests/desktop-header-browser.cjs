// Native PHP menu projection, real shared CSS and pointer/keyboard navigation.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const styles=['tokens','overlay','navigation','components'].map(name=>fs.readFileSync(`theme/codela-storefront/assets/styles/${name}.css`,'utf8'));
const dockSource=fs.readFileSync('theme/codela-storefront/assets/scripts/dock-controller.js','utf8').replace('export function createDockController','function createDockController');
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
   // Run the actual shared navigation controller, not a test-only focus shim.
   await page.addScriptTag({content:dockSource+'\ncreateDockController({getDialog:()=>document.querySelector("#sf-panel"),getCurrent:()=>null,open:()=>{},close:()=>{}}).init(document.querySelector("#sf-panel"));'});
   for(const width of [320,700,900,1099,1100,1280,1440,1920]){
    await page.setViewportSize({width,height:900});
    // All visible header islands share the 44px footprint and vertical center.
    const islands=await page.evaluate(()=>{
     const header=document.querySelector('.sf-header'),h=header.getBoundingClientRect();
     return ['.sf-brand','.sf-header-menu .sf-ui-icon-button','.sf-actions','.sf-desktop-navigation']
      .map(selector=>({selector,el:header.querySelector(selector)}))
      .filter(({el})=>el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden')
      .map(({selector,el})=>{const r=el.getBoundingClientRect();return {selector,height:r.height,offset:(r.top+r.height/2)-(h.top+h.height/2)};});
    });
    for(const island of islands){
     assert(Math.abs(island.height-44)<=2,`Header island height at ${width}px: ${JSON.stringify(island)}`);
     assert(Math.abs(island.offset)<=2,`Header island vertical alignment at ${width}px: ${JSON.stringify(island)}`);
    }
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),`No overflow, menu ${assigned}, width ${width}`);
    assert.equal(await page.locator('.sf-desktop-navigation').count(),Number(assigned),'No fabricated menu when location is empty');
    if(assigned==='1'){
     assert.equal(await page.locator('.sf-desktop-navigation').isVisible(),width>=1100,'Desktop-only native links');
     if(width>=1100){
      const nav=await page.locator('.sf-desktop-navigation').boundingBox(),brand=await page.locator('.sf-brand').boundingBox(),tools=await page.locator('.sf-actions').boundingBox();
      assert(nav.x>=brand.x+brand.width,'Menu cannot cover brand');assert(nav.x+nav.width<=tools.x,'Menu cannot cover tools');
      assert(Math.abs(nav.x+nav.width/2-width/2)<1,'Menu capsule is centered on the viewport');
      assert.equal(await page.locator('.sf-desktop-menu .sub-menu').count(),1,'Desktop contains nested destinations');
      const active=await page.locator('.sf-desktop-menu>.current-menu-item').evaluate(el=>({background:getComputedStyle(el).backgroundColor,radius:getComputedStyle(el).borderRadius,decoration:getComputedStyle(el.querySelector('a')).textDecorationLine}));
      const selection=await page.locator('.sf-desktop-menu>.current-menu-item').boundingBox();assert(Math.abs(selection.y-nav.y)<1&&Math.abs(selection.y+selection.height-nav.y-nav.height)<1,'Active selection touches both vertical edges');assert.equal(active.radius,'999px');assert.equal(active.background,'rgba(118, 118, 128, 0.16)');assert.equal(active.decoration,'none');
      const parent=page.locator('.sf-desktop-menu>.menu-item-has-children');
      const link=await parent.locator(':scope>a').boundingBox(),toggle=await parent.locator(':scope>button').boundingBox();
      assert(Math.abs(link.x+link.width-toggle.x)<1,'Label and arrow form one adjacent control group');assert(toggle.width>=44&&toggle.height>=44,'Disclosure keeps accessible hit target');

      assert(!(await page.locator('.sf-header-menu').isVisible()),'Hamburger hidden while full desktop menu is visible');
      await page.locator('[popovertarget=sf-desktop-submenu-7]').click();
      assert(await page.locator('#sf-desktop-submenu-7').isVisible(),'Native submenu opens with pointer');
      await page.keyboard.press('Escape');
      assert(!(await page.locator('#sf-desktop-submenu-7').isVisible()),'Native Escape closes submenu');
      assert.equal(await page.locator('#sf-menu .sub-menu').count(),1,'Nested menu still available');
      // Exercise real sequential keyboard navigation. Re-focusing the already
      // active last link after a viewport resize is a no-op in the browser and
      // does not trigger native scroll-to-focus.
      const links=page.locator('.sf-desktop-menu > li > a'),last=links.last();
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
    // Merchant-sized menu: inspect the same compact capsule as the reported UI.
    await page.locator('.sf-desktop-menu').evaluate(el=>{el.innerHTML=['Ana Sayfa','Blog','Mağaza','Workshop','Hakkımızda','İletişim'].map((label,i)=>`<li class="${i?'':'current-menu-item'}"><a href="${i?'#':'/shop/'}">${label}</a></li>`).join('');});
    for(const width of [1100,1280,1757,1920]){
     await page.setViewportSize({width,height:300});
     const geometry=await page.locator('.sf-desktop-navigation').evaluate(el=>{const r=el.getBoundingClientRect(),list=el.querySelector('ul').getBoundingClientRect();return {width:r.width,content:list.width,offset:r.x+r.width/2-innerWidth/2};});
     assert(Math.abs(geometry.offset)<1,'Short menu stays at the viewport center');
     assert(geometry.width<=geometry.content+17,'No unused white strip after the menu links');
     if(width===1757){fs.mkdirSync('qa',{recursive:true});await page.screenshot({path:`qa/storefront-ui-kit-desktop-menu-${process.env.TEST_WEBKIT?'webkit':'chromium'}.png`});}
    }
    await page.setViewportSize({width:1440,height:900});
    const link=page.locator('.sf-desktop-menu a').first();await Promise.all([page.waitForURL('https://store.test/shop/'),link.click()]);
   }
   await page.close();
  }
  console.log('Desktop header: assigned/empty WordPress menu, 8 widths, nested-menu ownership, long-menu keyboard reachability and direct pointer navigation passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
