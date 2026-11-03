// Reproducible Stage 0 capture. Run against a git-archive of the pinned source.
// Real theme PHP, styles and controllers; WordPress binding/API boundaries only
// are fixture data. This is not a live WooCommerce or payment acceptance test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const base = path.resolve(process.env.CODELA_BASELINE_ROOT || process.cwd());
const output = path.resolve(process.env.CODELA_BASELINE_OUTPUT || path.join(base, 'qa/library-migration/baseline-2026-11-03/cart'));
const themeRoot = path.join(base, 'theme/codela-storefront/');
const sizes = JSON.parse(fs.readFileSync(path.join(__dirname, 'source-sizes.json'), 'utf8'));
for (const item of sizes.assets) {
  const bytes = fs.readFileSync(path.join(themeRoot, item.path));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, 'Pinned 0.1.195 source: ' + item.path);
}
const header = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-header.php'], { cwd: base, encoding: 'utf8' });
const theme = JSON.parse(fs.readFileSync(path.join(themeRoot, 'theme.json'), 'utf8'));
const css = fs.readFileSync(path.join(themeRoot, 'assets/styles/storefront-base.css'), 'utf8') + `body{font-family:${theme.settings.typography.fontFamilies[0].fontFamily};line-height:${theme.styles.typography.lineHeight}}a{text-decoration:${theme.styles.elements.link.typography.textDecoration}}`;
const modules = ['format', 'search-controller', 'cart-controller', 'overlay-controller', 'dock-controller'].map(name => fs.readFileSync(path.join(themeRoot, `assets/scripts/${name}.js`), 'utf8').replace(/^import .*;$/gm, '').replace(/^export /gm, '')).join('\n');
const entry = fs.readFileSync(path.join(themeRoot, 'assets/storefront.js'), 'utf8').replace(/^import .*;$/gm, '');
const config = { api: 'https://store.test/api/', search: 'https://store.test/search-api', cart: '/cart/', account: '/my-account/', labels: {} };
const total = { total_items: '185000', total_items_tax: '0', currency_code: 'TRY', currency_minor_unit: 2 };
const item = (key, name, price) => ({ key, name, permalink: '/product/' + key, quantity: 1, quantity_limits: { minimum: 1, maximum: 3, multiple_of: 1, editable: true }, images: [{ thumbnail: 'https://store.test/product.svg' }], totals: { line_subtotal: price, line_subtotal_tax: '0', currency_code: 'TRY', currency_minor_unit: 2 } });
const populated = { items_count: 2, items: [item('vase', 'El yapımı seramik vazo', '129000'), item('bowl', 'Dekoratif kase', '56000')], totals: total };
const empty = { items_count: 0, items: [], totals: { ...total, total_items: '0' } };
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {});
  const records = [];
  try {
    for (const width of [320, 390, 700, 701, 900, 901, 1280, 1440]) {
      for (const state of ['loading', 'empty', 'populated']) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.pathname === '/api/cart') {
            if (state === 'loading') return;
            return route.fulfill({ json: state === 'empty' ? empty : populated, headers: { Nonce: 'fixture' } });
          }
          if (url.pathname === '/search-api') return route.fulfill({ json: [] });
          if (url.pathname.includes('/assets/icons/')) return route.fulfill({ contentType: 'image/svg+xml', body: fs.readFileSync(path.join(themeRoot, 'assets/icons/', path.basename(url.pathname))) });
          if (url.pathname === '/product.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120"><rect width="100" height="120" fill="#d8cbbc"/><ellipse cx="50" cy="65" rx="24" ry="35" fill="#a68e78"/></svg>' });
          return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body>${header}<main id="sf-content" style="height:2000px">Sepet karşılaştırma ortamı</main></body></html>` });
        });
        await page.goto('https://store.test/');
        await page.addScriptTag({ content: `function store(name, options) { window.sfActions = options.actions; return { state: { config: ${JSON.stringify(config)} } }; }\n${modules}\n${entry}` });
        await page.evaluate(() => window.sfActions.cart());
        if (state === 'loading') await page.locator('.sf-cart-skeleton').waitFor();
        else if (state === 'populated') await page.locator('[data-cart-key]').first().waitFor();
        else await page.waitForFunction(() => document.querySelector('#sf-cart')?.textContent.includes('Your cart is empty'));
        await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))));
        const metrics = await page.evaluate(() => {
          const rect = selector => { const el = document.querySelector(selector); if (!el) return null; const box = el.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
          return { dialog: rect('#sf-panel'), cart: rect('#sf-cart'), close: rect('.sf-panel-top .sf-close'), footer: rect('.sf-cart-bottom'), dialogCount: document.querySelectorAll('dialog').length, focus: document.activeElement?.className, busy: document.querySelector('#sf-cart').getAttribute('aria-busy'), enter: getComputedStyle(document.querySelector('#sf-panel')).getPropertyValue('--sf-ui-motion-panel-enter').trim(), exit: getComputedStyle(document.querySelector('#sf-panel')).getPropertyValue('--sf-ui-motion-panel-exit').trim() };
        });
        assert.equal(metrics.dialogCount, 1, 'One native dialog');
        assert.equal(metrics.enter, '240ms'); assert.equal(metrics.exit, '180ms');
        if (width >= 901) { assert(metrics.dialog.width <= 460); assert(Math.abs(metrics.dialog.x + metrics.dialog.width - width) < 1); }
        else assert(Math.abs(metrics.dialog.width - width) < 1);
        const image = `chromium-cart-${state}-${width}.png`;
        await page.screenshot({ path: path.join(output, image) });
        assert.deepEqual(errors, []);
        records.push({ width, height: 900, state, image, metrics });
        await page.close();
      }
    }
    fs.writeFileSync(path.join(output, 'metrics.json'), JSON.stringify({ source_sha: sizes.source_sha, browser: browser.version(), fixture: 'real theme PHP/controller with controlled Store API responses', records }, null, 2) + '\n');
    console.log('Baseline cart screenshots: 24 width/state fixtures. No live store request or mutation.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
