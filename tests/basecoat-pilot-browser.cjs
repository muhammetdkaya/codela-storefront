// No-deploy CI test. Uses current Codela CSS, not Basecoat's CSS/reset.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture, reviewTable} = require('./basecoat-pilot-fixture.cjs');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.SF_ENGINE || (process.env.TEST_WEBKIT ? 'webkit' : 'chromium');
assert(['chromium', 'webkit', 'firefox'].includes(engine), 'Supported CI browser');
const reportDir = path.resolve(process.env.BASECOAT_REPORT_DIR || process.env.SF_REPORT_DIR || path.join('qa', 'basecoat-pilot', engine));
const target = '.form-row, fieldset, label[for], input:not([type=hidden]), select, [role=alert], button[type=submit], #order_review, #order_review_heading, #payment, table, .sf-account-card, .sf-account-card > header, .sf-account-order-total, .wc-block-checkout__sidebar, .wc-block-components-order-summary';

async function snapshot(page) {
    return page.locator(target).evaluateAll(nodes => nodes.map(el => {
        const style = getComputedStyle(el), box = el.getBoundingClientRect();
        return {tag: el.tagName, id: el.id, text: el.textContent, value: el.value,
            disabled: el.disabled, form: el.form?.getAttribute('class'),
            name: el.getAttribute('name'), type: el.getAttribute('type'),
            required: el.required, invalid: el.getAttribute('aria-invalid'), describedby: el.getAttribute('aria-describedby'),
            label: el.getAttribute('for'), role: el.getAttribute('role'),
            rect: ['x', 'y', 'width', 'height'].map(key => +box[key].toFixed(3)),
            style: Object.fromEntries(['backgroundColor', 'color', 'borderColor', 'borderWidth', 'borderRadius', 'outlineColor', 'outlineWidth', 'outlineStyle', 'outlineOffset', 'fontSize', 'fontWeight', 'padding', 'margin', 'display', 'gap', 'opacity', 'boxShadow'].map(key => [key, style[key]]))};
    }));
}

