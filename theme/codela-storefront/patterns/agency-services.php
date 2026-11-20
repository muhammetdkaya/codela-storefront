<?php
/**
 * Title: Codela — Hizmetler / MONA Bento
 * Slug: codela-storefront/agency-services
 * Categories: featured
 * Description: The four-card Agency services screen matching the approved reference.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:html -->
<?php
echo codela_sf_section_agency_bento( [
    'id' => 'pattern-agency-services',
    'title' => 'Uzmanlık Alanları',
    'description' => '',
    'items' => [
        [ 'enabled' => true, 'title' => 'Web Tasarım', 'body' => 'Kurumsal · Arayüz · Dönüşüm' ],
        [ 'enabled' => true, 'title' => 'E-Ticaret', 'body' => 'Satış · Akış' ],
        [ 'enabled' => true, 'title' => 'Özel Yazılım', 'body' => 'Ölçek · API' ],
        [ 'enabled' => true, 'title' => 'Optimizasyon / Destek', 'body' => 'Hız · Güvenlik · Sürekli bakım' ],
    ],
] );
?>
<!-- /wp:html -->
