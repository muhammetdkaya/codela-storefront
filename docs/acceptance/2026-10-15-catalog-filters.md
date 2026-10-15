# Storefront 0.1.96 — katalog filtreleri kabulü

## Son doğrulanmış durum — 0.1.96 mağaza/kategori filtreleri canlı
15 Ekim 2026: Tema **0.1.95→0.1.96 canlı**, Codela eklentisi **1.1.1 değişmedi**. Mağaza ve kategori/etiket arşivlerinde ortak kompakt başlık/sonuç sayısı, breadcrumbsız düzen; sıralama mevcut tek tam ekran dialog içindeki Filters görünümüne taşındı. Header'ın mevcut tools slotunda ortak soft IconButton ve yerel sliders-horizontal SVG kullanılır; mobilde Menu'nün hemen solunda. Kategori bağlantıları, native Woo GET fiyat aralığı/sıralama, kategori kapsamını koruyan Uygula ve Temizle. Empty bounds native Woo sorgusundan önce normalize edilir; açık 0 fiyatı korunur. Yeni filtre API'si, modal/controller, kart kopyası veya satın alma motoru yok. Kategori/etiket template'leri aynı native archive-product bloğunu kullanır.

**Yayın:** [PR29](https://github.com/muhammetdkaya/codela-storefront/pull/29), [kaynak 5ba4c0cd](https://github.com/muhammetdkaya/codela-storefront/commit/5ba4c0cd6394ffd6e407f74dcd2db8ffbc574dca), [CI+gerçek FTP 38775799204](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38775799204) başarılı. Paket SHA256: `17999f0f5c366303d4131ba15355c1348a7b787f64ac81ea1de92ed15d2b5405`. PR CI38775481494 PHP/JS/24 paket ve bütün browser regresyonları başarılı; yeni filtre fixture'ı shop/category × dock açık/kapalı × 320/390/700/1280, 44px hedef/overflow, tek dialog, Escape/focus ve kapsamlı GET gönderimini doğruladı. Beş canlı gate başarılı: WebKit38776225733, shell38776225658, document38776225974, gallery38776225923, performance38776226144.

**Canlı kabul:** Gerçek Türkçe mağaza /magaza/ ve /urun-kategori/codela-demo/ tarayıcıda incelendi; CSS0.1.96 ve yeni panel doğrulandı. Kategoride min20/max30 + price-desc gerçek sonuçları27,25,23.20,21 şeklinde4 ürün; kategori URL'si korundu. Mobil native WP/Woo screenshot'ında Header Filter/Menu44px eşitliği ve panel yerleşimi incelendi. **Gerçek Woo kabulü:** [38776765741](https://github.com/muhammetdkaya/codela/actions/runs/38776765741) başarılı: WP6.5.5/Woo9.0.2 ve WP7.1.3/Woo11.2.1 × Chromium/WebKit, her ortam16 kontrol, toplam64 başarılı. Test kaynağı4874d0e43724466d511cde641955b11b0048813f; yeni0.1.96 ZIP/source/hash doğrulandı. İlk38775916948 hash pin'i yerel ZIP yeniden üretiminden geldiği için kurulumda durdu; pin doğrudan gerçek CI paket manifestinden düzeltildi. İkinci38776229914 yeni Filters/price/reset kontrollerini geçti ancak eski testi kaldırılmış select.orderby aradığı için durdu; o test aynı yeni panelden sıralama seçip Uygula kullanacak şekilde güncellendi. Son başarılı koşu aynı yayınlanmış0.1.96 tema paketidir; test düzeltmeleri yeni runtime/eklenti yayını değildir.

**Kalan / sıradaki iş:** Bu mağaza/kategori geliştirmesini yeniden kurma. Kullanıcının görsel kabulü ve fiziksel Safari/GPU/toolbar/safe-area kontrolü; gerçek ödeme sağlayıcısı ve üçüncü taraf medya; eski JPEG backfill (yetkili oturum+yedek; kullanıcı istemeden yeniden giriş isteme) ayrı açık kalır.


```json
[
  {
    "engine": "chromium",
    "status": "passed",
    "checks": 16,
    "versions": {
      "wordpress": "6.5.5",
      "woocommerce": "9.0.2",
      "codela": "1.1.1",
      "theme": "0.1.96"
    }
  },
  {
    "engine": "webkit",
    "status": "passed",
    "checks": 16,
    "versions": {
      "wordpress": "6.5.5",
      "woocommerce": "9.0.2",
      "codela": "1.1.1",
      "theme": "0.1.96"
    }
  },
  {
    "engine": "chromium",
    "status": "passed",
    "checks": 16,
    "versions": {
      "wordpress": "7.1.3",
      "woocommerce": "11.2.1",
      "codela": "1.1.1",
      "theme": "0.1.96"
    }
  },
  {
    "engine": "webkit",
    "status": "passed",
    "checks": 16,
    "versions": {
      "wordpress": "7.1.3",
      "woocommerce": "11.2.1",
      "codela": "1.1.1",
      "theme": "0.1.96"
    }
  }
]
```
