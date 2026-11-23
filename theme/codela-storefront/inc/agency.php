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

/** Return only the verified owned service subpage, including renamed parents. */
function codela_sf_agency_owned_service_detail_url( string $slug ): string {
    $allowed = [ 'web-tasarimi', 'e-ticaret', 'ozel-yazilim', 'gelistirme-destek' ];
    if ( ! in_array( $slug, $allowed, true ) ) { return ''; }
    $state = get_option( 'codela_agency_demo_state_v1', [] );
    $parent_id = is_array( $state ) && ! empty( $state['done'] )
        ? (int) ( $state['pages']['hizmetler'] ?? 0 ) : 0;
    if ( ! $parent_id || get_post_meta( $parent_id, '_codela_agency_demo_key', true ) !== 'codela-agency-starter:1:hizmetler' ) { return ''; }
    $ids = get_posts( [
        'post_type' => 'page', 'post_status' => 'publish', 'post_parent' => $parent_id,
        'meta_key' => '_codela_agency_service_detail_key',
        'meta_value' => 'codela-agency-detail:1:' . $slug,
        'fields' => 'ids', 'numberposts' => 2, 'suppress_filters' => true,
    ] );
    if ( 1 !== count( $ids ) ) { return ''; }
    $page = get_post( (int) $ids[0] );
    return $page && $page->post_name && ! post_password_required( $page )
        ? (string) get_permalink( $page ) : '';
}

