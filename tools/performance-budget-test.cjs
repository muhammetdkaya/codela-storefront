const assert = require('node:assert/strict');
const { evaluateBudget } = require('./performance-budget.cjs');
function sample(page, repeat, { lcp = page === 'home' ? 2200 : 1500, cls = 0, status = 200, errors = [] } = {}) {
  return { profile: 'mobile', page, repeat, cache: 'cold', status, errors,
    lcp: { startTime: lcp }, cls,
    galleryImages: page === 'product' ? [
      { src: 'https://shop.test/hero.jpg' }, { src: 'https://shop.test/second.jpg' },
      { src: 'https://shop.test/third.jpg' },
    ] : [],
    resources: page === 'product' ? [
      { url: 'https://shop.test/hero.jpg', transfer: 50000 },
      { url: 'https://shop.test/second.jpg', transfer: 100000 },
      { url: 'https://shop.test/third.jpg', transfer: 120000 },
    ] : [] };
}
const baseline = { samples: ['home','product'].flatMap(page => [1,2,3].map(i => sample(page,i))) };
const good = evaluateBudget(baseline);
assert.equal(good.pass, true);
assert.equal(good.checks.product.lcpMs, 1500);
assert.equal(good.secondaryGallery.medianTransferredBytes, 220000);
assert.equal(good.secondaryGallery.samples[0].count, 2);
assert.equal(good.secondaryGallery.samples[0].images[0].filename, 'second.jpg');

// A transient outlier must not defeat a median-based LCP budget.
const outlier = structuredClone(baseline);
outlier.samples.find(s => s.page === 'product').lcp.startTime = 8000;
assert.equal(evaluateBudget(outlier).pass, true);

// The 0.1.74-style CLS regression must fail even if LCP improves.
const regression = structuredClone(baseline);
regression.samples.filter(s => s.page === 'product').forEach(s => { s.cls = 0.462; s.lcp.startTime = 1200; });
assert.equal(evaluateBudget(regression).pass, false);
assert(evaluateBudget(regression).failures.some(e => e.includes('CLS')));
const slowHome = structuredClone(baseline);
slowHome.samples.filter(s => s.page === 'home').forEach(s => { s.lcp.startTime = 3000; });
assert.equal(evaluateBudget(slowHome).pass, false);

// Do not pass a truncated audit, failed response or missing LCP.
for (const change of [
  s => { s.samples.pop(); },
  s => { s.samples[0].status = 503; },
  s => { s.samples[0].lcp = null; },
  s => { s.samples[0].errors.push('page error'); },
]) {
  const broken = structuredClone(baseline);
  change(broken);
  assert.equal(evaluateBudget(broken).pass, false);
}
console.log('Performance budget and secondary gallery transfer regression tests passed.');
