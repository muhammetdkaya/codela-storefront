<?php
/** Per-image mobile framing; WordPress owns attachment editing and Woo owns image changes. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_image_focus_choices(): array {
    return [
        'center' => [ '50% 50%', __( 'Center', 'codela-storefront' ) ],
        'top' => [ '50% 0%', __( 'Top', 'codela-storefront' ) ],
        'bottom' => [ '50% 100%', __( 'Bottom', 'codela-storefront' ) ],
        'left' => [ '0% 50%', __( 'Left', 'codela-storefront' ) ],
        'right' => [ '100% 50%', __( 'Right', 'codela-storefront' ) ],
        'top-left' => [ '0% 0%', __( 'Top left', 'codela-storefront' ) ],
        'top-right' => [ '100% 0%', __( 'Top right', 'codela-storefront' ) ],
        'bottom-left' => [ '0% 100%', __( 'Bottom left', 'codela-storefront' ) ],
        'bottom-right' => [ '100% 100%', __( 'Bottom right', 'codela-storefront' ) ],
    ];
}

function codela_sf_image_framing( int $attachment_id ): array {
    $stored = $attachment_id > 0 ? get_post_meta( $attachment_id, '_codela_sf_image_framing', true ) : [];
    $stored = is_array( $stored ) ? $stored : [];
    $choices = codela_sf_image_focus_choices();
    $focus = is_string( $stored['focus'] ?? null ) && isset( $choices[ $stored['focus'] ] ) ? $stored['focus'] : 'center';
    return [
        'fit' => 'contain' === ( $stored['fit'] ?? null ) ? 'contain' : 'cover',
        'focus' => $focus,
        'position' => $choices[ $focus ][0],
    ];
}

/** Only gallery images receive these attributes; thumbnails and originals remain native. */
function codela_sf_image_framing_attributes( int $attachment_id, array $attributes = [] ): array {
    $framing = codela_sf_image_framing( $attachment_id );
    $style = rtrim( (string) ( $attributes['style'] ?? '' ), '; ' );
    $attributes['style'] = ( $style ? $style . ';' : '' ) . '--sf-image-mobile-fit:' . $framing['fit'] . ';--sf-image-mobile-position:' . $framing['position'] . ';';
    $attributes['data-sf-mobile-fit'] = $framing['fit'];
    $attributes['data-sf-mobile-position'] = $framing['position'];
    return $attributes;
}

add_filter( 'attachment_fields_to_edit', static function( array $fields, $post ): array {
    $id = (int) $post->ID;
    if ( ! wp_attachment_is_image( $id ) || ! current_user_can( 'edit_post', $id ) ) { return $fields; }
    $framing = codela_sf_image_framing( $id );
    $prefix = 'attachments[' . $id . ']';
    $fields['codela_sf_mobile_fill'] = [
        'label' => __( 'Mobile product image', 'codela-storefront' ),
        'input' => 'html',
        'html' => wp_nonce_field( 'codela_sf_image_framing_' . $id, $prefix . '[codela_sf_framing_nonce]', false, false )
            . '<input type="hidden" name="' . esc_attr( $prefix . '[codela_sf_mobile_fill]' ) . '" value="0">'
            . '<label><input type="checkbox" name="' . esc_attr( $prefix . '[codela_sf_mobile_fill]' ) . '" value="1" ' . checked( 'cover', $framing['fit'], false ) . '> '
            . esc_html__( 'Fill the image area on mobile', 'codela-storefront' ) . '</label>',
        'helps' => __( 'Crops the edges on phones and tablets. Uncheck to show the whole image. Desktop always shows the whole image.', 'codela-storefront' ),
    ];
    $select = '<select name="' . esc_attr( $prefix . '[codela_sf_focus]' ) . '" aria-label="' . esc_attr__( 'Mobile focal point', 'codela-storefront' ) . '">';
    foreach ( codela_sf_image_focus_choices() as $value => $choice ) {
        $select .= '<option value="' . esc_attr( $value ) . '" ' . selected( $value, $framing['focus'], false ) . '>' . esc_html( $choice[1] ) . '</option>';
    }
    $fields['codela_sf_focus'] = [
        'label' => __( 'Mobile focal point', 'codela-storefront' ),
        'input' => 'html',
        'html' => $select . '</select>',
        'helps' => __( 'Keep this part of the photo visible when filling the area. Applies to this image wherever it is used in a product gallery.', 'codela-storefront' ),
    ];
    return $fields;
}, 10, 2 );

add_filter( 'attachment_fields_to_save', static function( array $post, array $attachment ): array {
    if ( ! isset( $attachment['codela_sf_mobile_fill'], $attachment['codela_sf_focus'] ) ) { return $post; }
    $id = (int) ( $post['ID'] ?? 0 );
    $nonce = $attachment['codela_sf_framing_nonce'] ?? '';
    if ( ! $id || ! wp_attachment_is_image( $id ) || ! current_user_can( 'edit_post', $id )
        || ! is_string( $nonce ) || ! wp_verify_nonce( $nonce, 'codela_sf_image_framing_' . $id ) ) { return $post; }
    $fill = $attachment['codela_sf_mobile_fill'];
    $focus = $attachment['codela_sf_focus'];
    if ( ! is_string( $fill ) || ! in_array( $fill, [ '0', '1' ], true ) || ! is_string( $focus ) || ! isset( codela_sf_image_focus_choices()[ $focus ] ) ) {
        $post['errors']['codela_sf_focus']['errors'][] = __( 'Invalid image framing. The saved settings were kept.', 'codela-storefront' );
        return $post;
    }
    update_post_meta( $id, '_codela_sf_image_framing', [ 'fit' => '1' === $fill ? 'cover' : 'contain', 'focus' => $focus ] );
    return $post;
}, 10, 2 );

// Native AJAX and preloaded variations use the same attachment metadata.
add_filter( 'woocommerce_available_variation', static function( array $data ): array {
    if ( ! empty( $data['image_id'] ) && is_array( $data['image'] ?? null ) ) {
        $framing = codela_sf_image_framing( (int) $data['image_id'] );
        $data['image']['codela_sf_mobile'] = [ 'fit' => $framing['fit'], 'position' => $framing['position'] ];
    }
    return $data;
} );
