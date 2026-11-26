<?php
/**
 * MONA phase 5 — source-matched three-step Project Start.
 * Prototype confirmation replaced with actual WP admin-post result.
 * No fake phone frame, background submission, or invented delivery claim.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_project( array $data, string $type = '' ): string {
    $id = codela_sf_agency_dom_id( 'cdl-project-' . sanitize_html_class( (string) ( $data['id'] ?? 'start' ) ) );
    $form_id = codela_sf_agency_dom_id( 'sf-agency-project-form' );
    $source = codela_sf_agency_form_context( 'agency-project', $data );
    $slots = codela_sf_project_availability();
    $first = '';
    foreach ( $slots as $key => $slot ) { if ( (int) $slot['free'] > 0 ) { $first = $key; break; } }
    $status = isset( $_GET['codela_status'] ) && is_string( $_GET['codela_status'] )
        ? sanitize_key( wp_unslash( $_GET['codela_status'] ) ) : '';
    $receipt = isset( $_GET['codela_receipt'] ) && is_string( $_GET['codela_receipt'] )
        ? sanitize_key( wp_unslash( $_GET['codela_receipt'] ) ) : '';
    $receipt_data = 'sent' === $status && preg_match( '/^[a-f0-9]{32}$/D', $receipt )
        ? get_transient( 'codela_sf_project_receipt_' . $receipt ) : false;
    $target = isset( $_GET['codela_component'] ) && is_string( $_GET['codela_component'] ) ? wp_unslash( $_GET['codela_component'] ) : '';
    if ( $source[0] && ( $target ? $target !== $source[1] : 'sf-agency-project-form' !== $form_id ) ) { $status = ''; $receipt_data = false; }
    $confirmed = (bool) $receipt_data && ( empty( $receipt_data['component'] ) || $receipt_data['component'] === $source[1] );
    $chosen = isset( $_GET['hizmetler'] ) && is_string( $_GET['hizmetler'] )
        ? sanitize_text_field( wp_unslash( $_GET['hizmetler'] ) ) : '';
    $services = [ 'Web Tasarım', 'E-Ticaret', 'Özel Yazılım', 'Optimizasyon / Destek' ];
    if ( ! in_array( $chosen, $services, true ) ) { $chosen = 'Web Tasarım'; }
    $descriptions = [ 'Hızlı, mobil uyumlu kurumsal siteler.', 'Ödeme ve kargo akışı hazır mağazalar.', 'Özel paneller ve API entegrasyonları.', 'Hız, güvenlik ve sürekli destek.' ];
    $quote_rules = codela_sf_quote_rules();
    $direct_scope = isset( $_GET['teklif'] ) && '1' === $_GET['teklif'] && isset( $_GET['hizmetler'] ) && is_string( $_GET['hizmetler'] ) && in_array( $_GET['hizmetler'], $services, true );
    $policy = function_exists( 'get_privacy_policy_url' ) ? (string) get_privacy_policy_url() : '';
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--project" data-agency-widget="project">
      <section class="cdl-project" aria-label="Proje Başlat">
        <div class="cdl-project__shell">
          <div class="cdl-project__panel">
            <div class="cdl-project__progress" aria-label="Proje talebi ilerlemesi">
              <div class="cdl-project__progress-label"><span>PROJE BAŞLAT</span><span data-project-progress-label aria-live="polite"><?php echo $confirmed ? 'TAMAMLANDI' : '01 / 04'; ?></span></div>
              <div class="cdl-project__progress-track" aria-hidden="true"><span data-project-progress-bar<?php echo $confirmed ? ' style="width:100%"' : ''; ?>></span></div>
            </div>
            <?php if ( $confirmed ) : ?>
              <div class="cdl-project__success" role="status">
                <span class="cdl-project__success-icon" aria-hidden="true">✓</span>
                <h1 id="<?php echo esc_attr( $id ); ?>">Talebin <span class="cdl-project__title-muted">bize ulaştı.</span></h1>
                <p>Seçimlerini inceleyip iletişim bilgilerin üzerinden dönüş yapacağız.</p>
                <?php if ( is_array( $receipt_data ) && ! empty( $receipt_data['summary'] ) && is_array( $receipt_data['summary'] ) ) : ?>
                  <div class="cdl-project__summary"><span data-project-summary><?php foreach ( $receipt_data['summary'] as $tag ) : ?><span><?php echo esc_html( $tag ); ?></span><?php endforeach; ?></span></div>
                <?php endif; ?>
                <a href="<?php echo esc_url( codela_sf_agency_project_link() ); ?>" class="cdl-project__button">Yeni Talep Oluştur <span aria-hidden="true">→</span></a>
              </div>
            <?php else : ?>
              <?php if ( in_array( $status, [ 'failed', 'invalid', 'wait' ], true ) ) : ?>
                <p class="cdl-project__alert" role="alert">
                  <?php echo esc_html( 'wait' === $status
                    ? 'Kısa süre önce talep gönderdiniz. Bir dakika sonra tekrar deneyin.'
                    : ( 'invalid' === $status ? 'Bilgileri kontrol edip yeniden deneyin.' : 'Talep iletilemedi. Lütfen tekrar deneyin.' ) ); ?>
                </p>
              <?php endif; ?>
              <form id="<?php echo esc_attr( $form_id ); ?>" class="cdl-project__form"
                    action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" data-project-form<?php echo $direct_scope ? ' data-project-start-scope' : ''; ?>>
                <input type="hidden" name="action" value="codela_sf_agency_project"/>
                <?php codela_sf_agency_nonce_input( 'codela_sf_agency_project', 'agency_project_nonce' ); codela_sf_agency_form_context_input( $source ); ?>
                <div class="cdl-project__step" data-project-step="1">
                  <div class="cdl-project__heading"><h1 id="<?php echo esc_attr( $id ); ?>">Hangi alanda <span class="cdl-project__title-muted">çalışmak istersin?</span></h1></div>
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
                  <button type="button" class="cdl-project__button" data-project-next>Devam Et: Proje Kapsamı <span aria-hidden="true">→</span></button>
                </div>
                <div class="cdl-project__step" data-project-step="2">
                  <div class="cdl-project__heading"><h2>Proje kapsamını <span class="cdl-project__title-muted">netleştirelim.</span></h2><p>Seçimler isteğe bağlıdır. Kesin fiyat görüşmede belirlenir.</p></div>
                  <?php foreach ( $services as $service ) : $key = codela_sf_project_quote_key( $service ); $rules = $quote_rules[$key]; ?>
                    <fieldset class="cdl-project__fieldset cdl-project__scope" data-project-scope="<?php echo esc_attr( $service ); ?>" data-pricing-mode="<?php echo 'support' === $key ? 'monthly' : ( 'software' === $key ? 'starting' : 'range' ); ?>">
                      <legend><?php echo esc_html( codela_sf_quote_services()[$key] ); ?></legend>
                      <?php if ( $rules['packages'] ) : ?>
                      <?php if ( 'software' === $key ) : ?><div class="cdl-project__scope-options"><?php foreach ( $rules['packages'] as $id => $row ) : ?>
                        <label><input type="checkbox" data-scope-package name="project_quote[<?php echo esc_attr( $key ); ?>][packages][]" value="<?php echo esc_attr( $id ); ?>" data-min="<?php echo esc_attr( $row['min'] ?? '' ); ?>" data-max="<?php echo esc_attr( $row['max'] ?? '' ); ?>"><span><?php echo esc_html( $row['label'] ); ?></span></label>
                      <?php endforeach; ?></div><?php else : ?>
                        <label class="cdl-project__scope-select">Paket / kapsam<select data-scope-package name="project_quote[<?php echo esc_attr( $key ); ?>][packages][]"><option value="">Henüz karar vermedim</option><?php foreach ( $rules['packages'] as $id => $row ) : ?><option value="<?php echo esc_attr( $id ); ?>" data-min="<?php echo esc_attr( $row['min'] ?? '' ); ?>" data-max="<?php echo esc_attr( $row['max'] ?? '' ); ?>"><?php echo esc_html( $row['label'] ); ?></option><?php endforeach; ?></select></label>
                      <?php endif; endif; ?>
                      <?php if ( $rules['extras'] ) : ?><details class="cdl-project__scope-extras"><summary>Ek kapsamlar (isteğe bağlı)</summary><div class="cdl-project__scope-options"><?php foreach ( $rules['extras'] as $id => $row ) : ?>
                        <label><input type="checkbox" data-scope-extra name="project_quote[<?php echo esc_attr( $key ); ?>][extras][]" value="<?php echo esc_attr( $id ); ?>" data-min="<?php echo esc_attr( $row['min'] ?? '' ); ?>" data-max="<?php echo esc_attr( $row['max'] ?? '' ); ?>"><span><?php echo esc_html( $row['label'] ); ?></span></label>
                      <?php endforeach; ?></div></details><?php endif; ?>
                      <label class="cdl-project__scope-custom"><input type="checkbox" name="project_quote[<?php echo esc_attr( $key ); ?>][custom]" value="1" data-scope-custom> İhtiyacıma özel teklif</label>
                      <p class="cdl-project__scope-estimate" data-scope-estimate aria-live="polite">Görüşmede belirlenecek</p>
                    </fieldset>
                  <?php endforeach; ?>
                  <p class="cdl-project__reservation-note">Tahmini fiyatlar bağlayıcı değildir; nihai kapsam ve KDV görüşmede netleşir.</p>
                  <div class="cdl-project__scope-footer"><div data-project-scope-summary class="cdl-project__scope-summary" aria-live="polite"></div><div class="cdl-project__controls"><button type="button" class="cdl-project__button cdl-project__back-button" data-project-back aria-label="Önceki adım">←</button><button type="button" class="cdl-project__button" data-project-next>Devam Et: Takvim <span aria-hidden="true">→</span></button></div></div>
                </div>
                <div class="cdl-project__step" data-project-step="3">
                  <div class="cdl-project__heading"><h2>Ne zaman <span class="cdl-project__title-muted">başlayalım?</span></h2></div>
                  <fieldset class="cdl-project__fieldset"><legend class="screen-reader-text">Açık stüdyo kapasitesi</legend><div class="cdl-project__choices cdl-project__choices--services cdl-project__slots">
                    <?php $index = 0; foreach ( $slots as $month => $slot ) : $index++; ?>
                      <label class="cdl-project__choice">
                        <input type="radio" name="agency_project_month" value="<?php echo esc_attr($month); ?>" data-month-label="<?php echo esc_attr($slot['label']); ?>" <?php checked($first,$month); ?> <?php echo (int)$slot['free'] < 1 ? 'disabled' : ''; ?> required>
                        <span><i aria-hidden="true"><?php echo esc_html(sprintf('%02d',$index)); ?></i><span class="cdl-project__choice-copy"><strong><?php echo esc_html($slot['label']); ?> <span class="cdl-project__capacity-dots" aria-hidden="true"><?php if ( null !== $slot['free'] ) { for($dot=0;$dot<max(3,min(12,$slot['free']));$dot++){echo '<i class="' . ($dot<$slot['free']?'is-free':'') . '"></i>';} } ?></span></strong><small><?php echo null === $slot['free'] ? 'Kapasite henüz belirtilmedi' : ( $slot['free'] ? esc_html($slot['free'] . ' yeni proje için müsait') : 'Bu ay dolu' ); ?></small></span></span>
                      </label>
                    <?php endforeach; ?>
                    <label class="cdl-project__choice"><input type="radio" name="agency_project_month" value="flexible" data-month-label="Esnek takvim" <?php checked($first,''); ?> required><span><i aria-hidden="true"><?php echo esc_html(sprintf('%02d',$index+1)); ?></i><span class="cdl-project__choice-copy"><strong>Esnek takvim</strong><small>Önce kapsamı birlikte netleştirelim</small></span></span></label>
                  </div></fieldset>
                  <p class="cdl-project__reservation-note">Başlangıç tercihi, kesin rezervasyon değildir.</p>
                  <div class="cdl-project__controls"><button type="button" class="cdl-project__button cdl-project__back-button" data-project-back aria-label="Önceki adım">←</button><button type="button" class="cdl-project__button" data-project-next>Devam Et: İletişim <span aria-hidden="true">→</span></button></div>
                </div>
                <div class="cdl-project__step" data-project-step="4">
                  <div class="cdl-project__heading">
                    <h2>Sana nasıl <span class="cdl-project__title-muted">ulaşalım?</span></h2>
                  </div>
                  <div class="cdl-project__summary">
                    <span data-project-summary></span>
                  </div>
                  <div class="cdl-project__fields">
                    <label>Ad Soyad / Marka
                      <input type="text" name="agency_project_name" autocomplete="name" maxlength="120"
                             placeholder="Adın veya marka adın" minlength="2" required />
                    </label>
                    <label>E-posta veya WhatsApp
                      <input type="text" name="agency_project_contact" autocomplete="off" maxlength="180"
                             placeholder="ad@markaniz.com veya 05XX..." required />
                    </label>
                    <label>Kısa Not (İsteğe bağlı)
                      <textarea name="agency_project_note" rows="1" maxlength="2000"
                                placeholder="Hedefinden kısaca bahsedebilirsin"></textarea>
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
