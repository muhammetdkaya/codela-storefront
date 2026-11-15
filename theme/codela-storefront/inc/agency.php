<?php
/** Codela agency mode: isolated WordPress-native pages, forms and theme assets. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_agency_front_page(): bool {
    return 'agency' === codela_sf_site_mode() && is_front_page();
}

function codela_sf_agency_home(): string {
    return do_blocks( '<!-- wp:template-part {"slug":"agency-home","theme":"codela-storefront","tagName":"div","align":"full","className":"sf-agency-home"} /-->' );
}

/** Never overwrite an existing WordPress page; preserve editable page ownership. */
function codela_sf_agency_seed_pages(): void {
    if ( ! codela_sf_ready() || 'agency' !== codela_sf_site_mode() || ! function_exists( 'wp_insert_post' ) || get_option( 'codela_sf_agency_pages_v1', false ) ) { return; }
    $pages = [
        'hizmetler' => [ 'Hizmetler', 'agency-services' ],
        'hakkimizda' => [ 'Hakkımızda', 'agency-about' ],
        'iletisim' => [ 'İletişim', 'agency-contact' ],
    ];
    foreach ( $pages as $slug => $config ) {
        if ( get_page_by_path( $slug ) ) { continue; }
        $page_id = wp_insert_post( [
            'post_type'    => 'page',
            'post_status'  => 'publish',
            'post_name'    => $slug,
            'post_title'   => $config[0],
            'post_content' => '<!-- wp:pattern {"slug":"codela-storefront/' . $config[1] . '"} /-->',
            'comment_status' => 'closed',
            'ping_status'    => 'closed',
        ], true );
        if ( is_wp_error( $page_id ) || ! $page_id ) { return; }
    }
    update_option( 'codela_sf_agency_pages_v1', '1', false );
}
add_action( 'init', 'codela_sf_agency_seed_pages', 30 );

function codela_sf_agency_page_url( string $slug, string $fallback = '' ): string {
    $page = get_page_by_path( $slug );
    return $page && 'publish' === $page->post_status && ! post_password_required( $page ) ? (string) get_permalink( $page ) : ( $fallback ?: home_url( '/' ) );
}

/** Only link to the real published contact page; never a draft/protected URL. */
function codela_sf_agency_contact_url(): string {
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

/**
 * Agency navigation replaces the store menu only while agency mode is active.
 * It is a presentation projection: it never edits a customer's WordPress menu.
 * Routes resolve through published pages, with safe home-section fallbacks.
 */
function codela_sf_agency_menu( bool $desktop = false ): string {
    $items = [
        [ 'label' => 'Ana Sayfa', 'url' => home_url( '/' ), 'active' => is_front_page() ],
        [ 'label' => 'Hizmetler', 'url' => codela_sf_agency_page_url( 'hizmetler', home_url( '/#sf-agency-services' ) ), 'active' => function_exists( 'is_page' ) && is_page( 'hizmetler' ) ],
        [ 'label' => 'Hakkımızda', 'url' => codela_sf_agency_page_url( 'hakkimizda', home_url( '/#sf-agency-process' ) ), 'active' => function_exists( 'is_page' ) && is_page( 'hakkimizda' ) ],
        [ 'label' => 'İletişim', 'url' => codela_sf_agency_contact_link(), 'active' => function_exists( 'is_page' ) && is_page( 'iletisim' ) ],
    ];
    $id = $desktop ? 'sf-desktop-menu' : 'sf-panel-menu';
    $class = $desktop ? 'sf-desktop-menu' : 'sf-menu-list';
    $html = '<ul id="' . esc_attr( $id ) . '" class="' . esc_attr( $class ) . '">';
    foreach ( $items as $item ) {
        $active = $item['active'];
        $html .= '<li class="menu-item' . ( $active ? ' current-menu-item' : '' ) . '">';
        $html .= '<a class="' . ( $desktop ? 'sf-ui-pressable' : '' ) . '" href="' . esc_url( $item['url'] ) . '"' . ( $active ? ' aria-current="page"' : '' ) . '>' . esc_html( $item['label'] ) . '</a></li>';
    }
    return $html . '</ul>';
}

/** The agency gets a single scoped CSS/JS pair, only on its real public pages. */
function codela_sf_agency_styles(): void {
    wp_enqueue_style( 'codela-storefront-agency', get_template_directory_uri() . '/assets/styles/agency.css', [], wp_get_theme()->get( 'Version' ) );
}
function codela_sf_agency_is_public_page(): bool {
    return 'agency' === codela_sf_site_mode()
        && ( is_front_page() || ( function_exists( 'is_page' ) && is_page( [ 'hizmetler', 'hakkimizda', 'iletisim' ] ) ) );
}
add_action( 'wp_enqueue_scripts', static function() {
    if ( ! codela_sf_ready() || ! codela_sf_agency_is_public_page() ) { return; }
    codela_sf_agency_styles();
    wp_enqueue_script( 'codela-storefront-agency', get_template_directory_uri() . '/assets/scripts/agency.js', [], wp_get_theme()->get( 'Version' ), true );
}, 30 );
add_action( 'enqueue_block_editor_assets', 'codela_sf_agency_styles' );

/** Native admin-post action: nonce, honeypot, throttling and sanitized plain text. */
function codela_sf_agency_contact_submit(): void {
    $base = codela_sf_agency_contact_link();
    $redirect = static function( string $status ) use ( $base ): void {
        wp_safe_redirect( add_query_arg( 'codela_status', $status, $base ) );
        exit;
    };
    if ( 'agency' !== codela_sf_site_mode() || ! codela_sf_ready() ) { $redirect( 'invalid' ); }
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
