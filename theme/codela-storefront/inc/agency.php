<?php
/** Codela agency mode: isolated WordPress-native pages, forms and theme assets. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
require_once __DIR__ . '/agency-quote.php';

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

/** Allocate document-local IDs while keeping the first public anchor stable. */
function codela_sf_agency_dom_id( string $base ): string {
    static $used = [];
    $id = $base;
    for ( $suffix = 2; isset( $used[$id] ); ++$suffix ) { $id = $base . '-' . $suffix; }
    $used[$id] = true;
    return $id;
}

/** Each form keeps the existing POST field name without duplicating DOM IDs. */
function codela_sf_agency_nonce_input( string $action, string $field ): void {
    echo '<input type="hidden" name="' . esc_attr( $field ) . '" value="' . esc_attr( wp_create_nonce( $action ) ) . '">';
}

/** The plugin owns validation and preview/meta selection. */
function codela_sf_agency_components( $post ): array {
    if ( ! $post || ! function_exists( 'parse_blocks' ) || ! function_exists( 'codela_sections_validate_root' ) || ! function_exists( 'codela_sections_page_content' ) ) { return []; }
    $components = [];
    foreach ( parse_blocks( codela_sections_page_content( $post ) ) as $root ) {
        if ( 'codela/page-layout' !== ( $root['blockName'] ?? '' ) || is_wp_error( codela_sections_validate_root( $root ) ) ) { continue; }
        foreach ( $root['innerBlocks'] as $child ) {
            $name = (string) ( $child['blockName'] ?? '' );
            if ( ! str_starts_with( $name, 'codela/section-agency-' ) ) { continue; }
            $type = substr( $name, strlen( 'codela/section-' ) );
            $data = codela_sections_clean( $type, $child['attrs']['data'] ?? [] );
            if ( ! is_wp_error( $data ) && ! empty( $data['enabled'] ) ) { $components[$type][] = $data; }
        }
    }
    return $components;
}

/** A source is a public page containing the requested enabled native component,
 * not a caller-supplied return URL. No private/password-protected page is accepted.
 */
function codela_sf_agency_form_source( int $id, string $type, string $component ): string {
    if ( $id < 1 || ! preg_match( '/^[a-zA-Z0-9-]{1,64}$/D', $component ) ) { return ''; }
    $post = get_post( $id );
    if ( ! $post || 'page' !== $post->post_type || 'publish' !== $post->post_status || ! empty( $post->post_password ) ) { return ''; }
    foreach ( codela_sf_agency_components( $post )[$type] ?? [] as $data ) {
        if ( $component === $data['id'] ) { return (string) get_permalink( $post ); }
    }
    return '';
}
function codela_sf_agency_form_context( string $type, array $data ): array {
    $id = function_exists( 'get_queried_object_id' ) ? (int) get_queried_object_id() : 0;
    $component = (string) ( $data['id'] ?? '' );
    return codela_sf_agency_form_source( $id, $type, $component ) ? [ $id, $component ] : [ 0, '' ];
}
function codela_sf_agency_form_context_input( array $context ): void {
    if ( ! $context[0] ) { return; }
    echo '<input type="hidden" name="agency_source_page" value="' . esc_attr( $context[0] ) . '"><input type="hidden" name="agency_source_component" value="' . esc_attr( $context[1] ) . '">';
    codela_sf_agency_nonce_input( 'codela_sf_source_' . $context[0] . '_' . $context[1], 'agency_source_nonce' );
}
function codela_sf_agency_submitted_source( string $type ): array {
    $id = $_POST['agency_source_page'] ?? '';
    $component = $_POST['agency_source_component'] ?? '';
    $nonce = $_POST['agency_source_nonce'] ?? '';
    if ( ! is_string( $id ) || ! ctype_digit( $id ) || ! is_string( $component ) || ! is_string( $nonce )
        || ! wp_verify_nonce( wp_unslash( $nonce ), 'codela_sf_source_' . (int) $id . '_' . $component ) ) { return []; }
    $url = codela_sf_agency_form_source( (int) $id, $type, $component );
    return $url ? [ 'url' => $url, 'component' => $component ] : [];
}

