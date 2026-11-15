<?php
/**
 * Dynamic agency sections supplied by the Codela page-layout editor.
 * The editorial fields use the plugin's validated section contract; the
 * original agency homepage pattern remains the fallback for existing sites.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_items( array $data ): array {
    return array_slice( array_values( array_filter( $data['items'] ?? [], static function( $item ) {
        return is_array( $item ) && ( $item['enabled'] ?? true ) && '' !== trim( (string) ( $item['title'] ?? '' ) );
    } ) ), 0, 3 );
}

function codela_sf_section_agency_cards( array $data, string $type = '' ): string {
    if ( 'agency' !== codela_sf_site_mode() ) { return ''; }
    $items = codela_sf_section_agency_items( $data );
    if ( ! $items ) { return ''; }
    $id = 'sf-agency-cards-' . sanitize_html_class( (string) $data['id'] );
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
            <h2 class="sf-agency-title" id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $data['title'] ?: 'WordPress ve özel yazılım çözümleri.' ); ?></h2>
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

function codela_sf_section_agency_scroll( array $data, string $type = '' ): string {
    if ( 'agency' !== codela_sf_site_mode() ) { return ''; }
    $items = codela_sf_section_agency_items( $data );
    if ( ! $items ) { return ''; }
    $id = 'sf-agency-scroll-' . sanitize_html_class( (string) $data['id'] );
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/#sf-agency-services' ) );
    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--scroll" data-agency-widget="scroll">
      <section class="sf-agency-hero" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-scroll-variant" data-agency-container-scroll>
          <div class="sf-agency-scroll-sticky sf-agency-wrap">
            <div class="sf-agency-scroll-intro">
              <p>CODELA · UÇTAN UCA WORDPRESS MÜHENDİSLİĞİ</p>
              <h2 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $data['title'] ?: 'Dijital deneyiminiz, yeni bir boyutta.' ); ?></h2>
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
