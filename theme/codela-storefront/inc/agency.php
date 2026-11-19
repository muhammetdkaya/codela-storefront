<?php
/** Codela agency mode: isolated WordPress-native pages, forms and theme assets. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Agency layouts are ordinary WordPress pages and widgets. Site identity is
 * chosen by installed demo content, never a permanent agency/commerce switch.
 */
/** Resolve an installed Agency page by its recorded ID, not a colliding slug. */
function codela_sf_agency_installed_page_url( string $slug ): string {
    $keys = [ 'hizmetler' => 'hizmetler', 'hakkimizda' => 'hakkimizda', 'iletisim' => 'iletisim' ];
    if ( ! isset( $keys[ $slug ] ) ) { return ''; }
    $state = get_option( 'codela_agency_demo_state_v1', [] );
    $id = is_array( $state ) && ! empty( $state['done'] )
        ? (int) ( $state['pages'][ $keys[ $slug ] ] ?? 0 ) : 0;
    $page = $id ? get_post( $id ) : null;
    return $page && 'page' === $page->post_type
        && 'publish' === $page->post_status && ! post_password_required( $page )
        ? (string) get_permalink( $page ) : '';
}

function codela_sf_agency_page_url( string $slug, string $fallback = '' ): string {
    $installed = codela_sf_agency_installed_page_url( $slug );
    if ( $installed ) { return $installed; }
    $page = get_page_by_path( $slug );
    return $page && 'publish' === $page->post_status && ! post_password_required( $page )
        ? (string) get_permalink( $page ) : ( $fallback ?: home_url( '/' ) );
}
function codela_sf_agency_contact_url(): string {
    $installed = codela_sf_agency_installed_page_url( 'iletisim' );
    if ( $installed ) { return $installed; }
    foreach ( [ 'iletisim', 'contact' ] as $slug ) {
        $page = get_page_by_path( $slug );
        if ( $page && 'publish' === $page->post_status && ! post_password_required( $page ) ) {
            return (string) get_permalink( $page );
        }
    }
    return '';
}
function codela_sf_agency_contact_link(): string {
    return codela_sf_agency_contact_url() ?: home_url( '/#sf-agency-contact' );
}

/** Load visual assets only for a page that actually contains agency modules. */
function codela_sf_agency_asset_flags(): array {
    $flags = [ 'pattern' => false, 'widgets' => false ];
    if ( ! function_exists( 'get_queried_object_id' ) || ! function_exists( 'get_post' ) ) { return $flags; }
    $id = (int) get_queried_object_id();
    $post = $id ? get_post( $id ) : null;
    if ( ! $post || 'page' !== $post->post_type || post_password_required( $post ) ) { return $flags; }
    $content = (string) $post->post_content;
    if ( function_exists( 'get_post_meta' ) ) {
        $layout = get_post_meta( $id, '_codela_page_layout', true );
        if ( is_string( $layout ) ) { $content .= $layout; }
    }
    $flags['pattern'] = str_contains( $content, 'codela-storefront/agency-' );
    $flags['widgets'] = str_contains( $content, 'codela/section-agency-' ); // Includes agency-studio without a theme-mode flag.
    return $flags;
}
function codela_sf_agency_styles(): void {
    wp_enqueue_style( 'codela-storefront-agency', get_template_directory_uri() . '/assets/styles/agency.css', [], wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', static function() {
    if ( ! codela_sf_ready() ) { return; }
    $flags = codela_sf_agency_asset_flags();
    if ( ! $flags['pattern'] && ! $flags['widgets'] ) { return; }
    codela_sf_agency_styles();
    if ( $flags['pattern'] ) {
        wp_enqueue_script( 'codela-storefront-agency', get_template_directory_uri() . '/assets/scripts/agency.js', [], wp_get_theme()->get( 'Version' ), true );
    }
    if ( $flags['widgets'] ) {
        wp_enqueue_script( 'codela-storefront-agency-widgets', get_template_directory_uri() . '/assets/scripts/agency-widgets.js', [], wp_get_theme()->get( 'Version' ), true );
    }
}, 30 );
add_action( 'enqueue_block_editor_assets', 'codela_sf_agency_styles' );

/** Native admin-post action: nonce, honeypot, throttling and sanitized plain text. */
function codela_sf_agency_contact_submit(): void {
    $base = codela_sf_agency_contact_link();
    $redirect = static function( string $status ) use ( $base ): void {
        wp_safe_redirect( add_query_arg( 'codela_status', $status, $base ) );
        exit;
    };
    if ( ! codela_sf_ready() ) { $redirect( 'invalid' ); }
    $field = static function( string $key ): string {
        $value = $_POST[ $key ] ?? '';
        return is_string( $value ) ? trim( sanitize_text_field( wp_unslash( $value ) ) ) : '';
    };
    $nonce = $field( 'agency_contact_nonce' );
    if ( ! $nonce || ! wp_verify_nonce( $nonce, 'codela_sf_agency_contact' ) ) { $redirect( 'invalid' ); }
    if ( $field( 'agency_webpage' ) !== '' ) { $redirect( 'sent' ); } // silent spam rejection
    $name = $field( 'agency_name' );
    $email = sanitize_email( $field( 'agency_email' ) );
    $phone = $field( 'agency_phone' );
    $services = $field( 'agency_services' );
    $raw_message = $_POST['agency_message'] ?? '';
    $message = is_string( $raw_message ) ? trim( sanitize_textarea_field( wp_unslash( $raw_message ) ) ) : '';
    $length = static function( string $text ): int { return function_exists( 'mb_strlen' ) ? mb_strlen( $text ) : strlen( $text ); };
    if ( ! $name || $length( $name ) > 120 || ! is_email( $email ) || strlen( $email ) > 180
        || $length( $phone ) > 30 || $length( $services ) > 450 || $length( $message ) < 10
        || $length( $message ) > 4000 || '1' !== $field( 'agency_consent' ) ) { $redirect( 'invalid' ); }

    $identity = (string) ( $_SERVER['REMOTE_ADDR'] ?? 'unknown' );
    $throttle = 'codela_sf_contact_' . hash_hmac( 'sha256', $identity, wp_salt( 'auth' ) );
    if ( get_transient( $throttle ) ) { $redirect( 'wait' ); }
    $to = sanitize_email( (string) get_option( 'admin_email' ) );
    if ( ! is_email( $to ) ) { $redirect( 'failed' ); }
    $body = "Yeni Ajans Proje Talebi\n\nAd Soyad: $name\nE-posta: $email\nTelefon: $phone\nHizmetler: $services\n\nProje Özeti:\n$message\n";
    $sent = wp_mail( $to, '[Codela] Yeni proje talebi', $body, [ 'Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . $email ] );
    if ( ! $sent ) { $redirect( 'failed' ); }
    set_transient( $throttle, 1, MINUTE_IN_SECONDS );
    $redirect( 'sent' );
}
add_action( 'admin_post_nopriv_codela_sf_agency_contact', 'codela_sf_agency_contact_submit' );
add_action( 'admin_post_codela_sf_agency_contact', 'codela_sf_agency_contact_submit' );
