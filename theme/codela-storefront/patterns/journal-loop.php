<?php
/**
 * Title: Journal posts
 * Slug: codela-storefront/journal-loop
 * Inserter: no
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:query {"query":{"inherit":true},"className":"sf-journal-query"} -->
<div class="wp-block-query sf-journal-query">
<!-- wp:post-template {"className":"sf-journal-grid"} -->
<!-- wp:group {"tagName":"article","className":"sf-journal-card sf-ui-card"} -->
<article class="wp-block-group sf-journal-card sf-ui-card">
<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"3/2","sizeSlug":"large"} /-->
<!-- wp:group {"className":"sf-journal-card-copy"} -->
<div class="wp-block-group sf-journal-card-copy">
<!-- wp:post-terms {"term":"category","className":"sf-journal-category"} /-->
<!-- wp:post-title {"isLink":true,"level":2} /-->
<!-- wp:post-excerpt {"moreText":"","excerptLength":24} /-->
<!-- wp:group {"className":"sf-journal-card-footer"} -->
<div class="wp-block-group sf-journal-card-footer">
<!-- wp:post-date /-->
<!-- wp:read-more {"className":"sf-ui-button sf-ui-button--secondary"} /-->
</div><!-- /wp:group -->
</div><!-- /wp:group -->
</article><!-- /wp:group -->
<!-- /wp:post-template -->
<!-- wp:query-no-results -->
<!-- wp:paragraph {"className":"sf-journal-empty"} -->
<p class="sf-journal-empty"><?php esc_html_e( 'No posts yet.', 'codela-storefront' ); ?></p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results -->
<!-- wp:query-pagination {"className":"sf-journal-pagination","layout":{"type":"flex","justifyContent":"center"}} -->
<!-- wp:query-pagination-previous {"className":"sf-ui-button sf-ui-button--secondary"} /-->
<!-- wp:query-pagination-numbers /-->
<!-- wp:query-pagination-next {"className":"sf-ui-button sf-ui-button--secondary"} /-->
<!-- /wp:query-pagination -->
</div><!-- /wp:query -->