function codela_sf_agency_page_url( string $slug, string $fallback = '' ): string {
    if ( 0 === strpos( $slug, 'hizmetler/' ) ) {
        $detail = codela_sf_agency_owned_service_detail_url( substr( $slug, strlen( 'hizmetler/' ) ) );
        if ( $detail ) { return $detail; }
    }
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


/** Resolve only the installed and Codela-owned Project Start page. */
function codela_sf_agency_project_url(): string {
    $state = get_option( 'codela_agency_demo_state_v1', [] );
    $home = is_array( $state ) && ! empty( $state['done'] ) ? (int) ( $state['pages']['home'] ?? 0 ) : 0;
    if ( ! $home || 'codela-agency-starter:1:home' !== get_post_meta( $home, '_codela_agency_demo_key', true ) ) { return ''; }
    $ids = get_posts( [
        'post_type' => 'page', 'post_status' => 'publish',
        'meta_key' => '_codela_agency_project_key',
        'meta_value' => 'codela-agency-project:1',
        'fields' => 'ids', 'numberposts' => 2, 'suppress_filters' => true,
    ] );
    if ( 1 !== count( $ids ) ) { return ''; }
    $page = get_post( (int) $ids[0] );
    return $page && 'page' === $page->post_type
        && ! post_password_required( $page ) ? (string) get_permalink( $page ) : '';
}
function codela_sf_agency_project_link(): string {
    return codela_sf_agency_project_url() ?: codela_sf_agency_contact_link();
}

/** Destination-only Agency skeleton hints for verified installed pages.
 * Use actual permalinks; renamed pages and service children need no hard-coded slugs.
 * This does not select an Agency theme mode or change WooCommerce navigation.
 */
function codela_sf_agency_navigation_routes(): array {
    $state = get_option( 'codela_agency_demo_state_v1', [] );
    if ( ! is_array( $state ) || empty( $state['done'] ) ) { return []; }
    $routes = [];
    $home_id = (int) ( $state['pages']['home'] ?? 0 );
    if ( $home_id && 'page' === get_option( 'show_on_front' )
        && (int) get_option( 'page_on_front' ) === $home_id
        && 'codela-agency-starter:1:home' === get_post_meta( $home_id, '_codela_agency_demo_key', true ) ) {
        $routes[] = [ 'url' => home_url( '/' ), 'kind' => 'home' ];
    }
    foreach ( [ 'hizmetler' => 'services', 'hakkimizda' => 'about', 'iletisim' => 'contact' ] as $key => $kind ) {
        $url = codela_sf_agency_installed_page_url( $key );
        if ( $url ) { $routes[] = [ 'url' => $url, 'kind' => $kind ]; }
    }
    $project = codela_sf_agency_project_url();
    if ( $project ) { $routes[] = [ 'url' => $project, 'kind' => 'project' ]; }
    $parent_id = (int) ( $state['pages']['hizmetler'] ?? 0 );
    if ( $parent_id && 'codela-agency-starter:1:hizmetler' === get_post_meta( $parent_id, '_codela_agency_demo_key', true ) ) {
        $detail_keys = [ 'web-tasarimi', 'e-ticaret', 'ozel-yazilim', 'gelistirme-destek' ];
        $children = get_posts( [
            'post_type' => 'page', 'post_status' => 'publish', 'post_parent' => $parent_id,
            'meta_key' => '_codela_agency_service_detail_key', 'fields' => 'ids',
            'numberposts' => 8, 'suppress_filters' => true,
        ] );
        foreach ( $children as $child_id ) {
            $key = (string) get_post_meta( (int) $child_id, '_codela_agency_service_detail_key', true );
            if ( ! in_array( str_replace( 'codela-agency-detail:1:', '', $key ), $detail_keys, true )
                || ! str_starts_with( $key, 'codela-agency-detail:1:' )
                || post_password_required( (int) $child_id ) ) { continue; }
            $url = get_permalink( (int) $child_id );
            if ( $url ) { $routes[] = [ 'url' => (string) $url, 'kind' => 'detail' ]; }
        }
    }
    return $routes;
}

/** Load visual assets only for a page that actually contains agency modules. */
function codela_sf_agency_asset_flags(): array {
    $flags = [ 'pattern' => false, 'widgets' => false, 'project' => false, 'about' => false, 'studio' => false, 'visuals' => false ];
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
    $flags['project'] = str_contains( $content, 'codela/section-agency-project' );
    $flags['studio'] = str_contains( $content, 'codela/section-agency-studio' );
    $flags['about'] = str_contains( $content, 'codela/section-agency-about' ) || str_contains( $content, 'codela-storefront/agency-about' );
    $flags['visuals'] = str_contains( $content, 'section-agency-bento' )
        || str_contains( $content, 'section-agency-detail' )
        || str_contains( $content, 'section-agency-process' )
        || str_contains( $content, 'codela-storefront/agency-process' )
        || str_contains( $content, 'codela-storefront/agency-home' );
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
    if ( $flags['about'] ) {
        wp_enqueue_style( 'codela-storefront-agency-about', get_template_directory_uri() . '/assets/styles/agency-about.css', [ 'codela-storefront-agency' ], wp_get_theme()->get( 'Version' ) );
    }
    // Spotlight assets are required only for an Agency homepage containing Studio.
    if ( $flags['studio'] && function_exists( 'is_front_page' ) && is_front_page() ) {
        wp_enqueue_style( 'codela-storefront-agency-light-scene',
            get_template_directory_uri() . '/assets/styles/agency-light-scene.css',
            [ 'codela-storefront-agency' ], wp_get_theme()->get( 'Version' ) );
        wp_enqueue_script( 'codela-storefront-agency-light-scene',
            get_template_directory_uri() . '/assets/scripts/agency-light-scene.js',
            [], wp_get_theme()->get( 'Version' ), true );
    }
    if ( $flags['project'] ) {
        wp_enqueue_style( 'codela-storefront-agency-project', get_template_directory_uri() . '/assets/styles/agency-project.css', [ 'codela-storefront-agency' ], wp_get_theme()->get( 'Version' ) );
    }
    if ( $flags['pattern'] ) {
        wp_enqueue_script( 'codela-storefront-agency', get_template_directory_uri() . '/assets/scripts/agency.js', [], wp_get_theme()->get( 'Version' ), true );
    }
    if ( $flags['widgets'] || $flags['pattern'] ) {
        wp_enqueue_script( 'codela-storefront-agency-widgets', get_template_directory_uri() . '/assets/scripts/agency-widgets.js', [], wp_get_theme()->get( 'Version' ), true );
    }
    // Geometry-matched light overlays only for Services, Process, and detail pages.
    if ( $flags['visuals'] ) {
        wp_enqueue_style( 'codela-storefront-agency-reference-light',
            get_template_directory_uri() . '/assets/styles/agency-reference-light.css',
            [ 'codela-storefront-agency' ], wp_get_theme()->get( 'Version' ) );
        wp_enqueue_script( 'codela-storefront-agency-reference-light',
            get_template_directory_uri() . '/assets/scripts/agency-reference-light.js',
            [ 'codela-storefront-agency-widgets' ], wp_get_theme()->get( 'Version' ), true );
    }
    if ( $flags['widgets'] && function_exists( 'is_front_page' ) && is_front_page() ) {
        wp_enqueue_script( 'codela-storefront-agency-stage-scroll', get_template_directory_uri() . '/assets/scripts/agency-stage-scroll.js', [], wp_get_theme()->get( 'Version' ), true );
    }
}, 30 );
add_action( 'enqueue_block_editor_assets', 'codela_sf_agency_styles' );

/** Fix the generic WooCommerce tab title only on the verified Codela Agency homepage. */
add_filter( 'document_title_parts', static function( array $parts ): array {
    if ( ! function_exists( 'is_front_page' ) || ! is_front_page() ) { return $parts; }
    $stale_tagline = 'Checkout, shipping and notifications for WooCommerce.';
    $is_stale = 'WooCommerce' === trim( (string) get_option( 'blogname', '' ) )
        || $stale_tagline === trim( (string) ( $parts['tagline'] ?? '' ) )
        || $stale_tagline === trim( (string) get_option( 'blogdescription', '' ) );
    if ( ! $is_stale ) { return $parts; }
    $state = get_option( 'codela_agency_demo_state_v1', [] );
    $home = is_array( $state ) && ! empty( $state['done'] ) ? (int) ( $state['pages']['home'] ?? 0 ) : 0;
    if ( ! $home || 'page' !== get_option( 'show_on_front' )
        || $home !== (int) get_option( 'page_on_front' )
        || 'codela-agency-starter:1:home' !== get_post_meta( $home, '_codela_agency_demo_key', true ) ) { return $parts; }
    $parts['title'] = 'Web Tasarım, E-Ticaret ve Yazılım';
    $parts['site'] = 'Codela';
    if ( isset( $parts['tagline'] ) && $stale_tagline === trim( (string) $parts['tagline'] ) ) {
        unset( $parts['tagline'] );
    }
    return $parts;
}, 20 );

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


