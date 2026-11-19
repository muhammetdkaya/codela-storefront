<?php
/**
 * MONA stage 3 — genuine, linkable WordPress service-detail page.
 * The layout and source descriptions are taken from the approved Codela
 * Services detail screen; WordPress owns the page and native navigation.
 * The design references existing stage 1/2 theme assets, never data URIs.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_detail( array $data, string $type = '', bool $primary = false ): string {
    $settings = [
        'web' => [ 'tag' => 'Kurumsal · Arayüz', 'image' => 'mona-bento-web.jpg' ],
        'commerce' => [ 'tag' => 'Satış · Deneyim', 'image' => 'mona-bento-web.jpg' ],
        'software' => [ 'tag' => 'Ölçek · Entegrasyon', 'image' => 'mona-studio-hero.jpg' ],
        'support' => [ 'tag' => 'Hız · Süreklilik', 'image' => 'mona-studio-hero.jpg' ],
    ];
    $variant = (string) ( $data['variant'] ?? 'web' );
    if ( ! isset( $settings[ $variant ] ) ) { return ''; }

    $title = trim( (string) ( $data['title'] ?? '' ) );
    $description = trim( (string) ( $data['description'] ?? '' ) );
    if ( '' === $title || '' === $description ) { return ''; }
    $rows = is_array( $data['items'] ?? null ) ? array_slice( $data['items'], 0, 4 ) : [];
    $scope = array_values( array_filter( $rows, static function ( $item ): bool {
        return is_array( $item ) && ( $item['enabled'] ?? true )
            && '' !== trim( (string) ( $item['title'] ?? '' ) );
    } ) );
    $image = get_template_directory_uri() . '/assets/media/' . $settings[ $variant ]['image'];
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/' ) );
    // The real project flow replaces the temporary contact-form fallback only
    // after its WordPress page is published and ownership-verified.
    $contact = add_query_arg( 'hizmetler', $title, codela_sf_agency_project_link() );
    $id = 'codela-detail-' . sanitize_html_class( (string) ( $data['id'] ?? 'service' ) );
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--detail" data-agency-widget="detail">
      <section class="cdl-service-detail" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="cdl-service-detail__shell">
          <div class="cdl-service-detail__header">
            <a class="cdl-service-detail__back" href="<?php echo esc_url( $services ); ?>"
               aria-label="Hizmetlere dön"><span aria-hidden="true">←</span><span>Hizmetler</span></a>
            <span class="cdl-service-detail__brand">CODELA</span>
          </div>
          <div class="cdl-service-detail__content">
            <div class="cdl-service-detail__visual">
              <img src="<?php echo esc_url( $image ); ?>" alt="" width="1376" height="768"
                   loading="eager" fetchpriority="high" decoding="async" />
              <span class="cdl-service-detail__shade" aria-hidden="true"></span>
              <span class="cdl-service-detail__tag"><?php echo esc_html( $settings[ $variant ]['tag'] ); ?></span>
            </div>
            <div class="cdl-service-detail__information">
              <div class="cdl-service-detail__copy">
                <h1 id="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $title ); ?></h1>
                <p><?php echo esc_html( $description ); ?></p>
                <?php if ( $scope ) : ?>
                  <div class="cdl-service-detail__scope">
                    <h2>Kapsam</h2>
                    <ul>
                      <?php foreach ( $scope as $item ) : ?>
                        <li><?php echo esc_html( (string) $item['title'] ); ?></li>
                      <?php endforeach; ?>
                    </ul>
                  </div>
                <?php endif; ?>
              </div>
              <a class="cdl-service-detail__cta" href="<?php echo esc_url( $contact ); ?>">
                Proje Başlat <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
