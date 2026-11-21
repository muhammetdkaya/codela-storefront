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

/**
 * Editorial Light Agency welcome. Editor-owned copy is authoritative except
 * for untouched Codela starter text from earlier package versions.
 */
function codela_sf_section_agency_scroll( array $data, string $type = '', bool $primary = false ): string {
    $id = 'sf-agency-scroll-' . sanitize_html_class( (string) ( $data['id'] ?? 'welcome' ) );
    $heading = $primary && function_exists( 'is_front_page' ) && is_front_page() ? 'h1' : 'h2';
    $title = trim( (string) ( $data['title'] ?? '' ) );
    $description = trim( (string) ( $data['description'] ?? '' ) );
    $approved = 'Markanıza özel web siteleri, e-ticaret ve yazılım.';
    $approved_lead = 'İşiniz için doğru dijital deneyimi tasarlıyor, geliştiriyor ve yayına alıyoruz.';
    $starter = 'agency-starter-scroll' === (string) ( $data['id'] ?? '' );
    if ( $starter && in_array( $title, [
        'Tasarım, e-ticaret ve yazılım. Tek bir deneyimde.',
        'Web siteleri. E-ticaret. Özel yazılım.',
    ], true ) ) {
        $title = $approved;
    }
    if ( $starter && in_array( $description, [
        'WordPress, WooCommerce ve özel yazılım çözümlerini aynı ekipte buluşturuyoruz.',
        'İşinizi büyüten dijital deneyimleri tasarlıyor, geliştiriyor ve yayına alıyoruz.',
    ], true ) ) {
        $description = $approved_lead;
    }
    if ( '' === $title ) { $title = $approved; }
    $editorial = $approved === $title;
    $parts = $editorial
        ? [ 'Markanıza özel', 'web siteleri,', 'e-ticaret', 've yazılım.' ]
        : preg_split( '/(?<=[.!?])\s+/u', $title, -1, PREG_SPLIT_NO_EMPTY );
    if ( ! is_array( $parts ) || count( $parts ) > 4 || ! $parts ) { $parts = [ $title ]; }
    $contact = codela_sf_agency_contact_link();
    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--scroll sf-agency-widget--minimal" data-agency-widget="scroll">
      <section class="sf-agency-hero sf-agency-minimal-hero is-playing" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-minimal-content">
          <p class="sf-agency-minimal-eyebrow">CODELA / BAĞIMSIZ DİJİTAL STÜDYO</p>
          <<?php echo $heading; ?> id="<?php echo esc_attr( $id ); ?>" class="sf-agency-minimal-title">
            <?php foreach ( $parts as $index => $part ) : ?>
              <span class="sf-agency-reveal sf-agency-reveal-<?php echo (int) min( $index + 1, 4 ); ?><?php echo $editorial && 2 === $index ? ' sf-agency-minimal-tint' : ''; ?>"><?php echo esc_html( trim( $part ) ); ?></span>
            <?php endforeach; ?>
          </<?php echo $heading; ?>>
          <?php if ( '' !== $description ) : ?>
            <p class="sf-agency-minimal-lead sf-agency-reveal sf-agency-reveal-5"><?php echo esc_html( $description ); ?></p>
          <?php endif; ?>
          <a class="sf-agency-minimal-cta sf-agency-reveal sf-agency-reveal-6" href="<?php echo esc_url( $contact ); ?>">
            <span>Projenizi konuşalım</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg>
          </a>
        </div>
        <div class="sf-agency-minimal-signoff" aria-hidden="true">
          <span>TASARIM + TEKNOLOJİ</span><span>İSTANBUL / TR</span>
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

    // Restyle only the untouched starter copy; editor-customized services remain authoritative.
    $starter = 'agency-starter-services' === (string) ( $data['id'] ?? '' );
    $legacy_titles = [
        'Kurumsal Web & Redesign', 'Elementor & Özel Widget',
        'WooCommerce & E-Ticaret', 'Özel Eklenti & API',
    ];
    $legacy_bodies = [
        'Markanıza özel, mobil öncelikli WordPress arayüzleri.',
        'Figma tasarımını hassas ve kolay yönetilebilir bileşenlere dönüştürürüz.',
        'Ödeme, kargo ve dönüşüm akışlarıyla eksiksiz mağazalar.',
        'ERP/CRM entegrasyonları ve işinize özel WordPress çözümleri.',
    ];
    $approved_titles = [ 'E-Ticaret', 'Web Tasarım', 'Özel Yazılım', 'Bakım ve Geliştirme' ];
    // Render the new editor values directly; only the exact old starter receives
    // the fallback offer copy. A visitor-edited legacy body is never replaced.
    $untouched = $starter && count( $items ) === 4
        && array_column( $items, 'title' ) === $legacy_titles
        && array_column( $items, 'body' ) === $legacy_bodies;
    $approved = $starter && count( $items ) === 4
        && array_column( $items, 'title' ) === $approved_titles;
    $starter_offer = $untouched || $approved;
    $labels = [ 'E-TİCARET', 'WEB TASARIMI', 'ÖZEL YAZILIM', 'BAKIM & GELİŞTİRME' ];
    $tones = [ 'commerce', 'web', 'code', 'support' ];
    $colors = [ '#647961', '#82766a', '#5968b6', '#9b7364' ];
    $chips = [ [ 'WooCommerce', 'Sanal POS', 'Sipariş' ],
        [ 'WordPress', 'Özel tasarım', 'Elementor' ],
        [ 'Özel eklenti', 'API', 'ERP / CRM' ],
        [ 'Hız', 'Bakım', 'Geliştirme' ] ];
    $slugs = [ 'e-ticaret', 'web-tasarimi', 'ozel-yazilim', 'gelistirme-destek' ];
    if ( $untouched ) {
        $items = [
            [ 'title' => 'Satışa hazır e-ticaret siteleri.',
              'body' => 'Ürün keşfi, güvenli ödeme, sipariş yönetimi ve kargoyu birleştiren WooCommerce mağazaları.' ],
            [ 'title' => 'Markanıza özel web siteleri.',
              'body' => 'Özgün, mobil uyumlu kurumsal siteler ve kolay yönetilebilir WordPress sayfaları.' ],
            [ 'title' => 'İşinize özel yazılım çözümleri.',
              'body' => 'İş akışınıza uygun eklentiler, yönetim panelleri ve API bağlantıları.' ],
            [ 'title' => 'Bakım ve geliştirme.',
              'body' => 'Mevcut siteniz için hız, güvenlik, teknik bakım ve yeni özellik geliştirme.' ],
        ];
    }
    $heading_title = trim( (string) ( $data['title'] ?? '' ) );
    $lead = trim( (string) ( $data['description'] ?? '' ) );
    $known_titles = [ 'WordPress üzerine her türlü çözüm.', 'Fikirden yayına, yanınızdayız.', 'Web sitenizden özel yazılıma.' ];
    $known_leads = [ 'İhtiyaca uygun tasarım, e-ticaret ve özel geliştirme hizmetleri.',
        'İhtiyacınıza göre tasarlanan, kullanımı kolay ve hızlı dijital çözümler.' ];
    $editorial_title = $starter_offer && in_array( $heading_title, $known_titles, true );
    if ( $untouched && in_array( $lead, $known_leads, true ) ) {
        $lead = 'Markanız için web, e-ticaret ve özel yazılım çözümleri geliştiriyoruz.';
    }

    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--services sf-agency-widget--services-v3"
         data-agency-widget="services" data-agency-active-service="0">
      <section class="sf-agency-services" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-services-stage">
        <div class="sf-agency-wrap sf-agency-services-head">
          <div class="sf-agency-services-heading">
            <p class="sf-agency-eyebrow">CODELA / HİZMETLERİMİZ</p>
            <?php if ( $editorial_title ) : ?>
              <h2 class="sf-agency-heading" id="<?php echo esc_attr( $id ); ?>">Web sitenizden <span class="sf-agency-service-accent">özel yazılıma.</span></h2>
            <?php else : ?>
              <h2 class="sf-agency-heading" id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $heading_title ?: 'Web sitenizden özel yazılıma.' ); ?></h2>
            <?php endif; ?>
            <?php if ( $lead ) : ?><p class="sf-agency-widget-services-lead"><?php echo esc_html( $lead ); ?></p><?php endif; ?>
          </div>
          <div class="sf-agency-carousel-actions">
            <span class="sf-agency-service-counter" data-agency-widget-count aria-live="off">01 / <?php echo esc_html( sprintf( '%02d', count( $items ) ) ); ?></span>
            <button class="sf-agency-carousel-arrow" type="button" data-agency-widget-prev aria-label="Önceki hizmet">←</button>
            <button class="sf-agency-carousel-arrow" type="button" data-agency-widget-next aria-label="Sonraki hizmet">→</button>
          </div>
        </div>
        <div class="sf-agency-service-track" data-agency-widget-track role="region" tabindex="0" aria-label="Hizmet kartları">
          <?php foreach ( $items as $index => $item ) : ?>
            <?php
            $label = $starter_offer ? $labels[ $index ] : (string) $item['title'];
            $chips_for_item = $starter_offer ? $chips[ $index ] : [];
            $slug = $slugs[ $index ];
            // Never invent an unpublished service permalink: fall back to the real Services page.
            $detail_href = codela_sf_agency_page_url( 'hizmetler/' . $slug, $services );
            ?>
            <article class="sf-agency-poster sf-agency-poster--<?php echo esc_attr( $tones[ $index ] ); ?>"
                     data-agency-service-accent="<?php echo esc_attr( $colors[ $index ] ); ?>">
              <div class="sf-agency-poster-main">
                <div class="sf-agency-poster-meta">
                  <span><?php echo esc_html( $label ); ?></span>
                  <span><?php echo esc_html( sprintf( '%02d / %02d', $index + 1, count( $items ) ) ); ?></span>
                </div>
              </div>
              <div class="sf-agency-poster-visual" aria-hidden="true">
                <div class="sf-agency-mini-ui">
                  <div class="sf-agency-mini-bar"><i></i><i></i><i></i><small><?php echo esc_html( [ 'SHOP', 'STUDIO', 'WORKSPACE', 'PERFORMANCE' ][ $index ] ); ?></small></div>
                  <?php if ( 0 === $index ) : ?>
                    <img class="sf-agency-mini-preview" src="<?php echo esc_url( get_template_directory_uri() . '/assets/media/agency-storefront-interface.svg' ); ?>" alt="" loading="lazy" decoding="async" width="1200" height="560" />
                  <?php elseif ( 1 === $index ) : ?>
                    <div class="sf-agency-mini-site"><div><b></b><b></b><i></i><i></i><em></em></div><figure></figure></div>
                  <?php elseif ( 2 === $index ) : ?>
                    <div class="sf-agency-mini-dashboard"><div class="sf-agency-mini-sidebar"><i></i><i></i><i></i></div><div class="sf-agency-mini-stats"><b>1.248</b><b>+24%</b><div class="sf-agency-mini-chart"><i></i><i></i><i></i><i></i><i></i></div></div></div>
                  <?php else : ?>
                    <div class="sf-agency-mini-speed"><div class="sf-agency-mini-ring"><div><b>92</b><small>PERFORMANS</small></div></div><div class="sf-agency-mini-bars"><i></i><i></i><i></i></div></div>
                  <?php endif; ?>
                </div>
              </div>
              <div class="sf-agency-poster-body">
                <h3><?php echo esc_html( $item['title'] ); ?></h3>
                <p class="sf-agency-poster-description"><?php echo esc_html( $item['body'] ); ?></p>
                <?php if ( $chips_for_item ) : ?>
                  <div class="sf-agency-poster-chips">
                    <?php foreach ( $chips_for_item as $chip ) : ?><span><?php echo esc_html( $chip ); ?></span><?php endforeach; ?>
                  </div>
                <?php endif; ?>
              </div>
              <a class="sf-agency-poster-link" href="<?php echo esc_url( $detail_href ); ?>">
                Hizmeti keşfet <span aria-hidden="true">↗</span>
              </a>
            </article>
          <?php endforeach; ?>
        </div>
        </div><!-- /service stage -->
        <div class="sf-agency-wrap sf-agency-services-footer">
          <div><strong>Projeniz için doğru çözümü birlikte belirleyelim.</strong>
            <p>İhtiyacınızı anlatın, nereden başlayacağımızı konuşalım.</p></div>
          <a class="sf-agency-services-cta" href="<?php echo esc_url( $contact ); ?>">Projenizi anlatın <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}

