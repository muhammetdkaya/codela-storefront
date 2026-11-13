# Modern Web Guidance in Codela

Official project-local agent skill: `.agents/skills/modern-web-guidance/SKILL.md`

Source: https://github.com/GoogleChrome/modern-web-guidance (Apache-2.0 project license; preserve the original skill content). The guidance belongs to the *development environment*, not to the production WordPress package, theme ZIP or storefront visitors.

## Using the skill

- For HTML, CSS, animation, accessibility, passkeys, forms and browser-side JavaScript tasks, compatible coding agents should load the project-local skill and use the official CLI `search` then `retrieve` for the relevant use case before selecting an implementation. Do not claim a guide was retrieved when the tool was unavailable.
- Example: `DISABLE_TELEMETRY=1 npx -y modern-web-guidance@latest search "smooth modal animations"`; then `DISABLE_TELEMETRY=1 npx -y modern-web-guidance@latest retrieve "<guide-id>"`.
- For a broad legacy modernization audit only, use the separate read-only GitHub Actions workflow **Modern Web Guidance — Audit**.
- This skill doesn't replace PHP / WordPress / WooCommerce validation, page-specific browser tests, real iPhone Safari checks or existing release/deploy controls.

## Run an audit from a phone

1. Open this GitHub repository -> **Actions** -> **Modern Web Guidance — Audit**.
2. Choose **Run workflow**, branch `main`, then open the resulting workflow run.
3. Inspect the **Step summary** and download the `modern-web-guidance-report` artifact for the complete scanner output.
4. Evaluate each finding manually. An outdated-pattern match is not automatically an error; preserve valid fallback code, existing WooCommerce functionality and required browser support.

The audit downloads the public npm CLI in GitHub's runner with telemetry disabled, scans only the primary source directory, and uploads a diagnostic report. It never commits changes, deploys to WordPress, publishes ZIPs, modifies versions or uses production secrets.

The workflow runs on manual dispatch and once when its own workflow YAML is added or modified. It does **not** run on every source push or on a schedule, to conserve GitHub Actions minutes.

## Browser policy

Prioritize supported Safari (including iPhone), Chrome, Firefox and Edge. Use Baseline broadly available APIs directly. For newer capabilities, verify compatibility and supply a small feature-detected fallback or progressive enhancement; avoid adding heavy dependencies, untested Safari-only assumptions or runtime layout work without evidence. Keep critical shopping, payment, login and account interactions functional without experimental APIs.

## Repository scope

Audit path: `theme/codela-storefront/`.

The canonical theme source is `theme/codela-storefront/`; leave generated styles/JS consistent with their sources and do not trigger release feeds or FTP deployment for audit-only work.
