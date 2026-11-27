<?php
/** One native shell, with capability-specific feature adapters. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_script_module_graph( bool $commerce ): array {
    $modules = [
        'codela-storefront/format'  => [ 'scripts/format.js', [] ],
        'codela-storefront/search'  => [ 'scripts/search-controller.js', [ 'codela-storefront/format' ] ],
        'codela-storefront/cart'    => [ 'scripts/cart-controller.js', [ 'codela-storefront/format' ] ],
        'codela-storefront/panel-motion' => [ 'scripts/panel-motion.js', [] ],
        'codela-storefront/overlay' => [ 'scripts/overlay-controller.js', [ 'codela-storefront/panel-motion' ] ],
        'codela-storefront/dock'    => [ 'scripts/dock-controller.js', [] ],
        'codela-storefront/navigation' => [ 'scripts/navigation-controller.js', [ '@wordpress/interactivity', [ 'id' => '@wordpress/interactivity-router', 'import' => 'dynamic' ] ] ],
        'codela-storefront'         => [ 'storefront.js', [
            '@wordpress/interactivity',
            'codela-storefront/search',
            'codela-storefront/cart',
            'codela-storefront/overlay',
            'codela-storefront/dock',
        ] ],
    ];
    if ( ! $commerce ) {
        // The stable feature IDs resolve to an inactive adapter without
        // Store API, DOM or event side effects on a Woo-disabled site.
        unset( $modules['codela-storefront/format'] );
        foreach ( [ 'search', 'cart' ] as $feature ) {
            $modules['codela-storefront/' . $feature] = [ 'scripts/commerce-disabled.js', [] ];
        }
    }
    return $modules;
}
