// Production PHP pattern and CSS; no screenshot mock replaces the actual content.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const shell = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-header.php'], { cwd: root, encoding: 'utf8' }).replaceAll('https://store.test/theme/', '/theme/codela-storefront/');
const html = execFileSync(process.env.PHP_BIN || 'php', ['tests/agency.php', '--render'], { cwd: root, encoding: 'utf8' }).replace('<!-- agency-shell -->', shell);
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(html); }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'image/svg+xml');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser, page;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined });
    const errors = [];
    page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    fs.mkdirSync(path.join(root, 'qa'), { recursive: true });
    for (const [width, height] of [[320,740], [390,844], [768,1024], [1440,900]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      assert.equal(await page.locator('.sf-content h1').count(), 1, 'One main page heading; the closed account dialog has its own heading');
      assert.equal(await page.locator('.sf-agency-poster').count(), 4);
      assert.equal(await page.locator('.sf-agency-swap-card').count(), 3);
      if (width <= 700) {
        const paint = await page.locator('.sf-agency-hero').evaluate(el => {
          const effect = getComputedStyle(el, '::after');
          return {filter:effect.filter,background:effect.backgroundImage};
        });
        assert.equal(paint.filter,'none','Legacy Card Swap hero avoids oversized mobile CSS blur');
        assert(paint.background.startsWith('radial-gradient('),'Legacy halo retained without filtered render surface');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No horizontal overflow at ${width}`);
      const bounds = await page.locator('.sf-agency-hero').boundingBox();
      const header = await page.locator('.sf-header').boundingBox();
      // Floating header must overlay the dark hero; only hero controls need safe spacing.
      assert(Math.abs(bounds.y - header.y) <= 1, 'Agency hero begins behind the real fixed glass header, with no white band');
      const switchBounds = await page.locator('.sf-agency-hero-variant-switch').boundingBox();
      assert(switchBounds.y >= header.y + header.height - 1, 'Hero display controls remain below the fixed header');
      assert.equal(await page.locator('.sf-agency-hero').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(9, 9, 11)', 'Dark hero covers the header underlay');
      assert(bounds.height >= height - 2, 'Hero extends across the complete first viewport');
      if (width === 390) {
        const buttons = await page.locator('.sf-agency-intro .sf-ui-button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
        assert(Math.abs(buttons[0].top - buttons[1].top) < 2, 'Phone hero actions share one row');
        assert(buttons.every(button => button.height >= 44), 'Compact buttons retain touch targets');
        const tabs = await page.locator('.sf-agency-swap-tab').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
        assert(tabs.every(tab => Math.abs(tab.top - tabs[0].top) < 2), 'Mobile swap tabs stay in a single horizontal row');
        const stage = await page.locator('.sf-agency-swap-stage').boundingBox();
        assert(stage.width > 240 && stage.height > 300, 'Reference card stack remains usable on phone');
      }
      // The alternative is the real reference Container Scroll mockup, not a static link.
      const scrollButton = page.locator('[data-agency-variant="scroll"]');
      const stackButton = page.locator('[data-agency-variant="cardswap"]');
      assert.equal(await scrollButton.count(), 1, '3D scroll mode exists');
      await scrollButton.click();
      assert.equal(await scrollButton.getAttribute('aria-pressed'), 'true');
      assert(await page.locator('[data-agency-hero-cards]').evaluate(node => node.hidden), 'Card Swap layout is hidden in 3D mode');
      assert(!(await page.locator('[data-agency-container-scroll]').evaluate(node => node.hidden)), '3D tablet layout becomes visible');
      assert((await page.locator('[data-agency-scroll-device]').evaluate(node => getComputedStyle(node).transform)) !== 'none', '3D tablet has an initial transform');
      await page.evaluate(() => scrollTo(0, 260));
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-agency-scroll-device]');
        return el && Number.parseFloat(el.style.getPropertyValue('--agency-scroll-scale')) > 0.94;
      });
      if (width === 390 || width === 1440) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(170);
        await page.screenshot({ path: path.join(root, `qa/agency-scroll-${width}.png`), fullPage: true });
      }
            await stackButton.click();
      assert.equal(await stackButton.getAttribute('aria-pressed'), 'true');
      assert(!(await page.locator('[data-agency-hero-cards]').evaluate(node => node.hidden)), 'Card Swap is restored without a page reload');
      assert(await page.locator('[data-agency-container-scroll]').evaluate(node => node.hidden), 'Inactive 3D variant is excluded from layout');
            const services = await page.locator('#sf-agency-services').boundingBox();
      assert(services.y >= bounds.y + bounds.height - 1, 'Three-card showcase is below hero');
      for (const link of await page.locator('.sf-agency a[href^="#"]').all()) {
        const target = await link.getAttribute('href');
        assert.equal(await page.locator(target).count(), 1, `Working local anchor ${target}`);
      }
      const swapTabs = page.locator('[data-agency-swap-to]');
      await swapTabs.nth(1).click();
      assert.equal(await page.locator('[data-agency-card="1"]').getAttribute('data-pos'), '0', 'Hero card changes on tab selection');
      await swapTabs.nth(0).click();
      await page.locator('[data-agency-card="0"]').press('Enter');
      assert.equal(await page.locator('[data-agency-card="1"]').getAttribute('data-pos'), '0', 'Hero card changes with keyboard');
      await page.locator('[data-agency-carousel-next]').click();
      await page.waitForFunction(() => document.querySelector('[data-agency-service-track]').scrollLeft > 2);
      await page.locator('[data-agency-detail="web"]').click();
      assert(await page.locator('[data-agency-dialog]').evaluate(node => node.open), 'Service detail opens in native dialog');
      await page.locator('[data-agency-dialog-close]').click();
      assert(!(await page.locator('[data-agency-dialog]').evaluate(node => node.open)), 'Service dialog closes');
      if (width === 390 || width === 1440) {
        await swapTabs.nth(0).click();
        await page.locator('[data-agency-detail="web"]').first().evaluate(node => node.blur());
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(820);
        await page.screenshot({ path: path.join(root, `qa/agency-${width}.png`), fullPage: true });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.sf-agency-swap-card').first().evaluate(node => getComputedStyle(node).transitionDuration), '0s', 'Reduced motion disables animated card transitions');
    const plain = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await plain.goto(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(await plain.locator('.sf-agency-poster').count(), 4, 'All service cards render without JavaScript');
    assert.equal(await plain.locator('.sf-agency-swap-card').count(), 3, 'Hero cards render without JavaScript');
    assert.equal(await plain.locator('.sf-agency-service-track').count(), 1, 'Native carousel scrollport works without JavaScript');
    assert(await plain.locator('[data-agency-container-scroll]').evaluate(node => node.hidden), 'Non-JS fallback shows the initial card hero, not both modes');
    assert.deepEqual(errors, []);
    console.log('Agency: four widths, reference hero and carousel, modal, links, keyboard, reduced motion and no-JS passed.');
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(root, 'qa/agency-failure.png'), fullPage: true });
    throw error;
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