/** Load visual assets only for a page that actually contains agency modules. */
function codela_sf_agency_asset_flags(): array {
    $flags = [ 'pattern' => false, 'widgets' => false, 'project' => false, 'about' => false, 'studio' => false, 'visuals' => false ];
    if ( ! function_exists( 'get_queried_object_id' ) || ! function_exists( 'get_post' ) ) { return $flags; }
    $id = (int) get_queried_object_id();
    $post = $id ? get_post( $id ) : null;
    if ( ! $post || 'page' !== $post->post_type || post_password_required( $post ) ) { return $flags; }
    $content = (string) $post->post_content;
    if ( function_exists( 'get_queried_object' ) ) {
        $preview = get_queried_object();
        if ( $preview instanceof WP_Post && (int) $preview->ID === $id ) { $post = $preview; $content = (string) $post->post_content; }
    }
    if ( function_exists( 'codela_sections_page_content' ) && function_exists( 'parse_blocks' ) && function_exists( 'codela_sections_validate_root' ) ) {
        $types = codela_sf_agency_components( $post );
        $flags['pattern'] = str_contains( $content, 'codela-storefront/agency-' );
        $flags['widgets'] = (bool) $types;
        $flags['project'] = isset( $types['agency-project'] );
        $flags['studio'] = isset( $types['agency-studio'] );
        $flags['about'] = isset( $types['agency-about'] ) || str_contains( $content, 'codela-storefront/agency-about' );
        $flags['visuals'] = isset( $types['agency-bento'] ) || isset( $types['agency-detail'] ) || isset( $types['agency-process'] )
            || str_contains( $content, 'codela-storefront/agency-process' ) || str_contains( $content, 'codela-storefront/agency-home' );
        return $flags;
    }
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
    // Studio owns its visual resources on every page that contains the component.
    if ( $flags['studio'] ) {
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
    $source = codela_sf_agency_submitted_source( 'agency-contact-bento' );
    $base = $source['url'] ?? codela_sf_agency_contact_link();
    $redirect = static function( string $status ) use ( $base, $source ): void {
        $args = [ 'codela_status' => $status ];
        if ( $source ) { $args['codela_component'] = $source['component']; }
        wp_safe_redirect( add_query_arg( $args, $base ) );
        exit;
    };
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! codela_sf_ready() || ( isset( $_POST['agency_source_page'] ) && ! $source ) ) { $redirect( 'invalid' ); }
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
    $source = codela_sf_agency_submitted_source( 'agency-project' );
    $base = $source['url'] ?? codela_sf_agency_project_link();
    $redirect = static function( string $status ) use ( $base, $source ): void {
        $args = [ 'codela_status' => $status ];
        if ( $source ) { $args['codela_component'] = $source['component']; }
        wp_safe_redirect( add_query_arg( $args, $base ) );
        exit;
    };
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! codela_sf_ready() || ( isset( $_POST['agency_source_page'] ) && ! $source ) || ( ! $source && ! codela_sf_agency_project_url() ) ) { $redirect( 'invalid' ); }
    $field = static function( string $key ): string {
        $value = $_POST[ $key ] ?? '';
        return is_string( $value ) ? trim( sanitize_text_field( wp_unslash( $value ) ) ) : '';
    };
    if ( ! wp_verify_nonce( $field( 'agency_project_nonce' ), 'codela_sf_agency_project' ) ) { $redirect( 'invalid' ); }
    if ( '' !== $field( 'agency_project_webpage' ) ) { $redirect( 'invalid' ); }
    $raw_services = $_POST['agency_project_service'] ?? [];
    $raw_services = is_array( $raw_services ) ? $raw_services : [ $raw_services ];
    $services = [];
    foreach ( $raw_services as $raw_service ) {
        if ( ! is_string( $raw_service ) ) { $redirect( 'invalid' ); }
        $services[] = sanitize_text_field( wp_unslash( $raw_service ) );
    }
    $services = array_unique( $services );
    $service = implode( ', ', $services );
    $time = $field( 'agency_project_time' );
    $scale = $field( 'agency_project_scale' );
    $month = $field( 'agency_project_month' );
    if ( $month ) {
        $available = codela_sf_project_availability();
        if ( 'flexible' !== $month && ( ! isset( $available[$month] ) || (int) $available[$month]['free'] < 1 ) ) { $redirect( 'invalid' ); }
        $time = 'flexible' === $month ? 'Esnek takvim' : $available[$month]['label'];
    }
    $name = $field( 'agency_project_name' );
    $contact = $field( 'agency_project_contact' );
    $raw_note = $_POST['agency_project_note'] ?? '';
    $note = is_string( $raw_note ) ? trim( sanitize_textarea_field( wp_unslash( $raw_note ) ) ) : '';
    $length = static function( string $value ): int { return function_exists( 'mb_strlen' ) ? mb_strlen( $value ) : strlen( $value ); };
    $allowed_services = [ 'Web Tasarım', 'E-Ticaret', 'Özel Yazılım', 'Optimizasyon / Destek' ];
    $allowed_times = [ '2–4 hafta', '1–2 ay', 'Esnek takvim', 'Hemen', '1–2 Ay', 'Esnek' ];
    $allowed_scales = [ 'Sıfırdan başlıyoruz', 'Mevcut site yenilenecek', 'Tasarım hazır, kodlama gerekli', 'Başlangıç', 'Büyüme', 'Kurumsal' ];
    if ( ! $services || count( $services ) > 4 || array_diff( $services, $allowed_services )
        || ( ! $month && ( ! in_array( $time, $allowed_times, true ) || ! in_array( $scale, $allowed_scales, true ) ) )
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
        . "Hizmet: $service\nBaşlangıç tercihi: $time\n" . ( $scale ? "Mevcut durum / ölçek: $scale\n" : '' )
        . "Ad Soyad / Marka: $name\nİletişim: $contact\n"
        . "Kısa not:\n" . ( $note ?: 'Belirtilmedi' ) . "\n";
    if ( ! wp_mail( $to, '[Codela] Yeni proje başlat talebi', $body, $headers ) ) { $redirect( 'failed' ); }
    set_transient( $throttle, 1, MINUTE_IN_SECONDS );
    // Only a genuinely accepted WordPress mail submission can create the receipt.
    // The receipt makes a manually typed ?codela_status=sent insufficient.
    $receipt = bin2hex( random_bytes( 16 ) );
    $summary = array_map( static fn($service) => 'Optimizasyon / Destek' === $service ? 'Bakım & Geliştirme' : $service, $services );
    $summary[] = $time;
    set_transient( 'codela_sf_project_receipt_' . $receipt, [ 'summary' => $summary, 'component' => $source['component'] ?? '' ], 5 * MINUTE_IN_SECONDS );
    $args = [ 'codela_status' => 'sent', 'codela_receipt' => $receipt ];
    if ( $source ) { $args['codela_component'] = $source['component']; }
    wp_safe_redirect( add_query_arg( $args, $base ) );
    exit;
}
add_action( 'admin_post_codela_sf_agency_project', 'codela_sf_agency_project_submit' );
add_action( 'admin_post_nopriv_codela_sf_agency_project', 'codela_sf_agency_project_submit' );

