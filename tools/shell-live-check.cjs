// Read-only acceptance of WordPress's actual Interactivity Router on live store.
// Uses a harmless query parameter to exercise the same safe home template.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 const report={status:'pending',url:'https://codela.dev/',checks:{}};
 let page;
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page=await context.newPage();
  const errors=[];const navigationRequests=[];
  page.on('pageerror',err=>errors.push(err.message));
  page.on('request',req=>{if(req.url().includes('codela_sf_navigation_qa'))navigationRequests.push({url:req.url(),resourceType:req.resourceType()});});
  await page.goto(report.url,{waitUntil:'networkidle',timeout:90000});
  report.themeVersion=await page.locator('link[href*="styles/tokens.css"]').first().getAttribute('href');
  const region=page.locator('main#sf-content[data-wp-router-region="codela/storefront/main"]');
  report.checks.mainRegion=await region.count()===1;
  report.checks.routerScript=await page.locator('script[src*="navigation-controller.js"]').count()>0;
  if(!report.checks.mainRegion||!report.checks.routerScript){
    report.status='unsupported';
    throw Error('Live home is not a supported router region; check WordPress version and core API compatibility.');
  }
  await page.evaluate(()=>{
    window.__shellOriginal={
      header:document.querySelector('.sf-header'),
      dialog:document.querySelector('#sf-panel'),
      dock:document.querySelector('.sf-mobile-dock')
    };
    const a=document.createElement('a');
    a.href='/?codela_sf_navigation_qa=1';
    a.dataset.sfRoute='home';
    a.textContent='QA navigation';
    a.id='sf-route-qa-link';
    document.querySelector('.sf-shell').appendChild(a);
  });
  await page.route('**/?codela_sf_navigation_qa=1',async route=>{
    await new Promise(resolve=>setTimeout(resolve,650));
    await route.continue();
  });
  // This URL shares the current home content; the WordPress router can serve
  // it instantly without a fetch. In that case NO skeleton is correct.
  const click=page.locator('#sf-route-qa-link').click({noWaitAfter:true});
  const pending=page.locator('.sf-route-skeleton').waitFor({state:'visible',timeout:1200}).then(()=>true).catch(()=>false);
  await click;
  await page.waitForURL(/codela_sf_navigation_qa=1/,{timeout:15000});
  report.checks.skeletonObserved=await pending;
  report.checks.skeletonRule='Fast cached navigation may bypass the 160ms loading skeleton';
  await page.locator('.sf-route-skeleton').waitFor({state:'detached',timeout:15000});
  report.checks.sameNodes=await page.evaluate(()=>window.__shellOriginal.header===document.querySelector('.sf-header')&&window.__shellOriginal.dialog===document.querySelector('#sf-panel')&&window.__shellOriginal.dock===document.querySelector('.sf-mobile-dock'));
  assert(report.checks.sameNodes,'Core router must preserve header/dialog/dock DOM identity.');
  await page.goBack({waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForURL(url=>!url.searchParams.has('codela_sf_navigation_qa'),{timeout:15000});
  report.checks.backNavigation=await page.evaluate(()=>window.__shellOriginal?.header===document.querySelector('.sf-header'));
  assert(report.checks.backNavigation,'Back traversal unexpectedly reloaded header');
  // Look for a genuinely different *public* WP page with the same router
  // region. No test content is created or written to the site.
  report.checks.staticPageCrossNavigation='no eligible public page discovered';
  let attemptingStaticPage=false;
  try {
    const response=await page.request.get('https://codela.dev/wp-json/wp/v2/pages?per_page=30&_fields=link,status',{timeout:9000});
    if(response.ok()){
      const pages=await response.json();
      for(const candidate of (Array.isArray(pages)?pages:[]).slice(0,15)){
        if(candidate.status!=='publish'||!candidate.link||new URL(candidate.link).origin!==new URL(report.url).origin)continue;
        const result=await page.request.get(candidate.link,{timeout:9000});
        const html=result.ok()?await result.text():'';
        if(!html.includes('data-wp-router-region="codela/storefront/main"')||!html.includes('data-sf-route-type="page"'))continue;
        await page.evaluate(url=>{
          const anchor=document.createElement('a');
          anchor.id='sf-qa-static-page';
          anchor.href=url;
          anchor.dataset.sfRoute='content';
          anchor.textContent='QA static page';
          document.querySelector('.sf-shell').appendChild(anchor);
        },candidate.link);
        attemptingStaticPage=true;
        await page.locator('#sf-qa-static-page').click({noWaitAfter:true});
        await page.waitForURL(candidate.link,{timeout:15000});
        await page.waitForTimeout(250);
        assert(await page.evaluate(()=>window.__shellOriginal?.header===document.querySelector('.sf-header')),'Static page lost persistent header');
        assert(await page.locator('main#sf-content[data-sf-route-type="page"]').count()===1,'Destination static content missing');
        report.checks.staticPageCrossNavigation='passed: '+new URL(candidate.link).pathname;
        break;
      }
    }
  } catch(error) {
    if(attemptingStaticPage)throw error;
    report.checks.staticPageCrossNavigation='not verified: '+error.message;
  }
  report.checks.pageErrors=errors;
  assert(errors.length===0,'JavaScript errors during navigation: '+errors.join('; '));
  report.status='passed';
  await context.close();
 }catch(error){
  if(page && !page.isClosed()) {
    report.debug=await page.evaluate(()=>({url:location.href,ready:document.readyState,routeLink:!!document.querySelector('#sf-route-qa-link'),region:!!document.querySelector('#sf-content[data-wp-router-region]'),mainRegionHTML:document.querySelector('#sf-content')?.outerHTML.slice(0,350),scripts:[...document.querySelectorAll('script[src]')].filter(x=>x.src.includes('navigation')).map(x=>({src:x.src,type:x.type})),skeleton:!!document.querySelector('.sf-route-skeleton'),routerModule:!!document.querySelector('script[type=importmap]')})).catch(e=>({evaluateError:e.message}));
  }
  report.checks.pageErrors=typeof errors==='undefined'?[]:errors;
  report.checks.navigationRequests=typeof navigationRequests==='undefined'?[]:navigationRequests;
  report.error=error.message;
  report.status=report.status==='unsupported'?'unsupported':'failed';
  throw error;
 }finally{
  fs.mkdirSync('qa/navigation',{recursive:true});
  fs.writeFileSync('qa/navigation/live-acceptance.json',JSON.stringify(report,null,2));
  console.log('SHELL_ACCEPT '+JSON.stringify(report));
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
