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
      assert.equal(await page.locator('.sf-agency-card').count(), 3);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No horizontal overflow at ${width}`);
      const bounds = await page.locator('.sf-agency-hero').boundingBox();
      const header = await page.locator('.sf-header').boundingBox();
      assert(bounds.y >= header.y + header.height - 1, 'Agency content clears the real fixed theme header');
      assert(bounds.height >= height - (width <= 700 ? 68 : 76) - 2, 'Hero fills the available first screen');
      if (width === 390) {
        assert(bounds.height <= height - 68 + 2, 'Portrait hero fits one screen at the reference phone size');
        const buttons = await page.locator('.sf-agency-intro .sf-ui-button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
        assert(Math.abs(buttons[0].top - buttons[1].top) < 2, 'Phone hero actions share one row');
        assert(buttons.every(button => button.height >= 44), 'Compact buttons retain touch targets');
        const scene = await page.locator('.sf-agency-scene').boundingBox();
        const dock = await page.locator('.sf-mobile-dock').boundingBox();
        assert(scene.y + scene.height <= dock.y + 1, 'First scene clears the real mobile dock');
      }
      const services = await page.locator('#sf-agency-services').boundingBox();
      assert(services.y >= bounds.y + bounds.height - 1, 'Three-card showcase is below hero');
      for (const link of await page.locator('.sf-agency a[href^="#"]').all()) {
        const target = await link.getAttribute('href');
        assert.equal(await page.locator(target).count(), 1, `Working local anchor ${target}`);
      }
      const details = page.locator('.sf-agency-details').first();
      await details.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert(await details.evaluate(node => node.open), 'Service detail opens by keyboard');
      await page.keyboard.press('Enter');
      if (width === 390 || width === 1440) {
        await page.locator('.sf-agency-details summary').first().evaluate(node => node.blur());
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(root, `qa/agency-${width}.png`), fullPage: true });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('[data-agency-tilt]').evaluate(node => getComputedStyle(node).transform), 'none');
    const plain = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await plain.goto(`http://127.0.0.1:${server.address().port}/`);
    await plain.locator('.sf-agency-details summary').first().click();
    assert(await plain.locator('.sf-agency-details').first().evaluate(node => node.open), 'Details work without JS');
    assert.deepEqual(errors, []);
    console.log('Agency: four widths, full-height hero, showcase order, links, keyboard, reduced motion and no-JS passed.');
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(root, 'qa/agency-failure.png'), fullPage: true });
    throw error;
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
