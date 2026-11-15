<?php
/**
 * Title: Codela — Hizmetler
 * Slug: codela-storefront/agency-services
 * Categories: featured
 * Description: Referans ajans hizmetleri sayfası, altı seçilebilir hizmet ve filtreler.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$contact = function_exists( 'codela_sf_agency_contact_link' ) ? codela_sf_agency_contact_link() : home_url( '/#sf-agency-contact' );
$services = [
  [ 'cat' => 'web', 'tag' => 'Kurumsal Web', 'title' => 'Kurumsal Web Tasarım & Özel Tema', 'desc' => 'Marka kimliğinize özel sıfırdan tasarlanan, çok dilli, mobil öncelikli ve arama motorlarına uygun kurumsal WordPress siteleri.', 'select' => 'Kurumsal Web Sitesi', 'chips' => [ 'Özel UI/UX', 'Çoklu Dil', 'Teknik SEO' ] ],
  [ 'cat' => 'web', 'tag' => 'Elementor Uzmanlığı', 'title' => 'Elementor & Özel Widget Geliştirme', 'desc' => 'Figma tasarımlarının hassas biçimde Elementor’a aktarımı, özel widget’lar ve hızlı, kolay yönetilebilir sayfa mimarileri.', 'select' => 'Elementor Özel Tasarım & Widget', 'chips' => [ 'Figma → Elementor', 'Özel Widget', 'ACF & Dinamik Alanlar' ] ],
  [ 'cat' => 'commerce', 'tag' => 'WooCommerce', 'title' => 'Anahtar Teslim E-Ticaret & WooCommerce', 'desc' => 'Ürün ve sepet deneyimi, sanal POS, kargo bağlantıları ve iş modelinize göre özelleştirilmiş WooCommerce mağazaları.', 'select' => 'WooCommerce E-Ticaret Mağazası', 'chips' => [ 'Özel Checkout', 'Sanal POS', 'Kargo Entegrasyonu' ] ],
  [ 'cat' => 'custom', 'tag' => 'Özel Geliştirme', 'title' => 'Özel Eklenti (Plugin) & ERP/API Köprüleri', 'desc' => 'Hazır eklentilerin çözemediği ihtiyaçlara özel WordPress eklentileri ve muhasebe, ERP, CRM ile REST API entegrasyonları.', 'select' => 'Özel Eklenti & API Geliştirme', 'chips' => [ 'WordPress Plugin', 'ERP & CRM', 'REST API' ] ],
  [ 'cat' => 'commerce', 'tag' => 'Redesign & Taşıma', 'title' => 'Mevcut Siteyi Yenileme & Veri Taşıma', 'desc' => 'Eski, yavaş veya mobil uyumsuz sitelerin içerik ve SEO sürekliliğini gözeterek modern WordPress/WooCommerce yapısına taşınması.', 'select' => 'Site Yenileme (Redesign) & Taşıma', 'chips' => [ 'Redesign', 'Veri Taşıma', 'SEO Sürekliliği' ] ],
  [ 'cat' => 'custom', 'tag' => 'Performans & Bakım', 'title' => 'PageSpeed Optimizasyonu & Sürekli Bakım', 'desc' => 'WordPress ve Elementor sitelerinde hız iyileştirmeleri, güvenlik, düzenli güncellemeler ve yedekleme süreçleri.', 'select' => 'Hız Optimizasyonu & Aylık Bakım', 'chips' => [ 'Core Web Vitals', 'Güvenlik & Yedekleme', 'Aylık Destek' ] ],
];
?>
<!-- wp:html -->
<div class="sf-agency sf-agency-inner-page sf-agency-service-page" data-agency-services>
  <section class="sf-agency-services-intro">
    <div class="sf-agency-wrap">
      <div class="sf-agency-services-intro-layout">
        <div>
          <p class="sf-agency-page-tag">codela.dev / hizmetler · Uçtan Uca WordPress Ajansı</p>
          <h1>WordPress üzerine<br>ihtiyacınız olan her şey.</h1>
          <p class="sf-agency-page-lead">Kurumsal siteden Elementor tasarımına, anahtar teslim e-ticaretten sıfırdan eklenti yazımına kadar ihtiyacınız olan hizmetleri seçip teklif talebinize ekleyin.</p>
        </div>
        <div class="sf-agency-service-filters" role="group" aria-label="Hizmet kategorisi filtresi">
          <button type="button" data-agency-filter="all" aria-pressed="true">Tümü (6)</button>
          <button type="button" data-agency-filter="web" aria-pressed="false">Web &amp; Elementor</button>
          <button type="button" data-agency-filter="commerce" aria-pressed="false">E-Ticaret &amp; Woo</button>
          <button type="button" data-agency-filter="custom" aria-pressed="false">Özel Eklenti &amp; Bakım</button>
        </div>
      </div>
      <div class="sf-agency-module-grid" data-agency-module-grid>
      <?php foreach ( $services as $index => $item ) : ?>
        <article class="sf-agency-module" data-agency-mod-cat="<?php echo esc_attr( $item['cat'] ); ?>">
          <div>
            <div class="sf-agency-module-top">
              <span class="sf-agency-module-badge sf-agency-module-badge--<?php echo esc_attr( $item['cat'] ); ?>"><?php echo esc_html( $item['tag'] ); ?></span>
              <label class="sf-agency-module-check"><input type="checkbox" name="agency_services[]" value="<?php echo esc_attr( $item['select'] ); ?>" <?php if ( $index < 2 ) { echo 'checked'; } ?>><span data-agency-check-label><?php echo $index < 2 ? 'Seçili' : 'Seç'; ?></span></label>
            </div>
            <h2><?php echo esc_html( $item['title'] ); ?></h2>
            <p><?php echo esc_html( $item['desc'] ); ?></p>
          </div>
          <div class="sf-agency-module-chips">
            <?php foreach ( $item['chips'] as $chip ) : ?><span><?php echo esc_html( $chip ); ?></span><?php endforeach; ?>
          </div>
        </article>
      <?php endforeach; ?>
      </div>
      <div class="sf-agency-service-selection" data-agency-selection>
        <div><span>PROJE KAPSAM SEÇİMİ</span><p data-agency-selection-summary aria-live="polite">2 hizmet seçildi: Kurumsal Web Sitesi, Elementor Özel Tasarım &amp; Widget</p></div>
        <a href="<?php echo esc_url( $contact ); ?>" data-agency-selected-cta>Seçili Hizmetlerle Teklif Al →</a>
      </div>
    </div>
  </section>
  <section class="sf-agency-service-after">
    <div class="sf-agency-wrap">
      <div><span>TEKNOLOJİLER</span><h2>Özel tasarım. Temiz kod. Sürdürülebilir altyapı.</h2></div>
      <div class="sf-agency-service-technology"><span>WordPress</span><span>Elementor</span><span>WooCommerce</span><span>PHP</span><span>REST API</span><span>Gutenberg</span></div>
    </div>
  </section>
</div>
<!-- /wp:html -->
