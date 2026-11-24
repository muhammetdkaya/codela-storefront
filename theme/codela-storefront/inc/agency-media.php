<?php
/**
 * Optional Agency stock media: explicit preparation, immutable content cache.
 * Phase 1: no automatic downloads and no removal of bundled legacy assets.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_agency_media_manifest(): array {
    static $manifest = null;
    if ( null === $manifest ) {
        $file = __DIR__ . '/../config/agency-media.json';
        $data = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null;
        $manifest = is_array( $data ) && 1 === ( $data['schema'] ?? 0 )
            && preg_match( '/^[a-f0-9]{40}$/D', $data['source_commit'] ?? '' )
            && is_array( $data['files'] ?? null ) ? $data : [];
    }
    return $manifest;
}

function codela_sf_agency_media_valid( string $path, array $entry ): bool {
    if ( ! is_file( $path ) || is_link( $path ) || ! is_readable( $path )
        || ! is_int( $entry['size'] ?? null ) || $entry['size'] < 1
        || ! preg_match( '/^[a-f0-9]{40}$/D', $entry['git_blob'] ?? '' )
        || filesize( $path ) !== $entry['size'] ) { return false; }
    $ctx = hash_init( 'sha1' );
    hash_update( $ctx, 'blob ' . $entry['size'] . "\0" );
    return hash_update_file( $ctx, $path ) && hash_equals( $entry['git_blob'], hash_final( $ctx ) );
}

/** Content-addressed copies are independent of theme replacement and deduplicated. */
function codela_sf_agency_media_location( array $entry ): array {
    $uploads = wp_upload_dir( null, false );
    if ( ! empty( $uploads['error'] ) || empty( $uploads['basedir'] ) || empty( $uploads['baseurl'] )
        || ! preg_match( '/^[a-f0-9]{40}$/D', $entry['git_blob'] ?? '' ) ) { return []; }
    $relative = '/codela-starter-assets/agency/' . $entry['git_blob'] . '.jpg';
    return [ 'path' => $uploads['basedir'] . $relative, 'url' => $uploads['baseurl'] . $relative ];
}

/** Call only from an authorized import or pre-update migration, not a page render. */
function codela_sf_agency_media_prepare( bool $allow_download = false ) {
    $manifest = codela_sf_agency_media_manifest();
    if ( ! $manifest ) { return new WP_Error( 'codela_agency_manifest', 'Ajans görsel listesi doğrulanamadı.' ); }
    foreach ( $manifest['files'] as $name => $entry ) {
        if ( ! preg_match( '/^[a-z0-9-]+\.jpg$/D', $name ) || ! is_array( $entry ) ) {
            return new WP_Error( 'codela_agency_manifest', 'Geçersiz ajans görsel kaydı.' );
        }
        $location = codela_sf_agency_media_location( $entry );
        if ( ! $location ) { return new WP_Error( 'codela_agency_storage', 'Ajans görsel dizini kullanılamıyor.' ); }
        $target = $location['path'];
        if ( codela_sf_agency_media_valid( $target, $entry ) ) { continue; }
        $dir = dirname( $target );
        if ( ! wp_mkdir_p( $dir ) ) { return new WP_Error( 'codela_agency_storage', 'Ajans görsel dizini oluşturulamadı.' ); }
        $temp = tempnam( $dir, '.codela-' );
        if ( false === $temp ) { return new WP_Error( 'codela_agency_storage', 'Geçici dosya oluşturulamadı.' ); }
        try {
            $legacy = get_template_directory() . '/assets/media/' . $name;
            if ( codela_sf_agency_media_valid( $legacy, $entry ) ) {
                if ( ! copy( $legacy, $temp ) ) { return new WP_Error( 'codela_agency_copy', 'Mevcut ajans görseli kopyalanamadı.' ); }
            } elseif ( $allow_download ) {
                $url = 'https://raw.githubusercontent.com/muhammetdkaya/codela-storefront/'
                    . $manifest['source_commit'] . '/theme/codela-storefront/assets/media/' . $name;
                $response = wp_safe_remote_get( $url, [ 'timeout' => 20, 'redirection' => 0,
                    'stream' => true, 'filename' => $temp, 'limit_response_size' => $entry['size'] + 1 ] );
                if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
                    return new WP_Error( 'codela_agency_download', 'Ajans görseli indirilemedi: ' . $name );
                }
            } else {
                return new WP_Error( 'codela_agency_missing', 'Mevcut ajans görseli bulunamadı: ' . $name );
            }
            clearstatcache( true, $temp );
            if ( ! codela_sf_agency_media_valid( $temp, $entry ) ) {
                return new WP_Error( 'codela_agency_integrity', 'Ajans görsel bütünlüğü doğrulanamadı: ' . $name );
            }
            if ( ! codela_sf_agency_media_valid( $target, $entry ) && ! rename( $temp, $target ) ) {
                return new WP_Error( 'codela_agency_storage', 'Ajans görseli kaydedilemedi: ' . $name );
            }
            clearstatcache( true, $target );
            if ( ! codela_sf_agency_media_valid( $target, $entry ) ) {
                return new WP_Error( 'codela_agency_integrity', 'Kaydedilen ajans görseli doğrulanamadı: ' . $name );
            }
            // tempnam may create files with restrictive permissions; use WP's file mode.
            if ( defined( 'FS_CHMOD_FILE' ) ) { chmod( $target, FS_CHMOD_FILE ); }
        } finally {
            if ( is_file( $temp ) ) { wp_delete_file( $temp ); }
        }
    }
    return true;
}

/** Local-only resolution; never contact GitHub during a storefront request. */
function codela_sf_agency_media_url( string $name ): string {
    $entry = codela_sf_agency_media_manifest()['files'][ $name ] ?? null;
    if ( ! is_array( $entry ) ) { return ''; }
    $location = codela_sf_agency_media_location( $entry );
    if ( $location && is_file( $location['path'] ) && ! is_link( $location['path'] )
        && filesize( $location['path'] ) === $entry['size'] ) { return $location['url']; }
    $legacy = get_template_directory() . '/assets/media/' . $name;
    return is_file( $legacy ) ? get_template_directory_uri() . '/assets/media/' . $name : '';
}
