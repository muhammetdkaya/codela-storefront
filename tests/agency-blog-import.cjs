const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('theme/codela-storefront/assets/scripts/agency-blog-import.js', 'utf8');
function fixture(fetch) {
  const button = { addEventListener(type, callback) { this.click = callback; } };
  const status = {};
  const progress = { hidden: true, value: 0 };
  const review = { hidden: true, focus() { this.focused = true; } };
  const elements = { '[data-import-button]': button, '[data-import-status]': status,
    '[data-import-progress]': progress, '[data-import-review]': review };
  const panel = { dataset: { url: '/wp-admin/admin-ajax.php', nonce: 'test-nonce' },
    querySelector: (selector) => elements[selector], setAttribute() {}, removeAttribute() {} };
  const listeners = new Set();
  vm.runInNewContext(source, { document: { getElementById: () => panel }, fetch, URLSearchParams,
    window: { addEventListener(type) { listeners.add(type); }, removeEventListener(type) { listeners.delete(type); } } });
  return { button, status, progress, review, listeners };
}
const success = (count) => ({ ok: true, json: async () => ({ success: true, data: { count, total: 10, done: count === 10 } }) });
(async () => {
  let count = 0, release;
  const first = new Promise((resolve) => { release = resolve; });
  const ui = fixture(async (url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.body.get('nonce'), 'test-nonce');
    if (++count === 1) await first;
    return success(count);
  });
  const running = ui.button.click();
  await ui.button.click();
  assert.equal(count, 1, 'Double click must not start a second request loop');
  assert.equal(ui.button.disabled, true);
  assert.equal(ui.listeners.has('beforeunload'), true);
  release(); await running;
  assert.equal(count, 10);
  assert.equal(ui.progress.value, 10);
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.review.hidden, false);
  assert.equal(ui.review.focused, true);
  assert.equal(ui.listeners.size, 0);

  let attempt = 0;
  const retry = fixture(async () => {
    attempt++;
    if (attempt === 1) return success(3);
    if (attempt === 2) return { ok: false, json: async () => ({ success: false, data: { message: 'Upload interrupted' } }) };
    return success(10);
  });
  await retry.button.click();
  assert.equal(retry.status.textContent, 'Upload interrupted');
  assert.equal(retry.button.disabled, false);
  assert.equal(retry.listeners.size, 0);
  await retry.button.click();
  assert.equal(retry.progress.value, 10, 'Resumption follows server progress instead of a local cursor');

  const malformed = fixture(async () => ({ ok: true, json: async () => ({ success: true, data: { count: 11, total: 10, done: true } }) }));
  await malformed.button.click();
  assert.equal(malformed.review.hidden, true);
  assert.equal(malformed.button.disabled, false);
  console.log('Blog import UI: single click, progress, interruption, resume and invalid responses passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
