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
    $lead = 'Kapsam ve başlangıç ayını seç, birlikte bir yol haritası çıkaralım.';
    $slots = codela_sf_project_availability();
    $first = '';
    foreach ( $slots as $key => $slot ) { if ( (int) $slot['free'] > 0 ) { $first = $key; break; } }
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
                <div class="cdl-project__availability"><span class="cdl-project__availability-left"><i aria-hidden="true"></i><span><?php echo $first ? esc_html($slots[$first]['label'] . ' · ' . $slots[$first]['free'] . ' yeni proje için müsait') : 'Başlangıç tarihini birlikte netleştirelim'; ?></span></span><time data-project-clock>GMT+3</time></div>
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
                  <button type="button" class="cdl-project__button" data-project-next>Devam Et: Başlangıç Ayı <span aria-hidden="true">→</span></button>
                </div>
                <div class="cdl-project__step" data-project-step="2">
                  <div class="cdl-project__heading"><h2>Hangi ay başlamak istersin?</h2><p>Başlangıç tercihi, kesin rezervasyon değildir.</p></div>
                  <fieldset class="cdl-project__fieldset"><legend>Açık stüdyo kapasitesi</legend><div class="cdl-project__choices cdl-project__choices--services cdl-project__slots">
                    <?php foreach ( $slots as $month => $slot ) : ?>
                      <label class="cdl-project__choice">
                        <input type="radio" name="agency_project_month" value="<?php echo esc_attr($month); ?>" data-month-label="<?php echo esc_attr($slot['label']); ?>" <?php checked($first,$month); ?> <?php echo (int)$slot['free'] < 1 ? 'disabled' : ''; ?> required>
                        <span><span class="cdl-project__choice-copy"><strong><?php echo esc_html($slot['label']); ?> <span class="cdl-project__capacity-dots" aria-hidden="true"><?php if ( null !== $slot['free'] ) { for($dot=0;$dot<max(3,min(12,$slot['free']));$dot++){echo '<i class="' . ($dot<$slot['free']?'is-free':'') . '"></i>';} } ?></span></strong><small><?php echo null === $slot['free'] ? 'Kapasite henüz belirtilmedi' : ( $slot['free'] ? esc_html($slot['free'] . ' yeni proje için müsait') : 'Bu ay dolu' ); ?></small></span></span>
                      </label>
                    <?php endforeach; ?>
                    <label class="cdl-project__choice"><input type="radio" name="agency_project_month" value="flexible" data-month-label="Esnek takvim" <?php checked($first,''); ?> required><span><span class="cdl-project__choice-copy"><strong>Esnek takvim</strong><small>Önce kapsamı birlikte konuşalım.</small></span></span></label>
                  </div></fieldset>
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
