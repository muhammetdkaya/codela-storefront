<?php
/**
 * Compact Codela About section, adapted from the approved Hakkımızda preview.
 * One editor section, one reusable glass surface, repeatable principle rows.
 * No duplicate site header, login, menu, decorative grid or atmospheric layer.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_about( array $data, string $type = '' ): string {
    $id = 'sf-about-' . sanitize_html_class( (string) ( $data['id'] ?? 'codela-about' ) );
    $title = trim( (string) ( $data['title'] ?? '' ) );
    if ( '' === $title ) { return ''; }
    $lead = trim( (string) ( $data['description'] ?? '' ) );
    $about_title = trim( (string) ( $data['approach_title'] ?? '' ) ) ?: 'Az karmaşa. Daha iyi deneyim.';
    $about_lead = trim( (string) ( $data['approach_description'] ?? '' ) );
    $contact_title = trim( (string) ( $data['contact_title'] ?? '' ) ) ?: 'Aklında bir proje mi var?';
    $contact_lead = trim( (string) ( $data['contact_description'] ?? '' ) );
    $items = array_values( array_filter( (array) ( $data['items'] ?? [] ), static function( $item ): bool {
        return is_array( $item ) && ( $item['enabled'] ?? true ) && '' !== trim( (string) ( $item['title'] ?? '' ) );
    } ) );
    $items = array_slice( $items, 0, 3 );
    $project = codela_sf_agency_project_link();
    $contact = codela_sf_agency_contact_link();

    // Upgrade only known starter copy; keep editorial content editable.
    if ( $title === 'Dijitalde iyi görünmek yetmez. İyi çalışmalı.' ) {
        $title = 'Az ama net dijital işler üretiyoruz.';
        $lead = 'İstanbul merkezli, tasarım ve yazılımı aynı masada tutan bağımsız dijital stüdyo.';
    }
    $headline_parts = $title === 'Az ama net dijital işler üretiyoruz.' ? [ 'Az ama net', 'dijital işler üretiyoruz.' ] : [ $title ];
    if ( $about_title === 'Az karmaşa. Daha iyi deneyim.' ) {
        $about_title = 'İyi bir dijital ürün kendini bağırmadan anlatır.';
        $about_lead = 'Sade mimari, ölçülü detay ve uzun ömürlü kodla markaların gerçekten işine yarayan sistemler kuruyoruz.';
    }
    $new_items = [
      'Önce doğru çözüm' => [ 'Gereksiz karmaşa yok', 'Hızlı açılan, ekibinin kolayca yönetebildiği ve doğrudan satış ile iletişimi destekleyen yapılar kurarız.' ],
      'Tasarım ve yazılım birlikte' => [ 'Tasarım ve kod tek elde', 'Arayüzde kurgulanan hassasiyeti geliştirme aşamasında kaybetmeden, aynı standartta canlıya alırız.' ],
      'Şeffaf iş birliği' => [ 'Yayın sonrası da yanındayız', 'Teslimle bitmeyen bir çalışma düzeniyle performans, güvenlik ve yeni ihtiyaçları birlikte geliştiririz.' ],
    ];
    foreach ( $items as &$item ) {
        if ( isset( $new_items[ $item['title'] ] ) ) { [ $item['title'], $item['body'] ] = $new_items[ $item['title'] ]; }
    }
    unset( $item );
    if ( count( $items ) === 3 && $items[0]['title'] === 'Gereksiz karmaşa yok' && $items[1]['title'] === 'Tasarım ve kod tek elde' ) { [ $items[0], $items[1] ] = [ $items[1], $items[0] ]; }
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--about" data-agency-widget="about">
      <div class="sf-about-layout">
        <section class="sf-about-hero" aria-labelledby="<?php echo esc_attr( $id ); ?>-title">
          <div class="sf-about-eyebrow">HAKKIMIZDA</div>
          <h1 id="<?php echo esc_attr( $id ); ?>-title"><?php echo esc_html( $headline_parts[0] ); ?><?php if ( isset( $headline_parts[1] ) ) : ?><span><?php echo esc_html( $headline_parts[1] ); ?></span><?php endif; ?></h1>
          <?php if ( $lead ) : ?><div class="sf-about-hero-bottom"><p><?php echo esc_html( $lead ); ?></p></div><?php endif; ?>
        </section>
        <section class="sf-about-approach" aria-label="Yaklaşımımız">
          <blockquote class="sf-about-manifesto"><?php echo esc_html( $about_title ); ?> <span><?php echo esc_html( $about_lead ); ?></span></blockquote>
          <?php if ( $items ) : ?><div class="sf-about-principles" aria-label="Codela çalışma ilkeleri">
            <?php foreach ( $items as $index => $item ) : ?><article class="sf-about-principle"><span class="sf-about-number"><?php echo esc_html( sprintf( '%02d', $index + 1 ) ); ?></span><div><h3><?php echo esc_html( $item['title'] ); ?></h3><p><?php echo esc_html( $item['body'] ?? '' ); ?></p></div></article><?php endforeach; ?>
          </div><?php endif; ?>
        </section>
        <section class="sf-about-contact" aria-label="Birlikte çalışalım"><span class="sf-about-location">İstanbul · Online</span><a class="sf-about-button sf-about-button--primary" href="<?php echo esc_url( $project ); ?>">Proje Başlat <span aria-hidden="true">→</span></a></section>
      </div>
    </div>
    <?php
    return (string) ob_get_clean();
}