/** Public map editor hooks belong to WordPress bootstrap, not section rendering. */
add_action( 'add_meta_boxes_page', static function( $post ) {
    $layout = get_post_meta( $post->ID, '_codela_page_layout', true );
    if ( ! str_contains( (string) $post->post_content . ( is_string( $layout ) ? $layout : '' ), 'section-agency-contact-bento' ) ) { return; }
    add_meta_box( 'codela_contact_map', 'Codela · Harita konumu', static function( $page ) {
        wp_nonce_field( 'codela_contact_map', 'codela_contact_map_nonce' );
        echo '<p>Yalnızca kamuya açık ofis konumunun enlem ve boylamını virgülle ayırarak girin. Boş bırakırsanız işaretsiz genel harita gösterilir.</p>';
        echo '<label for="codela_contact_map_coordinates">Enlem, boylam</label><input class="widefat" id="codela_contact_map_coordinates" name="codela_contact_map_coordinates" value="' . esc_attr( get_post_meta( $page->ID, 'codela_contact_map_coordinates', true ) ) . '">';
    }, 'page', 'side' );
} );
add_action( 'save_post_page', static function( $post_id ) {
    if ( ! isset( $_POST['codela_contact_map_nonce'], $_POST['codela_contact_map_coordinates'] ) || ! is_string( $_POST['codela_contact_map_nonce'] ) || ! is_string( $_POST['codela_contact_map_coordinates'] )
        || ! wp_verify_nonce( wp_unslash( $_POST['codela_contact_map_nonce'] ), 'codela_contact_map' ) || ! current_user_can( 'edit_post', $post_id ) || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) { return; }
    $raw = trim( wp_unslash( $_POST['codela_contact_map_coordinates'] ) );
    if ( '' === $raw ) { delete_post_meta( $post_id, 'codela_contact_map_coordinates' ); return; }
    $point = codela_sf_contact_map_point( $raw );
    if ( $point ) { update_post_meta( $post_id, 'codela_contact_map_coordinates', implode( ',', $point ) ); }
} );

