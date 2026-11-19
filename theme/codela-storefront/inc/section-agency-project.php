<?php
/**
 * MONA phase 5 — source-matched two-step Project Start.
 * Prototype confirmation replaced with actual WP admin-post result.
 * No fake phone frame, background submission, or invented delivery claim.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_project( array $data, string $type = '' ): string {
    $id = 'cdl-project-' . sanitize_html_class( (string) ( $data['id'] ?? 'start' ) );
    $title = trim( (string) ( $data['title'] ?? '' ) ) ?: 'Neye odaklanıyoruz?';
    $lead = trim( (string) ( $data['description'] ?? '' ) );
    $status = isset( $_GET['codela_status'] ) && is_string( $_GET['codela_status'] )
        ? sanitize_key( wp_unslash( $_GET['codela_status'] ) ) : '';
    $receipt = isset( $_GET['codela_receipt'] ) && is_string( $_GET['codela_receipt'] )
        ? sanitize_key( wp_unslash( $_GET['codela_receipt'] ) ) : '';
    $confirmed = 'sent' === $status && preg_match( '/^[a-f0-9]{32}$/D', $receipt )
        && (bool) get_transient( 'codela_sf_project_receipt_' . $receipt );
    $chosen = isset( $_GET['hizmetler'] ) && is_string( $_GET['hizmetler'] )
        ? sanitize_text_field( wp_unslash( $_GET['hizmetler'] ) ) : '';
    $services = [ 'Web Tasarım', 'E-Ticaret', 'Özel Yazılım', 'Optimizasyon / Destek' ];
    if ( ! in_array( $chosen, $services, true ) ) { $chosen = 'Web Tasarım'; }
    $times = [ 'Hemen', '1–2 Ay', 'Esnek' ];
    $scales = [ 'Başlangıç', 'Büyüme', 'Kurumsal' ];
    $contact = codela_sf_agency_contact_link();
    $services_url = codela_sf_agency_page_url( 'hizmetler', home_url( '/' ) );
    $policy = function_exists( 'get_privacy_policy_url' ) ? (string) get_privacy_policy_url() : '';
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--project" data-agency-widget="project">
      <section class="cdl-project" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="cdl-project__shell">
          <header class="cdl-project__topbar">
            <a class="cdl-project__back" href="<?php echo esc_url( $contact ); ?>" aria-label="İletişim sayfasına dön">
              <span aria-hidden="true">←</span><span>İletişim</span>
            </a>
            <span class="cdl-project__wordmark">CODELA</span>
          </header>
          <div class="cdl-project__panel">
            <?php if ( $confirmed ) : ?>
              <div class="cdl-project__success" role="status">
                <span class="cdl-project__success-icon" aria-hidden="true">✓</span>
                <p class="cdl-project__kicker">TALEP ALINDI</p>
                <h1 id="<?php echo esc_attr( $id ); ?>">Talebiniz alındı.</h1>
                <p>Projeniz için gönderim talebiniz WordPress tarafından kabul edildi. İletişim bilgileriniz üzerinden dönüş yapacağız.</p>
                <a href="<?php echo esc_url( $services_url ); ?>" class="cdl-project__button">Hizmetlere Dön <span aria-hidden="true">→</span></a>
              </div>
            <?php else : ?>
              <div class="cdl-project__progress" aria-label="Proje talebi ilerlemesi">
                <div class="cdl-project__progress-label"><span>PROJE BAŞLAT</span><span data-project-progress-label>1 / 2</span></div>
                <div class="cdl-project__progress-track" aria-hidden="true"><span data-project-progress-bar></span></div>
              </div>
              <?php if ( in_array( $status, [ 'failed', 'invalid', 'wait' ], true ) ) : ?>
                <p class="cdl-project__alert" role="alert">
                  <?php echo esc_html( 'wait' === $status
                    ? 'Kısa süre önce talep gönderdiniz. Bir dakika sonra tekrar deneyin.'
                    : ( 'invalid' === $status ? 'Bilgileri kontrol edip yeniden deneyin.' : 'Talep iletilemedi. Lütfen tekrar deneyin.' ) ); ?>
                </p>
              <?php endif; ?>
              <form id="sf-agency-project-form" class="cdl-project__form"
                    action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" data-project-form>
                <input type="hidden" name="action" value="codela_sf_agency_project"/>
                <?php wp_nonce_field( 'codela_sf_agency_project', 'agency_project_nonce' ); ?>
                <div class="cdl-project__step" data-project-step="1">
                  <div class="cdl-project__heading">
                    <p class="cdl-project__kicker">PROJE BAŞLAT</p>
                    <h1 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $title ); ?></h1>
                    <?php if ( $lead ) : ?><p><?php echo esc_html( $lead ); ?></p><?php endif; ?>
                  </div>
                  <fieldset class="cdl-project__fieldset">
                    <legend>Hizmet seçimi</legend>
                    <div class="cdl-project__choices cdl-project__choices--services">
                      <?php foreach ( $services as $index => $service ) : ?>
                        <label class="cdl-project__choice">
                          <input type="radio" name="agency_project_service" value="<?php echo esc_attr( $service ); ?>"
                                 <?php checked( $service, $chosen ); ?> required />
                          <span><?php echo esc_html( 3 === $index ? 'Optimizasyon' : $service ); ?></span>
                        </label>
                      <?php endforeach; ?>
                    </div>
                  </fieldset>
                  <fieldset class="cdl-project__fieldset">
                    <legend>Hedef zaman</legend>
                    <div class="cdl-project__choices cdl-project__choices--three">
                      <?php foreach ( $times as $time ) : ?>
                        <label class="cdl-project__choice">
                          <input type="radio" name="agency_project_time" value="<?php echo esc_attr( $time ); ?>"
                                 <?php checked( $time, 'Hemen' ); ?> required />
                          <span><?php echo esc_html( $time ); ?></span>
                        </label>
                      <?php endforeach; ?>
                    </div>
                  </fieldset>
                  <fieldset class="cdl-project__fieldset">
                    <legend>Proje ölçeği</legend>
                    <div class="cdl-project__choices cdl-project__choices--three">
                      <?php foreach ( $scales as $scale ) : ?>
                        <label class="cdl-project__choice">
                          <input type="radio" name="agency_project_scale" value="<?php echo esc_attr( $scale ); ?>"
                                 <?php checked( $scale, 'Büyüme' ); ?> required />
                          <span><?php echo esc_html( $scale ); ?></span>
                        </label>
                      <?php endforeach; ?>
                    </div>
                  </fieldset>
                  <button type="button" class="cdl-project__button" data-project-next>Devam Et <span aria-hidden="true">→</span></button>
                </div>
                <div class="cdl-project__step" data-project-step="2">
                  <div class="cdl-project__heading">
                    <p class="cdl-project__kicker">SON ADIM</p>
                    <h2>Size nasıl ulaşalım?</h2>
                  </div>
                  <div class="cdl-project__summary">
                    <span data-project-summary><?php echo esc_html( $chosen ); ?> · Hemen · Büyüme</span>
                    <button type="button" data-project-back>Düzenle</button>
                  </div>
                  <div class="cdl-project__fields">
                    <label>Ad Soyad / Marka
                      <input type="text" name="agency_project_name" autocomplete="name" maxlength="120"
                             placeholder="Adınız veya marka adınız" required />
                    </label>
                    <label>E-posta veya Telefon
                      <input type="text" name="agency_project_contact" maxlength="180"
                             placeholder="ornek@firma.com veya telefon" required />
                    </label>
                    <label>Kısa not (opsiyonel)
                      <textarea name="agency_project_note" rows="3" maxlength="2000"
                                placeholder="Aklınızdaki hedefi kısaca yazabilirsiniz..."></textarea>
                    </label>
                  </div>
                  <div class="cdl-project__honey" aria-hidden="true">
                    <label>Bu alan boş kalmalı <input type="text" tabindex="-1" autocomplete="off" name="agency_project_webpage" /></label>
                  </div>
                  <label class="cdl-project__consent">
                    <input type="checkbox" name="agency_project_consent" value="1" required />
                    <span>İletişim bilgilerimin proje talebime dönüş yapılması amacıyla kullanılmasını kabul ediyorum.
                      <?php if ( $policy ) : ?><a href="<?php echo esc_url( $policy ); ?>">Gizlilik politikası</a><?php endif; ?>
                    </span>
                  </label>
                  <button type="submit" class="cdl-project__button" data-project-submit>Talebi Gönder <span aria-hidden="true">→</span></button>
                </div>
              </form>
            <?php endif; ?>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
