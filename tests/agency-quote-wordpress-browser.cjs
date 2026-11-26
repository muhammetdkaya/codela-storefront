const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ids=JSON.parse(fs.readFileSync('/tmp/codela-agency-real-fixture.json','utf8'));
const base='http://127.0.0.1:8897';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
 try{
  for(const [width,height] of [[390,844],[1280,720],[1440,900],[1920,1080],[2560,1440]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base+'/?page_id='+ids.mixed,{waitUntil:'domcontentloaded'});
   await page.locator('.cdl-quote').first().waitFor();
   assert(await page.locator('body').evaluate(e=>e.classList.contains('sf-agency-mixed')));
   assert(await page.getByText('Native paragraph remains visible.').isVisible());
   assert.equal(await page.locator('.cdl-quote').count(),2);
   const quote=page.locator('.cdl-quote').first();
   await quote.locator('summary').click();
   await quote.locator('select[name=quote_package]').selectOption('0');
   await quote.locator('input[name="quote_extra[]"][value="0"]').check();
   await page.waitForFunction(()=>document.querySelector('[data-quote-estimate]').textContent.includes('13.500'));
   assert((await quote.locator('[data-quote-estimate]').textContent()).includes('20.000'));
   await quote.locator('input[name="quote_extra[]"][value="1"]').check();
   assert(await quote.locator('[data-quote-estimate]').isHidden(),'Unknown extra hides total');
   assert(await page.locator('.cdl-quote').nth(1).locator('[data-quote-estimate]').isHidden(),'Second quote remains independent');
   assert(await page.locator('.sf-footer').isVisible(),'Detail embedded in a mixed page does not hide native footer');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert(overflow<=2,'Mixed page has no horizontal overflow at '+width+': '+overflow);
   const duplicate=await page.evaluate(()=>{const ids=[...document.querySelectorAll('.sf-agency-widget [id]')].map(e=>e.id);return ids.length!==new Set(ids).size});
   assert(!duplicate,'No duplicate component DOM IDs');
   await page.screenshot({path:'qa/agency-real-quote-'+width+'.png',fullPage:true});
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base+'/?page_id='+ids.disabled,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.cdl-quote').count(),0,'Disabled component has no form');
  assert.equal(await page.locator('script[src*="agency-widgets.js"]').count(),0,'Disabled component has no widget script');
  await page.close();
  console.log('Real WP mixed page, quote controls and five viewport checks passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
