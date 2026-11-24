# Optional agency media rollout — phase 1

This branch introduces a pinned manifest and an explicit, local-first media preparation API.
It does not yet change the distributed ZIP, the import flow, or the theme updater.
Do not release a slim theme until all subsequent gates are implemented and verified.

- 15 legacy JPEG names, 11 unique Git blobs. Copies use immutable content-addressed filenames in uploads.
- Existing matching local files can be copied without internet access; explicit imports can fetch from the pinned source commit. The Git blob hash and exact byte count must match before promotion.
- No front-end download, no modification of user attachments, no automatic deletion.
- Phase 2: audit all PHP/CSS/JS/pattern/editor references, integrate local URL resolution, add explicit import preparation with retry, and guard native WP and FTP deployment routes before replacing existing theme files. Include custom Agency sections and previews, not merely active preset flags.
- Phase 3: slim build only after successful migration and verified fallback/rollback; use SHA-256 content manifests for release transport. Exercise offline upgrade, interrupted transfer, corrupt files, repeated import, mixed commerce/agency pages, multisite, custom images, and cache invalidation.
- The current full package remains the production fallback until these gates pass. No new public version is implied by this branch.

## Core QA separation

General reproducibility checks now use a core-only ZIP, with no release feed metadata. The dedicated Agency QA validates actual media bytes separately. Stable release and FTP packaging deliberately retain legacy assets until migration gates pass; this avoids silently changing the live deployment contract.
