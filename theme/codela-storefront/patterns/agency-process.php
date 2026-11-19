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
        [ 'enabled' => true, 'title' => 'Analiz ve Altyapı', 'body' => 'Projenin kapsamı, kullanıcı akışı ve teknik planı netleşir.' ],
        [ 'enabled' => true, 'title' => 'Tasarım ve Geliştirme', 'body' => 'Markanıza özel hızlı arayüz ve tüm entegrasyonlar tamamlanır.' ],
        [ 'enabled' => true, 'title' => 'Test, Yayın ve Destek', 'body' => 'Hız ve güvenlik kontrolleri sonrası siteniz güvenle yayına alınır.' ],
    ],
] );
?>
<!-- /wp:html -->
