<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
/** All contact surfaces consume the same public identity, never account data. */
function codela_sf_public_contact(): array {
    $defaults = [ 'phone' => '', 'whatsapp' => '', 'email' => '', 'street' => '', 'district' => '', 'region' => '', 'country' => '', 'area_lat' => '', 'area_lon' => '' ];
    return function_exists( 'codela_public_contact' ) ? array_merge( $defaults, codela_public_contact() ) : $defaults;
}
function codela_sf_contact_href( string $kind, array $contact ): string {
    if ( 'phone' === $kind && $contact['phone'] ) { return 'tel:' . $contact['phone']; }
    if ( 'whatsapp' === $kind && $contact['whatsapp'] ) { return 'https://wa.me/' . ltrim( $contact['whatsapp'], '+' ); }
    if ( 'email' === $kind && $contact['email'] ) { return 'mailto:' . $contact['email']; }
    return '';
}
function codela_sf_contact_icon( string $kind, string $placement = '' ): string {
    $paths = [
        'phone' => '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/>',
        'whatsapp' => '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.8-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M9 8c-.9.4-.7 2 .1 3.2.8 1.4 2.2 2.7 3.8 3.2 1.3.4 2.5.1 2.7-1l-2-1.2-.9 1c-1.3-.6-2.3-1.6-2.9-2.8l.8-.9L9 8Z"/>',
        'email' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    ];
    if ( 'phone' === $kind && 'header' === $placement ) { $paths['phone'] = '<path d="M5.8 3.5 8 3.2c.6-.1 1.1.3 1.3.9l1 3.4c.2.6 0 1.1-.5 1.5l-1.5 1.1a13 13 0 0 0 5.6 5.6l1.1-1.5c.4-.5.9-.7 1.5-.5l3.4 1c.6.2 1 .7.9 1.3l-.3 2.2c-.2 1.4-1.4 2.4-2.8 2.3C10.1 20.1 3.9 13.9 3.5 6.3c-.1-1.4.9-2.6 2.3-2.8Z"/>'; }
    $header_phone = 'phone' === $kind && 'header' === $placement;
    $size = $header_phone ? 24 : 22;
    $stroke = $header_phone ? '1.8' : '1.6';
    return isset( $paths[$kind] ) ? '<svg aria-hidden="true" focusable="false" class="sf-contact-icon" width="' . $size . '" height="' . $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' . $stroke . '" stroke-linecap="round" stroke-linejoin="round">' . $paths[$kind] . '</svg>' : '';
}
function codela_sf_contact_link( string $kind, string $label, array $contact, string $class = '', string $placement = '' ): string {
    $url = codela_sf_contact_href( $kind, $contact );
    if ( ! $url ) { return ''; }
    return '<a class="' . esc_attr( $class ) . '" href="' . esc_url( $url ) . '" data-codela-contact="' . esc_attr( $kind ) . '" data-contact-placement="' . esc_attr( $placement ) . '" aria-label="' . esc_attr( $label ) . '">' . codela_sf_contact_icon( $kind, $placement ) . '<span>' . esc_html( $label ) . '</span></a>';
}
