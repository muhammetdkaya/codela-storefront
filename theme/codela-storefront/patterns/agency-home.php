<?php
/**
 * Title: Codela — Ajans anasayfası
 * Slug: codela-storefront/agency-home
 * Categories: featured
 * Inserter: yes
 * Description: Tam ekran karşılama, üçlü hizmet vitrini ve iletişim alanı.
 *
 * Layout adapted from HyperUI's MIT-licensed Center/Split Banners.
 * See THIRD-PARTY-NOTICES-agency.txt for source and license.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$contact = codela_sf_agency_contact_url();
$account = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : home_url( '/' );
?>
<!-- wp:group {"className":"sf-agency"} -->
<div class="wp-block-group sf-agency">
<!-- wp:group {"tagName":"section","className":"sf-agency-hero"} -->
<section class="wp-block-group sf-agency-hero">
<!-- wp:group {"className":"sf-agency-hero-grid sf-agency-wrap"} -->
<div class="wp-block-group sf-agency-hero-grid sf-agency-wrap">
<!-- wp:group {"className":"sf-agency-intro"} -->
<div class="wp-block-group sf-agency-intro">
<!-- wp:paragraph {"className":"sf-agency-eyebrow"} -->
<p class="sf-agency-eyebrow">Tasarım, teknoloji ve biraz cesaret.</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"className":"sf-agency-title"} -->
<h1 class="wp-block-heading sf-agency-title">İyi fikirler.<br>Güçlü <em>dijital deneyimler.</em></h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"className":"sf-agency-lead"} -->
<p class="sf-agency-lead">Markanıza özel web siteleri, satışa hazır mağazalar ve işinizi kolaylaştıran yazılımlar. WordPress üzerinde, ihtiyacınız kadar özel.</p>
<!-- /wp:paragraph -->
<!-- wp:html -->
<div class="sf-agency-actions">
<?php echo codela_sf_ui_button( 'Projemi konuşalım', [ 'href' => $contact ?: '#sf-agency-contact', 'icon' => 'arrow-right' ] ); ?>
<?php echo codela_sf_ui_button( 'Neler yapıyoruz?', [ 'variant' => 'secondary', 'href' => '#sf-agency-services' ] ); ?>
</div>
<!-- /wp:html -->
</div><!-- /wp:group -->
<!-- wp:html -->
<div class="sf-agency-scene" aria-hidden="true">
  <div class="sf-agency-orbit sf-agency-orbit--one"></div><div class="sf-agency-orbit sf-agency-orbit--two"></div>
  <div class="sf-agency-window" data-agency-tilt>
    <div class="sf-agency-window-bar"><span class="sf-agency-window-dots"><i></i><i></i><i></i></span><span>markanız.com</span><span>↗</span></div>
    <div class="sf-agency-window-content">
      <div class="sf-agency-demo-nav"><strong>studio.</strong><span>Keşfet &nbsp; Hakkımızda</span><span>↗</span></div>
      <div class="sf-agency-demo-layout"><div><small>Size özgü bir başlangıç.</small><strong>Az ama<br>çok şey<br>anlatan.</strong><span class="sf-agency-demo-link">Koleksiyonu keşfet ↗</span></div><div class="sf-agency-sculpture"><i></i><b></b><span>01 / 03</span></div></div>
      <div class="sf-agency-demo-footer"><span>Özgün tasarım</span><span>Her ekranda aynı özen</span></div>
    </div>
  </div>
  <span class="sf-agency-scene-note">Arayüz konsepti · sizin markanıza uyarlanır</span>
</div>
<!-- /wp:html -->
</div><!-- /wp:group -->
<!-- wp:html -->
<div class="sf-agency-hero-foot sf-agency-wrap"><span>WordPress <i>·</i> Elementor <i>·</i> WooCommerce</span><a href="#sf-agency-services">Aşağıda daha fazlası <span aria-hidden="true">↓</span></a></div>
<!-- /wp:html -->
</section><!-- /wp:group -->
<!-- wp:group {"tagName":"section","className":"sf-agency-services sf-agency-wrap","anchor":"sf-agency-services"} -->
<section class="wp-block-group sf-agency-services sf-agency-wrap" id="sf-agency-services">
<!-- wp:paragraph {"className":"sf-agency-eyebrow"} -->
<p class="sf-agency-eyebrow">Birbirini tamamlayan üç uzmanlık.</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"className":"sf-agency-heading"} -->
<h2 class="wp-block-heading sf-agency-heading">Fikrinizin ihtiyacı<br>hangisi olursa.</h2>
<!-- /wp:heading -->
<!-- wp:group {"className":"sf-agency-cards"} -->
<div class="wp-block-group sf-agency-cards">
<!-- wp:group {"tagName":"article","className":"sf-agency-card sf-agency-card--web"} -->
<article class="wp-block-group sf-agency-card sf-agency-card--web">
<!-- wp:paragraph {"className":"sf-agency-card-number"} --><p class="sf-agency-card-number">01 / WEB TASARIM</p><!-- /wp:paragraph -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">İlk bakışta<br>size ait.</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>Özgün kurumsal siteler, özel temalar ve kolay yönetilebilir Elementor kurguları.</p><!-- /wp:paragraph -->
<!-- wp:html -->
<div class="sf-agency-micro sf-agency-micro--web" aria-hidden="true"><div class="sf-agency-mini-browser"><small>studio. <span>☰</span></small><strong>İz bırakan<br>bir başlangıç.</strong><div class="sf-agency-mini-grid"><i></i><i></i><i></i></div><span>Markanızın yeni yüzü ↗</span></div></div>
<details class="sf-agency-details"><summary>Çözümü keşfet <span aria-hidden="true">+</span></summary><p>İçerik yapısı, arayüz tasarımı ve mobil uyumu birlikte ele alıyoruz. İhtiyacınıza göre özel tema, Elementor bileşenleri ve çok dilli yapı geliştiriyoruz.</p></details>
<!-- /wp:html -->
</article><!-- /wp:group -->
<!-- wp:group {"tagName":"article","className":"sf-agency-card sf-agency-card--commerce"} -->
<article class="wp-block-group sf-agency-card sf-agency-card--commerce">
<!-- wp:paragraph {"className":"sf-agency-card-number"} --><p class="sf-agency-card-number">02 / E-TİCARET</p><!-- /wp:paragraph -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Keşfetmekten<br>satın almaya.</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>Ürün keşfi, ödeme ve sipariş akışı bir bütün olarak tasarlanan WooCommerce mağazaları.</p><!-- /wp:paragraph -->
<!-- wp:html -->
<div class="sf-agency-micro sf-agency-micro--commerce" aria-hidden="true"><div class="sf-agency-mini-product"><div class="sf-agency-product-shape"><i></i></div><div><small>YENİ KOLEKSİYON</small><strong>Günlük eşlikçiniz.</strong><span>Doğal tonlar, sade detaylar.</span><div class="sf-agency-swatches"><i></i><i></i><i></i></div></div></div><div class="sf-agency-order"><span>✓</span> Sipariş akışı, tek bir yerde. <b>↗</b></div></div>
<details class="sf-agency-details"><summary>Çözümü keşfet <span aria-hidden="true">+</span></summary><p>Mağaza tasarımından sanal POS, kargo ve e-fatura entegrasyonlarına kadar satış sürecinizi kuruyoruz. Mevcut ürün ve müşteri verilerinizin taşınmasını da planlıyoruz.</p></details>
<!-- /wp:html -->
</article><!-- /wp:group -->
<!-- wp:group {"tagName":"article","className":"sf-agency-card sf-agency-card--code"} -->
<article class="wp-block-group sf-agency-card sf-agency-card--code">
<!-- wp:paragraph {"className":"sf-agency-card-number"} --><p class="sf-agency-card-number">03 / ÖZEL GELİŞTİRME</p><!-- /wp:paragraph -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Hazır çözümlerin<br>bir adım ötesi.</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>İşinize özel eklentiler, API bağlantıları ve birlikte çalışan sistemler.</p><!-- /wp:paragraph -->
<!-- wp:html -->
<div class="sf-agency-micro sf-agency-micro--code" aria-hidden="true"><div class="sf-agency-node-row"><span>Woo</span><i></i><strong>{ }</strong><i></i><span>ERP</span></div><div class="sf-agency-code-line"><span>sipariş.oluşturuldu</span><b>→</b><span>senkronize</span></div><div class="sf-agency-code-line"><span>stok.güncellendi</span><b>→</b><span>senkronize</span></div><small>Birbirini anlayan sistemler.</small></div>
<details class="sf-agency-details"><summary>Çözümü keşfet <span aria-hidden="true">+</span></summary><p>Hazır eklentilerin karşılamadığı ihtiyaçlar için özel WordPress eklentileri ve yönetim araçları geliştiriyoruz. ERP, CRM ve dış servislerle veri akışını işinize göre kurguluyoruz.</p></details>
<!-- /wp:html -->
</article><!-- /wp:group -->
</div><!-- /wp:group -->
</section><!-- /wp:group -->
<!-- wp:group {"tagName":"section","className":"sf-agency-contact sf-agency-wrap","anchor":"sf-agency-contact"} -->
<section class="wp-block-group sf-agency-contact sf-agency-wrap" id="sf-agency-contact">
<!-- wp:paragraph {"className":"sf-agency-eyebrow"} --><p class="sf-agency-eyebrow">Bir sonraki iyi fikir sizinki.</p><!-- /wp:paragraph -->
<!-- wp:heading {"className":"sf-agency-heading"} --><h2 class="wp-block-heading sf-agency-heading">Aklınızdakini<br>birlikte netleştirelim.</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Yeni bir başlangıç, daha iyi bir mağaza veya işinizi kolaylaştıracak bir çözüm.</p><!-- /wp:paragraph -->
<!-- wp:html -->
<div class="sf-agency-actions">
<?php if ( $contact ) { echo codela_sf_ui_button( 'Projemi anlatmak istiyorum', [ 'href' => $contact, 'icon' => 'arrow-right' ] ); } ?>
<?php echo codela_sf_ui_button( 'Müşteri alanına geç', [ 'variant' => $contact ? 'secondary' : 'primary', 'href' => $account, 'icon' => 'user-round' ] ); ?>
</div>
<!-- /wp:html -->
</section><!-- /wp:group -->
</div><!-- /wp:group -->
