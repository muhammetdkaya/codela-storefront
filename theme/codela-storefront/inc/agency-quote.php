<?php
/** Non-binding Agency estimates. No product, cart, payment or reservation is created. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_quote_services(): array {
    return [ 'web' => 'Web Tasarım', 'commerce' => 'E-Ticaret', 'software' => 'Özel Yazılım', 'support' => 'Bakım & Geliştirme' ];
}
function codela_sf_quote_defaults(): array {
    $names = [
        'web' => [ 'WordPress web sitesi', 'Özel web sitesi' ],
        'commerce' => [ 'WooCommerce mağazası', 'Özel e-ticaret altyapısı' ],
        'software' => [ 'Özel yönetim paneli', 'API ve sistem entegrasyonu' ],
        'support' => [ 'Bakım ve güncelleme', 'Performans iyileştirme' ],
    ];
    $out = [];
    foreach ( $names as $service => $labels ) {
        $out[$service] = [ 'packages' => [], 'extras' => [] ];
        foreach ( $labels as $i => $label ) { $out[$service]['packages'][$i] = [ 'label' => $label, 'min' => null, 'max' => null ]; }
    }
    return $out;
}
/** Validate whole-TL ranges together; never manufacture a price for blank fields. */
function codela_sf_quote_clean( $raw ): ?array {
    if ( ! is_array( $raw ) ) { return null; }
    $out = [];
    foreach ( codela_sf_quote_services() as $service => $title ) {
        $out[$service] = [ 'packages' => [], 'extras' => [] ];
        foreach ( [ 'packages', 'extras' ] as $kind ) {
            $rows = $raw[$service][$kind] ?? [];
            if ( ! is_array( $rows ) || count( $rows ) > 6 ) { return null; }
            foreach ( $rows as $i => $row ) {
                if ( ! is_int( $i ) || $i < 0 || $i > 5 || ! is_array( $row ) ) { return null; }
                $label = $row['label'] ?? '';
                $min = $row['min'] ?? ''; $max = $row['max'] ?? '';
                if ( ! is_string( $label ) || strlen( $label ) > 180 ) { return null; }
                $label = trim( sanitize_text_field( $label ) );
                if ( ! $label ) {
                    if ( '' !== $min && null !== $min || '' !== $max && null !== $max ) { return null; }
                    continue;
                }
                if ( ( '' === $min || null === $min ) && ( '' === $max || null === $max ) ) { $min = $max = null; }
                else {
                    if ( ! ( is_string( $min ) || is_int( $min ) ) || ! ( is_string( $max ) || is_int( $max ) )
                        || ! preg_match( '/^[0-9]{1,9}$/D', (string) $min ) || ! preg_match( '/^[0-9]{1,9}$/D', (string) $max )
                        || (int) $min > (int) $max || ( 'packages' === $kind && (int) $min < 1 ) ) { return null; }
                    $min = (int) $min; $max = (int) $max;
                }
                $out[$service][$kind][$i] = [ 'label' => $label, 'min' => $min, 'max' => $max ];
            }
        }
    }
    return $out;
}
function codela_sf_quote_rules(): array {
    $stored = get_option( 'codela_sf_quote_rules', null );
    return null === $stored ? codela_sf_quote_defaults() : ( codela_sf_quote_clean( $stored ) ?? codela_sf_quote_defaults() );
}
function codela_sf_quote_estimate( array $rules, string $package, array $extras ): ?array {
    if ( 'custom' === $package ) { return null; }
    if ( ! preg_match( '/^[0-5]$/D', $package ) || ! isset( $rules['packages'][(int) $package] ) ) { return null; }
    $rows = [ $rules['packages'][(int) $package] ];
    foreach ( array_unique( $extras ) as $extra ) {
        if ( ! is_string( $extra ) || ! preg_match( '/^[0-5]$/D', $extra ) || ! isset( $rules['extras'][(int) $extra] ) ) { return null; }
        $rows[] = $rules['extras'][(int) $extra];
    }
    $min = $max = 0;
    foreach ( $rows as $row ) {
        if ( null === $row['min'] || null === $row['max'] ) { return null; }
        $min += $row['min']; $max += $row['max'];
    }
    return [ $min, $max ];
}
function codela_sf_quote_money( array $range ): string {
    $min = number_format( $range[0], 0, ',', '.' ); $max = number_format( $range[1], 0, ',', '.' );
    return $min . ( $min === $max ? '' : ' – ' . $max ) . ' TL';
}
function codela_sf_quote_row_price( array $row ): string {
    return null === $row['min'] || null === $row['max'] ? '' : codela_sf_quote_money( [ $row['min'], $row['max'] ] );
}
function codela_sf_quote_render_settings(): void {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    $rules = codela_sf_quote_rules();
    echo '<section id="codela-quote-rules" class="cdl-theme-appearance-panel"><h2>Ücretsiz teklif · Paketler ve fiyatlar</h2><p>Fiyatlar TL cinsinden, bağlayıcı olmayan tahminlerdir. Fiyatı bilinmeyen satırda iki tutarı da boş bırakın. Bir satırı kaldırmak için adını ve tutarlarını temizleyin. Her hizmette altı paket ve altı ek kapsam tanımlanabilir.</p><form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="codela_sf_save_quote_rules">';
    wp_nonce_field( 'codela_sf_save_quote_rules' );
    foreach ( codela_sf_quote_services() as $service => $title ) {
        echo '<details><summary><strong>' . esc_html( $title ) . '</strong></summary>';
        foreach ( [ 'packages' => 'Paketler', 'extras' => 'Ek kapsamlar' ] as $kind => $heading ) {
            echo '<h3>' . esc_html( $heading ) . '</h3><div class="cdl-theme-fields">';
            for ( $i = 0; $i < 6; ++$i ) {
                $row = $rules[$service][$kind][$i] ?? [ 'label' => '', 'min' => '', 'max' => '' ];
                $prefix = 'quote[' . $service . '][' . $kind . '][' . $i . ']';
                echo '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><input type="text" maxlength="120" aria-label="' . esc_attr( $heading . ' ' . ( $i + 1 ) . ' adı' ) . '" name="' . esc_attr( $prefix . '[label]' ) . '" value="' . esc_attr( $row['label'] ) . '" placeholder="Paket / kapsam adı">';
                foreach ( [ 'min' => 'En az TL', 'max' => 'En çok TL' ] as $key => $label ) {
                    echo '<input type="number" min="0" max="999999999" step="1" aria-label="' . esc_attr( $label ) . '" name="' . esc_attr( $prefix . '[' . $key . ']' ) . '" value="' . esc_attr( $row[$key] ?? '' ) . '" placeholder="' . esc_attr( $label ) . '" style="width:115px">';
                }
                echo '</div>';
            }
            echo '</div>';
        }
        echo '</details>';
    }
    submit_button( 'Teklif kurallarını kaydet' );
    echo '</form></section>';
}
add_action( function_exists( 'codela_theme_render_general' ) ? 'codela_theme_settings_general' : 'codela_theme_settings_integrations', 'codela_sf_quote_render_settings' );
add_action( 'admin_post_codela_sf_save_quote_rules', static function() {
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! current_user_can( 'manage_options' ) || ! function_exists( 'codela_theme_admin_url' ) ) { wp_die( 'Yetkisiz işlem.', '', [ 'response' => 403 ] ); }
    check_admin_referer( 'codela_sf_save_quote_rules' );
    $raw = $_POST['quote'] ?? null;
    $clean = is_array( $raw ) ? codela_sf_quote_clean( wp_unslash( $raw ) ) : null;
    if ( null === $clean ) { wp_die( 'Paket ve fiyat aralıklarını kontrol edin. Değişiklik kaydedilmedi.', '', [ 'response' => 400 ] ); }
    update_option( 'codela_sf_quote_rules', $clean, false );
    wp_safe_redirect( codela_theme_admin_url( function_exists( 'codela_theme_render_general' ) ? 'general' : 'integrations' ) . '#codela-quote-rules' ); exit;
} );

