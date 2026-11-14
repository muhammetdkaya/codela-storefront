<?php
/** Agency presentation uses a native, editable template part and the shared shell. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_agency_front_page(): bool {
    return 'agency' === codela_sf_site_mode() && is_front_page();
}

function codela_sf_agency_home(): string {
    return do_blocks( '<!-- wp:template-part {"slug":"agency-home","theme":"codela-storefront","tagName":"div","align":"full","className":"sf-agency-home"} /-->' );
}

/** Link only to published pages; an unfinished page must not become a dead CTA. */
function codela_sf_agency_contact_url(): string {
    foreach ( [ 'iletisim', 'contact' ] as $slug ) {
        $page = get_page_by_path( $slug );
        if ( $page && 'publish' === $page->post_status && ! post_password_required( $page ) ) {
            return (string) get_permalink( $page );
        }
    }
    return '';
}

function codela_sf_agency_styles(): void {
    wp_enqueue_style( 'codela-storefront-agency', get_template_directory_uri() . '/assets/styles/agency.css', [], wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', static function() {
    if ( ! codela_sf_ready() || ! codela_sf_agency_front_page() ) { return; }
    codela_sf_agency_styles();
    wp_enqueue_script( 'codela-storefront-agency', get_template_directory_uri() . '/assets/scripts/agency.js', [], wp_get_theme()->get( 'Version' ), true );
}, 30 );
add_action( 'enqueue_block_editor_assets', 'codela_sf_agency_styles' );
