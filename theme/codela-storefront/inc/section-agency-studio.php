<?php
/**
 * Codela MONA Studio welcome — stage 1 of the reference-driven Agency build.
 * Separate section type: legacy editor blocks and merchant pages remain untouched.
 * Visual material ships as a theme asset, not a multi-megabyte data URI.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_section_agency_studio( array $data, string $type = '', bool $primary = false ): string {
    $id = 'codela-studio-' . sanitize_html_class( (string) ( $data['id'] ?? 'welcome' ) );
    $heading = $primary && function_exists( 'is_front_page' ) && is_front_page() ? 'h1' : 'h2';
    $title = trim( (string) ( $data['title'] ?? '' ) );
    $lead = trim( (string) ( $data['description'] ?? '' ) );
    // Match only the two original MONA Studio defaults. Never rewrite an
    // author's custom title or description in a different Studio section.
    $starter = 'agency-starter-studio' === (string) ( $data['id'] ?? '' );
    $approved = 'Markanıza özel web siteleri, e-ticaret ve yazılım.';
    $approved_lead = 'İşinizi anlatan, satışınızı destekleyen ve günlük işlerinizi kolaylaştıran dijital çözümler geliştiriyoruz.';
    if ( $starter && 'Markanız için dijitalin ötesinde.' === $title ) { $title = $approved; }
    if ( $starter && 'Web tasarım, e-ticaret ve özel yazılım çözümleri.' === $lead ) { $lead = $approved_lead; }
    if ( '' === $title ) { $title = $approved; }
    if ( '' === $lead ) { $lead = $approved_lead; }
    $editorial = $approved === $title;
    $contact = codela_sf_agency_contact_link();
    $services = codela_sf_agency_page_url( 'hizmetler', home_url( '/#sf-agency-services' ) );
    $image = ( function_exists( 'get_template_directory_uri' ) ? get_template_directory_uri() : '' )
        . '/assets/media/mona-studio-hero.jpg';
    ob_start();
    ?>
    <div class="sf-agency-widget sf-agency-widget--studio" data-agency-widget="studio">
      <section class="codela-studio-hero" aria-labelledby="<?php echo esc_attr( $id ); ?>">
        <div class="codela-studio-hero__inner">
          <div class="codela-studio-hero__intro">
            <p class="codela-studio-hero__kicker"><span class="codela-studio-hero__dot" aria-hidden="true"></span> CODELA</p>
            <<?php echo $heading; ?> class="codela-studio-hero__title<?php echo $editorial ? ' codela-studio-hero__title--descriptive' : ''; ?>" id="<?php echo esc_attr( $id ); ?>">
              <?php if ( $editorial ) : ?>
                <span>Markanıza özel</span><span class="codela-studio-hero__title-muted">web siteleri, e-ticaret ve yazılım.</span>
              <?php else : ?>
                <?php echo esc_html( $title ); ?>
              <?php endif; ?>
            </<?php echo $heading; ?>>
            <p class="codela-studio-hero__lead"><?php echo esc_html( $lead ); ?></p>
            <a class="codela-studio-hero__contact" href="<?php echo esc_url( $contact ); ?>">Projenizi konuşalım <span aria-hidden="true">↗</span></a>
          </div>
          <div class="codela-studio-hero__visual">
            <img src="<?php echo esc_url( $image ); ?>" alt="Işığı yansıtan cam ve metal yüzeylerden oluşan Codela stüdyo kompozisyonu"
                 <?php echo $primary ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'; ?> decoding="async" width="1200" height="896" />
            <div class="codela-studio-hero__fade" aria-hidden="true"></div>
            <div class="codela-studio-hero__visual-foot">
              <span><i aria-hidden="true"></i> İstanbul · <?php echo esc_html( gmdate( 'Y' ) ); ?></span>
              <a href="<?php echo esc_url( $services ); ?>">Hizmetler <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
      </section>
    </div>
    <?php
    return (string) ob_get_clean();
}
