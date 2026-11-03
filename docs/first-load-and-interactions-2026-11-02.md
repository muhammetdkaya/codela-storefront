# Codela Storefront 0.1.195 — ölçüm ve kapsam

2 Kasım 2026. Tema kaynak tabanı: `6c1de7f3796bb7f6bf8c9950dd705e6b9ac8898e`, yayımlanmış 0.1.194. Üretim eklentisi, içerik, hosting ayarı veya cache purge işlemi yapılmadı.

## Canlı gözlem: 0.1.194

17:52–17:53 Türkiye saati, beş public sayfaya üçer anonim GET. Her URL kendi içinde ardışık; en fazla üç URL eşzamanlı. Sayfayı zorla önbelleksiz yapmadık. `x-litespeed-cache` yanıtı hit/miss olarak kaydedildi. Değerler `curl time_starttransfer − time_pretransfer`: proxy/TLS kurulumunu dışarıda bırakan **yanıt beklemesi**, saf PHP/SQL süresi veya kullanıcıların gerçek TTFB dağılımı değildir.

| Sayfa | İlk istek / cache | İkinci / cache | Üçüncü / cache |
|---|---:|---:|---:|
| `/` | 3382,2 ms / miss | 475,0 ms / hit | 517,1 ms / hit |
| `/magaza/` | 3388,1 ms / miss | 472,7 ms / hit | 465,1 ms / hit |
| `/urun/yelken-seramik-dekoratif-vazo/` | 3160,5 ms / miss | 464,1 ms / hit | 482,2 ms / hit |
| `/codela-demo-about/` | 470,0 ms / hit | 468,2 ms / hit | 464,2 ms / hit |
| `/codela-demo-contact/` | 1902,0 ms / miss | 460,2 ms / hit | 464,3 ms / hit |

Tüm yanıtlar HTTP 200. Tema stylesheet URL'leri 0.1.194. Ana sayfa gzip gövdesi 18587 bayt; mağaza 17258, ürün 21569, Hakkımızda 15692, iletişim 15081 bayt. Sunucunun Server-Timing/PHP/SQL profili yok; gecikmenin hangi eklenti/sorgudan kaynaklandığı bu veriden çıkarılamaz. Cache miss maliyeti belirgin; hosting cache hit oranı/TTL ve backend profiling sonraki ayrı incelemedir.

390×844 anonim Chromium'da Hakkımızda ilk ekranındaki `codela-ev-nora-kase-600x900.webp`, y≈186px ve 358×269px görünür alanla son LCP öğesiydi. Markup `loading=lazy`, `fetchpriority=low`; istek HTML yanıtı tamamlandıktan yaklaşık 1301ms sonra başladı. LCP HTML tamamlandıktan yaklaşık 2105ms sonra oluştu. Proxy bağlantı kurulumu nedeniyle toplam navigasyon zamanı kullanıcı performansı iddiası olarak kullanılmaz. O kısa gözlem penceresinde CLS/long task kaydı yok; bu saha INP/CLS kabulü değildir. Ürün olmayan bu sayfa ayrıca katalog CSS'ini yükledi (Resource Timing transferSize 3426 bayt, yanıt başlığı payı dahil).

## Tema düzeltmesi

- İlk dolu, bilinen Codela bölümünün ilk hikâye/hero/promo fotoğrafı eager/high olur; mevcut gerçek responsive preload toplayıcısı mobil/masaüstü kaynakları eşleştirir. Metin/ürün bölümü sonrası fotoğraf, ikinci kart/slayt ve karışık native içerik yüksek öncelik almaz. İçerik/crop/focal-point değiştirilmez.
- Tamamı doğrulanmış Codela düzeni olup ürün bölümü içermeyen sayfa katalog CSS'ini istemez. Genel native sayfa, bilinmeyen shortcode/blok ve Woo bağlamları muhafazakâr fallback'i korur. Sayfa dışındaki gerçek Woo kart döngüsü kayıtlı handle'ı başlık basılmadan yeniden enqueue eder. Genel Woo veya eklenti dosyaları topluca kaldırılmaz.
- Mobil sheet son pointer durumunu hemen kaydeder, yüksekliği çizim karesinde bir kez yazar. Bırakma son örneği beklemeden uygular; iptal/blur/resize bekleyen işi temizler. Form ve ölçü/scroll sahipliği aynı kalır; fiziksel cihaz FPS artışı ölçülmüş değildir.
- Filtreler native GET bağlantılarıdır: min/max fiyat, Woo seçili nitelik terimleri ve puan. Bir seçimi kaldırmak diğerlerini/eklenti sorgu parametrelerini korur, sayfalama ve add-to-cart'ı temizler. Bilinmeyen eklenti filtresi için uydurma etiket/sayaç üretilmez. Sıralama, filtre sayısına dahil değildir. Native ürün bulunamadı durumunda da kaldırma bağlantıları erişilebilir.
- Sepette yalnız ilk veri beklenirken statik skeleton; işlem satırında mevcut ortak spinner; değişmeyen yanıtta mevcut satır ve odak korunur. Fiyat/miktar tahmini veya ikinci sepet motoru yok. İşlem sırasında miktar değişiklikleri tek sırada, ödeme bağlantısı inert kalır; hata sonrası son iyi veri ve stok sınırları korunur.

Yerel deterministik gzip karşılaştırması: ortak CSS 16413 → 16632 bayt (+219); 194 katalog CSS’i 3105 bayt. Ürünsüz yönetilen sayfada CSS toplamı 2886 bayt ve bir bloklayıcı istek azalır. Bu, toplam sayfa transferi veya canlı hız yüzdesi değildir.

## Doğrulama sınırı

Yerelde Chromium: 8 bölüm sırası, responsive kaynak/preload tek isteği ve gecikmeli CSS'ten önce başlayan görsel; 320/390/700px yüksek frekanslı drag/release/cancel/blur/resize; 320/390/1280px sepet skeleton/busy/focus/error/limits ve filtre link/taşma/44px kontrolleri geçti. Gerçek WP 6.5 dependency sınıflarında 13 bağlam × debug/production geçti. Mevcut ürün sheet ve 56 katalog filtre durumu; PHP, UI Kit, cart race/sync, deterministik asset ve 24 paket testi geçti. Paket testlerinin FTP çıktıları mock'tur; gerçek dağıtım yapılmaz.

Odaklı GitHub Chromium/WebKit CI bekliyor. Yayın ve checksum kanıtı doğrulanınca AGENTS.md / storefront-theme.md devam noktasına işlenecek. Bu paket henüz canlı mağazada kurulu değil; kaynak/fixture testi gerçek ödeme, fiziksel Safari/Firefox veya kurulum sonrası canlı hız kabulü değildir. Eksik kalan rapor maddeleri: gerçek cihaz/hosting kabulü; masaüstü hesap/checkout görsel iyileştirmeleri ve isteğe bağlı editorial/hareket çalışmaları. Kullanıcı metni, demo içeriği ve fotoğraf kadrajları otomatik değiştirilmedi.
