<?php
// Real UI component renderer, independent of an installed WordPress runtime.
define('ABSPATH', __DIR__);
function esc_attr($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function esc_url($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function esc_html($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function sanitize_html_class($v) { return preg_replace('/[^A-Za-z0-9_-]/', '', (string)$v); }
function codela_sf_icon($name) { return '<span class="sf-icon" data-icon="' . esc_attr($name) . '"></span>'; }
require __DIR__ . '/../theme/codela-storefront/inc/ui.php';
echo codela_sf_ui_icon_button('x', 'Close "panel"', [
    'variant' => 'soft',
    'class' => 'sf-close',
    'attributes' => [
        'data-panel' => 'cart',
        'data-wp-on--click' => 'actions.cart',
        'aria-expanded' => 'false',
        'onclick' => 'alert(1)',
    ]
]);
echo codela_sf_ui_icon_button('x', 'Clear search', [
    'variant' => 'clear',
    'class' => 'sf-search-clear',
    'attributes' => [ 'hidden' => true ],
]);
echo codela_sf_ui_primary_link('https://store.test/checkout/', 'Continue');
