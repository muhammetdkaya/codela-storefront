# Codela Storefront

Independent WooCommerce storefront theme. Canonical source: `theme/codela-storefront/`.
Migrated unchanged at version 0.1.1 from [codela@c4be5baf419b3385a20df4ba898b03d39e6cc361](https://github.com/muhammetdkaya/codela/tree/c4be5baf419b3385a20df4ba898b03d39e6cc361/codela-commerce-toolkit/theme-package/codela-storefront).

The theme requires the Codela plugin. Settings stay under Codela > Ayarlar > Tema, with separate Header/Footer sections as those settings are implemented. Plugin bridge changes belong in the codela repository; ordinary theme edits belong here.

## Deployment and updates

The canonical theme source is `theme/codela-storefront/`. Source deployment to `codela.dev` and **WordPress updates distributed to customer sites** are separate operations.

### GitHub release and WordPress update channel (current)

- **Release metadata:** [`stable/manifest.json`](https://raw.githubusercontent.com/muhammetdkaya/codela-storefront/stable/manifest.json) in this GitHub repository.
- **Theme ZIP:** versioned assets attached to [GitHub Releases](https://github.com/muhammetdkaya/codela-storefront/releases), e.g. `https://github.com/muhammetdkaya/codela-storefront/releases/download/v0.1.201/codela-storefront-0.1.201.zip`.
- **Consumer:** the Codela Commerce Toolkit plugin's [`includes/theme-updates.php`](https://github.com/muhammetdkaya/codela/blob/main/codela-commerce-toolkit/includes/theme-updates.php), not a manifest hosted on `codela.dev`.
- **WordPress registration:** the installed theme's `Update URI: https://codela.dev/codela-storefront` selects the `update_themes_codela.dev` filter. This is a provider identifier; **it is not the URL from which the manifest is downloaded**.
- **Requirements and verification:** the plugin validates the manifest's theme identity, semantic version, package URL, requirements, and SHA-256, and verifies the ZIP contents before installation. It does **not** fall back to the old 0.1.1 bootstrap ZIP if metadata cannot be retrieved.

The plugin caches a successful manifest fetch in the site transient `codela_storefront_release` for **12 hours** (failed/invalid response: **15 minutes**). From the WordPress admin, use **Codela → Tema → Şimdi kontrol et**: this specific action deletes the cached transient, clears the theme cache, and calls `wp_update_themes()`. The generic WordPress Updates screen does not necessarily invalidate this plugin-specific cache. If a newly published version is still not offered, confirm the installed theme's version, plugin activation/requirements, and the GitHub URL's accessibility from WordPress before assuming the release is missing.

The explicit release request is `.releases/storefront.json`; the `Publish Storefront GitHub release` workflow builds the immutable-version package from its `source_sha`. Publishing a release and advancing the WordPress update feed are **separate**: `publish_feed: true` advances `stable/manifest.json`, while `publish_feed: false` publishes only the downloadable GitHub release. **As verified on 4 November 2026, the stable feed advertises 0.1.201.** Advancing the feed does not itself install the update on a site or upload the theme by FTP.

### FTP deployment (separate from the GitHub update feed)

Theme/scripts/tests changes on `main` trigger `Deploy Codela Storefront` validation and normally FTP deployment to `codela.dev`. The `deploy` job is skipped on pull requests, and for a main-branch merge whose commit message includes the explicit `[github-only]` marker. The workflow can also be manually dispatched on `main`. This is **not** the WordPress theme update channel.

The FTP workflow uses repository Actions secrets `FTP_PASSWORD` and `FTP_USERNAME` for the theme account on `server38.shared.spaceship.host` (FTPS, port 21). A pre-existing `FTP_SERVER` secret is not used. The account must reach `wp-content/themes` or `codela-storefront`. Never paste credentials into commits, issues, or chats.

Deployment validates the theme destination, stages/uploads only the intended theme, checks readback and site health, and provides rollback artifacts. It does not activate the theme, deploy the Codela plugin, or confirm installation on a separate customer site such as `azseramik.com`. Documentation-only commits do not match the FTP workflow's tracked paths.

## Checks

`python3 tests/package.py` covers deterministic ZIP, identity, missing-secret no-connect, safe deployment, wrong mapping, and health failure rollback.
CI also lints PHP and checks JavaScript syntax. Real device visuals and production payment tests remain separate.

### Fast codela.dev iteration (November 2026)

Main-branch pushes changing at most five presentation-only CSS/SVG or noncritical theme-part HTML files use quick asset, PHP syntax, SVG, and deterministic package checks; changes to theme logic, checkout, account/auth, tests or deployment workflows retain full browser validation. Manual dispatch always requests the full suite. The FTPS deployment now writes a scoped, checksum-verified theme manifest after a successful health check and transfers only changed/new files on later deployments; previously listed removed files are retired with rollback copies. An absent manifest causes one initial full synchronization. The marker also changes the theme's CSS cache key *on codela.dev* without advancing the WordPress update feed; other sites still receive changes only via the separate versioned release process. Heavy live audits are manually dispatchable or run when their own test scripts change, rather than starting automatically after every deploy.
