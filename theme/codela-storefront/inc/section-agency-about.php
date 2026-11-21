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

    // The approved first heading emphasizes only the closing sentence.
    $headline_parts = $title === 'Dijitalde iyi görünmek yetmez. İyi çalışmalı.'
        ? [ 'Dijitalde iyi görünmek yetmez.', 'İyi çalışmalı.' ] : [ $title ];
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--about" data-agency-widget="about">
      <div class="sf-about-layout">
        <section class="sf-about-hero" aria-labelledby="<?php echo esc_attr( $id ); ?>-title">
          <div class="sf-about-eyebrow">HAKKIMIZDA <span aria-hidden="true">·</span> WEB · E-TİCARET · ÖZEL YAZILIM</div>
          <h1 id="<?php echo esc_attr( $id ); ?>-title"><?php echo esc_html( $headline_parts[0] ); ?><?php if ( isset( $headline_parts[1] ) ) : ?><span><?php echo esc_html( $headline_parts[1] ); ?></span><?php endif; ?></h1>
          <div class="sf-about-hero-bottom">
            <?php if ( $lead ) : ?><p><?php echo esc_html( $lead ); ?></p><?php endif; ?>
            <div class="sf-about-actions">
              <a class="sf-about-button sf-about-button--primary" href="<?php echo esc_url( $project ); ?>">Proje Başlat <span aria-hidden="true">↗</span></a>
              <a class="sf-about-button sf-about-button--secondary" href="#<?php echo esc_attr( $id ); ?>-approach">Yaklaşımımız <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <section class="sf-about-approach" id="<?php echo esc_attr( $id ); ?>-approach" aria-labelledby="<?php echo esc_attr( $id ); ?>-approach-title">
          <div class="sf-about-heading">
            <div><span class="sf-about-label">YAKLAŞIMIMIZ</span><h2 id="<?php echo esc_attr( $id ); ?>-approach-title"><?php echo esc_html( $about_title ); ?></h2></div>
            <?php if ( $about_lead ) : ?><p><?php echo esc_html( $about_lead ); ?></p><?php endif; ?>
          </div>
          <?php if ( $items ) : ?>
            <div class="sf-about-surface sf-about-principles" aria-label="Codela çalışma ilkeleri">
              <?php foreach ( $items as $index => $item ) : ?>
                <article class="sf-about-principle">
                  <span class="sf-about-number"><?php echo esc_html( sprintf( '%02d', $index + 1 ) ); ?></span>
                  <div><h3><?php echo esc_html( $item['title'] ); ?></h3>
                    <?php if ( ! empty( $item['body'] ) ) : ?><p><?php echo esc_html( $item['body'] ); ?></p><?php endif; ?>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </section>

        <section class="sf-about-contact sf-about-surface" aria-labelledby="<?php echo esc_attr( $id ); ?>-contact-title">
          <div class="sf-about-contact-copy">
            <span class="sf-about-label">BİRLİKTE ÇALIŞALIM</span>
            <h2 id="<?php echo esc_attr( $id ); ?>-contact-title"><?php echo esc_html( $contact_title ); ?></h2>
            <?php if ( $contact_lead ) : ?><p><?php echo esc_html( $contact_lead ); ?></p><?php endif; ?>
          </div>
          <div class="sf-about-actions">
            <a class="sf-about-button sf-about-button--primary" href="<?php echo esc_url( $project ); ?>">Proje Başlat <span aria-hidden="true">↗</span></a>
            <a class="sf-about-button sf-about-button--secondary" href="<?php echo esc_url( $contact ); ?>">İletişim <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </div>
    </div>
    <?php
    return (string) ob_get_clean();
}
