<?php
/**
 * Title: Codela — Hakkımızda / Kısa
 * Slug: codela-storefront/agency-about
 * Categories: featured
 * Description: Tek yüzey, üç ilke ve proje başlat bağlantılı kompakt Hakkımızda.
 *
 * Legacy pattern pages render this immediately; Codela-owned originals are
 * converted to an editable page section on the next authorized admin visit.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:html -->
<?php
echo codela_sf_section_agency_about( [
  'id' => 'pattern-agency-about-compact',
  'title' => 'Dijitalde iyi görünmek yetmez. İyi çalışmalı.',
  'description' => 'Codela, markalar için web siteleri, e-ticaret deneyimleri ve özel yazılımlar tasarlayan bir dijital stüdyo. Fikirden yayına, tasarım ve teknolojiyi tek bir bütün olarak ele alıyoruz.',
  'approach_title' => 'Az karmaşa. Daha iyi deneyim.',
  'approach_description' => 'Her projede önce asıl ihtiyacı anlamaya odaklanıyoruz. Ardından tasarım kararlarını, teknik altyapıyı ve kullanıcı deneyimini aynı hedef etrafında birleştiriyoruz.',
  'contact_title' => 'Aklında bir proje mi var?',
  'contact_description' => 'İhtiyacını kısaca anlat. Nereden başlayabileceğimizi birlikte netleştirelim.',
  'items' => [
    [ 'enabled' => true, 'title' => 'Önce doğru çözüm', 'body' => 'İşin amacını ve kullanıcıların ihtiyacını netleştirir, gereksiz karmaşıklığı azaltırız.' ],
    [ 'enabled' => true, 'title' => 'Tasarım ve yazılım birlikte', 'body' => 'Görsel kaliteyi hız, erişilebilirlik ve sürdürülebilir koddan ayrı düşünmeyiz.' ],
    [ 'enabled' => true, 'title' => 'Şeffaf iş birliği', 'body' => 'Kararları anlaşılır kılar, geri bildirimleri sürecin doğal parçası olarak ele alırız.' ],
  ],
] );
?>
<!-- /wp:html -->
