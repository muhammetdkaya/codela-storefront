<?php
/** The saved visual preference is shared by every site experience. */
define( 'ABSPATH', '/test/' );
require __DIR__ . '/../theme/codela-storefront/inc/presentation.php';
function expect_presentation( bool $yes, string $message ): void {
    if ( ! $yes ) { throw new RuntimeException( $message ); }
}
$shared = [ 'site_experience' => 'agency', 'menu_design' => 'editorial', 'account_design' => 'standard' ];
expect_presentation( codela_sf_presentation( 'menu', $shared ) === 'editorial', 'Shared menu active in Agency' );
expect_presentation( codela_sf_presentation( 'account', $shared ) === 'standard', 'Shared account active in Agency' );
$shared['site_experience'] = 'commerce';
expect_presentation( codela_sf_presentation( 'menu', $shared ) === 'editorial', 'Switching to Commerce preserves the shared menu' );
expect_presentation( codela_sf_presentation( 'account', $shared ) === 'standard', 'Switching to Commerce preserves the shared account' );
$shared['menu_design'] = 'standard';
$shared['account_design'] = 'editorial';
expect_presentation( codela_sf_presentation( 'menu', $shared ) === 'standard', 'Shared menu switches independently' );
expect_presentation( codela_sf_presentation( 'account', $shared ) === 'editorial', 'Shared account switches independently' );
expect_presentation( codela_sf_presentation( 'unknown', $shared ) === 'standard', 'Unknown appearance cannot change' );
$legacy = [ 'site_experience' => 'agency', 'agency_menu_design' => 'editorial', 'agency_account_design' => 'standard' ];
expect_presentation( codela_sf_presentation( 'menu', $legacy ) === 'editorial', 'Legacy Agency remains supported until migrated' );
$legacy['site_experience'] = 'commerce';
$legacy['commerce_menu_design'] = 'standard';
expect_presentation( codela_sf_presentation( 'menu', $legacy ) === 'standard', 'Legacy Commerce remains supported until migrated' );
echo "Shared presentation resolver and legacy fallback: passed\n";
