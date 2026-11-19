<?php
/**
 * Approved MONA contact Bento: a dominant project card, two small contact
 * actions, one studio strip, plus the existing secure WordPress enquiry form.
 * No prototype device/status bars, unverified WhatsApp number, fake email or
 * fictitious "available now" status may reach the public website.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_contact_bento( array $data, string $type = '' ): string {
    $title = trim( (string) ( $data['title'] ?? '' ) );
    if ( '' === $title ) { return ''; }
    $lead = trim( (string) ( $data['description'] ?? '' ) );
    $email = (string) ( $data['public_email'] ?? '' );
    $phone = (string) ( $data['whatsapp_phone'] ?? '' );
    $phone_digits = preg_replace( '/\D+/', '', $phone );
    $has_whatsapp = strlen( $phone_digits ) >= 10 && strlen( $phone_digits ) <= 15;
    $studio = trim( (string) ( $data['studio_name'] ?? '' ) ) ?: 'Codela · Dijital stüdyo';
    $hours = trim( (string) ( $data['studio_hours'] ?? '' ) );
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/' ) );
    $policy = function_exists( 'get_privacy_policy_url' ) ? (string) get_privacy_policy_url() : '';
    $status = isset( $_GET['codela_status'] ) && is_string( $_GET['codela_status'] )
        ? sanitize_key( wp_unslash( $_GET['codela_status'] ) ) : '';
    $selected = isset( $_GET['hizmetler'] ) && is_string( $_GET['hizmetler'] )
        ? sanitize_text_field( wp_unslash( $_GET['hizmetler'] ) ) : '';
    $selected = function_exists( 'mb_substr' ) ? mb_substr( $selected, 0, 450 ) : substr( $selected, 0, 450 );
    $id = 'cdl-contact-' . sanitize_html_class( (string) ( $data['id'] ?? 'agency' ) );
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--contact-bento" data-agency-widget="contact-bento">
      <section class="cdl-contact" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="cdl-contact__inner">
          <header class="cdl-contact__header">
            <div>
              <p class="cdl-contact__eyebrow">İLETİŞİM</p>
              <h1 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $title ); ?></h1>
              <?php if ( $lead ) : ?><p class="cdl-contact__lead"><?php echo esc_html( $lead ); ?></p><?php endif; ?>
            </div>
            <span class="cdl-contact__brand">CODELA</span>
          </header>
          <div class="cdl-contact__grid">
            <a class="cdl-contact__card cdl-contact__card--primary" href="#sf-agency-contact-form"
               aria-label="Proje başlat: iletişim formuna geç">
              <span class="cdl-contact__light cdl-contact__light--right" aria-hidden="true"></span>
              <span class="cdl-contact__fluted" aria-hidden="true"></span>
              <span class="cdl-contact__top">
                <span class="cdl-contact__pill"><i aria-hidden="true"></i> Yeni Proje</span>
                <span class="cdl-contact__arrow cdl-contact__arrow--solid" aria-hidden="true">→</span>
              </span>
              <span class="cdl-contact__bottom">
                <strong>Proje Başlat</strong>
                <span>2 adımda kapsamı seç, sana özel yol haritası hazırlayalım.</span>
              </span>
            </a>

            <?php if ( is_email( $email ) ) : ?>
              <button class="cdl-contact__card cdl-contact__card--small" type="button"
                      data-agency-copy-email data-email="<?php echo esc_attr( $email ); ?>">
                <span class="cdl-contact__light cdl-contact__light--top" aria-hidden="true"></span>
                <span class="cdl-contact__top">
                  <span class="cdl-contact__small-label">E-POSTA</span>
                  <span class="cdl-contact__arrow" aria-hidden="true">↗</span>
                </span>
                <span class="cdl-contact__bottom">
                  <strong><?php echo esc_html( $email ); ?></strong>
                  <span data-agency-copy-hint aria-live="polite">Kopyalamak için dokun</span>
                </span>
              </button>
            <?php else : ?>
              <a class="cdl-contact__card cdl-contact__card--small" href="#sf-agency-contact-form">
                <span class="cdl-contact__light cdl-contact__light--top" aria-hidden="true"></span>
                <span class="cdl-contact__top"><span class="cdl-contact__small-label">E-POSTA</span>
                  <span class="cdl-contact__arrow" aria-hidden="true">↗</span></span>
                <span class="cdl-contact__bottom"><strong>Mesaj gönder</strong><span>İletişim formundan yaz</span></span>
              </a>
            <?php endif; ?>

            <?php if ( $has_whatsapp ) : ?>
              <a class="cdl-contact__card cdl-contact__card--small"
                 href="<?php echo esc_url( 'https://wa.me/' . $phone_digits ); ?>"
                 target="_blank" rel="noopener noreferrer">
                <span class="cdl-contact__light cdl-contact__light--top" aria-hidden="true"></span>
                <span class="cdl-contact__top"><span class="cdl-contact__small-label">HIZLI HAT</span>
                  <span class="cdl-contact__arrow" aria-hidden="true">↗</span></span>
                <span class="cdl-contact__bottom"><strong>WhatsApp</strong>
                  <span><?php echo esc_html( $phone ); ?></span></span>
              </a>
            <?php else : ?>
              <a class="cdl-contact__card cdl-contact__card--small" href="<?php echo esc_url( $services ); ?>">
                <span class="cdl-contact__light cdl-contact__light--top" aria-hidden="true"></span>
                <span class="cdl-contact__top"><span class="cdl-contact__small-label">HİZMETLER</span>
                  <span class="cdl-contact__arrow" aria-hidden="true">↗</span></span>
                <span class="cdl-contact__bottom"><strong>Neler yapıyoruz?</strong>
                  <span>Hizmetleri keşfet</span></span>
              </a>
            <?php endif; ?>

            <div class="cdl-contact__card cdl-contact__card--strip">
              <span class="cdl-contact__studio">
                <strong><?php echo esc_html( $studio ); ?></strong>
                <span><?php echo esc_html( $hours ?: 'Web, e-ticaret ve özel yazılım çözümleri' ); ?></span>
              </span>
              <span class="cdl-contact__pill cdl-contact__pill--quiet"><i aria-hidden="true"></i> Dijital stüdyo</span>
            </div>
          </div>
        </div>
      </section>
      <section id="sf-agency-contact-form" class="cdl-contact-form-section" aria-labelledby="cdl-contact-form-title">
        <div class="cdl-contact-form-section__inner">
          <div class="cdl-contact-form-section__intro">
            <p class="cdl-contact__eyebrow">KISA MESAJ</p>
            <h2 id="cdl-contact-form-title">Projenizi anlatın.</h2>
            <p>İhtiyacınızı paylaşın, kapsamı birlikte netleştirelim.</p>
          </div>
          <div class="cdl-contact-form-section__form-wrap">
            <?php if ( 'sent' === $status ) : ?>
              <p class="cdl-contact__notice cdl-contact__notice--success" role="status">Mesajınız gönderildi. Teşekkür ederiz.</p>
            <?php elseif ( 'failed' === $status ) : ?>
              <p class="cdl-contact__notice cdl-contact__notice--error" role="alert">Mesaj iletilemedi. Tekrar deneyin.</p>
            <?php elseif ( 'invalid' === $status ) : ?>
              <p class="cdl-contact__notice cdl-contact__notice--error" role="alert">Bilgileri kontrol edip tekrar deneyin.</p>
            <?php elseif ( 'wait' === $status ) : ?>
              <p class="cdl-contact__notice" role="status">Kısa süre önce mesaj gönderdiniz. Bir dakika sonra deneyin.</p>
            <?php endif; ?>
            <form class="cdl-contact__form" data-agency-contact-form method="post"
                  action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
              <input type="hidden" name="action" value="codela_sf_agency_contact">
              <?php wp_nonce_field( 'codela_sf_agency_contact', 'agency_contact_nonce' ); ?>
              <div class="cdl-contact__form-row">
                <label>Ad Soyad<input name="agency_name" type="text" maxlength="120"
                       autocomplete="name" required placeholder="Adınız Soyadınız"></label>
                <label>E-posta<input name="agency_email" type="email" maxlength="180"
                       autocomplete="email" required placeholder="ornek@firma.com"></label>
              </div>
              <label>Telefon <span>(İsteğe bağlı)</span>
                <input name="agency_phone" type="tel" maxlength="30" autocomplete="tel"
                       placeholder="05xx xxx xx xx"></label>
              <label>Hangi hizmetler?
                <input name="agency_services" type="text" maxlength="450"
                       data-agency-contact-services value="<?php echo esc_attr( $selected ); ?>"
                       placeholder="Web Tasarım, E-Ticaret, Özel Yazılım..."></label>
              <label>Projenin kısa özeti
                <textarea name="agency_message" rows="4" minlength="10" maxlength="4000"
                          required placeholder="Hedefinizi ve ihtiyacınızı kısaca anlatın..."></textarea></label>
              <div class="cdl-contact__honey" aria-hidden="true">
                <label>Bu alan boş kalmalı<input type="text" name="agency_webpage" tabindex="-1" autocomplete="off"></label>
              </div>
              <label class="cdl-contact__consent">
                <input type="checkbox" name="agency_consent" value="1" required>
                <span>İletişim bilgilerimin teklif talebime yanıt vermek amacıyla kullanılmasını kabul ediyorum.
                  <?php if ( $policy ) : ?><a href="<?php echo esc_url( $policy ); ?>">Gizlilik politikası</a><?php endif; ?></span>
              </label>
              <button class="cdl-contact__submit" type="submit">Mesaj Gönder <span aria-hidden="true">↗</span></button>
            </form>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
