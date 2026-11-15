<?php
/**
 * Dynamic agency sections supplied by the Codela page-layout editor.
 * The editorial fields use the plugin's validated section contract; the
 * original agency homepage pattern remains the fallback for existing sites.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_items( array $data, int $limit = 3 ): array {
    return array_slice( array_values( array_filter( $data['items'] ?? [], static function( $item ) {
        return is_array( $item ) && ( $item['enabled'] ?? true ) && '' !== trim( (string) ( $item['title'] ?? '' ) );
    } ) ), 0, max( 1, min( 8, $limit ) ) );
}

function codela_sf_section_agency_cards( array $data, string $type = '', bool $primary = false ): string {
    $items = codela_sf_section_agency_items( $data );
    if ( ! $items ) { return ''; }
    $id = 'sf-agency-cards-' . sanitize_html_class( (string) $data['id'] );
    $heading = $primary && function_exists( 'is_front_page' ) && is_front_page() ? 'h1' : 'h2';
    $contact = codela_sf_agency_contact_link();
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/#sf-agency-services' ) );
    $tones = [ 'web', 'commerce', 'code' ];
    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--cards" data-agency-widget="cards">
      <section class="sf-agency-hero" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-hero-grid sf-agency-wrap">
          <div class="sf-agency-intro">
            <p class="sf-agency-eyebrow"><span class="sf-agency-status-dot" aria-hidden="true"></span> CODELA · DİJİTAL AJANS</p>
            <<?php echo $heading; ?> class="sf-agency-title" id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $data['title'] ?: 'WordPress ve özel yazılım çözümleri.' ); ?></<?php echo $heading; ?>>
            <?php if ( $data['description'] ) : ?><p class="sf-agency-lead"><?php echo esc_html( $data['description'] ); ?></p><?php endif; ?>
            <div class="sf-agency-actions">
              <?php echo codela_sf_ui_button( 'Projenizi konuşalım', [ 'href' => $contact, 'icon' => 'arrow-right' ] ); ?>
              <?php echo codela_sf_ui_button( 'Hizmetleri incele', [ 'href' => $services, 'variant' => 'secondary' ] ); ?>
            </div>
            <div class="sf-agency-swap-controls" role="group" aria-label="Kartlı vitrin seçimi">
              <?php foreach ( $items as $index => $item ) : ?>
                <button type="button" class="sf-agency-swap-tab" data-agency-swap-to="<?php echo (int) $index; ?>" aria-pressed="<?php echo 0 === $index ? 'true' : 'false'; ?>"><?php echo esc_html( sprintf( '%02d · %s', $index + 1, $item['title'] ) ); ?></button>
              <?php endforeach; ?>
            </div>
          </div>
          <div class="sf-agency-swap-stage" data-agency-swap aria-label="Üç boyutlu hizmet vitrini">
            <?php foreach ( $items as $index => $item ) : ?>
              <article class="sf-agency-swap-card sf-agency-swap-card--<?php echo esc_attr( $tones[ $index ] ); ?>" data-agency-card="<?php echo (int) $index; ?>" data-pos="<?php echo (int) $index; ?>" role="button" tabindex="<?php echo 0 === $index ? '0' : '-1'; ?>" aria-hidden="<?php echo 0 === $index ? 'false' : 'true'; ?>" aria-label="<?php echo esc_attr( $item['title'] . '. Sonraki kartı göster' ); ?>">
                <div class="sf-agency-window-bar"><span class="sf-agency-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span><?php echo esc_html( sprintf( '%02d / CODELA', $index + 1 ) ); ?></span></div>
                <div class="sf-agency-swap-body">
                  <span class="sf-agency-swap-pill"><?php echo esc_html( $item['title'] ); ?></span>
                  <h3><?php echo esc_html( $item['title'] ); ?></h3>
                  <?php if ( ! empty( $item['body'] ) ) : ?><p><?php echo esc_html( $item['body'] ); ?></p><?php endif; ?>
                </div>
                <div class="sf-agency-swap-foot"><span>WordPress</span><span>Özel geliştirme</span><span>Mobil öncelikli</span></div>
              </article>
            <?php endforeach; ?>
          </div>
        </div>
        <div class="sf-agency-hero-foot sf-agency-wrap"><span>WordPress <i>·</i> Elementor <i>·</i> WooCommerce</span><a href="<?php echo esc_url( $services ); ?>">Hizmetleri keşfet <span aria-hidden="true">↓</span></a></div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}

function codela_sf_section_agency_scroll( array $data, string $type = '', bool $primary = false ): string {
    $items = codela_sf_section_agency_items( $data );
    if ( ! $items ) { return ''; }
    $id = 'sf-agency-scroll-' . sanitize_html_class( (string) $data['id'] );
    $heading = $primary && function_exists( 'is_front_page' ) && is_front_page() ? 'h1' : 'h2';
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/#sf-agency-services' ) );
    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--scroll" data-agency-widget="scroll">
      <section class="sf-agency-hero" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-scroll-variant" data-agency-container-scroll>
          <div class="sf-agency-scroll-sticky sf-agency-wrap">
            <div class="sf-agency-scroll-intro">
              <p>CODELA · UÇTAN UCA WORDPRESS MÜHENDİSLİĞİ</p>
              <<?php echo $heading; ?> id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $data['title'] ?: 'Dijital deneyiminiz, yeni bir boyutta.' ); ?></<?php echo $heading; ?>>
            </div>
            <div class="sf-agency-scroll-perspective">
              <div class="sf-agency-scroll-device" data-agency-scroll-device>
                <div class="sf-agency-scroll-screen">
                  <div class="sf-agency-scroll-screen-primary">
                    <span>CODELA AGENCY DASHBOARD</span>
                    <h3><?php echo esc_html( $data['title'] ?: 'Her Ölçekte WordPress Çözümü' ); ?></h3>
                    <?php if ( $data['description'] ) : ?><p><?php echo esc_html( $data['description'] ); ?></p><?php endif; ?>
                    <div class="sf-agency-scroll-specialties">
                      <?php foreach ( $items as $item ) : ?>
                        <div><strong><?php echo esc_html( $item['title'] ); ?></strong><?php if ( ! empty( $item['body'] ) ) : ?><small><?php echo esc_html( $item['body'] ); ?></small><?php endif; ?></div>
                      <?php endforeach; ?>
                    </div>
                  </div>
                  <div class="sf-agency-scroll-screen-aside">
                    <span>UZMANLIK ALANLARIMIZ</span>
                    <ul><?php foreach ( $items as $item ) : ?><li>✓ <?php echo esc_html( $item['title'] ); ?></li><?php endforeach; ?></ul>
                    <a href="<?php echo esc_url( $services ); ?>">Hizmetleri incele ↓</a>
                  </div>
                </div>
              </div>
            </div>
            <p class="sf-agency-scroll-caption">Kaydırdıkça deneyim ortaya çıkar</p>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}


/**
 * Reusable services carousel using the reference design's actual poster CSS.
 * Editorial copy is stored in validated page sections, not theme settings.
 */
