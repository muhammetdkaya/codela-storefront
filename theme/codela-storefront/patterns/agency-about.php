<?php
/**
 * Title: Codela — Hakkımızda / MONA Süreç
 * Slug: codela-storefront/agency-about
 * Categories: featured
 * Description: Modern three-step Agency process, not the legacy information cards.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:html -->
<?php
echo codela_sf_section_agency_process( [
    'id' => 'pattern-agency-about',
    'title' => 'Birlikte nasıl çalışıyoruz?',
    'description' => 'Keşiften yayına kadar şeffaf ve ölçülebilir bir iş akışı.',
    'items' => [
        [ 'enabled' => true, 'title' => 'Analiz, UX ve Altyapı', 'body' => 'Hedefleri, içerik mimarisini ve doğru teknolojiyi belirleriz.' ],
        [ 'enabled' => true, 'title' => 'Tasarım ve Geliştirme', 'body' => 'Özel arayüz, Elementor bileşenleri ve entegrasyonları geliştiririz.' ],
        [ 'enabled' => true, 'title' => 'Test, Yayın ve Destek', 'body' => 'Performans, mobil ve güvenlik kontrolleri sonrasında yayına alırız.' ],
    ],
] );
?>
<!-- /wp:html -->
