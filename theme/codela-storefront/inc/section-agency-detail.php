<?php
/** Editorial service detail, real native routes, editable service copy. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_section_agency_detail( array $data, string $type = '', bool $primary = false ): string {
    $settings = [
      'web'=>['Web Tasarım','web-tasarimi','3–5 hafta','Tasarım + Kod + Panel',[
        ['Özel Tasarım Sistemi','Markana özel tipografi ve bileşen dili.'],['Mobil Öncelikli Kodlama','Telefon ve masaüstünde akıcı, hızlı açılan arayüz.'],['Kolay Yönetim Paneli','Yazı ve görselleri teknik destek olmadan güncelleme.']
      ],[['Yayın sonrası düzenleme yapabilir miyim?','Evet, metin ve görsellerini yönetebileceğin bir panelle teslim ediyoruz.'],['Bakım zorunlu mu?','Hayır; tek seferlik teslim veya devam eden geliştirme desteği tercih edebilirsin.']]],
      'commerce'=>['E-Ticaret','e-ticaret','5–8 hafta','Mağaza + Ödeme + Kargo',[
        ['Dönüşüm Odaklı Ürün Sayfaları','Hızlı görsel yükleme ve sade sepet.'],['Ödeme & Kargo Entegrasyonu','İhtiyacına uygun ödeme ve kargo altyapısı.'],['Stok & Sipariş Paneli','Sipariş ve kampanyaları tek yerden yönet.']
      ],[['Mevcut ürünlerimi taşıyabilir miyiz?','Mevcut katalog ve görsellerin aktarım kapsamını birlikte belirleriz.'],['Hangi ödeme altyapılarını bağlıyorsunuz?','İhtiyaca ve sağlayıcı desteğine göre sanal POS entegrasyonları planlarız.']]],
      'software'=>['Özel Yazılım','ozel-yazilim','6–12 hafta','Mimari + API + Panel',[
        ['İhtiyaca Özel Panel','İş akışına uygun sade ekranlar.'],['ERP & API Entegrasyonları','Mevcut sistemlerle veri alışverişi.'],['Ölçeklenebilir Kod Tabanı','Yeni modüllerin eklenebileceği yapı.']
      ],[['Kodun mülkiyeti bize mi ait oluyor?','Kaynak kod ve erişimlerin devri proje sözleşmesinde netleştirilir.'],['Mevcut sistemimizle bağlanabilir mi?','Teknik erişim ve API olanaklarını inceleyerek entegrasyonu planlarız.']]],
      'support'=>['Bakım & Geliştirme','gelistirme-destek','Kapsama göre','Hız + Güvenlik + Bakım',[
        ['Performans İyileştirme','Yükleme ve kullanıcı deneyimi ölçümleri.'],['Güvenlik ve Güncellemeler','Sürüm ve güvenlik kontrolleri.'],['Sürekli Geliştirme','Yeni ihtiyaçlara yönelik düzenlemeler.']
      ],[['Mevcut sitemi değiştirmek gerekir mi?','Önce mevcut altyapıyı değerlendiririz.'],['Destek kapsamı nasıl belirlenir?','İhtiyaç ve öncelikleri birlikte belirleriz.']]]
    ];
    $variant = (string)($data['variant'] ?? 'web'); if(!isset($settings[$variant]))return '';
    $info=$settings[$variant];
    $title=trim((string)($data['title']??'')); $description=trim((string)($data['description']??''));
    if(!$title || !$description)return '';
    $rows=array_values(array_filter(array_slice((array)($data['items']??[]),0,4),static fn($item)=>is_array($item)&&($item['enabled']??true)&&!empty($item['title'])));
    // Keep editor-authored scope items whenever they contain actual descriptions.
    $custom=array_filter($rows,static fn($item)=>!empty($item['body']));
    $deliverables=$custom?array_map(static fn($item)=>[(string)$item['title'],(string)($item['body']??'')],$rows):$info[4];
    $service='support'===$variant?'Optimizasyon / Destek':$info[0];
    $cta=add_query_arg('hizmetler',$service,codela_sf_agency_project_link());
    $id='codela-detail-'.sanitize_html_class((string)($data['id']??'service'));
    ob_start(); ?>
    <div class="sf-agency-widget sf-agency-widget--detail" data-agency-widget="detail">
      <section class="cdl-service-detail" aria-labelledby="<?php echo esc_attr($id); ?>">
        <div class="cdl-service-detail__shell"><div class="cdl-service-detail__editorial">
          <nav class="cdl-service-detail__tabs" aria-label="Hizmetler">
            <?php foreach($settings as $key=>$tab): $url=codela_sf_agency_owned_service_detail_url($tab[1]); if(!$url)continue; ?>
              <a href="<?php echo esc_url($url); ?>" <?php echo $key===$variant?'aria-current="page"':''; ?>><?php echo esc_html($tab[0]); ?></a>
            <?php endforeach; ?>
          </nav>
          <div class="cdl-service-detail__eyebrow">HİZMET DETAYI</div>
          <div class="cdl-service-detail__copy"><h1 id="<?php echo esc_attr($id); ?>"><?php echo esc_html($title); ?></h1><p><?php echo esc_html($description); ?></p></div>
          <div class="cdl-service-detail__meta"><div><small>Tahmini süre</small><strong><?php echo esc_html($info[2]); ?></strong></div><div><small>Teslim kapsamı</small><strong><?php echo esc_html($info[3]); ?></strong></div></div>
          <div class="cdl-service-detail__scope"><h2>Neler dahil?</h2><ol><?php foreach($deliverables as $index=>$row): ?><li><span><?php echo esc_html(sprintf('%02d',$index+1)); ?></span><div><strong><?php echo esc_html($row[0]); ?></strong><p><?php echo esc_html($row[1]); ?></p></div></li><?php endforeach; ?></ol></div>
          <div class="cdl-service-detail__faq"><h2>Sık sorulan sorular</h2><?php foreach($info[5] as $index=>$qa): ?><details<?php echo $index===0?' open':''; ?>><summary><?php echo esc_html($qa[0]); ?><span aria-hidden="true">+</span></summary><p><?php echo esc_html($qa[1]); ?></p></details><?php endforeach; ?></div>
          <a class="cdl-service-detail__cta" href="<?php echo esc_url($cta); ?>">Bu Hizmet İçin Proje Başlat <span aria-hidden="true">→</span></a>
        </div></div>
      </section>
    </div>
    <?php return (string)ob_get_clean();
}
