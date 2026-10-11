const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const php=fs.readFileSync('theme/codela-storefront/inc/google-auth.php','utf8');
const result=JSON.parse(execFileSync(process.env.PHP_BIN||'php',['tests/google-auth.php'],{encoding:'utf8'}));

assert.equal(result.enabled,true,'Complete HTTPS credentials enable Google login');
assert.equal(result.callback,'https://store.test/wp-admin/admin-post.php?action=codela_sf_google_callback');
assert.equal(result.button,true,'Configured Google link uses the common secondary Button');
assert.equal(result.configured_has_no_notice,true,'Configured Google link bypasses the setup tip');
assert.equal(result.reject_unverified,'invalid_google_identity');
assert.equal(result.reject_missing_sub,'invalid_google_identity');
assert.equal(result.new,'customer','New verified Google identity becomes Woo customer');
assert.equal(result.created_count,1,'Only one WP customer is created');
assert.equal(result.new_linked,'google-new-1','Store immutable Google subject');
assert.equal(result.reuse_sub,true,'Google subject reuses exact customer');
assert.equal(result.reject_conflicting_sub,'manual_account_link_required','Do not attach a different identity to one email');
assert.equal(result.reject_external_auto_link,'manual_account_link_required','External verified mail cannot silently take over a local account');
assert.equal(result.allow_hosted_authority,'customer','Google-hosted domain is authoritative for its email');
assert.equal(result.link_existing_gmail,'customer','Verified Gmail can reuse a nonprivileged customer account');
assert.equal(result.reject_admin,'privileged_account','Never allow Google to log in as store admin');
assert.equal(result.disabled,true,'No secret disables feature');
assert(result.disabled_button.includes('sf-ui-button--secondary') &&
    result.disabled_button.includes('popovertarget="sf-google-setup-notice"') &&
    result.disabled_button.includes('Google sign-in is not configured yet.'),
    'Unconfigured Google remains visible as a real shared Button with native notice');
assert(!result.disabled_button.includes('codela_sf_google_start'), 'Disabled Google Button never initiates OAuth');
assert(php.includes("random_bytes( 32 )")&&php.includes("code_challenge_method' => 'S256'"),'Cryptographic state and PKCE S256');
assert(php.includes("'httponly' => true")&&php.includes("'samesite' => 'Lax'")&&php.includes("'secure' => true"),'Cookie scoped to HTTPS+HttpOnly+SameSite');
assert(php.includes('hash_equals( $state, $cookie )'),'Callback state bound to initiating browser');
assert(php.includes('delete_transient( $key );'),'State is consumed before token exchange');
assert(php.includes("'https://oauth2.googleapis.com/token'")&&php.includes("'https://openidconnect.googleapis.com/v1/userinfo'"),'Only official fixed Google OAuth APIs');
assert(php.includes("'redirection' => 0"),'No redirects to arbitrary provider endpoints');
assert(php.includes('wp_set_auth_cookie( $user->ID, true, is_ssl() )'),'Only validated customers get WordPress login cookies');
assert(php.includes("get_user_meta( $user->ID, '_sf_google_sub'"),'Identity mapping is by immutable sub');
assert(!php.includes("'access_type' => 'offline'"),'No long-lived refresh tokens for sign-in');
assert(php.includes("current_user_can( 'manage_options' )")&&php.includes("check_admin_referer( 'codela_sf_google_save' )"),'Credential editor is capability and nonce restricted');

console.log('Native Google OAuth: PKCE/state/cookie, verified customer identity, admin isolation, unconfigured notice: passed.');