function codela_sf_section_agency_services( array $data, string $type = '' ): string {
    $items = codela_sf_section_agency_items( $data, 4 );
    if ( ! $items ) { return ''; }
    $id = 'sf-agency-services-' . sanitize_html_class( (string) $data['id'] );
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/#sf-agency-services' ) );
    $contact = codela_sf_agency_contact_link();
    $tones = [ 'web', 'elementor', 'commerce', 'code' ];
    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--services" data-agency-widget="services">
      <section class="sf-agency-services" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-wrap sf-agency-services-head">
          <div class="sf-agency-services-heading">
            <p class="sf-agency-eyebrow">HİZMET VİTRİNİ</p>
            <h2 class="sf-agency-heading" id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $data['title'] ?: 'WordPress üzerine her türlü çözüm.' ); ?></h2>
            <?php if ( $data['description'] ) : ?><p class="sf-agency-widget-services-lead"><?php echo esc_html( $data['description'] ); ?></p><?php endif; ?>
          </div>
          <div class="sf-agency-carousel-actions">
            <a class="sf-agency-all-services" href="<?php echo esc_url( $services ); ?>">Tüm Hizmetler <span aria-hidden="true">↗</span></a>
            <button class="sf-agency-carousel-arrow" type="button" data-agency-widget-prev aria-label="Önceki hizmet">←</button>
            <button class="sf-agency-carousel-arrow" type="button" data-agency-widget-next aria-label="Sonraki hizmet">→</button>
          </div>
        </div>
        <div class="sf-agency-service-track" data-agency-widget-track tabindex="0" aria-label="Hizmet kartları">
          <?php foreach ( $items as $index => $item ) : ?>
            <article class="sf-agency-poster sf-agency-poster--<?php echo esc_attr( $tones[ $index ] ); ?>">
              <div class="sf-agency-poster-main">
                <span><?php echo esc_html( sprintf( '%02d · %s', $index + 1, $item['title'] ) ); ?></span>
                <h3><?php echo esc_html( $item['title'] ); ?></h3>
              </div>
              <div class="sf-agency-poster-bottom">
                <div class="sf-agency-glass-info"><p><?php echo esc_html( $item['body'] ); ?></p></div>
                <div class="sf-agency-poster-actions">
                  <button type="button" data-agency-widget-detail="<?php echo (int) $index; ?>">Kapsamı İncele ↗</button>
                  <a href="<?php echo esc_url( $contact ); ?>">Teklif Al →</a>
                </div>
              </div>
            </article>
          <?php endforeach; ?>
        </div>
        <dialog class="sf-agency-service-dialog" data-agency-widget-dialog aria-labelledby="<?php echo esc_attr( $id . '-detail' ); ?>">
          <div class="sf-agency-dialog-head"><span>HİZMET DETAYI</span><button type="button" data-agency-widget-close aria-label="Kapat">×</button></div>
          <h2 id="<?php echo esc_attr( $id . '-detail' ); ?>" data-agency-widget-detail-title></h2>
          <p data-agency-widget-detail-description></p>
          <a class="sf-agency-dialog-cta" href="<?php echo esc_url( $contact ); ?>">Bu hizmet için teklif iste →</a>
        </dialog>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}

