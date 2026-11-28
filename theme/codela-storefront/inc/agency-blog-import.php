<?php
/** Temporary, administrator-initiated editorial import for codela.dev only. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function codela_sf_blog_import_allowed(): bool {
    $host = strtolower( (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ) );
    $settings = get_option( 'codela_theme_settings', [] );
    return in_array( $host, [ 'codela.dev', 'www.codela.dev' ], true )
        && is_array( $settings ) && 'agency' === ( $settings['site_experience'] ?? '' )
        && current_user_can( 'manage_options' ) && current_user_can( 'edit_posts' )
        && current_user_can( 'upload_files' );
}

function codela_sf_blog_import_rows() {
    $path = get_template_directory() . '/content/blog-2026/';
    $json = is_readable( $path . 'posts.json' ) ? file_get_contents( $path . 'posts.json' ) : '';
    $rows = json_decode( $json ?: '', true );
    if ( ! is_array( $rows ) || count( $rows ) !== 10 ) {
        return new WP_Error( 'package', 'Blog paketi eksik. Temayı yeniden güncelleyip deneyin.' );
    }
    $slugs = [];
    foreach ( $rows as $row ) {
        foreach ( [ 'slug', 'title', 'seoTitle', 'meta', 'excerpt', 'category', 'focus', 'body_html', 'image', 'alt' ] as $field ) {
            if ( empty( $row[ $field ] ) || ! is_string( $row[ $field ] ) ) {
                return new WP_Error( 'package', 'Blog paketindeki bir içerik eksik.' );
            }
        }
        if ( ! preg_match( '/^[a-z0-9-]+$/D', $row['slug'] ) || isset( $slugs[ $row['slug'] ] )
            || ! preg_match( '/^[a-z0-9-]+\.webp$/D', $row['image'] ) || ! is_readable( $path . $row['image'] ) ) {
            return new WP_Error( 'package', 'Blog paketindeki bir görsel veya yazı kimliği geçersiz.' );
        }
        $slugs[ $row['slug'] ] = true;
    }
    return $rows;
}

/** Find our own content even after a user changes its slug or moves it to trash. */
function codela_sf_blog_import_find( string $key, string $type = 'post' ): int {
    $ids = get_posts( [ 'post_type' => $type, 'post_status' => array_keys( get_post_stati() ),
        'meta_key' => '_codela_blog_import_key', 'meta_value' => $key,
        'fields' => 'ids', 'posts_per_page' => 1, 'orderby' => 'ID', 'order' => 'ASC',
        'suppress_filters' => true ] );
    return $ids ? (int) $ids[0] : 0;
}

/** Conditional deletion prevents an old request from releasing a newer lock. */
function codela_sf_blog_import_unlock( string $value ): void {
    global $wpdb;
    $wpdb->delete( $wpdb->options, [ 'option_name' => 'codela_sf_blog_import_lock', 'option_value' => $value ], [ '%s', '%s' ] );
    wp_cache_delete( 'codela_sf_blog_import_lock', 'options' );
}

function codela_sf_blog_import_lock() {
    $old = (string) get_option( 'codela_sf_blog_import_lock', '' );
    $data = json_decode( $old, true );
    if ( $old && is_array( $data ) && (int) ( $data['expires'] ?? 0 ) < time() ) {
        codela_sf_blog_import_unlock( $old );
    }
    $value = wp_json_encode( [ 'token' => wp_generate_uuid4(), 'expires' => time() + 300 ] );
    if ( ! add_option( 'codela_sf_blog_import_lock', $value, '', false ) ) {
        return new WP_Error( 'busy', 'Bir aktarma işlemi sürüyor. Biraz sonra devam edebilirsiniz.' );
    }
    return $value;
}

