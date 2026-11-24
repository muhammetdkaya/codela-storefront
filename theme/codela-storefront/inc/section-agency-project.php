<?php
/**
 * MONA phase 5 — source-matched three-step Project Start.
 * Prototype confirmation replaced with actual WP admin-post result.
 * No fake phone frame, background submission, or invented delivery claim.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_project( array $data, string $type = '' ): string {
    $id = 'cdl-project-' . sanitize_html_class( (string) ( $data['id'] ?? 'start' ) );
    $title = trim( (string) ( $data['title'] ?? '' ) );
    if ( in_array( $title, [ '', 'Neye odaklanıyoruz?' ], true ) ) { $title = 'Projeni netleştirelim.'; }
    $lead = 'Üç kısa adımda kapsamı belirle, birlikte bir yol haritası çıkaralım.';
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
    $times = [ '2–4 hafta', '1–2 ay', 'Esnek takvim' ];
    $scales = [ 'Sıfırdan başlıyoruz', 'Mevcut site yenilenecek', 'Tasarım hazır, kodlama gerekli' ];
    $descriptions = [ 'Kurumsal veya marka odaklı, hızlı ve mobil uyumlu site.', 'Ödeme ve kargo akışı hazır, dönüşüm odaklı mağaza.', 'Yönetim panelleri, eklentiler ve API entegrasyonları.', 'Mevcut sitenin hız, güvenlik ve sürekli iyileştirmesi.' ];
    $contact = codela_sf_agency_contact_link();
    $services_url = codela_sf_agency_page_url( 'hizmetler', home_url( '/' ) );
    $policy = function_exists( 'get_privacy_policy_url' ) ? (string) get_privacy_policy_url() : '';
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--project" data-agency-widget="project">
      <section class="cdl-project" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="cdl-project__shell">
          <div class="cdl-project__panel">
            <?php if ( $confirmed ) : ?>
              <div class="cdl-project__success" role="status">
                <span class="cdl-project__success-icon" aria-hidden="true">✓</span>
                <p class="cdl-project__kicker">TALEP ALINDI</p>
                <h1 id="<?php echo esc_attr( $id ); ?>">Talebin bize ulaştı.</h1>
                <p>Seçimlerini inceleyip iletişim bilgilerin üzerinden dönüş yapacağız.</p>
                <a href="<?php echo esc_url( codela_sf_agency_project_url() ); ?>" class="cdl-project__button">Yeni Talep Oluştur <span aria-hidden="true">→</span></a>
              </div>
            <?php else : ?>
              <div class="cdl-project__progress" aria-label="Proje talebi ilerlemesi">
                <div class="cdl-project__progress-label"><span>PROJE BAŞLAT</span><span data-project-progress-label>01 / 03</span></div>
                <div class="cdl-project__heading"><h1 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $title ); ?></h1><p><?php echo esc_html( $lead ); ?></p></div>
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
                  <div class="cdl-project__heading"><h2>Hangi alanda desteğe ihtiyacın var?</h2><p>Birden fazla seçebilirsin.</p></div>
                  <fieldset class="cdl-project__fieldset">
                    <legend class="screen-reader-text">Hizmet seçimi</legend>
                    <div class="cdl-project__choices cdl-project__choices--services">
                      <?php foreach ( $services as $index => $service ) : ?>
                        <label class="cdl-project__choice">
                          <input type="checkbox" name="agency_project_service[]" value="<?php echo esc_attr( $service ); ?>"
                                 <?php checked( $service, $chosen ); ?> />
                          <span><i><?php echo esc_html( sprintf( '%02d', $index + 1 ) ); ?></i><span class="cdl-project__choice-copy"><strong><?php echo esc_html( 3 === $index ? 'Bakım & Geliştirme' : $service ); ?></strong><small><?php echo esc_html( $descriptions[ $index ] ); ?></small></span></span>
                        </label>
                      <?php endforeach; ?>
                    </div>
                  </fieldset>
                  <button type="button" class="cdl-project__button" data-project-next>Devam Et: Takvim <span aria-hidden="true">→</span></button>
                </div>
                <div class="cdl-project__step" data-project-step="2">
                  <div class="cdl-project__heading"><h2>Takvim ve ölçek nasıl?</h2><p>Yaklaşık bir çerçeve yeterli.</p></div>
                  <fieldset class="cdl-project__fieldset">
                    <legend>Hedef süre</legend>
                    <div class="cdl-project__choices cdl-project__choices--three">
                      <?php foreach ( $times as $time ) : ?>
                        <label class="cdl-project__choice">
                          <input type="radio" name="agency_project_time" value="<?php echo esc_attr( $time ); ?>"
                                 <?php checked( $time, '1–2 ay' ); ?> required />
                          <span><?php echo esc_html( $time ); ?></span>
                        </label>
                      <?php endforeach; ?>
                    </div>
                  </fieldset>
                  <fieldset class="cdl-project__fieldset">
                    <legend>Mevcut durum</legend>
                    <div class="cdl-project__choices cdl-project__choices--three">
                      <?php foreach ( $scales as $scale ) : ?>
                        <label class="cdl-project__choice">
                          <input type="radio" name="agency_project_scale" value="<?php echo esc_attr( $scale ); ?>"
                                 <?php checked( $scale, 'Sıfırdan başlıyoruz' ); ?> required />
                          <span><?php echo esc_html( 'Tasarım hazır, kodlama gerekli' === $scale ? 'Tasarım hazır' : $scale ); ?></span>
                        </label>
                      <?php endforeach; ?>
                    </div>
                  </fieldset>
                  <div class="cdl-project__controls"><button type="button" class="cdl-project__button cdl-project__back-button" data-project-back aria-label="Önceki adım">←</button><button type="button" class="cdl-project__button" data-project-next>Devam Et: İletişim <span aria-hidden="true">→</span></button></div>
                </div>
                <div class="cdl-project__step" data-project-step="3">
                  <div class="cdl-project__heading">
                    <h2>Sana nasıl ulaşalım?</h2><p>Seçimlerin özete eklendi.</p>
                  </div>
                  <div class="cdl-project__summary">
                    <span data-project-summary></span>
                  </div>
                  <div class="cdl-project__fields">
                    <label>Ad Soyad
                      <input type="text" name="agency_project_name" autocomplete="name" maxlength="120"
                             placeholder="Adınız veya marka adınız" required />
                    </label>
                    <label>E-posta
                      <input type="email" name="agency_project_contact" autocomplete="email" maxlength="180"
                             placeholder="ad@markaniz.com" required />
                    </label>
                    <label>Kısa Özet (İsteğe bağlı)
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
                  <div class="cdl-project__controls"><button type="button" class="cdl-project__button cdl-project__back-button" data-project-back aria-label="Önceki adım">←</button><button type="submit" class="cdl-project__button" data-project-submit>Talebi Gönder <span aria-hidden="true">→</span></button></div>
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
