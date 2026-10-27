// Desktop composition, native wheel chaining and exact mobile/tablet node restoration.
// Real Woo/plugin integration and physical-device acceptance remain separate gates.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = 'theme/codela-storefront/';
const css = ['tokens', 'components', 'gallery', 'product'].map(p => fs.readFileSync(root + 'assets/styles/' + p + '.css', 'utf8')).join('\n');
const template = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-product-sheet.php'], {encoding:'utf8'});
const qty = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-product-sheet.php', 'quantity'], {encoding:'utf8'});
const informationScript = fs.readFileSync(root + 'assets/scripts/product-information.js', 'utf8');
const galleryScript = fs.readFileSync(root + 'assets/scripts/gallery-defer.js', 'utf8');
const descriptionId = 'sf-product-section-description';
const image = n => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${n === 1 ? 1000 : 700}" height="${n === 1 ? 700 : 1000}"><rect width="100%" height="100%" fill="#c8b49b"/></svg>`);
function fixture({description = true, eta = true, modules = true, open = true, copy = '<p>Ürün açıklaması</p>'} = {}) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}.woocommerce div.product .related.products{margin-top:80px;min-height:1400px}${css}</style></head><body class="single-product woocommerce"><main class="sf-content"><div class="product"><div class="sf-product-overview"><div class="sf-product-media"><div class="woocommerce-product-gallery sf-ui-gallery sf-ui-gallery--hero sf-ui-gallery--scroll" style="opacity:0"><div class="woocommerce-product-gallery__wrapper">${[0,1,2,3,4].map(n => `<div class="woocommerce-product-gallery__image" data-thumb="${image(n)}"><a href="${image(n)}"><img width="700" height="1000" src="${image(n)}" alt="Product ${n}"></a></div>`).join('')}</div></div></div><div class="summary"><h1 class="product_title">Kavis Dekoratif Obje</h1><div class="sf-product-price-row"><p class="price">990,00 TL</p></div><p class="woocommerce-product-details__short-description">Kesintisiz kıvrımlı dekoratif obje.</p><form id="original-form" class="cart" method="post"><div class="sf-product-purchase"><div class="quantity">${qty}</div><button type="submit" name="add-to-cart" value="42" class="single_add_to_cart_button button">Sepete Ekle</button></div></form>${eta ? '<div class="cdl-de">Tahmini teslimat: 21–23 Ekim</div>' : ''}${modules ? '<div class="cdl-fsb--product">Ücretsiz kargo<div class="cdl-fsb-track"><span class="cdl-fsb-fill"></span></div></div><div class="cdl-wa"><a class="cdl-wa-button" href="https://wa.me/905000000000"><span class="cdl-wa-ico sf-ui-icon-button sf-ui-icon-button--soft">W</span>WhatsApp’tan sor</a></div><div class="cdl-tb">' + ['Güvenli ödeme','Kapıda ödeme','Koşulsuz iade','Hızlı kargo'].map(s => `<div class="cdl-tb-item"><span class="cdl-tb-label">${s}</span></div>`).join('') + '</div>' : ''}</div></div><div class="sf-product-information">${description ? `<details class="sf-product-information-section" id="${descriptionId}" ${open ? 'open' : ''}><summary>Açıklama</summary><div class="sf-product-information-content" id="tab-description">${copy}</div></details>` : ''}<details class="sf-product-information-section" id="sf-product-section-additional_information"><summary>Ek bilgi</summary><div id="tab-additional_information">Ölçüler</div></details><details class="sf-product-information-section" id="sf-product-section-reviews"><summary>Değerlendirmeler (0)</summary><div id="tab-reviews"><div id="reviews">Yorumlar</div><a id="review_form"></a></div></details></div><section class="related products"><h2>İlgili ürünler</h2></section>${template}</div></main></body></html>`;
}
// A long below-fold recommendation area makes wheel assertions independent of
// whether this fixture's short summary happens to fit a particular viewport.
const wait = (page, predicate, arg) => page.waitForFunction(predicate, arg, {timeout:5000});
async function load(page, width, options = {}) {
  // A real navigation discards previous matchMedia/window listeners, unlike setContent alone.
  await page.goto('about:blank');
  await page.setViewportSize({width, height:1000});
  await page.setContent(fixture(options));
  await page.evaluate(() => {
    window.originalNodes = Object.fromEntries(['sf-product-section-description', 'sf-product-section-additional_information', 'sf-product-section-reviews', 'original-form'].map(id => [id, document.getElementById(id)]));
    window.originalInformation = document.querySelector('.sf-product-information');
    window.originalTrust = document.querySelector('.cdl-tb');
    window.originalEta = document.querySelector('.cdl-de');
  });
}
async function assertIdentity(page, description = true) {
  assert(await page.evaluate(expectedDescription => {
    const ids = ['sf-product-section-additional_information', 'sf-product-section-reviews', 'original-form'];
    if (expectedDescription) ids.push('sf-product-section-description', 'tab-description');
    return ids.every(id => document.querySelectorAll('#' + id).length === 1) &&
      Object.entries(window.originalNodes).every(([id, node]) => document.getElementById(id) === node) &&
      document.querySelector('.sf-product-information') === window.originalInformation &&
      document.querySelector('.cdl-tb') === window.originalTrust &&
      document.querySelector('.cdl-de') === window.originalEta &&
      document.querySelectorAll('form.cart').length === 1;
  }, description), 'Same original nodes and IDs; no copied description, review, module or form');
}
async function resizeAndCheck(page, width, {description = true, originalOpen = true} = {}) {
  await page.setViewportSize({width, height:width <= 700 ? 844 : 1000});
  await wait(page, ({width, description, originalOpen}) => {
    const section = document.getElementById('sf-product-section-description');
    const sheet = document.querySelector('.sf-product-sheet');
    if ((width <= 700) !== Boolean(sheet)) return false;
    if (!description) return !section;
    if (width >= 901) return section.parentElement.matches('.sf-product-overview > .summary') && section.open;
    return section.parentElement === document.querySelector('.sf-product-information') && section.open === (width <= 700 ? false : originalOpen);
  }, {width, description, originalOpen});
  await assertIdentity(page, description);
  assert(await page.evaluate(() => {
    const info = document.querySelector('.sf-product-information');
    return document.getElementById('sf-product-section-additional_information').parentElement === info &&
      document.getElementById('sf-product-section-reviews').parentElement === info;
  }), 'Additional information/reviews stay in the existing information container at ' + width);
  if (width <= 700) {
    assert.equal(await page.locator('.sf-product-sheet-body > .cdl-tb').count(), 1);
    assert.equal(await page.locator('.sf-product-delivery .cdl-de').count(), 1);
    assert.equal(await page.locator('.sf-product-gallery-arrows').isVisible(), false, 'Desktop arrows stay absent on mobile');
  } else {
    assert.equal(await page.locator('.summary > .cdl-tb').count(), 1);
    assert.equal(await page.locator('.summary > .cdl-de').count(), 1);
  }
}
async function wheelOverPhoto(page, label) {
  await page.evaluate(() => window.scrollTo({top:0, behavior:'instant'}));
  await wait(page, () => window.scrollY === 0);
  const track = page.locator('.woocommerce-product-gallery__wrapper');
  const before = await page.evaluate(() => ({left:document.querySelector('.woocommerce-product-gallery__wrapper').scrollLeft, count:document.querySelector('.sf-product-gallery-count').textContent}));
  assert.deepEqual(await track.evaluate(el => ({x:getComputedStyle(el).overscrollBehaviorX, y:getComputedStyle(el).overscrollBehaviorY})), {x:'contain', y:'auto'}, 'Only vertical scroll chaining is released ' + label);
  let box = await track.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 260);
  await wait(page, () => window.scrollY > 200);
  const down = await page.evaluate(() => window.scrollY);
  box = await track.boundingBox();
  assert(box.y + box.height > 0 && box.y < 1000, 'Photo remains a visible wheel target ' + label);
  await page.mouse.move(box.x + box.width / 2, Math.max(1, box.y) + (Math.min(999, box.y + box.height) - Math.max(1, box.y)) / 2);
  await page.mouse.wheel(0, -180);
  await wait(page, previous => window.scrollY < previous - 50, down);
  const after = await page.evaluate(() => ({left:document.querySelector('.woocommerce-product-gallery__wrapper').scrollLeft, count:document.querySelector('.sf-product-gallery-count').textContent}));
  assert(Math.abs(before.left - after.left) < 1, 'Vertical wheel does not select another photo ' + label);
  assert.equal(after.count, before.count, 'Gallery count survives down/up document scrolling ' + label);
  await page.evaluate(() => window.scrollTo({top:0, behavior:'instant'}));
  await wait(page, () => window.scrollY === 0);
}
(async () => {
  const browser = await (process.env.TEST_WEBKIT ? webkit : chromium).launch({headless:true});
  try {
    const page = await browser.newPage({reducedMotion:'reduce'});
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [901,1024,1280,1440,1920]) {
      await load(page, width);
      assert.equal(await page.locator('.woocommerce-product-gallery').evaluate(el => getComputedStyle(el).opacity), '1', 'Native first photo is visible before Woo JS');
      const etaBefore = await page.locator('.cdl-de').boundingBox();
      await page.addScriptTag({content:informationScript});
      // Description relocation can legitimately grow summary. Gallery controls
      // must not add a second layout shift after that intentional composition.
      const before = await page.locator('.sf-product-information').boundingBox();
      await page.addScriptTag({content:galleryScript});
      const after = await page.locator('.sf-product-information').boundingBox();
      assert(Math.abs(before.y - after.y) < 1, 'Gallery controls cannot shift information on mount ' + width + ' ' + JSON.stringify({before,after}));
      const g = await page.evaluate(() => {
        const r = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        return {gallery:r('.woocommerce-product-gallery'),track:r('.woocommerce-product-gallery__wrapper'),summary:r('.summary'),info:r('.sf-product-information'),related:r('.related'),trust:r('.cdl-tb'),contact:r('.cdl-wa'),nav:r('.sf-product-gallery-nav'),description:r('#sf-product-section-description'),eta:r('.cdl-de'),overflow:document.documentElement.scrollWidth > innerWidth + 1};
      });
      assert(!g.overflow);
      assert(g.summary.left - g.gallery.right >= 43, 'Explicit center gutter');
      assert(g.track.height <= 640.1);
      assert(g.info.top >= Math.max(g.gallery.bottom,g.summary.bottom) - 1);
      assert(g.related.top >= g.info.bottom - 1 && g.related.top - g.info.bottom <= 37, 'Recommendations follow details without native extra gap');
      assert(g.info.width >= g.summary.right - g.gallery.left - 1, 'Remaining information spans both columns');
      assert(g.trust.top >= g.contact.bottom - 1 && g.trust.bottom <= g.summary.bottom + 1);
      assert(g.nav.top >= g.track.bottom, 'Preview rail below photograph');
      assert(Math.abs(g.description.top - etaBefore.y) < 1, 'Description begins at the original ETA position ' + width);
      assert(Math.abs(g.description.left - g.summary.left) < 1 && g.description.right <= g.summary.right + 1, 'Description belongs to right summary column');
      assert(g.eta.top >= g.description.bottom - 1, 'Delivery follows description');
      assert.equal(await page.locator('.summary > #sf-product-section-description[open]').count(), 1, 'Description starts readable, not as a closed button');
      assert.equal(await page.locator('.cdl-tb').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2);
      assert.equal(await page.locator('.sf-product-gallery-thumb:not([hidden])').count(), 3);
      assert.equal(await page.locator('.sf-product-purchase').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      await assertIdentity(page);
      await wheelOverPhoto(page, width);
      const next = page.getByRole('button', {name:'Next image',exact:true});
      const previous = page.getByRole('button', {name:'Previous image',exact:true});
      assert(await previous.isDisabled());
      await next.click();
      await wait(page, () => document.querySelector('.sf-product-gallery-count').textContent === '2 / 5');
      await previous.click();
      await wait(page, () => document.querySelector('.sf-product-gallery-count').textContent === '1 / 5');
      await page.locator('[data-quantity-step="1"]').click();
      assert.equal(await page.locator('input.qty').inputValue(), '2');
      for (const target of [900,700,701,901,390,width]) await resizeAndCheck(page, target);
      assert.equal(await page.locator('input.qty').inputValue(), '2', 'Original form state survives repeated desktop/tablet/mobile transitions');
    }
    // A merchant/extension's closed tablet disclosure is restored exactly;
    // desktop readability must not overwrite the original responsive state.
    await load(page, 900, {open:false});
    await page.addScriptTag({content:informationScript});
    await page.addScriptTag({content:galleryScript});
    await resizeAndCheck(page, 901, {originalOpen:false});
    await page.locator('#sf-product-section-description > summary').click();
    assert.equal(await page.locator('#sf-product-section-description').evaluate(el => el.open), false, 'Native desktop disclosure remains keyboard/pointer operable');
    for (const width of [900,701,700,901,390,900]) await resizeAndCheck(page, width, {originalOpen:false});

    for (const options of [{description:false}, {eta:false}, {eta:false,modules:false}, {copy:''}, {copy:'<p>' + 'Uzun <strong>ürün açıklaması</strong> ve bakım bilgileri. '.repeat(36) + '</p><ul><li>El yapımı seramik</li><li>Nemli bezle temizleyin</li></ul><p>' + 'kesintisiz'.repeat(70) + '</p>'}]) {
      await load(page, 901, options);
      await page.addScriptTag({content:informationScript});
      await page.addScriptTag({content:galleryScript});
      const hasDescription = options.description !== false;
      await assertIdentity(page, hasDescription);
      assert.equal(await page.locator('#sf-product-section-description').count(), hasDescription ? 1 : 0, 'Missing descriptions never fabricate a disclosure');
      if (hasDescription) {
        assert.equal(await page.locator('.summary > #sf-product-section-description[open]').count(), 1);
        assert(await page.evaluate(() => {
          const description = document.getElementById('sf-product-section-description');
          const next = description.nextElementSibling;
          return !next || next.matches('.cdl-de,.cdl-fsb-live--product,.cdl-fsb--product,.cdl-wa,.cdl-tb');
        }), 'Optional modules retain their order after description');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Empty/missing/long rich text stays inside the desktop viewport');
      const sections = await page.evaluate(() => Array.from(document.querySelector('.sf-product-information').children).map(el => el.id));
      assert.deepEqual(sections, ['sf-product-section-additional_information','sf-product-section-reviews']);
    }
    assert.deepEqual(errors, []);
    console.log('Desktop product passed: five widths, native wheel down/up, readable right description, ETA order, unchanged gallery controls/quantity, exact 700/701 and 900/901 restoration, closed-state preservation and optional/long descriptions.');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exit(1);});
