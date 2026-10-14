// Read-only performance budget evaluation. Deliberately separate from browser instrumentation.
const BUDGETS = Object.freeze({
  home: { lcpMs: 2800, cls: 0.1 },
  product: { lcpMs: 2500, cls: 0.1 },
});
const median = values => {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
function evaluateBudget(report) {
  const checks = {}, failures = [];
  for (const [page, limits] of Object.entries(BUDGETS)) {
    const samples = (report.samples || []).filter(s =>
      s.profile === 'mobile' && s.page === page && s.cache === 'cold'
    );
    const lcp = samples.map(s => s.lcp?.startTime);
    const cls = samples.map(s => s.cls);
    const invalid = samples.length !== 3 || samples.some(s =>
      s.status !== 200 || (s.errors || []).length ||
      !Number.isFinite(s.lcp?.startTime) || !Number.isFinite(s.cls)
    );
    if (invalid) {
      failures.push(page + ': expected three complete successful cold mobile samples');
      checks[page] = { sampleCount: samples.length, valid: false };
      continue;
    }
    const lcpMs = median(lcp), layoutShift = median(cls);
    const pass = lcpMs <= limits.lcpMs && layoutShift <= limits.cls;
    checks[page] = { sampleCount: samples.length, valid: true, lcpMs, cls: layoutShift, limits, pass };
    if (lcpMs > limits.lcpMs) failures.push(page + ': cold mobile median LCP ' + lcpMs + 'ms > ' + limits.lcpMs + 'ms');
    if (layoutShift > limits.cls) failures.push(page + ': cold mobile median CLS ' + layoutShift + ' > ' + limits.cls);
  }
  const productSamples = (report.samples || []).filter(s =>
    s.profile === 'mobile' && s.page === 'product' && s.cache === 'cold'
  );
  const gallery = productSamples.map(sample => {
    const secondary = (sample.galleryImages || []).slice(1);
    const unique = [...new Set(secondary.map(img => img.src).filter(Boolean))];
    // Resource Timing only counts transferred bytes available to this browser context.
    // This is not a claim about original media size or a WebP saving estimate.
    const transfers = unique.map(src => (sample.resources || []).find(r => r.url === src)?.transfer || 0);
    return { count: unique.length, transferredBytes: transfers.reduce((a, b) => a + b, 0),
      images: unique.map((src, i) => ({ filename: src.split('/').pop()?.split('?')[0], transferBytes: transfers[i] })) };
  });
  return { pass: failures.length === 0, checks, failures,
    secondaryGallery: { samples: gallery, medianTransferredBytes: gallery.length ? median(gallery.map(x => x.transferredBytes)) : null },
    note: 'Lab medians (3 cold mobile Chromium samples); post-deploy signal, not field CWV or pre-deploy gate.' };
}
module.exports = { evaluateBudget };
