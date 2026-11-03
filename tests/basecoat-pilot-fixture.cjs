/* Research fixture, not a production adapter. See docs/basecoat-pilot-2026-11-03.md.
 * The mapped variant keeps Codela CSS and existing native nodes. It deliberately
 * does NOT load Basecoat CSS, Tailwind, a reset, a form controller or a validator.
 */
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const theme = path.join(root, 'theme/codela-storefront');

function mapCandidate(root) {
    // Minimal Basecoat class/state mapping, with no moves, clones or listeners.
    root.querySelectorAll('fieldset').forEach(node => node.classList.add('fieldset'));
    root.querySelectorAll('.form-row, .wc-block-components-text-input').forEach(row => {
        const input = row.querySelector('input:not([type="hidden"]), select, textarea');
        if (!input || input.type === 'checkbox' || input.type === 'radio') return;
        row.classList.add('field');
        // Woo's input wrapper prevents Basecoat's .field > input selector.
        input.classList.add(input.tagName === 'SELECT' ? 'select' : input.tagName === 'TEXTAREA' ? 'textarea' : 'input');
        // This duplicated state needs an explicit resync after native changes.
        row.toggleAttribute('data-invalid', input.getAttribute('aria-invalid') === 'true');
        if (input.disabled) row.setAttribute('data-disabled', 'true');
        else row.removeAttribute('data-disabled');
    });
    root.querySelectorAll('#order_review, .wc-block-checkout__sidebar, .sf-account-card').forEach(node => node.classList.add('card'));
}

const classicFields = `<div id="customer_details"><div class="col-1"><div class="woocommerce-billing-fields">
<h3 id="billing-heading">Fatura bilgileri</h3>
<div class="woocommerce-billing-fields__field-wrapper" role="group" aria-labelledby="billing-heading">
<p class="form-row form-row-wide validate-required" id="billing_first_name_field"><label for="billing_first_name">Ad <abbr class="required" title="gerekli">*</abbr></label><span class="woocommerce-input-wrapper"><input class="input-text" type="text" name="billing_first_name" id="billing_first_name" autocomplete="given-name" value="Deneme" required aria-required="true"></span></p>
<p class="form-row form-row-wide validate-required woocommerce-invalid" id="billing_email_field"><label for="billing_email">E-posta <abbr class="required" title="gerekli">*</abbr></label><span class="woocommerce-input-wrapper"><input class="input-text" type="email" name="billing_email" id="billing_email" autocomplete="email" value="hatalı" required aria-required="true" aria-invalid="true" aria-describedby="billing_email_error"><span id="billing_email_error" role="alert">Geçerli bir e-posta adresi girin.</span></span></p>
<p class="form-row form-row-wide" id="billing_company_field"><label for="billing_company">Şirket (bu örnekte devre dışı)</label><span class="woocommerce-input-wrapper"><input class="input-text" type="text" name="billing_company" id="billing_company" value="Gönderilmez" disabled></span></p>
<p class="form-row form-row-wide" id="billing_country_field"><label for="billing_country">Ülke</label><span class="woocommerce-input-wrapper"><select name="billing_country" id="billing_country" autocomplete="country"><option value="TR">Türkiye</option></select></span></p>
</div></div></div></div>`;

const reviewTable = (total = '1.980,00') => `<table class="shop_table woocommerce-checkout-review-order-table"><thead><tr><th class="product-name">Ürün</th><th class="product-total">Ara toplam</th></tr></thead><tbody><tr class="cart_item"><td class="product-name">Uzun adlı örnek seramik ürün <strong class="product-quantity">× 2</strong></td><td class="product-total"><span class="woocommerce-Price-amount amount"><bdi>${total}&nbsp;<span class="woocommerce-Price-currencySymbol">₺</span></bdi></span></td></tr></tbody><tfoot><tr class="order-total"><th>Toplam</th><td><strong><span class="woocommerce-Price-amount amount"><bdi>${total}&nbsp;<span class="woocommerce-Price-currencySymbol">₺</span></bdi></span></strong></td></tr></tfoot></table>`;

function checkout() {
    return `<main class="sf-content sf-checkout-page" id="sf-content"><div class="wp-block-post-content"><div class="woocommerce">
<form class="checkout_coupon woocommerce-form-coupon" method="post"><p>Kuponunuz varsa aşağıya girin.</p><p class="form-row form-row-first"><label for="coupon_code">Kupon kodu</label><input class="input-text" name="coupon_code" id="coupon_code" value="örnek" aria-invalid="true" aria-describedby="coupon-error"><span class="coupon-error-notice" id="coupon-error" role="alert">Bu kupon kullanılamıyor.</span></p><p class="form-row form-row-last"><button class="button" name="apply_coupon" type="submit">Kuponu uygula</button></p></form>
<form name="checkout" method="post" class="checkout woocommerce-checkout" action="/checkout/" enctype="multipart/form-data">
${classicFields}<h3 id="order_review_heading">Sipariş özeti</h3><div id="order_review" class="woocommerce-checkout-review-order">
${reviewTable()}<div id="payment" class="woocommerce-checkout-payment"><ul class="wc_payment_methods payment_methods methods"><li class="wc_payment_method payment_method_fixture"><input id="payment_method_fixture" type="radio" class="input-radio" name="payment_method" value="fixture" checked><label for="payment_method_fixture">Test ödeme yöntemi</label><div class="payment_box payment_method_fixture"><p>Bu yalnızca görünüm fixture’ıdır. Gerçek ödeme yoktur.</p></div></li></ul><div class="form-row place-order"><input type="hidden" name="woocommerce-process-checkout-nonce" value="fixture-not-a-real-nonce"><button type="submit" class="button alt" name="woocommerce_checkout_place_order" id="place_order" value="Sipariş ver">Sipariş ver</button></div></div></div></form></div></div></main>`;
}