/** Public availability is maintained by the studio, not generated from fake reservations. */
function codela_sf_project_availability(): array {
    $stored = get_option( 'codela_sf_project_capacity', [] );
    $stored = is_array( $stored ) ? $stored : [];
    $months = [ 'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık' ];
    $start = new DateTimeImmutable( 'first day of next month midnight', new DateTimeZone( 'Europe/Istanbul' ) );
    $out = [];
    for ( $i = 0; $i < 3; $i++ ) {
        $date = $start->modify( '+' . $i . ' months' );
        $key = $date->format( 'Y-m' );
        $free = isset( $stored[$key] ) && is_numeric( $stored[$key] ) ? max( 0, min( 12, (int) $stored[$key] ) ) : null;
        $out[$key] = [ 'label' => $months[(int) $date->format('n')-1] . ' ' . $date->format('Y'), 'free' => $free ];
    }
    return $out;
}
/** Use General in the new settings hub, with an older-plugin fallback. */
add_action( function_exists( 'codela_theme_render_general' ) ? 'codela_theme_settings_general' : 'codela_theme_settings_integrations', static function() {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    echo '<section id="codela-project-capacity"><h2>Codela Proje Müsaitliği</h2><p>Önümüzdeki üç ay için kalan proje kapasitesi. Boş alan = henüz belirlenmedi; 0 = dolu. Talepler rezervasyon değildir.</p><form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="codela_sf_save_capacity">';
    wp_nonce_field( 'codela_sf_save_capacity' );
    foreach ( codela_sf_project_availability() as $month => $slot ) {
        echo '<p><label for="cdl-cap-' . esc_attr($month) . '">' . esc_html($slot['label']) . '</label> <input id="cdl-cap-' . esc_attr($month) . '" type="number" min="0" max="12" name="capacity[' . esc_attr($month) . ']" value="' . esc_attr($slot['free'] ?? '') . '"></p>';
    }
    submit_button( 'Kapasiteyi kaydet' ); echo '</form></section>';
} );
add_action( 'admin_post_codela_sf_save_capacity', static function() {
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! current_user_can( 'manage_options' ) || ! function_exists( 'codela_theme_admin_url' ) ) { wp_die( 'Yetkisiz işlem.', '', [ 'response' => 403 ] ); }
    check_admin_referer( 'codela_sf_save_capacity' );
    $raw = isset($_POST['capacity']) && is_array($_POST['capacity']) ? wp_unslash($_POST['capacity']) : [];
    $saved = get_option( 'codela_sf_project_capacity', [] );
    $saved = is_array( $saved ) ? $saved : [];
    foreach ( codela_sf_project_availability() as $key => $slot ) {
        if ( ! array_key_exists( $key, $raw ) ) { continue; }
        $value = $raw[$key];
        if ( '' === $value ) { unset( $saved[$key] ); }
        elseif ( is_string( $value ) && preg_match( '/^(?:[0-9]|1[0-2])$/D', $value ) ) { $saved[$key] = (int) $value; }
        else { wp_die( 'Geçersiz proje kapasitesi.', '', [ 'response' => 400 ] ); }
    }
    update_option( 'codela_sf_project_capacity', $saved, false );
    $section = function_exists( 'codela_theme_render_general' ) ? 'general' : 'integrations';
    wp_safe_redirect( codela_theme_admin_url( $section ) . '#codela-project-capacity' ); exit;
} );