function codela_sf_blog_import_image( array $row, int $post_id, string $key ) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attachment = codela_sf_blog_import_find( $key . ':cover', 'attachment' );
    if ( $attachment && 'trash' === get_post_status( $attachment ) ) {
        return new WP_Error( 'trashed_image', 'Bu yazının kapak görseli çöp kutusunda. Görseli geri yükleyip devam edin.' );
    }
    if ( $attachment && ! is_file( (string) get_attached_file( $attachment ) ) ) {
        return new WP_Error( 'missing_image', 'Daha önce aktarılan kapak dosyası bulunamadı. Ortam kütüphanesindeki dosyayı geri yükleyip devam edin.' );
    }
    if ( ! $attachment ) {
        $temp = wp_tempnam( $row['image'] );
        if ( ! $temp || ! copy( get_template_directory() . '/content/blog-2026/' . $row['image'], $temp ) ) {
            if ( $temp ) { wp_delete_file( $temp ); }
            return new WP_Error( 'image_copy', 'Görsel için geçici dosya oluşturulamadı. Sunucunun dosya izinlerini kontrol edin.' );
        }
        $attachment = media_handle_sideload( [ 'name' => 'codela-blog-' . $row['image'], 'tmp_name' => $temp ], $post_id, null,
            [ 'post_title' => $row['title'], 'meta_input' => [ '_codela_blog_import_key' => $key . ':cover',
                '_wp_attachment_image_alt' => $row['alt'] ] ] );
        if ( is_file( $temp ) ) { wp_delete_file( $temp ); }
        if ( is_wp_error( $attachment ) ) { return $attachment; }
    }
    // Recover sub-sizes after an interrupted image-generation request.
    $metadata = wp_update_image_subsizes( $attachment );
    if ( is_wp_error( $metadata ) || empty( $metadata['width'] ) || empty( $metadata['height'] ) ) {
        return new WP_Error( 'image_metadata', 'Kapak görselinin boyutları hazırlanamadı. Devam et düğmesiyle yeniden deneyin.' );
    }
    if ( ! get_post_thumbnail_id( $post_id ) ) { set_post_thumbnail( $post_id, $attachment ); }
    if ( ! get_post_thumbnail_id( $post_id ) ) {
        return new WP_Error( 'thumbnail', 'Kapak görseli yazıya bağlanamadı. Yeniden deneyin.' );
    }
    return (int) $attachment;
}

function codela_sf_blog_import_post( array $row, int $id, string $key ) {
    if ( $id && 'trash' === get_post_status( $id ) ) {
        return new WP_Error( 'trashed_post', 'Aktarılan bir yazı çöp kutusunda. Yazıyı geri yükleyip devam edin.' );
    }
    if ( $id && ! current_user_can( 'edit_post', $id ) ) {
        return new WP_Error( 'edit_post', 'Bu yazıyı düzenleme yetkiniz bulunmuyor.' );
    }
    if ( ! $id ) {
        // Never claim or overwrite an unrelated post with the same slug.
        $collision = get_posts( [ 'post_type' => 'post', 'post_status' => array_keys( get_post_stati() ),
            'name' => $row['slug'], 'fields' => 'ids', 'posts_per_page' => 1, 'suppress_filters' => true ] );
        if ( $collision ) {
            return new WP_Error( 'collision', 'Aynı bağlantı adına sahip bir yazı zaten var: ' . $row['slug'] . '. Mevcut yazının bağlantı adını düzenleyip devam edin.' );
        }
        $category = term_exists( $row['category'], 'category' );
        if ( ! $category ) { $category = wp_insert_term( $row['category'], 'category' ); }
        if ( is_wp_error( $category ) ) { return $category; }
        $id = wp_insert_post( wp_slash( [ 'post_type' => 'post', 'post_status' => 'draft',
            'post_author' => get_current_user_id(), 'post_title' => $row['title'], 'post_name' => $row['slug'],
            'post_content' => '<!-- wp:freeform -->' . wp_kses_post( $row['body_html'] ) . '<!-- /wp:freeform -->',
            'post_excerpt' => $row['excerpt'], 'post_category' => [ (int) ( is_array( $category ) ? $category['term_id'] : $category ) ],
            'comment_status' => 'closed', 'ping_status' => 'closed',
            'meta_input' => [ '_codela_blog_import_key' => $key, '_codela_seo_title' => $row['seoTitle'],
                '_codela_seo_description' => $row['meta'], '_codela_blog_focus_keyword' => $row['focus'] ],
        ] ), true );
        if ( is_wp_error( $id ) ) { return $id; }
    }
    $image = codela_sf_blog_import_image( $row, (int) $id, $key );
    if ( is_wp_error( $image ) ) { return $image; }
    update_post_meta( $id, '_codela_blog_import_complete', '1' );
    if ( '1' !== get_post_meta( $id, '_codela_blog_import_complete', true ) ) {
        return new WP_Error( 'save', 'Aktarma kaydı kaydedilemedi. Devam ederek yeniden deneyin.' );
    }
    return (int) $id;
}

