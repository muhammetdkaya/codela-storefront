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
    $content = codela_sf_icon( $icon ) . $after_html;
    if ( isset( $options['href'] ) ) {
        return '<a href="' . esc_url( (string) $options['href'] ) . '"' . $html . '>' . $content . '</a>';
    }
    return '<button type="button"' . $html . '>' . $content . '</button>';
}

/** Primary CTA, with shared pressed/focus/disabled behavior. */
function codela_sf_ui_primary_link( string $url, string $label, string $icon = 'arrow-right' ): string {
    return '<a class="sf-primary sf-ui-button sf-ui-button--primary" href="' . esc_url( $url ) . '">' .
        esc_html( $label ) . ( $icon ? ' ' . codela_sf_icon( $icon ) : '' ) . '</a>';
}
