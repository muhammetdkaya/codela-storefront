<?php
/**
 * MONA contact Bento: map, project and real contact cards, with a native
 * disclosure for the existing secure WordPress enquiry form.
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
    $project = codela_sf_agency_project_url();
    $project_href = $project ?: '#sf-agency-contact-form';
    $policy = function_exists( 'get_privacy_policy_url' ) ? (string) get_privacy_policy_url() : '';
    $status = isset( $_GET['codela_status'] ) && is_string( $_GET['codela_status'] )
        ? sanitize_key( wp_unslash( $_GET['codela_status'] ) ) : '';
    $selected = isset( $_GET['hizmetler'] ) && is_string( $_GET['hizmetler'] )
        ? sanitize_text_field( wp_unslash( $_GET['hizmetler'] ) ) : '';
    $selected = function_exists( 'mb_substr' ) ? mb_substr( $selected, 0, 450 ) : substr( $selected, 0, 450 );
    $id = 'cdl-contact-' . sanitize_html_class( (string) ( $data['id'] ?? 'agency' ) );
    // Public map configuration is explicit page metadata, never visitor location
    // or a private WooCommerce billing/store address.
    $map_point = codela_sf_contact_map_point( function_exists( 'get_queried_object_id' ) ? get_post_meta( get_queried_object_id(), 'codela_contact_map_coordinates', true ) : '' );
    $map_bbox = $map_point ? implode( ',', [ max( -180, $map_point[1] - .018 ), max( -85, $map_point[0] - .011 ), min( 180, $map_point[1] + .018 ), min( 85, $map_point[0] + .011 ) ] ) : '25.5,35.5,45,42.5';
    $map_url = 'https://www.openstreetmap.org/export/embed.html?bbox=' . rawurlencode( $map_bbox ) . '&layer=mapnik';
    $map_link = 'https://www.openstreetmap.org/#map=6/39/35';
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
          <div class="cdl-contact__grid">
            <div class="cdl-contact__card cdl-contact__card--map">
              <iframe title="Konum haritası" src="<?php echo esc_url( $map_url ); ?>" loading="lazy" referrerpolicy="no-referrer" tabindex="-1"></iframe>
              <div class="cdl-contact__map-caption">
                <span><strong>Konum</strong><small><?php echo $map_point ? 'Ofis konumu' : 'Genel görünüm · ofis konumu henüz belirtilmedi'; ?></small></span>
                <a href="<?php echo esc_url( $map_link ); ?>" target="_blank" rel="noopener noreferrer" aria-label="Haritayı yeni sekmede aç" class="cdl-contact__arrow">↗</a>
              </div>
              <a class="cdl-contact__map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
            </div>
            <a class="cdl-contact__card cdl-contact__card--primary" href="<?php echo esc_url( $project_href ); ?>"
               aria-label="<?php echo esc_attr( $project ? 'Proje Başlat sayfasına git' : 'Proje başlat: iletişim formuna geç' ); ?>">
              <span class="cdl-contact__light cdl-contact__light--right" aria-hidden="true"></span>
              <span class="cdl-contact__fluted" aria-hidden="true"></span>
              <span class="cdl-contact__top">
                <span class="cdl-contact__pill"><i aria-hidden="true"></i> Yeni Proje</span>
                <span class="cdl-contact__arrow cdl-contact__arrow--solid" aria-hidden="true">→</span>
              </span>
              <span class="cdl-contact__bottom">
                <strong>Proje Başlat</strong>
                <span>Hedefini kısaca anlat, sana özel yol haritasını birlikte çıkaralım.</span>
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
            <?php endif; ?>

            <details id="sf-agency-contact-form" class="cdl-contact__form-toggle<?php echo (bool) is_email( $email ) === $has_whatsapp ? ' cdl-contact__form-toggle--wide' : ''; ?>"<?php echo ( $status || $selected ) ? ' open' : ''; ?>>
              <summary class="cdl-contact__card cdl-contact__card--small">
                <span class="cdl-contact__light cdl-contact__light--top" aria-hidden="true"></span>
                <span class="cdl-contact__top"><span class="cdl-contact__small-label">İLETİŞİM FORMU</span>
                  <span class="cdl-contact__arrow" aria-hidden="true">↗</span></span>
                <span class="cdl-contact__bottom"><strong>Mesaj gönder</strong><span>İletişim formunu aç</span></span>
              </summary>
      <div class="cdl-contact-form-section" aria-labelledby="cdl-contact-form-title">
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
              <label>Telefon (İsteğe bağlı)
                <input name="agency_phone" type="tel" maxlength="30" autocomplete="tel"
                       placeholder="05xx xxx xx xx"></label>
              <input type="hidden" name="agency_services" data-agency-contact-services value="<?php echo esc_attr( $selected ); ?>">
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
      </div>
            </details>
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

add_action( 'add_meta_boxes_page', static function( $post ) {
    $layout = get_post_meta( $post->ID, '_codela_page_layout', true );
    if ( ! str_contains( (string) $post->post_content . ( is_string( $layout ) ? $layout : '' ), 'section-agency-contact-bento' ) ) { return; }
    add_meta_box( 'codela_contact_map', 'Codela · Harita konumu', static function( $page ) {
        wp_nonce_field( 'codela_contact_map', 'codela_contact_map_nonce' );
        echo '<p>Yalnızca kamuya açık ofis konumunun enlem ve boylamını virgülle ayırarak girin. Boş bırakırsanız işaretsiz genel harita gösterilir.</p>';
        echo '<label for="codela_contact_map_coordinates">Enlem, boylam</label><input class="widefat" id="codela_contact_map_coordinates" name="codela_contact_map_coordinates" value="' . esc_attr( get_post_meta( $page->ID, 'codela_contact_map_coordinates', true ) ) . '">';
    }, 'page', 'side' );
} );
add_action( 'save_post_page', static function( $post_id ) {
    if ( ! isset( $_POST['codela_contact_map_nonce'], $_POST['codela_contact_map_coordinates'] ) || ! is_string( $_POST['codela_contact_map_nonce'] ) || ! is_string( $_POST['codela_contact_map_coordinates'] )
        || ! wp_verify_nonce( wp_unslash( $_POST['codela_contact_map_nonce'] ), 'codela_contact_map' ) || ! current_user_can( 'edit_post', $post_id ) || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) { return; }
    $raw = trim( wp_unslash( $_POST['codela_contact_map_coordinates'] ) );
    if ( '' === $raw ) { delete_post_meta( $post_id, 'codela_contact_map_coordinates' ); return; }
    $point = codela_sf_contact_map_point( $raw );
    if ( $point ) { update_post_meta( $post_id, 'codela_contact_map_coordinates', implode( ',', $point ) ); }
} );