function blockCheckout() {
    return `<main class="sf-content sf-checkout-page" id="sf-content"><div class="wp-block-post-content"><div class="wp-block-woocommerce-checkout"><form class="wc-block-checkout" method="post" action="/checkout/">
<div class="wc-block-checkout__main"><h2 class="wc-block-components-checkout-step__heading-title">Bilgiler</h2><div class="wc-block-components-form">
<div class="wc-block-components-text-input is-active has-error"><label for="block_email">E-posta</label><input id="block_email" name="billing_email" type="email" required aria-invalid="true" aria-describedby="block-email-error" value="hatalı"><div id="block-email-error" class="wc-block-components-validation-error" role="alert"><p>Geçerli bir e-posta adresi girin.</p></div></div>
<div class="wc-block-components-text-input"><label for="block_company">Şirket</label><input id="block_company" name="billing_company" type="text" disabled value="Gönderilmez"></div></div>
<div class="wc-block-checkout__actions_row"><button type="submit" class="wc-block-components-button wc-block-components-checkout-place-order-button">Sipariş ver</button></div></div>
<aside class="wc-block-checkout__sidebar"><div class="wc-block-components-order-summary"><h2>Sipariş özeti</h2><p>Örnek seramik ürün × 2</p><div class="wc-block-components-totals-footer-item"><span>Toplam</span> <strong class="wc-block-components-totals-item__value">1.980,00 ₺</strong></div></div></aside></form></div></div></main>`;
}

function account(empty = false) {
    // Exercise the actual Codela template and UI renderer, not a copied card.
    const rendered = execFileSync(process.env.PHP_BIN || 'php', ['tests/render-account-dashboard.php'], {
        cwd: root, encoding: 'utf8', env: {...process.env, ACCOUNT_EMPTY: empty ? '1' : '', ACCOUNT_CANCELLED: '', ACCOUNT_ORDERS_EMPTY: ''},
    });
    const fields = `<form class="woocommerce-EditAccountForm edit-account" action="/account/edit-account/" method="post"><fieldset><legend>Hesap bilgileri</legend>
<p class="woocommerce-form-row form-row form-row-wide"><label for="account_email">E-posta</label><input class="woocommerce-Input input-text" id="account_email" name="account_email" type="email" autocomplete="email" required aria-required="true" aria-invalid="true" aria-describedby="account-email-error" value="hatalı"><span id="account-email-error" role="alert">Geçerli bir e-posta adresi girin.</span></p>
<p class="woocommerce-form-row form-row"><label for="account_display_name">Görünen ad</label><input class="woocommerce-Input input-text" id="account_display_name" name="account_display_name" type="text" value="Gönderilmez" disabled></p></fieldset>
<input type="hidden" name="save-account-details-nonce" value="fixture-not-a-real-nonce"><input type="hidden" name="action" value="save_account_details"><button type="submit" class="woocommerce-Button button" name="save_account_details" value="Değişiklikleri kaydet">Değişiklikleri kaydet</button></form>`;
    return `<main class="sf-content" id="sf-content"><div class="wp-block-post-content">${rendered.replace('<div class="woocommerce-MyAccount-content">', '<div class="woocommerce-MyAccount-content">' + fields)}</div></main>`;
}

function fixture(kind = 'checkout', mapped = false) {
    if (!['checkout', 'block', 'account', 'account-empty'].includes(kind)) throw new Error('Unknown fixture: ' + kind);
    const cssFiles = ['assets/styles/tokens.css', 'assets/storefront.css', 'assets/styles/components.css',
        kind.startsWith('account') ? 'assets/styles/account.css' : 'assets/styles/checkout.css'];
    const css = cssFiles.map(file => fs.readFileSync(path.join(theme, file), 'utf8')).join('\n');
    // Only the fixture's missing WordPress/Woo base layout is supplied here.
    // These are NOT proposed Codela paint/state overrides or Basecoat CSS.
    const hostCSS = 'body{font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6}a{color:inherit}.woocommerce form .form-row{padding:3px;margin:0 0 6px}.woocommerce form .form-row label{display:block}.woocommerce form .form-row input.input-text,.woocommerce form .form-row select{width:100%;margin:0;line-height:normal}.wc-block-checkout{display:flex;flex-wrap:wrap;gap:24px}.wc-block-checkout__main{flex:1 1 320px;min-width:0}.wc-block-checkout__sidebar{flex:1 1 280px;min-width:0}.wc-block-components-text-input{margin-bottom:16px}.wc-block-components-text-input label{display:block}.wc-block-components-text-input input{width:100%}';
    const content = kind === 'checkout' ? checkout() : kind === 'block' ? blockCheckout() : account(kind === 'account-empty');
    const bodyClass = kind.startsWith('account') ? 'woocommerce-account logged-in sf-account-dashboard' : 'woocommerce-checkout';
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Basecoat pilot: ${kind} / ${mapped ? 'mapped' : 'native'}</title><style data-pilot-host>${hostCSS}</style><style data-codela-source>${css}</style></head><body class="${bodyClass}">${content}<script>window.basecoatPilotMap=${mapCandidate.toString()};${mapped ? 'window.basecoatPilotMap(document);' : ''}</script></body></html>`;
}

module.exports = {fixture, mapCandidate, reviewTable};
// Open generated HTML directly to review. No server or checkout is required.
if (require.main === module) process.stdout.write(fixture(process.argv[2] || 'checkout', process.argv.includes('--mapped')));
