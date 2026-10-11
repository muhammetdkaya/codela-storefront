const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const php=process.env.PHP_BIN||'php';
const html=execFileSync(php,['tests/render-ui.php'],{encoding:'utf8'});
assert.equal((html.match(/sf-ui-icon-button/g)||[]).length,4,'Two controls each carry shared base+variant');
assert.match(html,/aria-label="Close &quot;panel&quot;"/,'Accessible name escaped');
assert.match(html,/data-wp-on--click="actions.cart"/,'Existing Interactivity click preserved');
assert.match(html,/aria-expanded="false"/);
assert(!html.includes('onclick='),'Unsafe event attribute rejected');
assert.match(html,/sf-ui-icon-button--clear[^>]*hidden/,'Clear icon begins hidden');
assert.match(html,/class="sf-primary sf-ui-button sf-ui-button--primary"/,'Primary CTA uses common component');
assert.match(html,/<button type="submit" class="ui-submit sf-ui-button sf-ui-button--primary"/,'Submit uses one Button component');
assert.match(html,/sf-ui-button--secondary" disabled/,'Disabled secondary variant is not clickable');
assert.match(html,/sf-ui-button--quiet" aria-busy="true" disabled/,'Loading variant is busy and disabled');
assert.match(html,/<a class="sf-ui-button sf-ui-button--secondary" href="https:\/\/store.test\/read\/"/,'Same component renders a real link');
assert.match(html,/data-icon="arrow-right"[^>]*><\/span><span class="sf-ui-button-label">Read/,'Leading icon is supported');
const output=execFileSync(php,['tests/render-header.php'],{encoding:'utf8'});
assert.equal((output.match(/sf-ui-icon-button--bare/g)||[]).length,3,'Store tools retain bare shared controls');
assert.match(output,/sf-header-menu[\s\S]*?sf-ui-icon-button--soft/,'Header menu shares soft control with close');
assert.equal((output.match(/sf-ui-icon-button--soft/g)||[]).length,3,'Menu and both close controls use soft variant');
assert.equal((output.match(/sf-ui-icon-button--clear/g)||[]).length,1,'Search clear uses common control');
assert.match(output,/<a[^>]*data-panel="cart"[^>]*>[\s\S]*?sf-badge/,'Cart badge preserved');
assert.match(output,/sf-ui-nav-tab/,'Mobile tabs use named UI component');
assert.match(output,/class="sf-primary sf-ui-button sf-ui-button--primary"/,'Checkout CTA uses same primary button');
const cssBase=fs.readFileSync('theme/codela-storefront/assets/storefront.css','utf8');
const cssUI=fs.readFileSync('theme/codela-storefront/assets/styles/components.css','utf8');
const tokens=fs.readFileSync('theme/codela-storefront/assets/styles/tokens.css','utf8');
assert(tokens.includes('--sf-ui-hit:44px'));
assert(cssUI.includes('.sf-ui-icon-button--soft'));
assert(cssUI.includes('.sf-ui-icon-button--soft:is(:active,.is-pressed)'));
const navigation=fs.readFileSync('theme/codela-storefront/assets/styles/navigation.css','utf8');
assert(navigation.includes('.sf-shell .sf-header .sf-brand'));
assert(cssUI.includes('.sf-shell .sf-ui-surface'));
assert(tokens.includes('--sf-ui-glass-surface'));
assert(cssUI.includes('prefers-reduced-transparency:reduce'));
assert(cssUI.includes('.sf-ui-button--primary'));
assert(cssUI.includes('.sf-ui-button--secondary'));
assert(cssUI.includes('.sf-ui-button--quiet'));
const accountCSS=fs.readFileSync('theme/codela-storefront/assets/styles/account.css','utf8');
assert(cssUI.includes('woocommerce-form-register,.woocommerce-ResetPassword) button[type=submit]'),
 'Native Woo login/register/reset buttons share the common Button variant');
assert(accountCSS.includes('var(--sf-ui-control-radius)') && accountCSS.includes('var(--sf-ui-action-height)'),
 'Guest inputs reuse existing UI Kit tokens');
assert(!accountCSS.includes('background:#252525') && !accountCSS.includes('button.woocommerce-button:hover'),
 'No guest-only duplicate button visuals');

assert(cssUI.includes('.sf-ui-spinner'));
assert(cssUI.includes(':focus-visible'));
assert(cssUI.includes('prefers-reduced-motion:reduce'));
assert(!cssBase.includes('.sf-primary{display:flex'),'Legacy primary control removed');
assert(!cssBase.includes('.sf-icon-button{display:inline-flex'),'Legacy icon control removed');
console.log('Codela theme UI Kit PHP output, accessibility, escape, shared primitives: passed.');


const menuSvg=fs.readFileSync('theme/codela-storefront/assets/icons/menu.svg','utf8');
assert(menuSvg.includes('M4 8h16M4 16h16'),'Modern menu has two strokes');
assert.match(output,/sf-menu-trigger[^>]*>[\s\S]*?class="sf-menu-mark"[^>]*><span><\/span><span><\/span>/,'Menu has two animatable strokes');
assert.match(output,/assets\/icons\/search\.svg\?ver=[a-f0-9]{8}/,'Other icon URLs keep cache fingerprints');
