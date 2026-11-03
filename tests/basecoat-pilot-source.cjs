const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {fixture, mapCandidate} = require('./basecoat-pilot-fixture.cjs');
const upstream = require('./basecoat-pilot-upstream.json');
const root = path.resolve(__dirname, '..');

assert.equal(upstream.version, '1.1.0');
assert.equal(upstream.commit, '6769c83c9644ec4195ed30af028a9e66fe670215');
for (const [name, file] of Object.entries(upstream.files)) {
    if (!file.content) continue; // Vega is explicitly labelled excerpts only.
    const bytes = Buffer.from(file.content);
    const hash = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(hash, file.blob, 'Unchanged upstream bytes: ' + name);
}
const source = name => upstream.files['src/css/components/' + name + '.css'].content;
assert(source('field').includes('@apply flex w-full flex-col'));
assert(source('input').includes(".field > input[type='email']"));
assert(source('input').includes(".input[type='email']"));
assert(source('input').includes('outline-none'));
assert(source('card').includes('> header'));
assert(source('card').includes('> footer'));
const style = upstream.files['src/css/styles/vega.css'].excerpts;
assert(style.input.includes('h-9 rounded-md'));
assert(style.card.includes('gap-6 py-6'));
assert(style.field.includes('data-[invalid=true]'));
assert(upstream.files['LICENSE.md'].content.includes('Copyright (c) 2025 Ronan Berder'));

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert(!Object.keys({...pkg.dependencies, ...pkg.devDependencies}).some(name => /basecoat|tailwind/.test(name)), 'Pilot does not add dependencies');
const body = mapCandidate.toString();
assert(!/innerHTML|outerHTML|cloneNode|replaceWith|appendChild|addEventListener|fetch\(/.test(body), 'Comparison mapping does not own nodes, events or commerce');

for (const kind of ['checkout', 'block', 'account', 'account-empty']) {
    const native = fixture(kind);
    const mapped = fixture(kind, true);
    assert(native.includes('data-codela-source'));
    assert(!/<link|<script[^>]+src=|@import\s/.test(native), 'No CDN/runtime/reset for ' + kind);
    assert.equal(mapped.replace(' / mapped</title>', ' / native</title>').replace('window.basecoatPilotMap(document);', ''), native, 'Only explicit mapping activation differs for ' + kind);
    assert(native.includes('disabled') && native.includes('role="alert"') && native.includes('aria-describedby='));
    assert(native.includes('type="submit"'));
    if (kind === 'checkout') {
        assert(native.includes('class="woocommerce-input-wrapper"'));
        assert(native.includes('name="woocommerce-process-checkout-nonce"'));
        assert(native.includes('name="payment_method"'));
        assert.equal((native.match(/<form\b/g) || []).length, 2, 'Coupon stays separate from checkout');
    }
    if (kind.startsWith('account')) {
        assert(native.includes('hook:woocommerce_account_dashboard'));
        assert(native.includes('save-account-details-nonce'));
        assert.equal(native.includes('href="/account/view-order/1048/"'), kind === 'account');
        assert.equal(native.includes('You have no orders yet.'), kind === 'account-empty');
    }
}
console.log('Basecoat pilot source checks passed: pinned source bytes/license, unchanged dependency boundary, four deterministic current-Codela fixtures, native forms and account template hooks. Browser visual/interaction checks remain separate.');
