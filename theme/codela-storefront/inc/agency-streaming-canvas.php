<?php
/**
 * Scoped variant of the native block template canvas.
 * Only the minimal HEAD prefix is emitted before get_the_block_template_html().
 * Block styles, script registration, body classes and native hooks remain ordered.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
// Recheck immediately before committing headers to the response.
if ( ! codela_sf_streaming_available() ) {
    require ABSPATH . WPINC . '/template-canvas.php';
    return;
}
header( 'X-Accel-Buffering: no' );
header( 'X-Codela-Streaming: early-head' );
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>" />
<?php
codela_sf_print_first_entry();
echo "<!-- codela-stream-start -->\n";
if ( 1 === ob_get_level() ) { ob_flush(); }
flush();

// Do not move wp_head() ahead of block rendering: blocks register assets here.
$template_html = get_the_block_template_html();
echo "<!-- codela-stream-rendered -->\n";
wp_head();
?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php echo $template_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Native rendered block template. ?>
<?php wp_footer(); ?>
</body>
</html>
