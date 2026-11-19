// Browser QA for actual PHP page patterns; no design-only mock HTML.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const html = Object.fromEntries(['services','about','contact'].map(name => [
  name, execFileSync(process.env.PHP_BIN || 'php', ['tests/agency-pages.php', '--render=' + name], { cwd: root, encoding: 'utf8' })
]));
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if (pathname === '/') {
    const page = new URL(req.url,'http://localhost').searchParams.get('page');
    if (!html[page]) { res.statusCode=404; return res.end(); }
    res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(html[page]);
  }
  const file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.statusCode=404; return res.end();
  }
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'image/svg+xml');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const port = server.address().port;
  let browser, page;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined });
    const errors = [];
    page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    fs.mkdirSync(path.join(root,'qa'),{recursive:true});
    for (const [width,height] of [[320,740],[390,844],[768,1024],[1440,900]]) {
      await page.setViewportSize({width,height});
      await page.goto('http://127.0.0.1:'+port+'/?page=services');
      assert.equal(await page.locator('.sf-agency-service-page h1').count(),1,'Services page has one heading');
      assert.equal(await page.locator('.sf-agency-module').count(),6,'Six service cards');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'No services overflow at '+width);
      await page.locator('[data-agency-filter="commerce"]').click();
      assert.equal(await page.locator('.sf-agency-module:visible').count(),2,'Commerce filter shows two cards');
      await page.locator('[data-agency-filter="all"]').click();
      assert.equal(await page.locator('.sf-agency-module:visible').count(),6,'All filter restores six cards');
      const checked = page.locator('.sf-agency-module-check input:checked');
      assert.equal(await checked.count(),2,'Two services selected by default');
      await page.locator('.sf-agency-module-check input').first().uncheck();
      assert.equal(await checked.count(),1,'Selection toggles independently of filters');
      assert((await page.locator('[data-agency-selected-cta]').getAttribute('href')).includes('hizmetler='),'Selected services passed to contact link');
      if (width === 390 || width === 1440) await page.screenshot({path:path.join(root,'qa/agency-services-'+width+'.png'),fullPage:true});

      await page.goto('http://127.0.0.1:'+port+'/?page=about');
      assert.equal(await page.locator('.sf-agency-about-page h1').count(),1,'About page has one heading');
      assert.equal(await page.locator('[data-agency-widget-step]').count(),3,'Three process steps');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'No about overflow at '+width);
      await page.locator('[data-agency-widget-step="1"]').click();
      assert.equal(await page.locator('[data-agency-widget-stage]').getAttribute('data-step'),'1','Process stage changes by click');
      await page.locator('[data-agency-widget-step="2"]').press('Enter');
      assert.equal(await page.locator('[data-agency-widget-stage]').getAttribute('data-step'),'2','Process stage keyboard interaction');
      if (width === 390 || width === 1440) await page.screenshot({path:path.join(root,'qa/agency-about-'+width+'.png'),fullPage:true});

      await page.goto('http://127.0.0.1:'+port+'/?page=contact&hizmetler='+encodeURIComponent('WooCommerce E-Ticaret Mağazası'));
      assert.equal(await page.locator('.sf-agency-contact-page h1').count(),1,'Contact page has one heading');
      assert.equal(await page.locator('[data-agency-contact-services]').inputValue(),'WooCommerce E-Ticaret Mağazası','Selected services populate contact form');
      assert.equal(await page.locator('form[action*="admin-post.php"]').count(),1,'Real WP form action');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),'No contact overflow at '+width);
      assert(!(await page.locator('[data-agency-contact-form]').evaluate(form => form.checkValidity())),'Form prevents incomplete requests');
      await page.locator('[name="agency_name"]').fill('Test User');
      await page.locator('[name="agency_email"]').fill('test@example.test');
      await page.locator('[name="agency_message"]').fill('A test project description for an automated check.');
      await page.locator('[name="agency_consent"]').check();
      assert(await page.locator('[data-agency-contact-form]').evaluate(form => form.checkValidity()),'Completed request can be submitted');
      if (width === 390 || width === 1440) await page.screenshot({path:path.join(root,'qa/agency-contact-'+width+'.png'),fullPage:true});
    }
    const noJs = await browser.newPage({ javaScriptEnabled:false, viewport:{width:390,height:844} });
    await noJs.goto('http://127.0.0.1:'+port+'/?page=services');
    assert.equal(await noJs.locator('.sf-agency-module').count(),6,'All services are visible without JavaScript');
    await noJs.goto('http://127.0.0.1:'+port+'/?page=about');
    assert.equal(await noJs.locator('[data-agency-widget-step]').count(),3,'Process text remains visible without JavaScript');
    assert.deepEqual(errors,[],'No uncaught errors');
    console.log('Agency Services/About/Contact: four widths, filter, scope handoff, process, form and no-JS passed.');
  } catch(error) {
    if(page) await page.screenshot({path:path.join(root,'qa/agency-pages-failure.png'),fullPage:true});
    throw error;
  } finally { if(browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