/** Agency process: editorial image stage and three-section progress navigation. */
function codela_sf_section_agency_process( array $data, string $type = '' ): string {
    $items = codela_sf_section_agency_items( $data, 3 );
    if ( ! $items ) { return ''; }
    // Keep the existing editor contract. Only a byte-for-byte pristine Agency
    // starter displays the refreshed content before its guarded DB migration.
    // Existing published Studio+Bento installations may have a partially
    // customized Process block. Upgrade only stock fields individually.
    if ( 'agency-starter-process' === (string) ( $data['id'] ?? '' ) ) {
        if ( 'Keşiften yayına kadar şeffaf ve ölçülebilir bir iş akışı.' === (string) ( $data['description'] ?? '' ) ) {
            $data['description'] = 'Keşiften yayına, hangi adımda ne yaptığımızı açıkça paylaşıyoruz.';
        }
        $old_titles = [ 'Analiz, UX ve Altyapı', 'Tasarım ve Geliştirme', 'Test, Yayın ve Destek' ];
        $old_bodies = [
            'Hedefleri, içerik mimarisini ve doğru teknolojiyi belirleriz.',
            'Özel arayüz, Elementor bileşenleri ve entegrasyonları geliştiririz.',
            'Performans, mobil ve güvenlik kontrolleri sonrasında yayına alırız.',
        ];
        $new_titles = [ 'Keşif ve Planlama', 'Tasarım ve Geliştirme', 'Test, Yayın ve Destek' ];
        $new_bodies = [
            'İhtiyaçlarınızı dinler; kapsamı, öncelikleri ve çalışma takvimini birlikte netleştiririz.',
            'Tasarımı onayınıza sunar, geliştirmeyi tamamlar ve ilerlemeyi sizinle paylaşırız.',
            'Mobil kullanım, hız ve temel işlevleri kontrol eder; projenizi yayına alırız.',
        ];
        foreach ( $items as $index => &$item ) {
            if ( (string) $item['title'] === $old_titles[ $index ] ) { $item['title'] = $new_titles[ $index ]; }
            if ( (string) ( $item['body'] ?? '' ) === $old_bodies[ $index ] ) { $item['body'] = $new_bodies[ $index ]; }
        }
        unset( $item );
    }
    $id = 'sf-agency-process-' . sanitize_html_class( (string) ( $data['id'] ?? 'process' ) );
    $labels = [ 'Keşif', 'Üretim', 'Yayın' ];
    $outcomes = [ 'Net Yol Haritası', 'Geliştirilen Dijital Deneyim', 'Kontrol Edilmiş, Yayına Hazır' ];
    $images = [ 'agency-reference-process-discovery.jpg', 'agency-reference-process-build.jpg', 'agency-reference-process-launch.jpg' ];
    $count = count( $items );
    $next = static function( int $index ) use ( $labels, $count ): string {
        return $index === $count - 1 ? 'Süreci Başlat' : 'Sonraki: ' . $labels[ $index + 1 ];
    };
    $project_url = codela_sf_agency_project_link();
    $media = rtrim( get_template_directory_uri(), '/' ) . '/assets/media/';
    $first = $items[0];
    ob_start();
    ?>
    <div class="sf-agency sf-agency-widget sf-agency-widget--process" data-agency-widget="process">
      <section class="sf-agency-process" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="sf-agency-wrap">
          <header class="sf-agency-process-head">
            <div>
              <span class="sf-agency-process-kicker">ÇALIŞMA SÜRECİ</span>
              <h2 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( trim( (string) ( $data['title'] ?? '' ) ) ?: 'Nasıl Çalışıyoruz?' ); ?></h2>
              <?php if ( ! empty( $data['description'] ) ) : ?><p><?php echo esc_html( $data['description'] ); ?></p><?php endif; ?>
            </div>
            <span class="sf-agency-process-counter" data-agency-widget-counter aria-live="polite">1 / <?php echo (int) $count; ?></span>
          </header>
          <div class="sf-agency-process-layout">
            <div class="sf-agency-process-steps" role="group" aria-label="Çalışma aşamaları">
              <?php foreach ( $items as $index => $item ) : ?>
                <button type="button" class="sf-agency-process-step"
                  data-agency-widget-step="<?php echo (int) $index; ?>"
                  data-complete="<?php echo 0 === $index ? 'true' : 'false'; ?>"
                  data-agency-stage-image="<?php echo esc_url( $media . $images[ $index ] ); ?>"
                  data-agency-stage-outcome="<?php echo esc_attr( $outcomes[ $index ] ); ?>"
                  data-agency-stage-title="<?php echo esc_attr( $item['title'] ); ?>"
                  data-agency-stage-body="<?php echo esc_attr( (string) ( $item['body'] ?? '' ) ); ?>"
                  data-agency-stage-next-label="<?php echo esc_attr( $next( $index ) ); ?>"
                  aria-pressed="<?php echo $index === 0 ? 'true' : 'false'; ?>">
                  <span class="sf-agency-process-bar" aria-hidden="true"><span class="sf-agency-process-bar-fill"></span></span>
                  <span class="sf-agency-process-step-label"><?php echo esc_html( ( $index + 1 ) . '. ' . $labels[ $index ] ); ?></span>
                </button>
              <?php endforeach; ?>
            </div>
            <div class="sf-agency-process-stage" data-agency-widget-stage data-step="0">
              <div class="sf-agency-process-stage-visual">
                <img data-agency-widget-stage-image
                  src="<?php echo esc_url( $media . $images[0] ); ?>"
                  alt="" width="1376" height="768" loading="lazy" decoding="async">
              </div>
              <div class="sf-agency-process-stage-content">
                <div class="sf-agency-process-stage-copy" aria-live="polite" aria-atomic="true">
                  <span class="sf-agency-process-stage-outcome" data-agency-widget-stage-kicker><?php echo esc_html( $outcomes[0] ); ?></span>
                  <h3 data-agency-widget-stage-title><?php echo esc_html( $first['title'] ); ?></h3>
                  <p data-agency-widget-stage-body><?php echo esc_html( (string) ( $first['body'] ?? '' ) ); ?></p>
                </div>
                <div class="sf-agency-process-stage-foot">
                  <button type="button" class="sf-agency-process-prev" data-agency-widget-prev aria-label="Önceki aşama" disabled><span aria-hidden="true">←</span></button>
                  <a class="sf-agency-process-next" href="<?php echo esc_url( $project_url ); ?>" data-agency-widget-next>
                    <span data-agency-widget-next-label><?php echo esc_html( $next( 0 ) ); ?></span><span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
