// Browser acceptance for actual PHP-rendered independent agency layout widgets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const html = execFileSync(process.env.PHP_BIN || 'php', ['tests/agency-pages.php','--render=widgets'], { cwd: root, encoding: 'utf8' });
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if (pathname === '/') { res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(html); }
  const file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.statusCode = 404; return res.end();
  }
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/plain');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser, page;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined});
    page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    fs.mkdirSync(path.join(root,'qa'),{recursive:true});
    for (const [width,height] of [[320,740],[390,844],[768,1024],[1440,900]]) {
      await page.setViewportSize({width,height});
      await page.goto('http://127.0.0.1:'+server.address().port+'/');
      const widgets = page.locator('[data-agency-widget]');
      const first = page.locator('[data-agency-widget="cards"]').first();
      const second = page.locator('[data-agency-widget="cards"]').last();
      const scroll = page.locator('[data-agency-widget="scroll"]');
      assert.equal(await widgets.count(),5,'Two cards, services, process and 3D sections may coexist');
      assert.equal(await page.locator('.sf-agency-swap-card').count(),6,'Duplicated cards each render their own content');
      const halo = await first.locator('.sf-agency-hero').evaluate(el => {
        const paint = getComputedStyle(el, '::after');
        return {filter:paint.filter,background:paint.backgroundImage};
      });
      if (width <= 700) {
        assert.equal(halo.filter,'none','Card hero uses a paint-only halo on phones');
        assert(halo.background.startsWith('radial-gradient('),'Mobile visual halo is retained as a radial gradient');
      } else {
        assert.notEqual(halo.filter,'none','Desktop reference presentation remains unchanged');
      }
      assert.notEqual(await first.locator('.sf-agency-swap-stage').evaluate(el => getComputedStyle(el).perspective),'none','3D card stack remains intact');
      assert.equal(await scroll.count(),1,'3D section is independently placed between Card Swap sections');
      const handoff = await scroll.evaluate(el => {
        const next = el.nextElementSibling;
        const expertise = el.querySelector('.sf-agency-scroll-expertise');
        const sheet = next?.querySelector('.sf-agency-services');
        return {
          next:next?.dataset.agencyWidget || '',
          overlap:next ? el.getBoundingClientRect().bottom - next.getBoundingClientRect().top : 0,
          radius:sheet ? parseFloat(getComputedStyle(sheet).borderTopLeftRadius) : 0,
          expertise:getComputedStyle(expertise).display
        };
      });
      assert.equal(handoff.next,'services','Real homepage order starts with 3D hero → Services');
      assert(handoff.overlap>=25 && handoff.overlap<=48,'Hero and services form a deliberate overlapping sheet');
      assert(handoff.radius>=24,'Light services surface rises with a rounded top edge');
      assert.equal(handoff.expertise,'none','Duplicated services recap disappears only when a service widget follows');
      const goNext = scroll.locator('[data-agency-scroll-next]');
      assert.equal(await goNext.count(),1,'Hero contains an accessible next-section link');
      assert((await goNext.getAttribute('href')).includes('hizmetler'),
        'Next-section link degrades to real Services page without JavaScript');
      assert.equal(await scroll.locator('.sf-agency-preview-browser').count(),1,
        '3D widget shows one product-style interface, not a repeated service dashboard');
      assert.equal(await scroll.locator('.sf-agency-scroll-expertise > div').count(),3,
        'Three saved editor specialties remain editable and visible');
      assert.equal(await scroll.locator('.sf-agency-scroll-actions a').count(),2,
        'Hero has direct contact and services actions');
      assert.equal(await scroll.locator('iframe').count(),0,
        'Embedded concept uses no cross-origin iframe');
      const services = page.locator('[data-agency-widget="services"]');
      const process = page.locator('[data-agency-widget="process"]');
      assert.equal(await services.locator('.sf-agency-poster').count(),4,'Four editable services render independently');
      await services.locator('[data-agency-widget-detail="0"]').click();
      assert(await services.locator('[data-agency-widget-dialog]').isVisible(),'Service opens its own detail dialog');
      assert.equal(await services.locator('[data-agency-widget-detail-title]').textContent(),'Web');
      await services.locator('[data-agency-widget-close]').click();
      assert(!(await services.locator('[data-agency-widget-dialog]').isVisible()),'Dialog closes without changing page');
      await process.locator('[data-agency-widget-step="1"]').click();
      assert.equal(await process.locator('[data-agency-widget-stage]').getAttribute('data-step'),'1','Second phase updates only its process widget');
      assert.equal(await process.locator('[data-agency-widget-stage-title]').textContent(),'Build');
      assert.equal(await page.locator('.sf-agency-hero-variant-switch').count(),0,'The old variant switch does not appear in managed layouts');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'No horizontal overflow at '+width);
      await first.locator('[data-agency-swap-to="1"]').click();
      assert.equal(await first.locator('[data-agency-card="1"]').getAttribute('data-pos'),'0','First Card Swap changes on click');
      assert.equal(await second.locator('[data-agency-card="0"]').getAttribute('data-pos'),'0','Second Card Swap state remains untouched');
      await second.locator('[data-agency-card="0"]').press('Enter');
      assert.equal(await second.locator('[data-agency-card="1"]').getAttribute('data-pos'),'0','Duplicated widget responds to keyboard independently');
      assert.equal(await first.locator('[data-agency-card="1"]').getAttribute('data-pos'),'0','First widget keeps its selection');
      await scroll.scrollIntoViewIfNeeded();
      const devicePaint=await scroll.locator('[data-agency-scroll-device]').evaluate(el=>({
        transform:getComputedStyle(el).transform,
        willChange:getComputedStyle(el).willChange,
        inlineRotate:el.style.getPropertyValue('--agency-scroll-rotate'),
        inlineScale:el.style.getPropertyValue('--agency-scroll-scale'),
        visible:getComputedStyle(el).visibility
      }));
      if (width <= 700) {
        assert.equal(devicePaint.transform,'none','Mobile 3D compositor is removed at its source');
        assert.equal(devicePaint.willChange,'auto','Mobile hero does not permanently allocate a transformed layer');
        assert.equal(devicePaint.inlineRotate,'','Mobile scroll never updates 3D rotation');
        assert.equal(devicePaint.inlineScale,'','Mobile scroll never updates 3D scale');
        assert.equal(devicePaint.visible,'visible','Hero is not hidden by overlay workaround');
      } else {
        assert.notEqual(devicePaint.transform,'none','Desktop keeps the approved 3D motion');
      }
      await goNext.click();
      await page.waitForFunction(() => {
        const services = document.querySelector('[data-agency-widget="services"] .sf-agency-services');
        if (!services) return false;
        const top = services.getBoundingClientRect().top;
        return top >= 30 && top <= 140;
      });
      assert.equal(new URL(page.url()).pathname,'/','Next-section cue moves within homepage without navigation');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'No overflow after interactions at '+width);
      if(width===390||width===1440)await page.screenshot({path:path.join(root,'qa/agency-widgets-'+width+'.png'),fullPage:true});
    }
    const plain = await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await plain.goto('http://127.0.0.1:'+server.address().port+'/');
    assert.equal(await plain.locator('[data-agency-widget]').count(),5,'All five widgets survive disabled JavaScript');
    assert(await plain.locator('[data-agency-scroll-next]').isVisible(),
      'Without JS the native Services link is still visible');
    assert.deepEqual(errors,[],'No uncaught JS errors');
    console.log('Independent agency widgets: four viewports, duplicates, keyboard, 3D transform, no-JS passed.');
  } catch(error) {
    if(page)await page.screenshot({path:path.join(root,'qa/agency-widgets-failure.png'),fullPage:true});
    throw error;
  } finally {
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
