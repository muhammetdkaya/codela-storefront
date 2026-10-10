# Codela Storefront

Independent WooCommerce storefront theme. Canonical source: `theme/codela-storefront/`.
Migrated unchanged at version 0.1.1 from [codela@c4be5baf419b3385a20df4ba898b03d39e6cc361](https://github.com/muhammetdkaya/codela/tree/c4be5baf419b3385a20df4ba898b03d39e6cc361/codela-commerce-toolkit/theme-package/codela-storefront).

The theme requires the Codela plugin. Settings stay under Codela > Ayarlar > Tema, with separate Header/Footer sections as those settings are implemented. Plugin bridge changes belong in the codela repository; ordinary theme edits belong here.

## Deployment

Push theme/scripts/tests changes to main to validate, build a standalone ZIP and deploy only codela-storefront to codela.dev. Plugin releases and codela-site marketing theme deployments are independent.

Add repository Actions secrets `FTP_PASSWORD` and `FTP_USERNAME` for the **theme FTP account**. The deployment uses server38.shared.spaceship.host, the same verified endpoint as codela-site's successful workflow. An existing FTP_SERVER secret can stay, but is not read. Explicit verified FTPS, port 21. Account must expose wp-content/themes, or codela-storefront itself.

After setting the secret, use Actions > Deploy Codela Storefront > Run workflow on main. Older runs may be skipped after documentation commits move main. Never paste passwords into issues or chats.

Deployment checks theme identity and a random public mapping probe before writing source, stages and reads back all files, publishes style/version and update manifest last, checks public source and store health, and restores changed files on failure. Existing custom files are preserved. Backup artifacts contain original theme files, not credentials. No theme activation occurs.

Public distribution: `https://codela.dev/wp-content/themes/codela-storefront/support/packages/manifest.json` and its versioned ZIP. The plugin loads this fixed manifest with a short cache, validates package URL and SHA-256, and uses the local frozen 0.1.1 bootstrap copy only if remote metadata is unavailable. Future versions must be incremented in style.css (asset versions derive from it). codela.dev gets edits directly through this workflow; other installations use Codela's Update action.

## Checks

`python3 tests/package.py` covers deterministic ZIP, identity, missing-secret no-connect, safe deployment, wrong mapping, and health failure rollback.
CI also lints PHP and checks JavaScript syntax. Real device visuals and production payment tests remain separate.
