# Production readiness — shared Storefront

All current and future profiles inherit the same security and media release checks. Commerce performance uses the existing cold-mobile home/product budget; Agency measures three independent cold mobile loads after deployment, with median LCP <=2500 ms and CLS <=0.1. This is a lab signal, not field Core Web Vitals. No synthetic INP claims.

The checkout uses native WooCommerce order processing. Never introduce client-supplied prices or gateway callbacks that trust browser data. Verify custom gateway signatures, amount/currency binding and idempotency in sandbox per provider.

Credential scanning is high-confidence pattern detection across tracked Git blobs; no secret values in logs. Weekly history scanning covers fetched reachable refs. A positive finding needs private triage and credential rotation, not just deletion.

Host backups are separate from theme deployment rollback. See Codela plugin production readiness operational checklist. Do not use GitHub as storage for customer/order database exports.

No visual redesign or production data mutations are part of this QA release.
