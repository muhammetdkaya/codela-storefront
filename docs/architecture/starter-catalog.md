# Starter catalog architecture (ADR)

Status: accepted for implementation; not a published update feed.

## Decision

One Storefront theme and one Commerce Toolkit integration, independent of the number of starters.
A starter is versioned content, not a theme, executable plugin, or permanent site mode.
Use a single catalog feed (for discovery) and immutable, versioned starter manifests (for installation).
Do not require a GitHub Release for each starter-only update: a verified commit-pinned artifact or an immutable release asset is sufficient. A GitHub Release remains an optional distribution mechanism, not the version model.

## Boundaries

- Theme: common rendering, widgets, CSS/JS, navigation and WooCommerce integration; versioned as now.
- Toolkit: catalog client, installer, migrations, ownership checks, admin UI; versioned as now.
- Starter catalog: stable IDs (agency, commerce, future IDs), title, preview, latest content version, compatible theme/plugin and supported schema versions, immutable manifest locator and SHA-256 digest. A catalog revision is not a starter version.
- Starter manifest: declarative layouts, media, starter-owned content and migration descriptions. Separate media objects by content digest; no remote PHP/JS or arbitrary executable code. New code-dependent features require a compatible theme/toolkit release first.
- Content files live outside the theme source directory in a versioned content directory or content-addressed store. General theme ZIP, tests and FTP code deployment exclude them once migration is verified. Existing Commerce demo media already has a versioned path.

## Lifecycle

Fresh theme: no starter download or installation. Catalog preview is small and independent.
Explicit import: validate catalog, compatibility, pinned manifest and per-file sizes/hashes; stage local content, verify, then create owned records. Retry without duplicates.
Existing starter: record installed version only after successful verification and migration. Legacy unrecorded installs are unknown until audited, not falsely declared current.
Update: show only installed starters with compatible newer versions. Do not automatically activate a starter or replace the site's home/menu. Apply only eligible owned records, preserve custom fields, surface conflicts and retain previous content.
Asset cache: local uploads/content-addressed filenames, deduplicated across aliases, never fetch remote media from public page rendering. Never delete files still referenced by any installed starter or custom page.
Theme upgrade: copy/verify legacy assets outside the theme before any slim update removes them. A failure must prevent destructive replacement. Coordinate native WordPress update, manual ZIP replacement and FTP; maintain a compatibility/full package while these paths are not validated.
FTP: code deployments and starter content deployments are separate, delta based. No unrelated media transfer. Existing live agency site is an explicit migration target, not evidence that all sites are agency.
Preview: isolated and stateless; does not mark a starter installed or mutate content.

## Version contract

Independent semantic versions for each starter, theme and toolkit. Initial tracked Agency and existing Commerce are both 1.0.0, with old untracked Agency installs explicitly unknown. A change to one starter does not increment another. Stable ownership IDs and migration versions are independent from content release versions. Never bump the Commerce demo's historical ownership marker without its compatibility migration.

## Required acceptance before stable slim release

1. A fresh commerce-only site installs the slim theme with no agency files in uploads or theme.
2. A fresh agency install stages and verifies the optional assets; frontend works offline afterward.
3. An existing agency site upgrades without lost media; failed migration leaves the previous install intact.
4. Mixed layouts, custom images, manually edited pages, repeat import, partial downloads and rollback are covered.
5. Theme test/FTP jobs handle no starter payload; dedicated content checks run on content changes and publish only the affected starter.
6. The update UI distinguishes core/plugin/starter versions and preserves user edits. Unknown or incompatible manifests cannot be applied.
7. Check release ZIP actual size, SHA-256, and native updater/FTP end-to-end before stable promotion.

The current development branch deliberately retains the full production package until the above migration gates pass. It is not safe to declare a slim release complete yet.
