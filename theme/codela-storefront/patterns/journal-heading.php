<?php
/**
 * Title: Journal heading
 * Slug: codela-storefront/journal-heading
 * Inserter: no
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$posts_page = (int) get_option( 'page_for_posts' );
$heading = $posts_page ? get_the_title( $posts_page ) : '';
$heading = $heading ?: __( 'Blog', 'codela-storefront' );
?>
<!-- wp:heading {"level":1,"className":"sf-journal-title"} -->
<h1 class="wp-block-heading sf-journal-title"><?php echo esc_html( $heading ); ?></h1>
<!-- /wp:heading -->
