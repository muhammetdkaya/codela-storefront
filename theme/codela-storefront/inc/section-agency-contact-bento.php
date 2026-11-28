<?php
/**
 * Editorial contact: map and four parallel actions with optional WhatsApp topics.
 * Preserve the secure enquiry form as fallback when channels are not configured.
 * No prototype device/status bars, unverified WhatsApp number, fake email or
 * fictitious "available now" status may reach the public website.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
require_once __DIR__ . '/public-contact.php';

function codela_sf_section_agency_contact_bento( array $data, string $type = '' ): string {
    $title = trim( (string) ( $data['title'] ?? '' ) );
    if ( '' === $title ) { return ''; }
    $lead = trim( (string) ( $data['description'] ?? '' ) );
    $email = (string) ( $data['public_email'] ?? '' );
    $studio = 'Codela Stüdyo';
    $public_contact = codela_sf_public_contact();
    $project = codela_sf_agency_project_url();
    $form_id = codela_sf_agency_dom_id( 'sf-agency-contact-form' );
    $source = codela_sf_agency_form_context( 'agency-contact-bento', $data );
    $form_title_id = codela_sf_agency_dom_id( 'cdl-contact-form-title' );
    $project_href = $project ?: '#' . $form_id;
    $phone_url = codela_sf_contact_href( 'phone', $public_contact );
    $wa_url = codela_sf_contact_href( 'whatsapp', $public_contact );
    $mail_url = codela_sf_contact_href( 'email', $public_contact );
    $phone_display = preg_replace( '/^(\+90)(\d{3})(\d{3})(\d{2})(\d{2})$/D', '$1 $2 $3 $4 $5', $public_contact['phone'] );
    $wa_topics = [
        'Web Tasarım' => 'Merhaba, markamız için yeni bir web sitesi planlıyoruz. Kapsam ve takvim hakkında kısa bilgi alabilir miyim?',
        'E-Ticaret' => 'Merhaba, e-ticaret mağazamız için tasarım ve geliştirme desteği arıyoruz. Uygun olduğunuzda görüşebilir miyiz?',
        'Özel Yazılım' => 'Merhaba, ekibimiz için özel bir panel ve entegrasyon fikrimiz var. Detayları paylaşabilirim.',
    ];
    $wa_first = reset( $wa_topics );
    $wa_id = codela_sf_agency_dom_id( 'cdl-contact-wa' );
    $row = 1;
    $policy = function_exists( 'get_privacy_policy_url' ) ? (string) get_privacy_policy_url() : '';
    $status = isset( $_GET['codela_status'] ) && is_string( $_GET['codela_status'] )
        ? sanitize_key( wp_unslash( $_GET['codela_status'] ) ) : '';
    $target = isset( $_GET['codela_component'] ) && is_string( $_GET['codela_component'] ) ? wp_unslash( $_GET['codela_component'] ) : '';
    if ( $target ? $target !== $source[1] : 'sf-agency-contact-form' !== $form_id ) { $status = ''; }
    $selected = isset( $_GET['hizmetler'] ) && is_string( $_GET['hizmetler'] )
        ? sanitize_text_field( wp_unslash( $_GET['hizmetler'] ) ) : '';
    $selected = function_exists( 'mb_substr' ) ? mb_substr( $selected, 0, 450 ) : substr( $selected, 0, 450 );
    $id = codela_sf_agency_dom_id( 'cdl-contact-' . sanitize_html_class( (string) ( $data['id'] ?? 'agency' ) ) );
    // Public map configuration is explicit page metadata, never visitor location
    // or a private WooCommerce billing/store address.
    $map_point = codela_sf_contact_map_point( function_exists( 'get_queried_object_id' ) && function_exists( 'get_post_meta' ) ? get_post_meta( get_queried_object_id(), 'codela_contact_map_coordinates', true ) : '' );
    // Explicit page coordinates override the shared public contact point.
    $area_point = codela_sf_contact_map_point( $public_contact['area_lat'] . ',' . $public_contact['area_lon'] );
    $map_center = $map_point ?: $area_point;
    $map_bbox = $map_center ? implode( ',', [ max( -180, $map_center[1] - .006 ), max( -85, $map_center[0] - .004 ), min( 180, $map_center[1] + .006 ), min( 85, $map_center[0] + .004 ) ] ) : '28.65,40.85,29.35,41.20';
    $map_url = 'https://www.openstreetmap.org/export/embed.html?bbox=' . rawurlencode( $map_bbox ) . '&layer=mapnik';
    $map_link = 'https://www.openstreetmap.org/#map=11/41.028/28.995';
    if ( $map_center ) {
        $map_url .= '&marker=' . rawurlencode( implode( ',', $map_center ) );
        $map_link = 'https://www.openstreetmap.org/?mlat=' . $map_center[0] . '&mlon=' . $map_center[1] . '#map=16/' . implode( '/', $map_center );
    }
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
          <div class="cdl-contact__grid cdl-contact__editorial">
            <div class="cdl-contact__card--map cdl-contact__map-frame" data-contact-map
                 data-map-lat="<?php echo esc_attr( $map_center ? (string) $map_center[0] : '41.028' ); ?>"
                 data-map-lon="<?php echo esc_attr( $map_center ? (string) $map_center[1] : '28.995' ); ?>"
                 data-map-office="<?php echo $map_center ? 'true' : 'false'; ?>" data-map-area="<?php echo $area_point ? 'true' : 'false'; ?>">
              <iframe class="cdl-contact__map-fallback" title="İstanbul haritası" src="<?php echo esc_url( $map_url ); ?>" loading="lazy" referrerpolicy="no-referrer" tabindex="-1"></iframe>
              <div class="cdl-contact__map-live" data-contact-map-live aria-label="İstanbul haritası"></div>
              <div class="cdl-contact__map-scrim" aria-hidden="true"></div>
              <div class="cdl-contact__map-overlay">
                <div class="cdl-contact__map-bottom">
                  <a href="<?php echo esc_url( $map_link ); ?>" class="cdl-contact__map-location" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr( $studio . ' — haritada aç' ); ?>"><strong><?php echo esc_html( $studio ); ?></strong><small><?php echo $map_center ? esc_html( $public_contact['district'] ?: 'İstanbul' ) : 'İstanbul · Online çalışma'; ?></small></a>
                </div>
              </div>
              <a class="cdl-contact__map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
            </div>
            <div class="cdl-contact__actions cdl-contact__actions--editorial">
              <a class="cdl-contact__action cdl-contact__card--primary" href="<?php echo esc_url( $project_href ); ?>">
                <span class="cdl-contact__action-left"><span class="cdl-contact__num">01</span><span class="cdl-contact__action-copy"><strong>Proje Başlat</strong><small>Kapsam ve tahmini bütçeyi birlikte netleştirelim.</small></span></span>
                <span class="cdl-contact__row-arrow" aria-hidden="true">→</span>
              </a>
              <?php if ( $wa_url ) : ?>
              <details class="cdl-contact__wa" data-contact-whatsapp>
                <summary class="cdl-contact__action">
                  <span class="cdl-contact__action-left"><span class="cdl-contact__num"><?php echo esc_html( sprintf('%02d', ++$row) ); ?></span><span class="cdl-contact__action-copy"><strong>WhatsApp'tan Yaz</strong><small>Konunu seç, hazır mesajla sohbeti başlat.</small></span></span>
                  <span class="cdl-contact__row-arrow" aria-hidden="true">+</span>
                </summary>
                <div class="cdl-contact__wa-drawer">
                  <fieldset class="cdl-contact__wa-topics">
                    <legend class="screen-reader-text">Görüşme konusu</legend>
                    <?php $first = true; foreach ( $wa_topics as $topic => $message ) : ?>
                      <label class="cdl-contact__wa-topic"><input type="radio" name="<?php echo esc_attr( $wa_id ); ?>" value="<?php echo esc_attr( $message ); ?>"<?php echo $first ? ' checked' : ''; ?>><span><?php echo esc_html( $topic ); ?></span></label>
                    <?php $first = false; endforeach; ?>
                  </fieldset>
                  <p class="cdl-contact__wa-preview" data-wa-preview aria-live="polite">“<?php echo esc_html( $wa_first ); ?>”</p>
                  <a class="cdl-contact__wa-go" data-wa-launch data-wa-url="<?php echo esc_url( $wa_url ); ?>" data-codela-contact="whatsapp" data-contact-placement="contact" href="<?php echo esc_url( $wa_url . '?text=' . rawurlencode( $wa_first ) ); ?>" target="_blank" rel="noopener noreferrer">WhatsApp'ı Aç <span aria-hidden="true">↗</span></a>
                </div>
              </details>
              <?php endif; ?>
              <?php if ( $phone_url ) : ?>
              <a class="cdl-contact__action cdl-contact__action--compact" href="<?php echo esc_url( $phone_url ); ?>" data-codela-contact="phone" data-contact-placement="contact">
                <span class="cdl-contact__action-left"><span class="cdl-contact__num"><?php echo esc_html( sprintf('%02d', ++$row) ); ?></span><span class="cdl-contact__action-copy"><strong>Bizi Ara</strong><small><?php echo esc_html( $phone_display ); ?></small></span></span><span class="cdl-contact__row-arrow" aria-hidden="true">↗</span>
              </a>
              <?php endif; ?>
              <?php if ( $mail_url ) : ?>
              <a class="cdl-contact__action cdl-contact__action--compact" href="<?php echo esc_url( $mail_url ); ?>" data-codela-contact="email" data-contact-placement="contact">
                <span class="cdl-contact__action-left"><span class="cdl-contact__num"><?php echo esc_html( sprintf('%02d', ++$row) ); ?></span><span class="cdl-contact__action-copy"><strong>Mail Gönder</strong><small><?php echo esc_html( $public_contact['email'] ); ?></small></span></span><span class="cdl-contact__row-arrow" aria-hidden="true">↗</span>
              </a>
              <?php endif; ?>
              <?php if ( ! $project || ! $wa_url || ! $phone_url || ! $mail_url || $status || $selected ) : ?>
              <details id="<?php echo esc_attr( $form_id ); ?>" data-contact-disclosure class="cdl-contact__form-toggle"<?php echo ( $status || ( 'sf-agency-contact-form' === $form_id && $selected ) ) ? ' open' : ''; ?>>
                <summary class="cdl-contact__action">
                  <span class="cdl-contact__action-left"><span class="cdl-contact__num"><?php echo esc_html( sprintf('%02d', ++$row) ); ?></span><span class="cdl-contact__action-copy"><strong>Mesaj Gönder</strong><small>Kısa bir soru veya ön bilgi bırak, sana dönüş yapalım.</small></span></span>
                  <span class="cdl-contact__row-arrow" aria-hidden="true">↗</span>
                </summary>
      <div class="cdl-contact-form-section" aria-labelledby="<?php echo esc_attr( $form_title_id ); ?>">
        <div class="cdl-contact-form-section__inner">
          <div class="cdl-contact-form-section__form-wrap">
            <div class="cdl-contact__sheet-head"><h2 id="<?php echo esc_attr( $form_title_id ); ?>">Mesaj Gönder</h2><button type="button" data-contact-close aria-label="Kapat" class="cdl-contact__row-arrow">×</button></div>
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
              <?php codela_sf_agency_nonce_input( 'codela_sf_agency_contact', 'agency_contact_nonce' ); codela_sf_agency_form_context_input( $source ); ?>
              <div class="cdl-contact__form-row">
                <label class="cdl-floating-field"><input name="agency_name" type="text" maxlength="120"
                       autocomplete="name" required placeholder=" "><span class="cdl-floating-label">Ad soyad</span></label>
                <label class="cdl-floating-field"><input name="agency_email" type="email" maxlength="180"
                       autocomplete="email" required placeholder=" "><span class="cdl-floating-label">E-posta</span></label>
              </div>
              <input type="hidden" name="agency_services" data-agency-contact-services value="<?php echo esc_attr( $selected ); ?>">
              <label class="cdl-floating-field">
                <textarea name="agency_message" rows="4" minlength="10" maxlength="4000"
                          required placeholder=" "></textarea><span class="cdl-floating-label">Mesaj</span></label>
              <div class="cdl-contact__honey" aria-hidden="true">
                <label>Bu alan boş kalmalı<input type="text" name="agency_webpage" tabindex="-1" autocomplete="off"></label>
              </div>
              <label class="cdl-contact__consent">
                <input type="checkbox" name="agency_consent" value="1" required>
                <span>İletişim bilgilerimin teklif talebime yanıt vermek amacıyla kullanılmasını kabul ediyorum.
                  <?php if ( $policy ) : ?><a href="<?php echo esc_url( $policy ); ?>">Gizlilik politikası</a><?php endif; ?></span>
              </label>
              <button class="cdl-contact__submit" type="submit">Mesajı Gönder <span aria-hidden="true">↗</span></button>
            </form>
            <?php if ( is_email( $email ) ) : ?>
              <div class="cdl-contact__sheet-alt"><span>veya e-posta ile</span><button type="button" data-agency-copy-email data-email="<?php echo esc_attr( $email ); ?>"><span data-agency-copy-hint><?php echo esc_html( $email ); ?></span></button></div>
            <?php endif; ?>
          </div>
        </div>
      </div>
            </details>
              <?php endif; ?>
            </div>
          </div>
        </div>
      </section>

    </div>
    <?php
    return (string) ob_get_clean();
}

/** Accept only explicitly entered, valid public map coordinates. */
function codela_sf_contact_map_point( $value ): array {
    if ( ! is_string( $value ) || ! preg_match( '/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/D', $value, $match ) ) { return []; }
    $lat = (float) $match[1]; $lon = (float) $match[2];
    return abs( $lat ) <= 85 && abs( $lon ) <= 180 ? [ $lat, $lon ] : [];
}
