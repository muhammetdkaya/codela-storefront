// Read-only acceptance of WordPress's actual Interactivity Router on live store.
// Uses a harmless query parameter to exercise the same safe home template.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 const report={status:'pending',url:'https://codela.dev/',checks:{}};
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
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
  await page.locator('#sf-route-qa-link').click();
  await page.locator('.sf-route-skeleton').waitFor({timeout:8000});
  report.checks.skeletonDelayed=true;
  await page.waitForURL(/codela_sf_navigation_qa=1/,{timeout:15000});
  await page.locator('.sf-route-skeleton').waitFor({state:'detached',timeout:15000});
  report.checks.sameNodes=await page.evaluate(()=>window.__shellOriginal.header===document.querySelector('.sf-header')&&window.__shellOriginal.dialog===document.querySelector('#sf-panel')&&window.__shellOriginal.dock===document.querySelector('.sf-mobile-dock'));
  assert(report.checks.sameNodes,'Core router must preserve header/dialog/dock DOM identity.');
  await page.goBack({waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForURL(url=>!url.searchParams.has('codela_sf_navigation_qa'),{timeout:15000});
  report.checks.backNavigation=await page.evaluate(()=>window.__shellOriginal?.header===document.querySelector('.sf-header'));
  assert(report.checks.backNavigation,'Back traversal unexpectedly reloaded header');
  report.checks.pageErrors=errors;
  assert(errors.length===0,'JavaScript errors during navigation: '+errors.join('; '));
  report.status='passed';
  await context.close();
 }catch(error){
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