(async () => {
    fs.mkdirSync(reportDir, {recursive: true});
    const options = {headless: true};
    if (engine === 'chromium' && process.env.CHROMIUM_BIN) options.executablePath = process.env.CHROMIUM_BIN;
    const browser = await playwright[engine].launch(options);
    const checks = [];
    try {
        for (const width of [320, 390, 700, 1024, 1360]) {
            for (const kind of ['checkout', 'block', 'account', 'account-empty']) {
                const page = await browser.newPage({viewport: {width, height: 1000}});
                const external = [];
                await page.route('**/*', route => { external.push(route.request().url()); return route.abort(); });
                await page.setContent(fixture(kind));
                const input = page.locator('input[type=email]').first();
                assert(await input.evaluate(el => el.validity.typeMismatch && el.required), 'Fixture starts with a genuine native email error');
                assert(await page.evaluate(() => {
                    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
                    return ids.length === new Set(ids).size;
                }), 'Unique IDs keep labels and error references unambiguous');
                await input.fill('deneme@example.test');
                // Actual keyboard traversal rather than programmatic focus alone.
                await page.keyboard.press('Tab');
                assert(!await page.evaluate(() => document.activeElement?.disabled), 'Tab skips disabled controls');
                await page.keyboard.press('Shift+Tab');
                assert(await input.evaluate(el => el === document.activeElement && el.matches(':focus-visible')), 'Keyboard returns to the original input with visible focus');
                await page.evaluate(() => {
                    window.originalNodes = [...document.querySelectorAll('form, input, label, select, button, #order_review, .sf-account-card')];
                    window.originalInput = document.activeElement;
                    window.originalEvents = 0;
                    window.originalInput.addEventListener('change', () => window.originalEvents++);
                });
                const before = await snapshot(page);
                const accessibleBefore = await input.ariaSnapshot();
                const beforeData = await page.locator('form').evaluateAll(forms => forms.map(form => [...new FormData(form)]));
                assert((await input.boundingBox()).height >= 54, 'Current field height is retained: ' + kind);
                const outline = await input.evaluate(el => ({width: getComputedStyle(el).outlineWidth, style: getComputedStyle(el).outlineStyle}));
                assert.equal(outline.width, '2px', 'Existing focus width ' + kind);
                assert.equal(outline.style, 'solid', 'Existing focus style ' + kind);
                if (width === 390 || width === 1360) await page.screenshot({path: path.join(reportDir, `basecoat-pilot-${engine}-${kind}-${width}-native.png`), fullPage: true});
                await page.evaluate(() => window.basecoatPilotMap(document));
                assert.deepEqual(await snapshot(page), before, 'Current appearance and semantic attributes stay identical: ' + kind + '/' + width);
                assert.equal(await input.ariaSnapshot(), accessibleBefore, 'Accessible input name/state remain identical');
                if (width === 390 || width === 1360) await page.screenshot({path: path.join(reportDir, `basecoat-pilot-${engine}-${kind}-${width}-mapped.png`), fullPage: true});
                assert.deepEqual(await page.locator('form').evaluateAll(forms => forms.map(form => [...new FormData(form)])), beforeData, 'Native serialization unchanged');
                assert(await page.evaluate(() => window.originalNodes.every((node, i) => node === document.querySelectorAll('form, input, label, select, button, #order_review, .sf-account-card')[i])), 'Same nodes in original order');
                assert(await input.evaluate(el => el === document.activeElement && el === window.originalInput), 'Focus is not recreated');
                await input.dispatchEvent('change');
                assert.equal(await page.evaluate(() => window.originalEvents), 1, 'Existing handler survives');
                assert.equal(await input.inputValue(), 'deneme@example.test');
                assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), 'No narrow overflow: ' + kind + '/' + width);
                assert(await page.locator('input:disabled').count() > 0);
                assert(beforeData.every(entries => !entries.some(([name]) => ['billing_company', 'account_display_name'].includes(name))), 'Disabled controls are not submitted');
                assert.equal(await page.locator('input[type=email]').first().evaluate(el => el.labels.length), 1, 'Exactly one native accessible label');
                assert(await input.evaluate(el => el.labels[0].control === el && el.labels[0].textContent.trim().length > 0), 'Native label points to this exact control');
                const errorIds = await input.evaluate(el => el.getAttribute('aria-describedby').split(/\s+/));
                for (const id of errorIds) {
                    const error = page.locator('#' + id);
                    assert.equal(await error.getAttribute('role'), 'alert', 'Associated error keeps its announcement role');
                    assert(await error.isVisible(), 'Associated error is visible, not only present in the DOM');
                    assert((await error.textContent()).trim().length > 0, 'Associated error has meaningful text');
                }
                if (kind === 'checkout') {
                    assert.equal(await page.locator('.field > input[type=email]').count(), 0, 'Actual Woo wrapper fails Basecoat auto-input selector');
                    assert.equal(await page.locator('.field > .woocommerce-input-wrapper > input.input[type=email]').count(), 1, 'Explicit input class is needed');
                    assert.equal(await page.locator('#order_review > header, #order_review > section, #order_review > footer').count(), 0, 'Native review has no Basecoat card slots');
                    await page.evaluate(html => {
                        const old = document.querySelector('.woocommerce-checkout-review-order-table');
                        const template = document.createElement('template'); template.innerHTML = html;
                        old.replaceWith(template.content.firstElementChild); // Simulated Woo fragment, not a pilot action.
                    }, reviewTable('1.782,00'));
                    assert(await page.locator('.order-total').textContent().then(text => text.includes('1.782,00')), 'Server fragment text stays authoritative');
                    assert(await input.evaluate(el => el === window.originalInput), 'Fragment does not recreate customer input');
                    assert.equal(await page.locator('#payment').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)', 'One native review surface');
                }
                if (kind === 'block') assert.equal(await page.locator('.wc-block-components-order-summary').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)', 'Block summary remains transparent inside one sidebar surface');
                // Basecoat's wrapper data is another state copy, not validation.
                await input.evaluate(el => {
                    el.setAttribute('aria-invalid', 'false');
                    for (const id of el.getAttribute('aria-describedby').split(/\s+/)) document.getElementById(id).hidden = true;
                    el.removeAttribute('aria-describedby');
                }); // Simulate the native owner's error cleanup, not Basecoat validation.
                assert(await input.evaluate(el => el.closest('.field').hasAttribute('data-invalid')), 'One-time mapping becomes stale after native validity changes');
                await page.evaluate(() => window.basecoatPilotMap(document));
                assert(!await input.evaluate(el => el.closest('.field').hasAttribute('data-invalid')), 'Codela would have to resync the second state');
                const once = await page.content();
                await page.evaluate(() => window.basecoatPilotMap(document));
                assert.equal(await page.content(), once, 'Mapping is idempotent');

                // Harness stops navigation; no pilot form listener is installed.
                const submitted = await input.evaluate(el => {
                    const form = el.form, button = form.querySelector('button[type=submit]');
                    const events = [];
                    const capture = event => { event.preventDefault(); events.push({sameForm: event.target === form, submitter: event.submitter === button}); };
                    form.addEventListener('submit', capture);
                    const value = el.value;
                    el.value = '';
                    const required = el.validity.valueMissing;
                    form.requestSubmit(button);
                    const emptyBlocked = events.length === 0;
                    el.value = 'invalid-email';
                    const email = el.validity.typeMismatch;
                    form.requestSubmit(button);
                    const emailBlocked = events.length === 0;
                    el.value = value;
                    form.requestSubmit(button);
                    form.removeEventListener('submit', capture);
                    return {required, email, emptyBlocked, emailBlocked, events};
                });
                assert.deepEqual(submitted, {required: true, email: true, emptyBlocked: true, emailBlocked: true, events: [{sameForm: true, submitter: true}]}, 'Native required/email validation blocks invalid submissions and retains the original valid submit');
                assert.deepEqual(external, [], 'Fixture makes no network request');
                checks.push(kind + '/' + width);
                await page.close();
            }
        }
        const context = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 1000}});
        for (const kind of ['checkout', 'block', 'account', 'account-empty']) {
            const page = await context.newPage();
            await page.setContent(fixture(kind));
            assert(await page.locator('input[type=email]').isVisible());
            assert(await page.locator('button[type=submit]').first().isVisible());
            assert.equal(await page.locator('.field, .card').count(), 0, 'No enhancement is required without JS');
            await page.close();
        }
        await context.close();
        fs.writeFileSync(path.join(reportDir, `basecoat-pilot-${engine}.json`), JSON.stringify({engine, checks, noScript: 4, interpretation: 'No Basecoat CSS is loaded. This proves node/appearance preservation by inert class mapping, not compatibility of the upstream stylesheet or live Woo checkout.'}, null, 2));
        console.log(`${engine}: ${checks.length} native/mapped parity cases and 4 no-JS cases passed. No library adoption or live payment test.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
