<?php
/** Deterministic rendering regression for the native-keyboard account picker. */
define( 'ABSPATH', __DIR__ );
class WP_User {
    public function __construct(
        public int $ID = 47,
        public string $user_login = 'testuser',
        public string $display_name = 'Test User',
        public string $user_email = 'ayse@example.test',
        public array $roles = [ 'customer' ]
    ) {}
}
function add_filter(...$args) {}
function add_action( ...$args ) {}
function __( $s, $domain = '' ) { return $s; }
function esc_attr_e( $s, $domain = '' ) { echo htmlspecialchars( $s, ENT_QUOTES ); }
function esc_html_e( $s, $domain = '' ) { echo htmlspecialchars( $s, ENT_QUOTES ); }
function esc_attr( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function codela_sf_icon( $s ) { return '<svg class="sf-icon"></svg>'; }
function wc_lostpassword_url() { return 'https://store.test/my-account/lost-password/'; }
function esc_url( $s ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function get_option($key, $default='') { return $key === 'woocommerce_enable_myaccount_registration' ? 'yes' : $default; }
function is_user_logged_in() { return false; }
function is_account_page() { return true; }
function is_ssl() { return true; }
function user_can( $user, $cap ) { return false; }
function wp_get_current_user() { return $GLOBALS['user']; }
function get_user_meta( $id, $key, $single = true ) {
    return [ 'first_name' => 'Ayşe', 'last_name' => 'Yılmaz' ][$key] ?? [];
}
function check( $condition, $reason ) {
    if ( ! $condition ) { throw new RuntimeException( $reason ); }
}
require __DIR__ . '/../theme/codela-storefront/inc/quick-login.php';

ob_start();
codela_sf_quick_guest_markup();
$html = ob_get_clean();
if ( '1' === getenv( 'CODELA_RENDER_ONLY' ) ) {
    echo $html;
    exit;
}
check( str_contains( $html, 'class="sf-quick-account' ), 'Remembered account is a single primary action' );
check( str_contains( $html, 'sf-quick-user' ), 'Account name placeholder exists' );
check( ! str_contains( $html, 'Welcome back' ), 'No redundant welcome heading' );
check( str_contains( $html, 'Welcome' ) && str_contains( $html, 'Continue quickly with your account.' ), 'Welcome heading and succinct copy are visible' );
check( str_contains( $html, 'sf-quick-wave' ), 'Waving-hand emoji follows the heading' );
check( str_contains( $html, 'sf-quick-email' ), 'Saved account email line is present' );
check( str_contains( $html, "codela_sf_icon( 'chevron-left' )" ) === false && str_contains( $html, 'sf-quick-chevron' ), 'Account card has a slim chevron' );
check( str_contains( $html, 'sf-quick-or' ) && str_contains( $html, 'sf-quick-email-login' ), 'Alternative password login remains available beneath or separator' );
check( ! str_contains( $html, 'sf-quick-remove' ) && ! str_contains( $html, 'Remove this account' ), 'Remembered account removal is absent from guest UI' );
check( str_contains( $html, 'sf-quick-google' ) && str_contains( $html, 'disabled aria-label=' ), 'Google entry renders as safely disabled if OAuth is not configured' );
check( ! str_contains( $html, 'data-quick-digit' ), 'No bespoke numeric keypad' );
check( preg_match_all( '/class="sf-quick-slot"/', $html ) === 6, 'Exactly six PIN cells' );
check( str_contains( $html, 'inputmode="numeric"' ), 'Uses native device numeric keyboard' );
check( str_contains( $html, 'autocomplete="off"' ), 'Browser autocomplete never stores PIN' );
check( str_contains( $html, 'role="dialog"' ) && str_contains( $html, 'aria-modal="true"' ), 'Accessible PIN bottom sheet' );
check( str_contains( $html, 'https://store.test/my-account/lost-password/' ), 'Uses native Woo lost-password route' );
check( str_contains( $html, 'sf-quick-sheet-links' ), 'Secondary actions do not crowd account picker' );

$GLOBALS['user'] = new WP_User();
ob_start();
codela_sf_quick_settings();
$settings = ob_get_clean();
check( str_contains( $settings, 'data-display-name="Ayşe Yılmaz"' ), 'Uses actual customer first and last name' );
check( str_contains( $settings, 'data-username="testuser"' ), 'Original Woo username is still retained as fallback' );
check( str_contains( $settings, 'data-email="ayse@example.test"' ), 'Real account email is available for the display-only remembered profile' );
echo "Quick-login remembered-account markup, native input and full-name contracts passed\n";
