<?php
/**
 * Title: Codela — Ajans anasayfası
 * Slug: codela-storefront/agency-home
 * Categories: featured
 * Inserter: yes
 * Description: Referans tasarımdaki 3D kartlı karşılama ve yatay hizmet vitrini.
 *
 * Layout and interaction are adapted from the Codela agency reference HTML
 * (React Bits Card Swap / Aceternity Apple Cards Carousel inspired mockup).
 * No vendor React runtime is bundled; the original reference uses CSS + JS.
 * Visual and interaction styles are scoped to agency mode.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$contact = codela_sf_agency_contact_url();
$contact_href = $contact ?: '#sf-agency-contact';
$account = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : home_url( '/' );
?>
<!-- wp:group {"className":"sf-agency"} -->
<div class="wp-block-group sf-agency">
<!-- wp:group {"tagName":"section","className":"sf-agency-hero"} -->
<section class="wp-block-group sf-agency-hero">
  <div class="sf-agency-hero-grid sf-agency-wrap">
    <div class="sf-agency-intro">
      <!-- wp:paragraph {"className":"sf-agency-eyebrow"} -->
      <p class="sf-agency-eyebrow"><span class="sf-agency-status-dot" aria-hidden="true"></span> codela.dev · 360° WordPress &amp; Yazılım Ajansı</p>
      <!-- /wp:paragraph -->
      <!-- wp:heading {"level":1,"className":"sf-agency-title"} -->
      <h1 class="wp-block-heading sf-agency-title">WordPress'te sınırları kaldıran <em>dijital ajans.</em></h1>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"className":"sf-agency-lead"} -->
      <p class="sf-agency-lead">Kurumsal web siteleri, özel Elementor mimarileri, WooCommerce mağazaları ve hazır çözümlerin yetmediği noktada özel eklenti &amp; API geliştirmeleri.</p>
      <!-- /wp:paragraph -->
      <!-- wp:html -->
      <div class="sf-agency-actions">
        <?php echo codela_sf_ui_button( 'Projemi Anlat', [ 'href' => $contact_href, 'icon' => 'arrow-right' ] ); ?>
        <?php echo codela_sf_ui_button( 'Hizmet Vitrini', [ 'href' => '#sf-agency-services', 'variant' => 'secondary' ] ); ?>
      </div>
      <div class="sf-agency-swap-controls" role="group" aria-label="Kartlı vitrin seçimi">
        <button type="button" class="sf-agency-swap-tab" data-agency-swap-to="0" aria-pressed="true">01 · Web Tasarımı</button>
        <button type="button" class="sf-agency-swap-tab" data-agency-swap-to="1" aria-pressed="false">02 · E-Ticaret</button>
        <button type="button" class="sf-agency-swap-tab" data-agency-swap-to="2" aria-pressed="false">03 · Özel Geliştirme</button>
      </div>
      <!-- /wp:html -->
    </div>
    <!-- wp:html -->
    <div class="sf-agency-swap-stage" data-agency-swap aria-label="Üç boyutlu hizmet vitrini">
      <article class="sf-agency-swap-card sf-agency-swap-card--web" data-agency-card="0" data-pos="0" role="button" tabindex="0" aria-label="Web tasarım kartı. Sonraki kartı göster">
        <div class="sf-agency-window-bar"><span class="sf-agency-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>01 / Kurumsal Web &amp; Elementor</span></div>
        <div class="sf-agency-swap-body">
          <span class="sf-agency-swap-pill">Özel Tema &amp; Elementor</span>
          <h2>Hazır şablon kokmayan, hızlı kurumsal siteler.</h2>
          <p>Markanıza özel tasarlanmış arayüzler, Elementor bileşenleri ve kolayca yönetilebilen esnek sayfa mimarisi.</p>
        </div>
        <div class="sf-agency-swap-foot"><span>Özgün UI/UX</span><span>Mobil öncelikli</span><span>Kolay yönetim</span></div>
      </article>
      <article class="sf-agency-swap-card sf-agency-swap-card--commerce" data-agency-card="1" data-pos="1" role="button" tabindex="-1" aria-hidden="true" aria-label="E-Ticaret kartı. Sonraki kartı göster">
        <div class="sf-agency-window-bar"><span class="sf-agency-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>02 / WooCommerce &amp; E-Ticaret</span></div>
        <div class="sf-agency-swap-body">
          <span class="sf-agency-swap-pill">Anahtar Teslim Mağaza</span>
          <h2>Satışa ve dönüşüme odaklanan e-ticaret.</h2>
          <p>Sanal POS, kargo, ürün yönetimi ve sürtünmesiz ödeme adımları tek bir mağaza deneyiminde buluşur.</p>
        </div>
        <div class="sf-agency-swap-foot"><span>WooCommerce</span><span>POS &amp; Kargo</span><span>Özel Checkout</span></div>
      </article>
      <article class="sf-agency-swap-card sf-agency-swap-card--code" data-agency-card="2" data-pos="2" role="button" tabindex="-1" aria-hidden="true" aria-label="Özel geliştirme kartı. Sonraki kartı göster">
        <div class="sf-agency-window-bar"><span class="sf-agency-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>03 / Özel Eklenti &amp; API</span></div>
        <div class="sf-agency-swap-body">
          <span class="sf-agency-swap-pill">Sıfırdan Plugin &amp; API</span>
          <h2>Hazır eklentilerin yetmediği yerde özel yazılım.</h2>
          <p>İş süreçlerinize özel WordPress eklentileri, ERP/CRM senkronizasyonları ve güvenilir entegrasyonlar.</p>
        </div>
        <div class="sf-agency-swap-foot"><span>Özel Eklenti</span><span>REST API</span><span>ERP / CRM</span></div>
      </article>
    </div>
    <!-- /wp:html -->
  </div>
  <!-- wp:html -->
  <div class="sf-agency-hero-foot sf-agency-wrap"><span>WordPress <i>·</i> Elementor <i>·</i> WooCommerce</span><a href="#sf-agency-services">Hizmetleri keşfet <span aria-hidden="true">↓</span></a></div>
  <!-- /wp:html -->
</section><!-- /wp:group -->

<!-- wp:group {"tagName":"section","className":"sf-agency-services","anchor":"sf-agency-services"} -->
<section class="wp-block-group sf-agency-services" id="sf-agency-services">
  <div class="sf-agency-wrap sf-agency-services-head">
    <div>
      <!-- wp:paragraph {"className":"sf-agency-eyebrow"} -->
      <p class="sf-agency-eyebrow">HİZMET VİTRİNİ</p>
      <!-- /wp:paragraph -->
      <!-- wp:heading {"className":"sf-agency-heading"} -->
      <h2 class="wp-block-heading sf-agency-heading">WordPress üzerine her türlü çözüm.</h2>
      <!-- /wp:heading -->
    </div>
    <!-- wp:html -->
    <div class="sf-agency-carousel-actions">
      <button type="button" class="sf-agency-carousel-arrow" data-agency-carousel-prev aria-label="Hizmetlerde sola kaydır">←</button>
      <button type="button" class="sf-agency-carousel-arrow" data-agency-carousel-next aria-label="Hizmetlerde sağa kaydır">→</button>
    </div>
    <!-- /wp:html -->
  </div>
  <!-- wp:html -->
  <div class="sf-agency-service-track" data-agency-service-track aria-label="Kaydırılabilir hizmet kartları" tabindex="0">
    <article class="sf-agency-poster sf-agency-poster--web">
      <div class="sf-agency-poster-main"><span>01 · KURUMSAL WEB &amp; REDESIGN</span><h3>Markanıza prestij katan, hızlı ve modern kurumsal siteler.</h3></div>
      <div class="sf-agency-poster-bottom"><div class="sf-agency-glass-info"><p>Özel UI/UX &amp; Çok Dilli Yapı</p><p>WordPress &amp; Elementor</p></div><div class="sf-agency-poster-actions"><button type="button" data-agency-detail="web">Kapsamı İncele ↗</button><a href="<?php echo esc_url( $contact_href ); ?>">Teklif Al →</a></div></div>
    </article>
    <article class="sf-agency-poster sf-agency-poster--elementor">
      <div class="sf-agency-poster-main"><span>02 · ELEMENTOR &amp; ÖZEL WIDGET</span><h3>Standart kalıpları aşan, kolay yönetilebilir Elementor kurguları.</h3></div>
      <div class="sf-agency-poster-bottom"><div class="sf-agency-glass-info"><p>Özel Elementor Bileşenleri</p><p>Dinamik İçerik &amp; ACF</p></div><div class="sf-agency-poster-actions"><button type="button" data-agency-detail="elementor">Kapsamı İncele ↗</button><a href="<?php echo esc_url( $contact_href ); ?>">Teklif Al →</a></div></div>
    </article>
    <article class="sf-agency-poster sf-agency-poster--commerce">
      <div class="sf-agency-poster-main"><span>03 · WOOCOMMERCE &amp; E-TİCARET</span><h3>Sanal POS, kargo ve hızlı ödeme adımlarıyla satışa hazır mağazalar.</h3></div>
      <div class="sf-agency-poster-bottom"><div class="sf-agency-glass-info"><p>B2C &amp; B2B Mağaza Kurgusu</p><p>POS, Kargo &amp; E-Fatura</p></div><div class="sf-agency-poster-actions"><button type="button" data-agency-detail="commerce">Kapsamı İncele ↗</button><a href="<?php echo esc_url( $contact_href ); ?>">Teklif Al →</a></div></div>
    </article>
    <article class="sf-agency-poster sf-agency-poster--code">
      <div class="sf-agency-poster-main"><span>04 · ÖZEL EKLENTİ &amp; ENTEGRASYON</span><h3>İşinize özel sıfırdan WordPress eklentisi ve ERP/CRM köprüleri.</h3></div>
      <div class="sf-agency-poster-bottom"><div class="sf-agency-glass-info"><p>Özel Plugin Mimarisi</p><p>ERP, Muhasebe &amp; REST API</p></div><div class="sf-agency-poster-actions"><button type="button" data-agency-detail="code">Kapsamı İncele ↗</button><a href="<?php echo esc_url( $contact_href ); ?>">Teklif Al →</a></div></div>
    </article>
  </div>
  <dialog class="sf-agency-service-dialog" data-agency-dialog aria-labelledby="sf-agency-dialog-title" aria-describedby="sf-agency-dialog-desc">
    <div class="sf-agency-dialog-head"><span data-agency-dialog-label></span><button type="button" data-agency-dialog-close aria-label="Kapat">×</button></div>
    <h2 id="sf-agency-dialog-title" data-agency-dialog-title></h2>
    <p id="sf-agency-dialog-desc" data-agency-dialog-desc></p>
    <ul data-agency-dialog-list></ul>
    <a class="sf-agency-dialog-cta" href="<?php echo esc_url( $contact_href ); ?>">Bu hizmet için teklif iste →</a>
  </dialog>
  <!-- /wp:html -->
</section><!-- /wp:group -->

<!-- wp:group {"tagName":"section","className":"sf-agency-contact sf-agency-wrap","anchor":"sf-agency-contact"} -->
<section class="wp-block-group sf-agency-contact sf-agency-wrap" id="sf-agency-contact">
  <!-- wp:paragraph {"className":"sf-agency-eyebrow"} --><p class="sf-agency-eyebrow">Bir sonraki iyi fikir sizinki.</p><!-- /wp:paragraph -->
  <!-- wp:heading {"className":"sf-agency-heading"} --><h2 class="wp-block-heading sf-agency-heading">Aklınızdakini birlikte netleştirelim.</h2><!-- /wp:heading -->
  <!-- wp:paragraph --><p>Yeni bir başlangıç, daha iyi bir mağaza veya işinizi kolaylaştıracak bir çözüm.</p><!-- /wp:paragraph -->
  <!-- wp:html -->
  <div class="sf-agency-actions">
    <?php if ( $contact ) { echo codela_sf_ui_button( 'Projemi anlatmak istiyorum', [ 'href' => $contact, 'icon' => 'arrow-right' ] ); } ?>
    <?php echo codela_sf_ui_button( 'Müşteri alanına geç', [ 'variant' => $contact ? 'secondary' : 'primary', 'href' => $account, 'icon' => 'user-round' ] ); ?>
  </div>
  <!-- /wp:html -->
</section><!-- /wp:group -->
</div><!-- /wp:group -->
