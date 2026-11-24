<?php
/**
 * Agency contact: one always-visible secure form and verified direct channels.
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
          </header>
          <div id="sf-agency-contact-form" class="cdl-contact__body">
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
              <label>Telefon (İsteğe bağlı)
                <input name="agency_phone" type="tel" maxlength="30" autocomplete="tel"
                       placeholder="05xx xxx xx xx"></label>
              <?php if ( $selected ) : ?><input type="hidden" name="agency_services" value="<?php echo esc_attr( $selected ); ?>"><?php endif; ?>
              <label>Mesajınız
                <textarea name="agency_message" rows="4" minlength="10" maxlength="4000"
                          required placeholder="Nasıl yardımcı olabiliriz?"></textarea></label>
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

            <?php if ( is_email( $email ) || $has_whatsapp ) : ?>
              <div class="cdl-contact__channels" aria-label="Diğer iletişim yolları">
                <?php if ( is_email( $email ) ) : ?>
                  <button type="button" data-agency-copy-email data-email="<?php echo esc_attr( $email ); ?>">
                    <span><?php echo esc_html( $email ); ?></span><small data-agency-copy-hint aria-live="polite">E-postayı kopyala</small>
                  </button>
                <?php endif; ?>
                <?php if ( $has_whatsapp ) : ?>
                  <a href="<?php echo esc_url( 'https://wa.me/' . $phone_digits ); ?>" target="_blank" rel="noopener noreferrer">WhatsApp <span aria-hidden="true">↗</span></a>
                <?php endif; ?>
              </div>
            <?php endif; ?>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
