<?php
/**
 * Title: Codela — Birlikte nasıl çalışıyoruz?
 * Slug: codela-storefront/agency-process
 * Categories: featured
 * Description: Referanstaki Sticky Scroll Reveal üç aşamalı süreç.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$agency_contact = function_exists( 'codela_sf_agency_contact_link' ) ? codela_sf_agency_contact_link() : home_url( '/#sf-agency-contact' );
?>
<!-- wp:html -->
<section class="sf-agency-process" id="sf-agency-process" data-agency-process>
  <div class="sf-agency-wrap">
    <header class="sf-agency-process-head">
      <span class="sf-agency-process-kicker">ÇALIŞMA SÜRECİ</span>
      <h2>Birlikte nasıl çalışıyoruz?</h2>
      <p>İhtiyaçtan yayına kadar tüm aşamalarda şeffaf ve ölçülebilir bir iş akışı.</p>
    </header>
    <div class="sf-agency-process-layout">
      <div class="sf-agency-process-steps" role="group" aria-label="Çalışma süreci">
        <button type="button" class="sf-agency-process-step" data-agency-step="0" aria-pressed="true">
          <span class="sf-agency-process-count">01 · Analiz, UX &amp; Altyapı Seçimi</span>
          <strong>İhtiyaca en uygun mimariyi belirleriz.</strong>
          <span>Projenin kurumsal vitrin mi, Elementor ile esnek yönetilecek bir yapı mı yoksa özel entegrasyonlu bir WooCommerce mağazası mı olacağını netleştirip site haritasını çıkarırız.</span>
        </button>
        <button type="button" class="sf-agency-process-step" data-agency-step="1" aria-pressed="false">
          <span class="sf-agency-process-count">02 · Tasarım, Elementor &amp; Özel Kodlama</span>
          <strong>Canlı test sunucusunda adım adım üretim.</strong>
          <span>Arayüzü, özel Elementor bileşenlerini ve WooCommerce entegrasyonlarını geliştirirken süreç boyunca kontrol ve geri bildirim imkânı sunarız.</span>
        </button>
        <button type="button" class="sf-agency-process-step" data-agency-step="2" aria-pressed="false">
          <span class="sf-agency-process-count">03 · Hız Optimizasyonu, Yayın &amp; Destek</span>
          <strong>Kontrollerden sonra yayın ve sürekli bakım.</strong>
          <span>Mobil uyumluluk, teknik SEO, güvenlik ve performans testlerini tamamlayıp siteyi yayına alır; bakım ve yeni geliştirmeler için destek sağlarız.</span>
        </button>
      </div>
      <div class="sf-agency-process-sticky">
        <div class="sf-agency-process-stage" data-agency-process-stage data-step="0" aria-live="polite" aria-atomic="true">
          <div class="sf-agency-process-stage-top">
            <span data-agency-stage-kicker>01 · ANALİZ &amp; MİMARİ</span>
            <span data-agency-stage-badge>YOL HARİTASI</span>
          </div>
          <div class="sf-agency-process-stage-rows" data-agency-stage-rows>
            <div class="sf-agency-process-stage-row"><span>✓ Kurumsal kimlik &amp; sayfa akış planı</span><em>Planlandı</em></div>
            <div class="sf-agency-process-stage-row"><span>✓ Elementor / WooCommerce / eklenti kapsamı</span><em>Netleştirildi</em></div>
          </div>
          <div class="sf-agency-process-stage-foot"><span data-agency-stage-note>Soldaki adımları seçerek süreci inceleyin.</span>
            <a href="<?php echo esc_url( $agency_contact ); ?>">Süreci Başlat →</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->