function codela_sf_agency_experience(): bool {
    return function_exists('codela_theme_settings') && 'agency' === (codela_theme_settings()['site_experience'] ?? '');
}
add_filter( 'render_block_core/group', static function($content,$block) {
    if ( ! codela_sf_agency_experience() || ! function_exists('is_404') || ! is_404() || ! str_contains((string)($block['attrs']['className'] ?? ''),'sf-404-template') ) { return $content; }
    return codela_sf_agency_404_markup();
}, 10, 2 );
function codela_sf_agency_404_markup(): string {
    return '<main id="sf-content" class="sf-content sf-404-agency"><section class="sf-agency-404" data-agency-widget="404"><div class="cdl-404-stage" data-404-stage><div class="cdl-404-grid" aria-hidden="true"></div><div class="cdl-404-beam" aria-hidden="true"></div><div class="cdl-404-coord" aria-hidden="true"><span>41.0082° N · 28.9784° E</span><span>ROTA DIŞI</span></div><div class="cdl-404-num" aria-hidden="true">404</div><h1>Işığın dışına çıktın.</h1><p>Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p><a class="cdl-404-home" href="' . esc_url(home_url('/')) . '">Ana Sayfaya Dön <span aria-hidden="true">→</span></a></div></section></main>';
}
add_action('wp_enqueue_scripts', static function() {
    if ( codela_sf_agency_experience() && function_exists('is_404') && is_404() ) {
        codela_sf_agency_styles();
        wp_enqueue_script('codela-storefront-agency-widgets',get_template_directory_uri().'/assets/scripts/agency-widgets.js',[],wp_get_theme()->get('Version'),true);
    }
}, 31);
/** Optional early HTML feedback, independent of the internal navigation bridge. */
function codela_sf_first_entry_enabled(): bool {
    if ( ! codela_sf_agency_experience() || ! codela_sf_ready()
        || codela_sf_is_cart_context() || codela_sf_is_checkout_context() || codela_sf_is_account_context()
        || ( function_exists( 'is_woocommerce' ) && is_woocommerce() )
        || is_preview() || is_customize_preview() ) { return false; }
    return in_array( codela_theme_settings()['first_entry_feedback_enabled'] ?? true, [ true, 1, '1' ], true );
}
/** Safe public home only; defer noncritical browsing JS independently of entry. */
function codela_sf_agency_first_paint_assets(): bool {
    if ( ! codela_sf_first_entry_enabled() || ! is_front_page() || ! is_singular( 'page' )
        || is_user_logged_in() || ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG )
        || 'GET' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) { return false; }
    $caps = codela_sf_sections_capabilities();
    $flags = codela_sf_agency_asset_flags();
    return ! empty( $caps['managed'] ) && empty( $caps['products'] ) && ! empty( $flags['widgets'] );
}
function codela_sf_print_first_entry(): void {
    static $printed = false;
    if ( $printed ) { return; }
    $printed = true;
    // Inline before enqueued assets; no unsafe flushing of WordPress or server buffers.
    // The browser can paint only after the server actually sends this HTML.
    echo '<style>html.cdl-first-entry::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:auto;background:#09090c;animation:cdl-entry-fail-open 0s linear 8s forwards}html.cdl-first-entry::before{content:"";position:fixed;z-index:10000;left:50%;top:50%;height:1px;width:min(260px,64vw);translate:-50% -50%;background:linear-gradient(90deg,transparent,#d3a480,#fff1dc,#d3a480,transparent);box-shadow:0 0 18px #d3a48080;pointer-events:none;animation:cdl-entry-beam 1s ease-in-out infinite alternate,cdl-entry-fail-open 0s linear 8s forwards}@keyframes cdl-entry-beam{from{transform:scaleX(.3);opacity:.45}to{transform:scaleX(1);opacity:1}}@keyframes cdl-entry-fail-open{to{visibility:hidden;pointer-events:none}}@media(prefers-reduced-motion:reduce){html.cdl-first-entry::before{animation:cdl-entry-fail-open 0s linear 8s forwards}}</style>';
    echo '<script>(function(){var root=document.documentElement,finished=false,limit,timer,frame=0,readyFrame=0,started=false,minimumElapsed=false,contentReady=false;function mark(n){try{window.performance.mark(n)}catch(e){}}function done(){if(finished)return;finished=true;clearTimeout(limit);clearTimeout(timer);if(frame)window.cancelAnimationFrame(frame);if(readyFrame)window.cancelAnimationFrame(readyFrame);root.classList.remove("cdl-first-entry");mark("codela-entry-revealed")}if(document.readyState!=="loading")return;try{var nav=window.performance&&window.performance.getEntriesByType("navigation")[0];if(nav&&nav.type==="back_forward")return;if((!nav||nav.type==="navigate")&&document.referrer&&new URL(document.referrer).origin===window.location.origin)return}catch(e){}try{var intent=JSON.parse(window.sessionStorage.getItem("sf-agency-entry-intent")||"null"),here=new URL(window.location.href);here.hash="";window.sessionStorage.removeItem("sf-agency-entry-intent");if((!nav||nav.type==="navigate")&&intent&&intent.url===here.href&&Date.now()-intent.time>=0&&Date.now()-intent.time<10000)return}catch(e){}root.classList.add("cdl-first-entry");mark("codela-entry-start");function reveal(){if(minimumElapsed&&contentReady)done()}function hold(){if(finished||started)return;started=true;mark("codela-entry-hold-start");timer=setTimeout(function(){minimumElapsed=true;reveal()},1000)}function start(){if(finished||started)return;if(typeof window.requestAnimationFrame!=="function"){hold();return}frame=window.requestAnimationFrame(function(){frame=window.requestAnimationFrame(function(){frame=0;hold()})})}function ready(){if(finished)return;function painted(){readyFrame=0;contentReady=true;mark("codela-entry-content-ready");reveal()}if(typeof window.requestAnimationFrame!=="function"){painted();return}readyFrame=window.requestAnimationFrame(function(){readyFrame=window.requestAnimationFrame(painted)})}limit=setTimeout(done,8000);document.addEventListener("DOMContentLoaded",ready,{once:true});start();window.addEventListener("pagehide",done,{once:true});window.addEventListener("pageshow",function(e){if(e.persisted)done()})})();</script>';
}
add_action('wp_head', static function() {
    if ( ! codela_sf_first_entry_enabled() ) { return; }
    codela_sf_print_first_entry();
}, -1000);
// Minimum entry time overlaps document loading; reveal after the minimum and DOM paint opportunity.
