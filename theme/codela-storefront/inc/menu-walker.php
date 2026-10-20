<?php
/** Native WordPress links with browser-owned nested-menu disclosures. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

class Codela_SF_Menu_Walker extends Walker_Nav_Menu {
    private array $parents = [];

    public function start_el( &$output, $data_object, $depth = 0, $args = null, $current_object_id = 0 ) {
        parent::start_el( $output, $data_object, $depth, $args, $current_object_id );
        if ( in_array( 'menu-item-has-children', (array) $data_object->classes, true ) ) {
            $id = 'sf-desktop-submenu-' . absint( $data_object->ID );
            $this->parents[ $depth ] = $id;
            $output .= codela_sf_ui_icon_button( 'chevron-down', sprintf( __( 'Open submenu: %s', 'codela-storefront' ), $data_object->title ), [
                'class' => 'sf-desktop-submenu-toggle', 'variant' => 'bare',
                'attributes' => [ 'popovertarget' => $id, 'type' => 'button' ],
            ] );
        }
    }

    public function start_lvl( &$output, $depth = 0, $args = null ) {
        $output .= '<ul class="sub-menu sf-desktop-submenu sf-ui-surface" id="' . esc_attr( $this->parents[ $depth ] ) . '" popover="auto">';
    }
}
