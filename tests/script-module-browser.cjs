// Tests actual PHP module registrations in a real browser with a warm HTTP
// cache. This local harness is not a substitute for the WP/Woo staging smoke.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-modules-'));
  const assets = path.join(dir, 'assets');
  fs.cpSync(path.resolve('theme/codela-storefront/assets'), assets, {recursive: true});
  // functions.php loads the genuine inc/ modules through get_template_directory().
  fs.cpSync(path.resolve('theme/codela-storefront/inc'), path.join(dir, 'inc'), {recursive: true});
  const formatFile = path.join(assets, 'scripts/format.js');
  const original = fs.readFileSync(formatFile, 'utf8');
  const cartFile = path.join(assets, 'scripts/cart-controller.js');
  const originalCart = fs.readFileSync(cartFile, 'utf8');
  const cartRevision = v => originalCart + '\nwindow.__sfCartRevision = ' + JSON.stringify(v) + ';\n';
  fs.writeFileSync(cartFile, cartRevision('A'));
  const revision = v => original + '\nwindow.__sfFormatRevision = ' + JSON.stringify(v) + ';\n';
  fs.writeFileSync(formatFile, revision('A'));
  let html = '';
  const requests = new Map();
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/a' || pathname === '/b' || pathname === '/c') {
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});
      res.end(html);return;
    }
    if (pathname === '/interactivity.js') {
      res.writeHead(200, {'Content-Type':'application/javascript'});
      res.end('export function store(){return {state:{config:{labels:{}}}};}');return;
    }
    if (!pathname.startsWith('/assets/') || pathname.includes('..')) {
      res.writeHead(404);res.end();return;
    }
    const file = path.join(assets, pathname.slice('/assets/'.length));
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);res.end();return;
    }
    const url = new URL(req.url, 'http://localhost');
    const key = url.pathname + url.search;
    requests.set(key, (requests.get(key) || 0) + 1);
    res.writeHead(200, {'Content-Type':'application/javascript','Cache-Control':'public, max-age=31536000, immutable'});
    res.end(fs.readFileSync(file));
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const readRegistration = () => JSON.parse(execFileSync(process.env.PHP_BIN || 'php', ['tests/script-modules.php'], {
      encoding:'utf8',env:{...process.env,SF_TEST_THEME_PATH:dir,SF_TEST_THEME_URL:origin}
    }));
    const buildHtml = modules => {
      const imports = Object.fromEntries(Object.entries(modules).map(([id, entry]) =>
        [id,entry.src + '?ver=' + entry.version]));
      imports['@wordpress/interactivity'] = origin + '/interactivity.js';
      // Resolves identifiers like the WordPress import map, with real HTTP cache.
      return '<!doctype html><html><head><script type="importmap">'
        + JSON.stringify({imports}) + '</script><script type="module">import "codela-storefront";</script>'
        + '</head><body></body></html>';
    };
    const a = readRegistration();
    html = buildHtml(a);
    browser = await chromium.launch({headless:true});
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/a');
    await page.waitForFunction(() => window.__sfFormatRevision === 'A' && window.__sfCartRevision === 'A');

    // Change ONLY cart-controller; the entry and formatter remain byte-for-byte stable.
    fs.writeFileSync(cartFile, cartRevision('B'));
    const b = readRegistration();
    assert.notEqual(a['codela-storefront/cart'].version,b['codela-storefront/cart'].version);
    for (const id of Object.keys(a)) {
      if (id !== 'codela-storefront/cart') {
        assert.equal(a[id].version,b[id].version,id+' must keep its cached URL');
      }
    }
    html = buildHtml(b);
    await page.goto(origin + '/b');
    await page.waitForFunction(() => window.__sfCartRevision === 'B' && window.__sfFormatRevision === 'A');

    // Then change ONLY the shared formatter. Both consumers still resolve it
    // through the new import map without changing either parent URL.
    fs.writeFileSync(formatFile, revision('B'));
    const c = readRegistration();
    assert.notEqual(b['codela-storefront/format'].version,c['codela-storefront/format'].version);
    for (const id of Object.keys(b)) {
      if (id !== 'codela-storefront/format') {
        assert.equal(b[id].version,c[id].version,id+' must keep its cached URL');
      }
    }
    html = buildHtml(c);
    await page.goto(origin + '/c');
    await page.waitForFunction(() => window.__sfFormatRevision === 'B' && window.__sfCartRevision === 'B');
    for (const [id,entryA,entryB] of [
      ['format',a['codela-storefront/format'],c['codela-storefront/format']],
      ['cart',a['codela-storefront/cart'],b['codela-storefront/cart']]
    ]) {
      const resource = id === 'cart' ? 'cart-controller.js' : 'format.js';
      const oldUrl = '/assets/scripts/' + resource + '?ver=' + entryA.version;
      const newUrl = '/assets/scripts/' + resource + '?ver=' + entryB.version;
      assert.equal(requests.get(oldUrl),1,'Old '+id+' resource requested once');
      assert.equal(requests.get(newUrl),1,'Updated '+id+' resource loaded without clearing cache');
    }
    assert.deepEqual(errors,[],'All bare imports resolve without runtime errors');
    await context.close();
    console.log('Module import graph and warm-cache child update: passed.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(dir,{recursive:true,force:true});
  }
})().catch(error => {console.error(error);process.exitCode = 1;});
