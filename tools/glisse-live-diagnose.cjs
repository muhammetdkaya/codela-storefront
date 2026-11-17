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
  await page.addInitScript(()=>{
    window.__glisseTrace=[];
    // Intercept only removal of Glisse's actual React root child. The stack
    // distinguishes WordPress/Preact hydration from React's own unmount.
    const originalRemoveChild=Node.prototype.removeChild;
    Node.prototype.removeChild=function(child){
      if(child?.matches?.('.lg-tab-bar') || (child?.querySelector?.('.lg-tab-bar') && this.matches?.('.sf-glisse-dock-root'))){
        window.__glisseTrace.push({
          t:Math.round(performance.now()),type:'REMOVE_CHILD_STACK',
          target:this.className,child:child.className,
          stack:(new Error('glisse removed')).stack?.slice(0,2200)
        });
      }
      return originalRemoveChild.call(this,child);
    };
    const originalReplaceChildren=Element.prototype.replaceChildren;
    Element.prototype.replaceChildren=function(...args){
      if(this.matches?.('.sf-glisse-dock-root')){
        window.__glisseTrace.push({
          t:Math.round(performance.now()),type:'REPLACE_CHILDREN_STACK',
          target:this.className,stack:(new Error('glisse replaced')).stack?.slice(0,2200)
        });
      }
      return originalReplaceChildren.apply(this,args);
    };
    const record=(type,node,extra={})=>{
      if(window.__glisseTrace.length>=100)return;
      window.__glisseTrace.push({
        t:Math.round(performance.now()),type,
        node:node?.tagName,classes:node?.className,
        connected:node?.isConnected,parent:node?.parentElement?.className,
        ...extra
      });
    };
    const obs=new MutationObserver(records=>{
      for(const m of records){
        if(m.type==='attributes' && m.target?.matches?.('.sf-mobile-dock'))
          record('dock.class-change',m.target,{old:m.oldValue});
        if(m.type!=='childList')continue;
        for(const [name,items] of [['added',m.addedNodes],['removed',m.removedNodes]]){
          for(const node of items){
            if(node.nodeType!==1)continue;
            if(node.matches?.('.lg-tab-bar'))
              record(name+'.tabBar',node,{target:m.target?.className});
            if(node.matches?.('.sf-glisse-dock-root,.lg-tab-bar,.sf-mobile-dock'))
              record(name,node);
            for(const el of node.querySelectorAll?.('.sf-glisse-dock-root,.lg-tab-bar,.sf-mobile-dock')||[])
              record(name+'-nested',el);
          }
        }
      }
    });
    obs.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
  });
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
        glisseRootCount:document.querySelectorAll('.sf-glisse-dock-root').length,
        allGlisseRoots:[...document.querySelectorAll('.sf-glisse-dock-root')].map(node=>({
          html:node.outerHTML.slice(0,850),children:node.children.length,
          parent:node.parentElement?.className,
          tabs:node.querySelectorAll('.lg-tab-bar').length
        })),
        glisseTrace:window.__glisseTrace,
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
  // Lifecycle stack reproducer: WebKit Glisse only.
  for (const [engine,launcher] of Object.entries({webkit})){
    const browser=await launcher.launch({headless:true});
    try{ results.push(await check(browser,engine,'1')); }
    finally{await browser.close()}
  }
  fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(results,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
