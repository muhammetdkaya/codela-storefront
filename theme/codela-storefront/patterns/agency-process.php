<?php
/**
 * Title: Codela — Nasıl Çalışıyoruz?
 * Slug: codela-storefront/agency-process
 * Categories: featured
 * Description: Three-step editorial process, source-matched to the agency HTML.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:html -->
<?php
echo codela_sf_section_agency_process( [
    'id' => 'pattern-agency-process',
    'title' => 'Nasıl Çalışıyoruz?',
    'description' => '',
    'items' => [
        [ 'enabled' => true, 'title' => 'Analiz ve Altyapı', 'body' => 'Hedefleri, kullanıcı ihtiyaçlarını ve içerik yapısını netleştirir; yol haritasını oluştururuz.' ],
        [ 'enabled' => true, 'title' => 'Tasarım ve Geliştirme', 'body' => 'Özgün arayüzü geliştirir, gerekli yönetim ve entegrasyon akışlarını kurarız.' ],
        [ 'enabled' => true, 'title' => 'Test, Yayın ve Destek', 'body' => 'Mobil görünümü, temel performansı ve kritik akışları test ederek yayına hazırlarız.' ],
    ],
] );
?>
<!-- /wp:html -->
