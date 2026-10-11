<?php
/**
 * Theme-only UI primitives. WooCommerce/Codela plugin markup is not rewritten.
 * Render as real <a> for navigation or real <button> for actions.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Render supported accessible attributes with centralized escaping. */
function codela_sf_ui_attributes( array $attributes ): string {
    $output = '';
    foreach ( $attributes as $name => $value ) {
        if ( ! is_string( $name ) || ! preg_match( '/^(?:aria-[a-z-]+|data-[a-z0-9_-]+|title|id|name|value|role|tabindex|hidden|disabled)$/D', $name ) || null === $value || false === $value ) {
            continue;
        }
        if ( in_array( $name, [ 'hidden', 'disabled' ], true ) ) {
            if ( $value ) { $output .= ' ' . $name; }
        } else {
            $output .= ' ' . $name . '="' . esc_attr( true === $value ? 'true' : (string) $value ) . '"';
        }
    }
    return $output;
}

/**
 * One icon-button renderer for header, dialog close and search clear.
 * $after_html is trusted internal decoration (e.g. the cart-count badge).
 */
function codela_sf_ui_icon_button( string $icon, string $label, array $options = [], string $after_html = '' ): string {
    $variant = (string) ( $options['variant'] ?? 'bare' );
    if ( ! in_array( $variant, [ 'bare', 'soft', 'clear' ], true ) ) { $variant = 'bare'; }
    $extra = preg_split( '/\s+/', trim( (string) ( $options['class'] ?? '' ) ) ) ?: [];
    $classes = array_merge( [ 'sf-ui-icon-button', 'sf-ui-icon-button--' . $variant, 'sf-icon-button' ], array_filter( array_map( 'sanitize_html_class', $extra ) ) );
    $attributes = (array) ( $options['attributes'] ?? [] );
    $attributes['aria-label'] = $label;
    $html = ' class="' . esc_attr( implode( ' ', array_unique( $classes ) ) ) . '"';
    $html .= codela_sf_ui_attributes( $attributes );
    $content = ( 'menu' === $icon ? '<span class="sf-menu-mark" aria-hidden="true"><span></span><span></span></span>' : codela_sf_icon( $icon ) ) . $after_html;
    if ( isset( $options['href'] ) ) {
        return '<a href="' . esc_url( (string) $options['href'] ) . '"' . $html . '>' . $content . '</a>';
    }
    return '<button type="button"' . $html . '>' . $content . '</button>';
}

/**
 * Full Button component — same design for actions and navigation.
 *
 * Options: variant primary|secondary|quiet, href for link, type for button,
 * icon and icon_position, class, attributes, disabled, loading.
 */
function codela_sf_ui_button( string $label, array $options = [] ): string {
    $variant = (string) ( $options['variant'] ?? 'primary' );
    if ( ! in_array( $variant, [ 'primary', 'secondary', 'quiet' ], true ) ) { $variant = 'primary'; }

    $extra = preg_split( '/\s+/', trim( (string) ( $options['class'] ?? '' ) ) ) ?: [];
    $extras = array_filter( array_map( 'sanitize_html_class', $extra ) );
    $classes = array_unique( array_merge( $extras, [ 'sf-ui-button', 'sf-ui-button--' . $variant ] ) );
    $disabled = ! empty( $options['disabled'] ) || ! empty( $options['loading'] );
    $loading = ! empty( $options['loading'] );
    $is_link = array_key_exists( 'href', $options );

    $attributes = (array) ( $options['attributes'] ?? [] );
    if ( $loading ) { $attributes['aria-busy'] = 'true'; }
    if ( $disabled && $is_link ) {
        $attributes['aria-disabled'] = 'true';
        $attributes['tabindex'] = '-1';
    }
    if ( $disabled && ! $is_link ) { $attributes['disabled'] = true; }

    $html = ' class="' . esc_attr( implode( ' ', $classes ) ) . '"';
    $html .= codela_sf_ui_attributes( $attributes );
    $icon = (string) ( $options['icon'] ?? '' );
    $graphic = $icon ? codela_sf_icon( $icon ) : '';
    $caption = '<span class="sf-ui-button-label">' . esc_html( $label ) . '</span>';
    if ( $loading ) { $caption = '<span class="sf-ui-spinner" aria-hidden="true"></span>' . $caption; }
    $contents = 'left' === ( $options['icon_position'] ?? 'right' ) ? $graphic . $caption : $caption . $graphic;

    if ( $is_link ) {
        $href = $disabled ? '' : ' href="' . esc_url( (string) $options['href'] ) . '"';
        return '<a' . $html . $href . '>' . $contents . '</a>';
    }
    $type = (string) ( $options['type'] ?? 'button' );
    if ( ! in_array( $type, [ 'button', 'submit', 'reset' ], true ) ) { $type = 'button'; }
    return '<button type="' . esc_attr( $type ) . '"' . $html . '>' . $contents . '</button>';
}

/** Backwards-compatible shared primary CTA alias used by theme layouts. */
function codela_sf_ui_primary_link( string $url, string $label, string $icon = 'arrow-right' ): string {
    return codela_sf_ui_button( $label, [
        'href' => $url,
        'variant' => 'primary',
        'icon' => $icon,
        'class' => 'sf-primary',
    ] );
}
