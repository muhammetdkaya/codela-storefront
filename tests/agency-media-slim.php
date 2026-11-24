<?php
define( 'ABSPATH', __DIR__ );
$root = sys_get_temp_dir() . '/codela-media-qa-' . bin2hex( random_bytes( 6 ) );
mkdir( $root );
$scheduled = [];
function get_template_directory() { global $root; return $root; }
function get_template_directory_uri() { return 'https://example.test/theme'; }
function wp_upload_dir( $time = null, $create = false ) { global $root; return [ 'basedir' => $root . '/uploads', 'baseurl' => 'https://example.test/uploads' ]; }
function wp_next_scheduled( $hook ) { global $scheduled; return isset( $scheduled[$hook] ); }
function wp_schedule_single_event( $time, $hook ) { global $scheduled; $scheduled[$hook] = $time; }
function add_action( ...$args ) {}
function add_filter( ...$args ) {}
function check_media( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }
require __DIR__ . '/../theme/codela-storefront/inc/agency-media.php';
try {
    $name = 'agency-light-web.jpg';
    $manifest = codela_sf_agency_media_manifest();
    $entry = $manifest['files'][$name];
    $url = codela_sf_agency_media_url( $name );
    check_media( $url === 'https://raw.githubusercontent.com/muhammetdkaya/codela-storefront/' . $manifest['source_commit'] . '/theme/codela-storefront/assets/media/' . $name, 'Missing media fallback' );
    check_media( count( $scheduled ) === 1, 'Single recovery job' );
    check_media( codela_sf_agency_media_url( '../bad.jpg' ) === '', 'Reject unknown name' );
    check_media( codela_sf_agency_media_legacy_content( '<img src="https://example.test/theme/assets/media/' . $name . '">' ) === '<img src="' . $url . '">', 'Legacy HTML fallback' );
    $location = codela_sf_agency_media_location( $entry );
    mkdir( dirname( $location['path'] ), 0777, true );
    copy( __DIR__ . '/../theme/codela-storefront/assets/media/' . $name, $location['path'] );
    check_media( codela_sf_agency_media_valid( $location['path'], $entry ), 'Local verified file' );
    check_media( codela_sf_agency_media_url( $name ) === $location['url'], 'Prefer local media' );
    unlink( $location['path'] );
    rmdir( dirname( $location['path'] ) );
    rmdir( dirname( dirname( $location['path'] ) ) );
    rmdir( $root . '/uploads' );
    echo "Slim media compatibility checks passed.\n";
} finally { rmdir( $root ); }