function codela_sf_quote_markup( string $service, array $data ): string {
    $context = codela_sf_agency_form_context( 'agency-detail', $data );
    if ( ! $context[0] || ! isset( codela_sf_quote_services()[$service] ) ) { return ''; }
    $rules = codela_sf_quote_rules()[$service];
    $id = codela_sf_agency_dom_id( 'cdl-quote-' . sanitize_html_class( $context[1] ) );
    $status = isset( $_GET['codela_quote_status'], $_GET['codela_component'] ) && is_string( $_GET['codela_quote_status'] ) && is_string( $_GET['codela_component'] ) && $_GET['codela_component'] === $context[1] ? sanitize_key( $_GET['codela_quote_status'] ) : '';
    if ( 'sent' === $status ) {
        $token = $_GET['codela_quote_receipt'] ?? '';
        $receipt = is_string( $token ) && preg_match( '/^[a-f0-9]{32}$/D', $token ) ? get_transient( 'codela_sf_quote_receipt_' . $token ) : false;
        if ( ! is_array( $receipt ) || $receipt !== $context ) { $status = ''; }
    }
    $priced = array_filter( $rules['packages'], static fn( $row ) => null !== $row['min'] );
    $start = $priced ? min( array_column( $priced, 'min' ) ) : null;
    ob_start(); ?>
    <details class="cdl-quote" id="<?php echo esc_attr( $id ); ?>"<?php echo $status ? ' open' : ''; ?>>
      <summary><span><strong>Ücretsiz Teklif Al</strong><small><?php echo null !== $start ? esc_html( codela_sf_quote_money( [ $start, $start ] ) . ' başlangıç tahmini' ) : 'İhtiyacına göre kapsamı netleştirelim.'; ?></small></span><span aria-hidden="true">↗</span></summary>
      <?php if ( 'sent' === $status ) : ?><p role="status">Talebin alındı. Kapsamı inceleyip sana dönüş yapacağız.</p>
      <?php else : ?>
        <?php if ( in_array( $status, [ 'invalid', 'failed', 'wait' ], true ) ) : ?><p role="alert"><?php echo esc_html( 'wait' === $status ? 'Kısa süre önce talep gönderdin. Bir dakika sonra tekrar dene.' : 'Talep iletilemedi. Bilgilerini kontrol edip tekrar dene.' ); ?></p><?php endif; ?>
        <form class="cdl-quote__form" data-quote-form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
          <input type="hidden" name="action" value="codela_sf_agency_quote">
          <input type="hidden" name="quote_service" value="<?php echo esc_attr( $service ); ?>">
          <?php codela_sf_agency_nonce_input( 'codela_sf_agency_quote', 'quote_nonce' ); codela_sf_agency_form_context_input( $context ); ?>
          <label>Paket<select name="quote_package" required>
            <option value="custom">İhtiyacıma özel teklif</option>
            <?php foreach ( $rules['packages'] as $key => $row ) : ?><option value="<?php echo esc_attr( $key ); ?>" data-min="<?php echo esc_attr( $row['min'] ?? '' ); ?>" data-max="<?php echo esc_attr( $row['max'] ?? '' ); ?>"><?php echo esc_html( $row['label'] . ( codela_sf_quote_row_price( $row ) ? ' · ' . codela_sf_quote_row_price( $row ) : '' ) ); ?></option><?php endforeach; ?>
          </select></label>
          <?php if ( $rules['extras'] ) : ?><fieldset><legend>Ek kapsam</legend><?php foreach ( $rules['extras'] as $key => $row ) : ?><label class="cdl-quote__check"><input type="checkbox" name="quote_extra[]" value="<?php echo esc_attr( $key ); ?>" data-min="<?php echo esc_attr( $row['min'] ?? '' ); ?>" data-max="<?php echo esc_attr( $row['max'] ?? '' ); ?>"><span><?php echo esc_html( $row['label'] . ( codela_sf_quote_row_price( $row ) ? ' · ' . codela_sf_quote_row_price( $row ) : '' ) ); ?></span></label><?php endforeach; ?></fieldset><?php endif; ?>
          <p class="cdl-quote__estimate" data-quote-estimate aria-live="polite" hidden></p>
          <p class="cdl-quote__note">Ücretsiz, bağlayıcı olmayan ön teklif. Nihai kapsam, KDV ve koşullar görüşmede netleşir; ödeme veya rezervasyon oluşturulmaz.</p>
          <label>Ad Soyad / Marka<input type="text" name="quote_name" autocomplete="name" minlength="2" maxlength="120" required></label>
          <label>E-posta<input type="email" name="quote_email" autocomplete="email" maxlength="180" required></label>
          <label>Proje hakkında<textarea name="quote_note" rows="3" maxlength="2000" placeholder="Sayfa sayısı, entegrasyonlar veya hedefin"></textarea></label>
          <label hidden>Boş bırak<input type="text" name="quote_webpage" tabindex="-1" autocomplete="off"></label>
          <label class="cdl-quote__check"><input type="checkbox" name="quote_consent" value="1" required><span>Bilgilerimin teklif talebime yanıt verilmesi için kullanılmasını kabul ediyorum. <?php if ( function_exists( 'get_privacy_policy_url' ) && get_privacy_policy_url() ) : ?><a href="<?php echo esc_url( get_privacy_policy_url() ); ?>">Gizlilik politikası</a><?php endif; ?></span></label>
          <button class="cdl-service-detail__cta" type="submit">Teklif Talebini Gönder <span aria-hidden="true">→</span></button>
        </form>
      <?php endif; ?>
    </details>
    <?php return (string) ob_get_clean();
}
function codela_sf_quote_submit(): void {
    $source = codela_sf_agency_submitted_source( 'agency-detail' );
    if ( ! $source || 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! codela_sf_ready() ) { wp_die( 'Geçersiz teklif kaynağı.', '', [ 'response' => 400 ] ); }
    $redirect = static function( string $status, string $receipt = '' ) use ( $source ): void {
        $args = [ 'codela_quote_status' => $status, 'codela_component' => $source['component'] ];
        if ( $receipt ) { $args['codela_quote_receipt'] = $receipt; }
        wp_safe_redirect( add_query_arg( $args, $source['url'] ) ); exit;
    };
    $field = static function( string $key ): string { $v = $_POST[$key] ?? ''; return is_string( $v ) ? trim( sanitize_text_field( wp_unslash( $v ) ) ) : ''; };
    if ( ! wp_verify_nonce( $field( 'quote_nonce' ), 'codela_sf_agency_quote' ) || $field( 'quote_webpage' ) !== '' || '1' !== $field( 'quote_consent' ) ) { $redirect( 'invalid' ); }
    $service = $field( 'quote_service' );
    $valid_service = false;
    foreach ( codela_sf_agency_components( get_post( (int) $_POST['agency_source_page'] ) )['agency-detail'] ?? [] as $data ) {
        if ( $data['id'] === $source['component'] && $data['variant'] === $service ) { $valid_service = true; break; }
    }
    $all = codela_sf_quote_rules();
    if ( ! $valid_service || ! isset( $all[$service] ) ) { $redirect( 'invalid' ); }
    $rules = $all[$service];
    $package = $field( 'quote_package' );
    if ( 'custom' !== $package && ( ! preg_match( '/^[0-5]$/D', $package ) || ! isset( $rules['packages'][(int) $package] ) ) ) { $redirect( 'invalid' ); }
    $extras = $_POST['quote_extra'] ?? [];
    if ( ! is_array( $extras ) || count( $extras ) > 6 ) { $redirect( 'invalid' ); }
    $extra_labels = [];
    foreach ( $extras as $extra ) {
        if ( ! is_string( $extra ) || ! preg_match( '/^[0-5]$/D', $extra ) || ! isset( $rules['extras'][(int) $extra] ) ) { $redirect( 'invalid' ); }
        $extra_labels[$extra] = $rules['extras'][(int) $extra]['label'];
    }
    $name = $field( 'quote_name' ); $email = sanitize_email( $field( 'quote_email' ) );
    $note = isset( $_POST['quote_note'] ) && is_string( $_POST['quote_note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['quote_note'] ) ) : '';
    if ( strlen( $name ) < 2 || strlen( $name ) > 480 || ! is_email( $email ) || strlen( $email ) > 180 || strlen( $note ) > 8000 ) { $redirect( 'invalid' ); }
    $throttle = 'codela_sf_quote_' . hash_hmac( 'sha256', (string) ( $_SERVER['REMOTE_ADDR'] ?? 'unknown' ), wp_salt( 'auth' ) );
    if ( get_transient( $throttle ) ) { $redirect( 'wait' ); }
    $to = sanitize_email( (string) get_option( 'admin_email' ) );
    $estimate = codela_sf_quote_estimate( $rules, $package, $extras );
    $label = 'custom' === $package ? 'İhtiyaca özel' : $rules['packages'][(int) $package]['label'];
    $body = "Ücretsiz teklif talebi (bağlayıcı değil)\nHizmet: " . codela_sf_quote_services()[$service] . "\nPaket: $label\nEk kapsam: " . implode( ', ', $extra_labels ) . "\nTahmin: " . ( $estimate ? codela_sf_quote_money( $estimate ) : 'Kapsam görüşmesinde belirlenecek' ) . "\nAd / Marka: $name\nE-posta: $email\nNot: $note";
    if ( ! is_email( $to ) || ! wp_mail( $to, '[Codela] Ücretsiz teklif talebi', $body, [ 'Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . $email ] ) ) { $redirect( 'failed' ); }
    set_transient( $throttle, 1, MINUTE_IN_SECONDS );
    $receipt = bin2hex( random_bytes( 16 ) );
    set_transient( 'codela_sf_quote_receipt_' . $receipt, [ (int) $_POST['agency_source_page'], $source['component'] ], 5 * MINUTE_IN_SECONDS );
    $redirect( 'sent', $receipt );
}
add_action( 'admin_post_codela_sf_agency_quote', 'codela_sf_quote_submit' );
add_action( 'admin_post_nopriv_codela_sf_agency_quote', 'codela_sf_quote_submit' );
