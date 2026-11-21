<?php
/**
 * MONA / Codela stage 2 — the approved four-card services Bento.
 *
 * Based on the supplied Codela Karşılama/Hizmetler HTML, not a redesign.
 * The presentation removes the prototype phone shell and status/navigation
 * chrome: Codela's own header and bottom dock remain authoritative.
 * Source photograph is a theme asset; legacy agency-services stays intact.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_bento( array $data, string $type = '' ): string {
    $id = 'codela-bento-' . sanitize_html_class( (string) ( $data['id'] ?? 'services' ) );
    $all = $data['items'] ?? [];
    if ( ! is_array( $all ) || ! $all ) { return ''; }
    $items = array_values( array_filter( array_slice( $all, 0, 4 ), static function ( $row ): bool {
        return is_array( $row ) && ( $row['enabled'] ?? true ) && '' !== trim( (string) ( $row['title'] ?? '' ) );
    } ) );
    if ( ! $items ) { return ''; }
    $title = trim( (string) ( $data['title'] ?? '' ) ) ?: 'Uzmanlık Alanları';
    // Existing installed Agency websites have editor-owned copy from 1.2.28.
    // Only the fully untouched starter gets the improved short labels at render
    // time; custom titles or descriptions keep their exact saved values.
    $legacy_titles = [ 'Web Tasarım', 'E-Ticaret', 'Özel Yazılım', 'Optimizasyon / Destek' ];
    $legacy_bodies = [ 'Kurumsal · Arayüz · Dönüşüm', 'Satış · Akış',
        'Ölçek · API', 'Hız · Güvenlik · Sürekli bakım' ];
    $editorial_tags = [ 'Kurumsal · UI/UX · WordPress',
        'WooCommerce · POS · Kargo', 'Eklenti · API · Entegrasyon',
        'Performans · Güvenlik · Bakım' ];
    $untouched_starter = 'agency-starter-bento' === (string) ( $data['id'] ?? '' )
        && 'Uzmanlık Alanları' === $title && 4 === count( $items )
        && array_column( $items, 'title' ) === $legacy_titles
        && array_column( $items, 'body' ) === $legacy_bodies;
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/hizmetler/' ) );
    $slugs = [ 'web-tasarimi', 'e-ticaret', 'ozel-yazilim', 'gelistirme-destek' ];
    $types = [ 'web', 'commerce', 'software', 'support' ];
    $tags = [ 'Kurumsal · Arayüz · Dönüşüm', 'Satış · Akış', 'Ölçek · API',
        'Hız · Güvenlik · Sürekli bakım' ];
    $photo = get_template_directory_uri() . '/assets/media/mona-bento-web.jpg';
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--bento" data-agency-widget="bento">
      <section class="cdl-bento" id="sf-agency-services" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="cdl-bento__inner">
          <header class="cdl-bento__heading cdl-bento__reveal" style="--cdl-bento-order:0">
            <div>
              <p class="cdl-bento__eyebrow">HİZMETLER</p>
              <h2 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $title ); ?></h2>
            </div>
          </header>
          <div class="cdl-bento__grid" aria-label="Codela hizmetlerimiz">
            <?php foreach ( $items as $index => $item ) : ?>
              <?php
              $variant = $types[ $index ];
              $href = codela_sf_agency_page_url( 'hizmetler/' . $slugs[ $index ], $services );
              $display = trim( (string) ( $item['title'] ?? '' ) );
              $body = trim( (string) ( $item['body'] ?? '' ) );
              $tag = $untouched_starter ? $editorial_tags[ $index ] : ( $body ?: $tags[ $index ] );
              ?>
              <a class="cdl-bento__card cdl-bento__card--<?php echo esc_attr( $variant ); ?> cdl-bento__reveal"
                 style="--cdl-bento-order:<?php echo esc_attr( (string) ( $index + 1 ) ); ?>"
                 href="<?php echo esc_url( $href ); ?>"
                 aria-label="<?php echo esc_attr( $display . ' hizmetini incele' ); ?>">
                <?php if ( 0 === $index ) : ?>
                  <img class="cdl-bento__photo" src="<?php echo esc_url( $photo ); ?>" alt=""
                       loading="lazy" decoding="async" width="1376" height="768" />
                  <span class="cdl-bento__image-shade" aria-hidden="true"></span>
                  <span class="cdl-bento__card-top">
                    <span class="cdl-bento__pill">Öne Çıkan</span>
                    <span class="cdl-bento__circle-arrow" aria-hidden="true">↗</span>
                  </span>
                  <span class="cdl-bento__card-copy">
                    <strong><?php echo esc_html( $display ); ?></strong>
                    <span><?php echo esc_html( $tag ); ?></span>
                  </span>
                <?php elseif ( 3 === $index ) : ?>
                  <span class="cdl-bento__light cdl-bento__light--right" aria-hidden="true"></span>
                  <span class="cdl-bento__support-text">
                    <strong><?php echo esc_html( $display ); ?></strong>
                    <span><?php echo esc_html( $tag ); ?></span>
                  </span>
                  <span class="cdl-bento__support-action" aria-hidden="true">İncele <span>→</span></span>
                <?php else : ?>
                  <span class="cdl-bento__light cdl-bento__light--top" aria-hidden="true"></span>
                  <?php if ( 1 === $index ) : ?>
                    <span class="cdl-bento__layers" aria-hidden="true"><i></i><i></i></span>
                  <?php else : ?>
                    <span class="cdl-bento__fluted" aria-hidden="true"></span>
                  <?php endif; ?>
                  <span class="cdl-bento__minor-arrow" aria-hidden="true">↗</span>
                  <span class="cdl-bento__minor-copy">
                    <small><?php echo esc_html( $tag ); ?></small>
                    <strong><?php echo esc_html( $display ); ?></strong>
                  </span>
                <?php endif; ?>
              </a>
            <?php endforeach; ?>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