/** One post per request bounds memory, thumbnail work and retry scope. */
function codela_sf_blog_import_step() {
    if ( ! codela_sf_blog_import_allowed() ) { return new WP_Error( 'forbidden', 'Bu işlem için yetkiniz bulunmuyor.' ); }
    $lock = codela_sf_blog_import_lock();
    if ( is_wp_error( $lock ) ) { return $lock; }
    try {
        if ( get_option( 'codela_sf_blog_import_20261128_done', false ) ) {
            return [ 'done' => true, 'count' => 10, 'total' => 10 ];
        }
        $rows = codela_sf_blog_import_rows();
        if ( is_wp_error( $rows ) ) { return $rows; }
        $ids = []; $pending = null;
        foreach ( $rows as $row ) {
            $key = '20261128:' . $row['slug'];
            $id = codela_sf_blog_import_find( $key );
            if ( $id && '1' === get_post_meta( $id, '_codela_blog_import_complete', true ) ) { $ids[] = $id; }
            elseif ( null === $pending ) { $pending = [ $row, $id, $key ]; }
        }
        if ( $pending ) {
            $result = codela_sf_blog_import_post( ...$pending );
            if ( is_wp_error( $result ) ) { return $result; }
            $ids[] = $result;
        }
        $done = count( $ids ) === count( $rows );
        if ( $done ) {
            update_option( 'codela_sf_blog_import_20261128_done', $ids, false );
            if ( ! get_option( 'codela_sf_blog_import_20261128_done', false ) ) {
                return new WP_Error( 'save', 'Aktarma tamamlandı ancak durum kaydedilemedi. Yeniden deneyin.' );
            }
        }
        return [ 'done' => $done, 'count' => count( $ids ), 'total' => count( $rows ) ];
    } finally {
        codela_sf_blog_import_unlock( $lock );
    }
}

function codela_sf_blog_import_ajax(): void {
    if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! codela_sf_blog_import_allowed() ) {
        wp_send_json_error( [ 'message' => 'Bu işlem için yetkiniz bulunmuyor.' ], 403 );
        return;
    }
    if ( ! check_ajax_referer( 'codela_sf_blog_import', 'nonce', false ) ) {
        wp_send_json_error( [ 'message' => 'Oturum doğrulaması sona erdi. Sayfayı yenileyip devam edin.' ], 403 );
        return;
    }
    $result = codela_sf_blog_import_step();
    if ( is_wp_error( $result ) ) {
        wp_send_json_error( [ 'message' => $result->get_error_message(), 'code' => $result->get_error_code() ],
            'busy' === $result->get_error_code() ? 409 : 400 );
        return;
    }
    wp_send_json_success( $result );
}
add_action( 'wp_ajax_codela_sf_blog_import', 'codela_sf_blog_import_ajax' );

function codela_sf_blog_import_render(): void {
    if ( ! codela_sf_blog_import_allowed() || get_option( 'codela_sf_blog_import_20261128_done', false ) ) { return; }
    ?>
    <section class="cdl-theme-appearance-panel" id="codela-blog-import" aria-labelledby="codela-blog-import-title"
        data-url="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>" data-nonce="<?php echo esc_attr( wp_create_nonce( 'codela_sf_blog_import' ) ); ?>">
        <div class="cdl-theme-sections"><div class="cdl-theme-section">
            <h4 id="codela-blog-import-title">Blog yazılarını aktar</h4>
            <p>10 yazı; kapak görselleri, kategorileri ve SEO bilgileriyle taslak olarak eklenecek. Ardından Yazılar ekranından yayımlayabilirsiniz.</p>
            <p class="description">İşlem tamamlanana kadar bu sayfayı açık tutun. Yarım kalırsa aynı düğmeyle devam edebilirsiniz. Aktarma tamamlandığında bu alan kapanır.</p>
            <p data-import-status role="status" aria-live="polite" aria-atomic="true"></p>
            <progress data-import-progress max="10" value="0" aria-label="Aktarılan blog yazıları" hidden></progress>
            <noscript><p>Tek tıkla aktarma için tarayıcınızda JavaScript açık olmalıdır.</p></noscript>
        </div></div>
        <div class="cdl-theme-save-row">
            <button type="button" class="codela-btn codela-btn--save" data-import-button>10 blog yazısını görselleriyle aktar</button>
            <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=post&post_status=draft' ) ); ?>" class="cdl-btn-secondary" data-import-review hidden>Taslak yazıları incele</a>
        </div>
    </section>
    <?php
    // Codela swaps settings tabs over AJAX and executes their inline scripts.
    // A footer enqueue here would be lost when arriving from another tab.
    wp_print_inline_script_tag( file_get_contents( get_template_directory() . '/assets/scripts/agency-blog-import.js' ) );
}
add_action( function_exists( 'codela_theme_render_general' ) ? 'codela_theme_settings_general' : 'codela_theme_settings_integrations', 'codela_sf_blog_import_render' );
