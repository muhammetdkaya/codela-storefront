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
      assert.equal(await scroll.count(),1,'3D section is independently placed between Card Swap sections');
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
      assert(await scroll.locator('[data-agency-scroll-device]').evaluate(el=>getComputedStyle(el).transform!=='none'),'3D device retains perspective transform');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'No overflow after interactions at '+width);
      if(width===390||width===1440)await page.screenshot({path:path.join(root,'qa/agency-widgets-'+width+'.png'),fullPage:true});
    }
    const plain = await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await plain.goto('http://127.0.0.1:'+server.address().port+'/');
    assert.equal(await plain.locator('[data-agency-widget]').count(),5,'All five widgets survive disabled JavaScript');
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
