<?php
/**
 * Editorial contact: Istanbul map, two action rows, with a native
 * disclosure for the existing secure WordPress enquiry form.
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
    $public_address = codela_sf_contact_address( $public_contact );
    $project = codela_sf_agency_project_url();
    $form_id = codela_sf_agency_dom_id( 'sf-agency-contact-form' );
    $source = codela_sf_agency_form_context( 'agency-contact-bento', $data );
    $form_title_id = codela_sf_agency_dom_id( 'cdl-contact-form-title' );
    $project_href = $project ?: '#' . $form_id;
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
    $area_point = codela_sf_contact_map_point( $public_contact['area_lat'] . ',' . $public_contact['area_lon'] );
    $map_center = $map_point ?: $area_point;
    $map_bbox = $map_center ? implode( ',', [ max( -180, $map_center[1] - .009 ), max( -85, $map_center[0] - .006 ), min( 180, $map_center[1] + .009 ), min( 85, $map_center[0] + .006 ) ] ) : '28.65,40.85,29.35,41.20';
    $map_url = 'https://www.openstreetmap.org/export/embed.html?bbox=' . rawurlencode( $map_bbox ) . '&layer=mapnik';
    $map_link = 'https://www.openstreetmap.org/#map=11/41.028/28.995';
    if ( $map_point ) {
        $map_url .= '&marker=' . rawurlencode( implode( ',', $map_point ) );
        $map_link = 'https://www.openstreetmap.org/?mlat=' . $map_point[0] . '&mlon=' . $map_point[1] . '#map=15/' . implode( '/', $map_point );
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
                 data-map-office="<?php echo $map_point ? 'true' : 'false'; ?>" data-map-area="<?php echo $area_point ? 'true' : 'false'; ?>">
              <iframe class="cdl-contact__map-fallback" title="İstanbul haritası" src="<?php echo esc_url( $map_url ); ?>" loading="lazy" referrerpolicy="no-referrer" tabindex="-1"></iframe>
              <div class="cdl-contact__map-live" data-contact-map-live aria-label="İstanbul haritası"></div>
              <div class="cdl-contact__map-scrim" aria-hidden="true"></div>
              <div class="cdl-contact__map-overlay">
                <span class="cdl-contact__map-chip">İSTANBUL · GMT+3</span>
                <div class="cdl-contact__map-bottom">
                  <span><strong><i aria-hidden="true"></i><?php echo esc_html( $studio ); ?></strong><small><?php echo $map_point ? 'Ofis konumu' : ( $area_point ? 'Başakşehir · Adres çevresi' : 'İstanbul · Online çalışma' ); ?></small></span>
                  <a href="<?php echo esc_url( $map_link ); ?>" data-contact-map-center target="_blank" rel="noopener noreferrer" class="cdl-contact__map-center">Merkezle</a>
                </div>
              </div>
              <a class="cdl-contact__map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
            </div>
            <div class="cdl-contact__actions">
              <?php if ( $public_address ) : ?><div class="sf-public-address"><strong><?php echo esc_html( $public_address ); ?></strong><a href="<?php echo esc_url( 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $public_address ) ); ?>" target="_blank" rel="noopener noreferrer">Yol tarifi ↗</a></div><?php endif; ?>
              <?php foreach ( [ 'phone' => $public_contact['phone'], 'whatsapp' => 'WhatsApp', 'email' => $public_contact['email'] ] as $kind => $label ) : ?>
                <?php echo codela_sf_contact_link( $kind, $label, $public_contact, 'sf-direct-contact cdl-contact__direct', 'contact' ); ?>
              <?php endforeach; ?>
              <a class="cdl-contact__action cdl-contact__card--primary" href="<?php echo esc_url( $project_href ); ?>">
                <span class="cdl-contact__action-left"><span class="cdl-contact__num">01</span><span class="cdl-contact__action-copy"><strong>Proje Başlat</strong><small>Hedefini anlat, kapsam ve yol haritasını birlikte çıkaralım.</small></span></span>
                <span class="cdl-contact__row-arrow" aria-hidden="true">→</span>
              </a>
              <details id="<?php echo esc_attr( $form_id ); ?>" data-contact-disclosure class="cdl-contact__form-toggle"<?php echo ( $status || ( 'sf-agency-contact-form' === $form_id && $selected ) ) ? ' open' : ''; ?>>
                <summary class="cdl-contact__action">
                  <span class="cdl-contact__action-left"><span class="cdl-contact__num">02</span><span class="cdl-contact__action-copy"><strong>Mesaj Gönder</strong><small>Kısa bir soru veya ön bilgi bırak, sana dönüş yapalım.</small></span></span>
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
                <label>Ad Soyad<input name="agency_name" type="text" maxlength="120"
                       autocomplete="name" required placeholder="Adınız Soyadınız"></label>
                <label>E-posta<input name="agency_email" type="email" maxlength="180"
                       autocomplete="email" required placeholder="ornek@firma.com"></label>
              </div>
              <input type="hidden" name="agency_services" data-agency-contact-services value="<?php echo esc_attr( $selected ); ?>">
              <label>Mesaj
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
              <button class="cdl-contact__submit" type="submit">Mesajı Gönder <span aria-hidden="true">↗</span></button>
            </form>
            <?php if ( is_email( $email ) ) : ?>
              <div class="cdl-contact__sheet-alt"><span>veya e-posta ile</span><button type="button" data-agency-copy-email data-email="<?php echo esc_attr( $email ); ?>"><span data-agency-copy-hint><?php echo esc_html( $email ); ?></span></button></div>
            <?php endif; ?>
          </div>
        </div>
      </div>
            </details>
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
