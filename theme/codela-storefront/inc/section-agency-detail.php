<?php
/** Editorial service detail — approved four-service reference, native WordPress links. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function codela_sf_section_agency_detail( array $data, string $type = '', bool $primary = false ): string {
    $settings = [
      'web'=>[
        'label'=>'Web','slug'=>'web-tasarimi','title'=>'Web Tasarım','service'=>'Web Tasarım','number'=>'01','subtitle'=>'hızlı, sade ve yönetilebilir.',
        'sub'=>'Hazır şablonlar yerine markanın duruşuna özel tasarlanmış, mobilde akıcı kurumsal web siteleri.',
        'quote'=>'İlk beş saniyede güven vermeyen bir site müşteriyi kaybeder.','soft'=>'Gereksiz kalabalığı temizleyip markanı en net haliyle sunan, ekibinin kolayca güncelleyebildiği sistemler kuruyoruz.','duration'=>'3–5 hafta',
        'items'=>[
          ['Özel arayüz ve tasarım dili','Markanın karakterine uygun tipografi, renk dengesi ve mobil öncelikli ekranlar.'],
          ['Temiz kod ve yüksek hız','Ağır eklentiler olmadan hızlı açılan, arama motorlarına uyumlu mimari.'],
          ['Kolay yönetim paneli','Metin, görsel ve yeni sayfaları yazılımcıya ihtiyaç duymadan dakikalar içinde güncelleme.']
        ],
        'faq'=>[
          ['Yayın sonrası içerikleri kendimiz değiştirebilir miyiz?','Evet, tüm metin ve görselleri kolayca güncelleyebileceğin sade bir yönetim paneliyle teslim ediyoruz.'],
          ['Mevcut içeriklerimiz yoksa yardımcı oluyor musunuz?','Mevcut notlarını birlikte sadeleştiriyor, sayfa yapısını ve başlık hiyerarşisini beraber netleştiriyoruz.']
        ]
      ],
      'commerce'=>[
        'label'=>'E-Ticaret','slug'=>'e-ticaret','title'=>'E-Ticaret','service'=>'E-Ticaret','number'=>'02','subtitle'=>'sürtünmesiz alışveriş deneyimi.',
        'sub'=>'Ödeme, kargo ve stok akışı sorunsuz çalışan, özellikle mobilde satın almayı kolaylaştıran online mağazalar.',
        'quote'=>'İyi bir mağaza müşteriyi yormadan sepete taşır.','soft'=>'Hızlı ürün sayfaları, net varyant seçimi ve güven veren tek adımlı ödeme akışıyla dönüşümü doğrudan destekliyoruz.','duration'=>'5–8 hafta',
        'items'=>[
          ['Dönüşüm odaklı vitrin ve ürün sayfası','Hızlı görsel geçişleri, net fiyat/beden seçimi ve mobilde tek elle kullanılan sepet.'],
          ['Ödeme ve kargo entegrasyonları','Sanal POS, taksit seçenekleri ve otomatik kargo takip bağlantıları proje kapsamına göre kurulur.'],
          ['Sipariş ve stok yönetimi','Ürün ekleme, kampanya ve sipariş süreçlerini tek bir sade panelden takip etme.']
        ],
        'faq'=>[
          ['Mevcut ürünlerimizi yeni mağazaya taşıyabilir miyiz?','Mevcut ürün kataloğunu, varyantlarını ve görsellerini inceleyip aktarım kapsamını birlikte belirliyoruz.'],
          ['Hangi sanal POS altyapılarını bağlıyorsunuz?','Türkiye ve yurt dışında, ihtiyaçlarına ve sağlayıcı desteğine göre güvenli entegrasyonlar planlıyoruz.']
        ]
      ],
      'software'=>[
        'label'=>'Yazılım','slug'=>'ozel-yazilim','title'=>'Özel Yazılım','service'=>'Özel Yazılım','number'=>'03','subtitle'=>'iş akışına birebir oturan araçlar.',
        'sub'=>'Hazır paketlerin yetişmediği yerde ekibinin günlük operasyonunu hızlandıran paneller ve entegrasyonlar.',
        'quote'=>'Ekibini yazılıma uydurmak yerine, yazılımı işine uyduruyoruz.','soft'=>'Sadece gerçekten kullandığın ekranlardan oluşan, mevcut sistemlerinle konuşan uzun ömürlü yapılar geliştiriyoruz.','duration'=>'6–12 hafta',
        'items'=>[
          ['İhtiyaca özel yönetim panelleri','Karmaşık menüler yerine ekibinin günlük işini tek ekranda çözen net arayüzler.'],
          ['API ve sistem entegrasyonları','Mevcut muhasebe, CRM, depo veya e-ticaret altyapılarınla veri akışı.'],
          ['Ölçeklenebilir ve devredilebilir kod','Sonradan yeni modül eklemeye açık, temiz belgelenmiş kaynak kod.']
        ],
        'faq'=>[
          ['Geliştirilen yazılımın tüm hakları bize mi ait oluyor?','Kaynak kod ve sunucu erişimlerinin devri proje sözleşmesinde netleştirilir.'],
          ['Mevcut yazılımımızla entegre çalışabilir mi?','API veya veritabanı erişimini inceleyerek uygun bağlantıyı planlıyoruz.']
        ]
      ],
      'support'=>[
        'label'=>'Bakım','slug'=>'gelistirme-destek','title'=>'Bakım & Geliştirme','service'=>'Optimizasyon / Destek','number'=>'04','subtitle'=>'yayın sonrası da aynı özen.',
        'sub'=>'Mevcut sitenin veya yazılımın hızını, güvenliğini ve yeni özellik ihtiyaçlarını düzenli olarak üstleniyoruz.',
        'quote'=>'Dijital ürün yayına alındığı gün değil, yaşadıkça değer kazanır.','soft'=>'Teknik aksaklıkları çözen, yeni sayfa ve iyileştirmeleri hayata geçiren sürekli stüdyo desteği.','duration'=>'Aylık plan',
        'items'=>[
          ['Performans ve güvenlik takibi','Düzenli yedekleme, güncelleme ve hız kontrolleriyle güvenilir çalışma.'],
          ['Hızlı yeni sayfa ve özellik desteği','Kampanya dönemlerinde veya yeni ihtiyaçlarda tasarım ve kod desteği.'],
          ['Doğrudan stüdyo hattı','Sistemi bilen ekiple doğrudan iletişim.']
        ],
        'faq'=>[
          ['Codela’nın yapmadığı bir site için de destek alabilir miyim?','Önce kısa bir teknik inceleme yapıyoruz; altyapı uygunsa bakım ve iyileştirme sürecini devralıyoruz.'],
          ['İstediğimiz zaman planı durdurabilir miyiz?','Aylık planın kapsamını ve koşullarını başlangıçta birlikte belirliyoruz.']
        ]
      ],
    ];
    $variant = (string)($data['variant'] ?? 'web'); if(!isset($settings[$variant]))return '';
    $info=$settings[$variant];
    $title=trim((string)($data['title']??''));
    if(!$title)return '';
    if($title===$info['service'])$title=$info['title'];
    // Replace the known starter copy, never overwrite a custom description.
    $legacy = [
      'web'=>'Markanızın duruşunu ilk saniyede hissettiren, mobil öncelikli ve dönüşüm odaklı modern web arayüzleri tasarlıyoruz.',
      'commerce'=>'Hızlı ürün keşfi, pürüzsüz sepet akışı ve güvenli ödeme entegrasyonlarıyla satışa odaklanan mağazalar kuruyoruz.',
      'software'=>'İş süreçlerinize tam oturan yönetim panelleri, API bağlantıları ve ölçeklenebilir web uygulamaları geliştiriyoruz.',
      'support'=>'Yayındaki sitenizin hızını, teknik SEO performansını ve güvenliğini sürekli izleyerek sorunsuz çalışmasını sağlıyoruz.',
    ];
    $description=trim((string)($data['description']??''));
    if(!$description || $description===$legacy[$variant])$description=$info['sub'];
    $rows=array_values(array_filter(array_slice((array)($data['items']??[]),0,4),static fn($item)=>is_array($item)&&($item['enabled']??true)&&!empty($item['title'])));
    $custom=array_filter($rows,static fn($item)=>!empty($item['body']));
    $deliverables=$custom?array_map(static fn($item)=>[(string)$item['title'],(string)($item['body']??'')],$rows):$info['items'];
    $cta=add_query_arg('hizmetler',$info['service'],codela_sf_agency_project_link());
    $quote_url = codela_sf_agency_project_url() ? add_query_arg( 'teklif', '1', $cta ) : '';
    $id=codela_sf_agency_dom_id( 'codela-detail-'.sanitize_html_class((string)($data['id']??'service')) );
    ob_start(); ?>
    <div class="sf-agency-widget sf-agency-widget--detail" data-agency-widget="detail">
      <section class="cdl-service-detail" aria-labelledby="<?php echo esc_attr($id); ?>">
        <div class="cdl-service-detail__shell"><div class="cdl-service-detail__editorial">
          <nav class="cdl-service-detail__tabs" aria-label="Hizmetler">
            <?php foreach($settings as $key=>$tab): $url=codela_sf_agency_owned_service_detail_url($tab['slug']); if(!$url)continue; ?>
              <a href="<?php echo esc_url($url); ?>" <?php echo $key===$variant?'aria-current="page"':''; ?>><?php echo esc_html($tab['label']); ?></a>
            <?php endforeach; ?>
          </nav>
          <div class="cdl-service-detail__body">
            <div class="cdl-service-detail__eyebrow">HİZMET · <?php echo esc_html($info['number']); ?></div>
            <div class="cdl-service-detail__copy"><h1 id="<?php echo esc_attr($id); ?>"><span class="cdl-service-detail__title-main"><?php echo esc_html($title); ?></span> <span class="cdl-service-detail__title-muted"><?php echo esc_html($info['subtitle']); ?></span></h1><p><?php echo esc_html($description); ?></p></div>
            <blockquote class="cdl-service-detail__manifesto"><?php echo esc_html($info['quote']); ?> <span><?php echo esc_html($info['soft']); ?></span></blockquote>
            <div class="cdl-service-detail__scope"><h2>Neler Dahil?</h2><ol><?php foreach($deliverables as $index=>$row): ?><li><span><?php echo esc_html(sprintf('%02d',$index+1)); ?></span><div><h3><?php echo esc_html($row[0]); ?></h3><p><?php echo esc_html($row[1]); ?></p></div></li><?php endforeach; ?></ol></div>
            <div class="cdl-service-detail__faq"><h2>Sık Sorulanlar</h2><?php foreach($info['faq'] as $index=>$qa): ?><details<?php echo $index===0?' open':''; ?>><summary><?php echo esc_html($qa[0]); ?><span aria-hidden="true">+</span></summary><p><?php echo esc_html($qa[1]); ?></p></details><?php endforeach; ?></div>
            <?php if ( ! $quote_url ) { echo codela_sf_quote_markup( $variant, $data ); } ?>
            <div class="cdl-service-detail__bottom"><span class="cdl-service-detail__meta"><i aria-hidden="true"></i><strong><?php echo esc_html($info['duration']); ?></strong><?php if('support'!==$variant): ?> · Ortalama<?php endif; ?></span><a class="cdl-service-detail__cta" href="<?php echo esc_url($quote_url ?: $cta); ?>"><?php echo $quote_url ? 'Ücretsiz Teklif Al' : 'Proje Başlat'; ?> <span aria-hidden="true">→</span></a></div>
          </div>
        </div></div>
      </section>
    </div>
    <?php return (string)ob_get_clean();
}
