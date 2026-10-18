<?php
/** Content sections reuse the shared attachment, heading and Button contracts. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_section_content( array $data, string $type ): string {
    $body = '';
    if ( 'contact' === $type ) {
        $rows = codela_sections_contact_rows( $data );
        $body = $rows ? '<dl class="codela-contact-list">' . implode( '', $rows ) . '</dl>' : '';
        if ( $data['directions_url'] ) { $body .= codela_sf_ui_primary_link( $data['directions_url'], __( 'Yol tarifi al', 'codela-storefront' ) ); }
    } else {
        foreach ( $data['items'] as $item ) {
            if ( ! $item['enabled'] || ! $item['title'] && ! $item['body'] ) { continue; }
            $image = 'story' === $type ? codela_sf_section_image( $item, false, '(max-width:700px) 100vw, 50vw' ) : '';
            $body .= '<article class="sf-content-card' . ( $image ? ' has-image' : '' ) . '">' . $image . '<div class="sf-content-copy">';
            $body .= ( $item['title'] ? '<h3>' . esc_html( $item['title'] ) . '</h3>' : '' ) . ( $item['body'] ? '<p>' . esc_html( $item['body'] ) . '</p>' : '' );
            if ( 'story' === $type && $item['button_url'] && $item['button_label'] ) { $body .= codela_sf_ui_primary_link( $item['button_url'], $item['button_label'] ); }
            $body .= '</div></article>';
        }
        if ( $body ) { $body = '<div class="sf-content-cards">' . $body . '</div>'; }
    }
    if ( ! $body ) { return ''; }
    return '<section class="sf-section sf-section--' . esc_attr( $type ) . ' sf-content--' . esc_attr( $data['variant'] ) . '">' . codela_sf_section_heading( $data ) . $body . '</section>';
}