/** Independent three-step agency process with per-instance interaction state. */
function codela_sf_section_agency_process( array $data, string $type = '' ): string {
    $items = codela_sf_section_agency_items( $data );
    if ( ! $items ) { return ''; }
    $id = 'sf-agency-process-' . sanitize_html_class( (string) $data['id'] );
    $contact = codela_sf_agency_contact_link();
    $first = $items[0];
    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--process" data-agency-widget="process">
      <section class="sf-agency-process" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-wrap">
          <header class="sf-agency-process-head">
            <span class="sf-agency-process-kicker">ÇALIŞMA SÜRECİ</span>
            <h2 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $data['title'] ?: 'Birlikte nasıl çalışıyoruz?' ); ?></h2>
            <?php if ( $data['description'] ) : ?><p><?php echo esc_html( $data['description'] ); ?></p><?php endif; ?>
          </header>
          <div class="sf-agency-process-layout">
            <div class="sf-agency-process-steps" role="group" aria-label="Çalışma aşamaları">
              <?php foreach ( $items as $index => $item ) : ?>
                <button type="button" class="sf-agency-process-step" data-agency-widget-step="<?php echo (int) $index; ?>" aria-pressed="<?php echo 0 === $index ? 'true' : 'false'; ?>">
                  <span class="sf-agency-process-count"><?php echo esc_html( sprintf( '%02d · %s', $index + 1, $item['title'] ) ); ?></span>
                  <strong><?php echo esc_html( $item['title'] ); ?></strong>
                  <span><?php echo esc_html( $item['body'] ); ?></span>
                </button>
              <?php endforeach; ?>
            </div>
            <div class="sf-agency-process-sticky">
              <div class="sf-agency-process-stage" data-agency-widget-stage data-step="0" aria-live="polite">
                <div class="sf-agency-process-stage-top"><span data-agency-widget-stage-kicker><?php echo esc_html( '01 · ' . $first['title'] ); ?></span><span>AŞAMA</span></div>
                <div class="sf-agency-process-stage-rows">
                  <div class="sf-agency-process-stage-row"><span data-agency-widget-stage-title><?php echo esc_html( $first['title'] ); ?></span><em>Adım 1</em></div>
                  <div class="sf-agency-process-stage-row"><span data-agency-widget-stage-body><?php echo esc_html( $first['body'] ); ?></span></div>
                </div>
                <div class="sf-agency-process-stage-foot"><span>Projenize uygun bir yol haritası çıkaralım.</span><a href="<?php echo esc_url( $contact ); ?>">Süreci Başlat →</a></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
