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
        if ( ! isset( $raw[$service] ) || ! is_array( $raw[$service] ) ) { return null; }
        $out[$service] = [ 'packages' => [], 'extras' => [] ];
        foreach ( [ 'packages', 'extras' ] as $kind ) {
            if ( ! array_key_exists( $kind, $raw[$service] ) ) { return null; }
            $rows = $raw[$service][$kind];
            if ( ! is_array( $rows ) || count( $rows ) > 24 ) { return null; }
            foreach ( $rows as $i => $row ) {
                if ( ! is_int( $i ) || $i < 0 || $i > 23 || ! is_array( $row ) ) { return null; }
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
    if ( ! preg_match( '/^(?:[0-9]|1[0-9]|2[0-3])$/D', $package ) || ! isset( $rules['packages'][(int) $package] ) ) { return null; }
    $rows = [ $rules['packages'][(int) $package] ];
    foreach ( array_unique( $extras ) as $extra ) {
        if ( ! is_string( $extra ) || ! preg_match( '/^(?:[0-9]|1[0-9]|2[0-3])$/D', $extra ) || ! isset( $rules['extras'][(int) $extra] ) ) { return null; }
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
/** Settings use the same hub rows and save action as other theme settings. */
function codela_sf_quote_admin_row( string $service, string $kind, string $index, array $row ): void {
    $prefix = 'quote[' . $service . '][' . $kind . '][' . $index . ']';
    echo '<div class="cdl-theme-row" data-quote-row data-index="' . esc_attr( $index ) . '"><div class="cdl-theme-fields">';
    foreach ( [ 'label' => 'Ad', 'min' => 'En az TL', 'max' => 'En çok TL' ] as $key => $label ) {
        $id = 'cdl-q-' . $service . '-' . $kind . '-' . $index . '-' . $key;
        echo '<div class="cdl-theme-field"><div class="cdl-theme-field-copy"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label></div><div class="cdl-theme-control"><input class="regular-text" id="' . esc_attr( $id ) . '" name="' . esc_attr( $prefix . '[' . $key . ']' ) . '" value="' . esc_attr( $row[$key] ?? '' ) . '" ' . ( 'label' === $key ? 'type="text" maxlength="120"' : 'type="number" min="0" max="999999999" step="1"' ) . '></div></div>';
    }
    echo '</div><div class="cdl-theme-row-tools"><button class="cdl-btn-secondary" type="button" data-quote-remove>Satırı kaldır</button></div></div>';
}
function codela_sf_quote_render_settings(): void {
    if ( ! current_user_can( 'manage_options' ) ) { return; }
    $rules = codela_sf_quote_rules();
    echo '<section id="codela-quote-rules" class="cdl-theme-appearance-panel" aria-label="Teklif ve fiyatlandırma"><form class="cdl-theme-appearance" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="codela_sf_save_quote_rules"><div class="cdl-theme-sections"><div class="cdl-theme-section"><h4>Teklif ve fiyatlandırma</h4><p class="description">Bağlayıcı olmayan TL tahminleri. Bilinmeyen fiyat için iki tutarı da boş bırakın. Bakım fiyatları aylık, yazılım fiyatları başlangıç tutarıdır.</p>';
    wp_nonce_field( 'codela_sf_save_quote_rules' );
    foreach ( codela_sf_quote_services() as $service => $title ) {
        echo '<details class="cdl-theme-row"><summary><strong>' . esc_html( $title ) . '</strong></summary>';
        foreach ( [ 'packages' => 'Paketler / kapsam', 'extras' => 'Ek kapsamlar' ] as $kind => $heading ) {
            echo '<div data-quote-group><h4>' . esc_html( $heading ) . '</h4><input type="hidden" name="quote[' . esc_attr( $service ) . '][' . esc_attr( $kind ) . '][_present]" value="1"><div data-quote-rows>';
            foreach ( $rules[$service][$kind] as $index => $row ) { codela_sf_quote_admin_row( $service, $kind, (string) $index, $row ); }
            echo '</div><template>';
            codela_sf_quote_admin_row( $service, $kind, '__INDEX__', [] );
            echo '</template><button type="button" class="cdl-btn-secondary" data-quote-add>+ Ekle</button></div>';
        }
        echo '</details>';
    }
    echo '</div></div><div class="cdl-theme-save-row"><button class="codela-btn codela-btn--save" type="submit">Kaydet</button></div></form></section>';
    echo '<script>(function(){const root=document.getElementById("codela-quote-rules");if(!root)return;root.addEventListener("click",e=>{const button=e.target.closest("button");if(!button)return;const group=button.closest("[data-quote-group]");if(!group)return;const rows=group.querySelector("[data-quote-rows]");if(button.hasAttribute("data-quote-remove")){button.closest("[data-quote-row]").remove();group.querySelector("[data-quote-add]").disabled=false;}if(button.hasAttribute("data-quote-add")){const used=new Set([...rows.children].map(x=>x.dataset.index));let i=0;while(used.has(String(i)))i++;if(i>=24)return;rows.insertAdjacentHTML("beforeend",group.querySelector("template").innerHTML.replaceAll("__INDEX__",String(i)));rows.lastElementChild.querySelector("input").focus();button.disabled=rows.children.length>=24;}});root.querySelectorAll("[data-quote-group]").forEach(g=>{g.querySelector("[data-quote-add]").disabled=g.querySelector("[data-quote-rows]").children.length>=24;});})();</script>';
}
add_action( function_exists( 'codela_theme_render_general' ) ? 'codela_theme_settings_general' : 'codela_theme_settings_integrations', 'codela_sf_quote_render_settings' );
add_action( 'admin_post_codela_sf_save_quote_rules', static function() {
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! current_user_can( 'manage_options' ) || ! function_exists( 'codela_theme_admin_url' ) ) { wp_die( 'Yetkisiz işlem.', '', [ 'response' => 403 ] ); }
    check_admin_referer( 'codela_sf_save_quote_rules' );
    $raw = $_POST['quote'] ?? null;
    $raw = is_array( $raw ) ? wp_unslash( $raw ) : null;
    if ( is_array( $raw ) ) {
        foreach ( $raw as &$service ) { if ( is_array( $service ) ) { foreach ( $service as &$rows ) { if ( is_array( $rows ) ) { unset( $rows['_present'] ); } } unset( $rows ); } } unset( $service );
    }
    $clean = codela_sf_quote_clean( $raw );
    if ( null === $clean ) { wp_die( 'Paket ve fiyat aralıklarını kontrol edin. Değişiklik kaydedilmedi.', '', [ 'response' => 400 ] ); }
    update_option( 'codela_sf_quote_rules', $clean, false );
    wp_safe_redirect( codela_theme_admin_url( function_exists( 'codela_theme_render_general' ) ? 'general' : 'integrations' ) . '#codela-quote-rules' ); exit;
} );

/** Quote calculations for the existing multi-service project form. */
function codela_sf_project_quote_key( string $service ): string {
    return [ 'Web Tasarım' => 'web', 'E-Ticaret' => 'commerce', 'Özel Yazılım' => 'software', 'Optimizasyon / Destek' => 'support' ][$service] ?? '';
}
function codela_sf_project_quote_calculate( array $services, $raw ): ?array {
    if ( ! is_array( $raw ) || count( $raw ) > 4 ) { return null; }
    $rules = codela_sf_quote_rules(); $out = [];
    foreach ( $services as $service ) {
        $key = codela_sf_project_quote_key( $service );
        if ( ! $key || ! isset( $rules[$key] ) ) { return null; }
        $choice = $raw[$key] ?? [];
        if ( ! is_array( $choice ) ) { return null; }
        $packages = $choice['packages'] ?? [];
        if ( [ '' ] === $packages ) { $packages = []; }
        $extras = $choice['extras'] ?? [];
        $custom = $choice['custom'] ?? '';
        if ( ! is_array( $packages ) || ! is_array( $extras ) || count( $packages ) > 24 || count( $extras ) > 24 || ( '' !== $custom && '1' !== $custom ) ) { return null; }
        if ( 'software' !== $key && count( $packages ) > 1 ) { return null; }
        $labels = []; $min = $max = 0; $known = (bool) $packages && '1' !== $custom;
        foreach ( [ 'packages' => $packages, 'extras' => $extras ] as $kind => $ids ) {
            $seen = [];
            foreach ( $ids as $id ) {
                if ( ! is_string( $id ) || ! preg_match( '/^(?:[0-9]|1[0-9]|2[0-3])$/D', $id ) || ! isset( $rules[$key][$kind][(int) $id] ) ) { return null; }
                if ( isset( $seen[$id] ) ) { continue; } $seen[$id] = true;
                $row = $rules[$key][$kind][(int) $id]; $labels[] = $row['label'];
                if ( null === $row['min'] || null === $row['max'] ) { $known = false; }
                else { $min += $row['min']; $max += $row['max']; }
            }
        }
        $label = $known ? ( 'software' === $key ? codela_sf_quote_money( [ $min, $min ] ) . ' itibarıyla' : codela_sf_quote_money( [ $min, $max ] ) . ( 'support' === $key ? ' / ay' : '' ) ) : 'Görüşmede belirlenecek';
        $out[$key] = [ 'service' => codela_sf_quote_services()[$key], 'scope' => '1' === $custom ? [ 'İhtiyaca özel' ] : $labels, 'estimate' => $label ];
    }
    return $out;
}
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
      <summary><span><strong>Ücretsiz Teklif Al</strong><small><?php echo null !== $start ? esc_html( codela_sf_quote_money( [ $start, $start ] ) . ' itibarıyla tahmini' ) : 'İhtiyacına göre kapsamı netleştirelim.'; ?></small></span><span aria-hidden="true">↗</span></summary>
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
/** One delivery contract for both project entry points. Existing installations
 * without the plugin record API keep their original mail-only behavior. */
function codela_sf_quote_deliver( string $name, string $contact, string $to, string $subject, string $body, array $headers, string $record_body ): bool {
    $stored = function_exists( '\\Codela\\ClientPortal\\store_public_quote' )
        ? \\Codela\\ClientPortal\\store_public_quote( $name, $contact, $record_body ) : 0;
    $sent = is_email( $to ) && wp_mail( $to, $subject, $body, $headers );
    // A persisted request is accepted even when the notification transport fails.
    return $stored > 0 || $sent;
}
function codela_sf_quote_submit(): void {
    $source = codela_sf_agency_submitted_source( 'agency-detail' );
    if ( ! $source || 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! codela_sf_ready() ) { wp_die( 'Geçersiz teklif kaynağı.', '', [ 'response' => 400 ] ); }
    $redirect = static function( string $status, string $receipt = '' ) use ( $source ): void {
        $args = [ 'codela_quote_status' => $status, 'codela_component' => $source['component'] ];
        if ( $receipt ) { $args['codela_quote_receipt'] = $receipt; }
        wp_safe_redirect( add_query_arg( $args, $source['url'] ) . '#cdl-quote-' . sanitize_html_class( $source['component'] ) ); exit;
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
    if ( 'custom' !== $package && ( ! preg_match( '/^(?:[0-9]|1[0-9]|2[0-3])$/D', $package ) || ! isset( $rules['packages'][(int) $package] ) ) ) { $redirect( 'invalid' ); }
    $extras = $_POST['quote_extra'] ?? [];
    if ( ! is_array( $extras ) || count( $extras ) > 24 ) { $redirect( 'invalid' ); }
    $extra_labels = [];
    foreach ( $extras as $extra ) {
        if ( ! is_string( $extra ) || ! preg_match( '/^(?:[0-9]|1[0-9]|2[0-3])$/D', $extra ) || ! isset( $rules['extras'][(int) $extra] ) ) { $redirect( 'invalid' ); }
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
    $record_body = "Hizmet: " . codela_sf_quote_services()[$service] . "\nPaket: $label\nEk kapsam: " . implode( ', ', $extra_labels ) . "\nTahmin: " . ( $estimate ? codela_sf_quote_money( $estimate ) : 'Görüşmede belirlenecek' ) . "\nNot: $note";
    if ( ! codela_sf_quote_deliver( $name, $email, $to, '[Codela] Ücretsiz teklif talebi', $body, [ 'Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . $email ], $record_body ) ) { $redirect( 'failed' ); }
    set_transient( $throttle, 1, MINUTE_IN_SECONDS );
    $receipt = bin2hex( random_bytes( 16 ) );
    set_transient( 'codela_sf_quote_receipt_' . $receipt, [ (int) $_POST['agency_source_page'], $source['component'] ], 5 * MINUTE_IN_SECONDS );
    $redirect( 'sent', $receipt );
}
add_action( 'admin_post_codela_sf_agency_quote', 'codela_sf_quote_submit' );
add_action( 'admin_post_nopriv_codela_sf_agency_quote', 'codela_sf_quote_submit' );
