<?php
/**
 * Title: Codela — Proje başlat / iletişim
 * Slug: codela-storefront/agency-contact
 * Categories: featured
 * Description: Gerçek WordPress iletişim işleyicisine bağlı ajans formu.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$status = isset( $_GET['codela_status'] ) ? sanitize_key( wp_unslash( $_GET['codela_status'] ) ) : '';
$policy = function_exists( 'get_privacy_policy_url' ) ? (string) get_privacy_policy_url() : '';
?>
<!-- wp:html -->
<div class="sf-agency sf-agency-inner-page sf-agency-contact-page" data-agency-contact-page>
  <section class="sf-agency-contact-hero">
    <div class="sf-agency-wrap sf-agency-contact-layout">
      <div class="sf-agency-contact-copy">
        <p class="sf-agency-page-tag">BİRLİKTE ÜRETELİM · CODELA.DEV</p>
        <h1>Yeni projenizin<br><em>ilk adımı.</em></h1>
        <p>Kurumsal site, e-ticaret, özel Elementor bileşeni veya yazılım entegrasyonu. İhtiyacınızı anlatın, kapsamı birlikte netleştirelim.</p>
        <div class="sf-agency-contact-capabilities" aria-label="Uzmanlık alanları">
          <span>WordPress &amp; Elementor</span><span>WooCommerce &amp; Ödeme</span><span>Özel Eklenti &amp; API</span>
        </div>
      </div>
      <div class="sf-agency-contact-form-wrap">
        <div class="sf-agency-contact-form-head"><span>PROJE BAŞLAT</span><h2>Projenizi anlatın.</h2><p>Form doğrudan WordPress üzerinden iletilir.</p></div>
        <?php if ( 'sent' === $status ) : ?>
        <p class="sf-agency-form-message sf-agency-form-message--success" role="status">Talebiniz iletim için alındı. En kısa sürede dönüş yapacağız.</p>
        <?php elseif ( 'failed' === $status ) : ?>
        <p class="sf-agency-form-message sf-agency-form-message--error" role="alert">Talep şu anda iletilemedi. Lütfen tekrar deneyin.</p>
        <?php elseif ( 'invalid' === $status ) : ?>
        <p class="sf-agency-form-message sf-agency-form-message--error" role="alert">Bilgileri kontrol edip tekrar deneyin.</p>
        <?php endif; ?>
        <form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" class="sf-agency-contact-form" data-agency-contact-form>
          <input type="hidden" name="action" value="codela_sf_agency_contact">
          <?php wp_nonce_field( 'codela_sf_agency_contact', 'agency_contact_nonce' ); ?>
          <div class="sf-agency-form-grid">
            <label>Adınız Soyadınız <input type="text" name="agency_name" autocomplete="name" maxlength="120" required placeholder="Adınız Soyadınız"></label>
            <label>E-posta Adresiniz <input type="email" name="agency_email" autocomplete="email" maxlength="180" required placeholder="ornek@firma.com"></label>
          </div>
          <label>Telefon (İsteğe bağlı) <input type="tel" name="agency_phone" autocomplete="tel" maxlength="30" placeholder="05xx xxx xx xx"></label>
          <label>Hangi hizmetler? <input type="text" name="agency_services" maxlength="450" data-agency-contact-services placeholder="Kurumsal site, WooCommerce, özel eklenti..."></label>
          <label>Projenizin Kısa Özeti <textarea name="agency_message" rows="5" maxlength="4000" minlength="10" required placeholder="İhtiyacınızı ve hedeflerinizi kısaca anlatın..."></textarea></label>
          <div class="sf-agency-honey" aria-hidden="true"><label>Bu alan boş kalmalı <input type="text" name="agency_webpage" tabindex="-1" autocomplete="off"></label></div>
          <label class="sf-agency-form-consent"><input type="checkbox" name="agency_consent" value="1" required><span>İletişim bilgilerimin teklif talebime yanıt vermek amacıyla kullanılmasını kabul ediyorum. <?php if ( $policy ) : ?><a href="<?php echo esc_url( $policy ); ?>">Gizlilik politikası</a><?php endif; ?></span></label>
          <button type="submit">Proje Talebi Gönder <span aria-hidden="true">↗</span></button>
        </form>
        <p class="sf-agency-form-foot">Gönderim sonrası talebin alındığına dair durum bilgisi burada görünür.</p>
      </div>
    </div>
  </section>
</div>
<!-- /wp:html -->
