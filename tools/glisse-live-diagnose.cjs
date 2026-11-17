/**
 * READ-ONLY live Codela vs opt-in Glisse visibility diagnosis.
 * No clicks, Woo API actions or site state changes.
 */
const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const outputDir='qa/glisse-live';
fs.mkdirSync(outputDir,{recursive:true});

async function check(browser, engine, flag) {
  const context=await browser.newContext({
    viewport:{width:402,height:666},
    deviceScaleFactor:3,
    isMobile:true,
    hasTouch:true,
    reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  const errors=[];
  const failures=[];
  page.on('pageerror',e=>errors.push(e.message.slice(0,500)));
  page.on('requestfailed',req=>{
    if(/glisse|storefront|navigation/.test(req.url()))
      failures.push({url:req.url(),error:req.failure()?.errorText});
  });
  const url='https://codela.dev/?codela_glisse_dock='+flag;
  let response=null;
  try {
    response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:55000});
    await page.waitForTimeout(1600);
    const snapshot=await page.evaluate(()=>{
      const css=e=>{if(!e)return null;const c=getComputedStyle(e);
        const r=e.getBoundingClientRect();
        return {
          tag:e.tagName,classes:e.className,hidden:e.hidden,inert:e.inert,
          display:c.display,visibility:c.visibility,opacity:c.opacity,
          pointerEvents:c.pointerEvents,position:c.position,
          zIndex:c.zIndex,transform:c.transform,filter:c.filter,
          background:c.backgroundColor,overflow:c.overflow,
          rect:{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom},
          isInViewport:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight
        };
      };
      const dock=document.querySelector('.sf-mobile-dock');
      const surface=dock?.querySelector('.sf-dock-surface');
      const root=dock?.querySelector('.sf-glisse-dock-root');
      const tabBar=root?.querySelector('.lg-tab-bar');
      const anchors=[...(dock?.querySelectorAll('.sf-dock-item')||[])].map(e=>({
        view:e.dataset.dockView,anchor:css(e),icon:css(e.querySelector('.sf-icon')),
        label:css(e.querySelector(':scope > span:last-child'))
      }));
      const ancestors=[];let node=dock;
      while(node&&ancestors.length<8){ancestors.push(css(node));node=node.parentElement}
      const bodyText=[...document.querySelectorAll('script[src],link[rel=stylesheet]')].filter(el=>/glisse|navigation|storefront/.test(el.src||el.href)).map(el=>el.src||el.href);
      return {
        href:location.href,ready:document.readyState,width:innerWidth,height:innerHeight,
        screenWidth:screen.width,screenHeight:screen.height,scrollY,
        docHeight:document.documentElement.scrollHeight,bodyClass:document.body.className,
        htmlClass:document.documentElement.className,glisseStyleTag:!!document.getElementById('glisse-styles'),
        dockCount:document.querySelectorAll('.sf-mobile-dock').length,
        dock:css(dock),surface:css(surface),root:css(root),tabBar:css(tabBar),
        lens:css(root?.querySelector('.lg-tab-lens')),
        nativeDockBars:anchors,
        ancestors,
        scripts:bodyText,
        hitAtBottom:(()=>{let h=document.elementFromPoint(innerWidth/2,innerHeight-34);return h?.outerHTML.slice(0,330)})()
      };
    });
    await page.screenshot({path:path.join(outputDir,engine+'-'+flag+'.png'),fullPage:false});
    const result={engine,flag,response:response?.status(),errors,failures,snapshot};
    console.log('LIVE_GLISSE_DIAG '+JSON.stringify(result));
    return result;
  }catch(e){
    const result={engine,flag,response:response?.status(),error:e.message,errors,failures};
    console.log('LIVE_GLISSE_DIAG '+JSON.stringify(result));
    return result;
  }finally{await context.close()}
}
(async()=>{
  const results=[];
  for (const [engine,launcher] of Object.entries({chromium,webkit})){
    const browser=await launcher.launch({headless:true});
    try{
      results.push(await check(browser,engine,'0'));
      results.push(await check(browser,engine,'1'));
    }finally{await browser.close()}
  }
  fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(results,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