/**
 * Reference two-step project form: REAL WordPress mail result, not the mockup's
 * JS-only success animation. Uses the existing agency mail destination.
 */
function codela_sf_agency_project_submit(): void {
    $base = codela_sf_agency_project_link();
    $redirect = static function( string $status ) use ( $base ): void {
        wp_safe_redirect( add_query_arg( 'codela_status', $status, $base ) );
        exit;
    };
    if ( ! codela_sf_ready() || ! codela_sf_agency_project_url() ) { $redirect( 'invalid' ); }
    $field = static function( string $key ): string {
        $value = $_POST[ $key ] ?? '';
        return is_string( $value ) ? trim( sanitize_text_field( wp_unslash( $value ) ) ) : '';
    };
    if ( ! wp_verify_nonce( $field( 'agency_project_nonce' ), 'codela_sf_agency_project' ) ) { $redirect( 'invalid' ); }
    if ( '' !== $field( 'agency_project_webpage' ) ) { $redirect( 'invalid' ); }
    $service = $field( 'agency_project_service' );
    $time = $field( 'agency_project_time' );
    $scale = $field( 'agency_project_scale' );
    $name = $field( 'agency_project_name' );
    $contact = $field( 'agency_project_contact' );
    $raw_note = $_POST['agency_project_note'] ?? '';
    $note = is_string( $raw_note ) ? trim( sanitize_textarea_field( wp_unslash( $raw_note ) ) ) : '';
    $length = static function( string $value ): int { return function_exists( 'mb_strlen' ) ? mb_strlen( $value ) : strlen( $value ); };
    $allowed_services = [ 'Web Tasarım', 'E-Ticaret', 'Özel Yazılım', 'Optimizasyon / Destek' ];
    $allowed_times = [ 'Hemen', '1–2 Ay', 'Esnek' ];
    $allowed_scales = [ 'Başlangıç', 'Büyüme', 'Kurumsal' ];
    if ( ! in_array( $service, $allowed_services, true )
        || ! in_array( $time, $allowed_times, true )
        || ! in_array( $scale, $allowed_scales, true )
        || $length( $name ) < 2 || $length( $name ) > 120
        || ! $contact || $length( $contact ) > 180
        || $length( $note ) > 2000
        || '1' !== $field( 'agency_project_consent' ) ) { $redirect( 'invalid' ); }
    $is_email = is_email( $contact );
    $digits = preg_replace( '/\D+/', '', $contact );
    $is_phone = preg_match( '/^\+?[0-9 ()-]{10,30}$/D', $contact )
        && strlen( $digits ) >= 10 && strlen( $digits ) <= 15;
    if ( ! $is_email && ! $is_phone ) { $redirect( 'invalid' ); }
    $remote = (string) ( $_SERVER['REMOTE_ADDR'] ?? 'unknown' );
    $throttle = 'codela_sf_project_' . hash_hmac( 'sha256', $remote, wp_salt( 'auth' ) );
    if ( get_transient( $throttle ) ) { $redirect( 'wait' ); }
    $to = sanitize_email( (string) get_option( 'admin_email' ) );
    if ( ! is_email( $to ) ) { $redirect( 'failed' ); }
    $headers = [ 'Content-Type: text/plain; charset=UTF-8' ];
    if ( $is_email ) { $headers[] = 'Reply-To: ' . sanitize_email( $contact ); }
    $body = "Yeni Codela Proje Başlat Talebi\n\n"
        . "Hizmet: $service\nHedef zaman: $time\nProje ölçeği: $scale\n"
        . "Ad Soyad / Marka: $name\nİletişim: $contact\n"
        . "Kısa not:\n" . ( $note ?: 'Belirtilmedi' ) . "\n";
    if ( ! wp_mail( $to, '[Codela] Yeni proje başlat talebi', $body, $headers ) ) { $redirect( 'failed' ); }
    set_transient( $throttle, 1, MINUTE_IN_SECONDS );
    // Only a genuinely accepted WordPress mail submission can create the receipt.
    // The receipt makes a manually typed ?codela_status=sent insufficient.
    $receipt = bin2hex( random_bytes( 16 ) );
    set_transient( 'codela_sf_project_receipt_' . $receipt, 1, 5 * MINUTE_IN_SECONDS );
    wp_safe_redirect( add_query_arg( [ 'codela_status' => 'sent', 'codela_receipt' => $receipt ], $base ) );
    exit;
}
add_action( 'admin_post_codela_sf_agency_project', 'codela_sf_agency_project_submit' );
add_action( 'admin_post_nopriv_codela_sf_agency_project', 'codela_sf_agency_project_submit' );
