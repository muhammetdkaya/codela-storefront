# Codela Storefront — güncel çalışma kuralları

## Tek güncel devam noktası — 13 Ekim 2026 / 0.1.60

- **Tema 0.1.59 → 0.1.60:** yeni yön: önce tam genişlikte, header arkasından başlayan galeri; sonra alt menünün yerini alan satın alma barı ve Codela dönüşüm araçlarıyla bütünleşme. [Güncel plan](docs/product-experience-plan.md).
- İlk aşama: ortak gallery.css + inc/media.php; Woo native galeri motoru korunur. Aynı sunum standart Galeri bloğunda “Kaydırılabilir galeri” stiliyle kullanılabilir. Yeni runtime JS/kütüphane/API yok.
- Sonraki iş mevcut codela-sticky-cart.js ve conversion-tools.php sahiplik/yerleşim uyarlamasıdır. İkinci motor kurulmayacak; bu sürüm alt bar/dönüşüm araçlarını değiştirmez.
- Doğrulama: PHP adaptör/ayar, 5 genişlikte üst kenar/tam genişlik, core Gallery klavye kaydırması, ortak UI, mevcut gezinme ve 23 paket testi başarılı. Gerçek Woo çok görselli swipe/varyasyon/lightbox ve fiziksel cihaz kabulü açık.
- Yayın: kaynak ve gerçek CI/dağıtım bekliyor. F3/F4/F5/F6 kapanmadı.

## Önceki canlı devam noktası — 13 Ekim 2026 / 0.1.59

- **Tema 0.1.58 → 0.1.59 canlıda:** WooCommerce native single-product şablonunu bozmadan ürün detay sayfasına özgü responsive yerleşim eklendi. Galeri, küçük resimler, sağ bilgi/fiyat sütunu, varyasyon ve miktar alanı, açıklama sekmeleri, benzer ürün kartları düzenlendi. Mobilde tek sütun.
- Satın alma düğmesi doğrudan merkezi `assets/styles/components.css` Button/pressed/focus/disabled/loading/fallback sözleşmesine bağlandı. `assets/styles/product.css` yalnız ürün ekranı yerleşimi ve boyut token'larını yönetir; WooCommerce varyasyon/galeri/sepete ekleme işlevi native kalır. Yeni JS/API/kütüphane yoktur.
- Kod: [PR #17](https://github.com/muhammetdkaya/codela-storefront/pull/17), main squash commit [e72d3c1](https://github.com/muhammetdkaya/codela-storefront/commit/e72d3c1e248ee7096c0b167fe163926a653a9cdd).
- Doğrulama: 5 ekran genişliğinde (320/390/700/900/1280px) responsive ürün tarayıcı testi, doğal Woo form submit ve ortak Button görsel kuralları, var olan testler ve paket doğrulaması geçti. [Actions 38346747050](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38346747050) **validate=success, deploy=success; gerçek `Deploy Storefront only=success`**.
- Kalan: fiziksel cihazda galeri/başlık/fiyat/seçenek/sepete ekleme görünümü, gerçek Woo simple/variable/grouped/external ürün akışı, stok/kupon/eklenti entegrasyonu kabulü. F3/F4 gerçek WordPress/Woo, F5 genel Woo kapsam sınırı ve F6 performans ölçümü de açıktır.
- **Sıradaki somut iş:** canlı ürün sayfasını fiziksel cihazda ve gerçek ürün türlerinde gözden geçir; üstteki kabulde bulgu varsa yalnız ilgili yerleşim adaptörünü düzelt, Woo native işlevi değiştirme. Ardından [kabul senaryoları](docs/cart-sync-acceptance.md) ile F3/F4.

## Önceki canlı devam noktası — 13 Ekim 2026 / 0.1.58

- **Tema 0.1.57 → 0.1.58 canlıda:** kullanıcı görsel/sağ sütun yükseklik farkını bildirdi. Sepet görsel kutusu içerik satırının tamamına uzanır; fotoğraf contain ile oranını korur, kesilmez. Uzun adlarda da üst/alt hizalar aynıdır; görselsiz ürün davranışı korunur.
- Beyaz zeminde ortak cam yüzeyin gri/silik görünümü düzeltildi: ortak brightness 1.5, üst kenar ışığı ve alt kenar/gölge biraz güçlendirildi. 28% tint, 8px blur, saydam border, koyu ikonlar, mevcut basma/kayma ve erişilebilirlik tercihleri korunur. Header, soft IconButton ve Dock aynı token'ı kullanır.
- Yeni JS/istek/kütüphane yok; Store API, controller ve eklenti kapsamına değişiklik yok.
- Doğrulama: Chromium 320/390/700/1280px görsel/içerik üst-alt eşitliği ve mevcut sepet/gezinme/UI kontrolleri; 22 paket testi. Beyaz zemin ile metin/renk arkası görsel referansları kontrol edildi. Kaynak [58100c1](https://github.com/muhammetdkaya/codela-storefront/commit/58100c17b807c627adff4066a3779cdc33d5180c); [Actions 38333643801](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38333643801): validate ve deploy başarılı; gerçek **Deploy Storefront only=success**.
- Kalan/ilk sonraki adım: fiziksel cihazda yeni görsel hizası ve beyaz/renkli zemin cam görünümü kabulü. F3/F4 gerçek WP/Woo kabulü, F5 kapsam sınırı ve F6 ölçümü açık.
- Önceki 0.1.57 kanıtı: [1d492fa](https://github.com/muhammetdkaya/codela-storefront/commit/1d492fa7bd4a5cd11502f1b67f207c07a8c7f7b2), [Actions 38332895672](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38332895672), validate ve gerçek Deploy Storefront only başarılı.

## Başlangıçta okunacaklar

1. Bu dosya ve [güncel teknik durum](docs/storefront-theme.md).
2. [Ortak tasarım sözleşmesi](docs/design-system.md).
3. [Mimari rapor](docs/architecture-review-2026-10-12.md) ve [uygulama rehberi](docs/architecture-remediation-guide-2026-10-12.md). Bunlar tarihli bulgulardır; güncel kaynakta yeniden doğrulayın.
4. Açık PR'lar, HEAD ve ilgili testler. Yerel/eşzamanlı değişiklikleri koruyun; eski SHA'yı zorla main'e taşımayın.

## Sahiplik ve ortak tasarım

- Tek Interactivity store, tek native dialog, tek dock. `assets/storefront.js` bileşim noktası; search/cart/overlay/dock ayrı controller'lardır. Yeni controller/SPA/router veya ikinci sepet motoru kurmayın.
- Tüm tema düğmeleri `inc/ui.php`, `assets/styles/tokens.css`, `assets/styles/components.css` içindeki Button/IconButton/pressable sözleşmesini kullanır. Sayfa CSS'i yerleşim ve mevcut token override'larını sağlar; yeni kopya paint/pressed/focus kuralları eklemeyin.
- Tema guest hesabı ve mağaza görünümünü yönetir. Oturum açmış Codela hesap/sipariş/adres/kargo paneli eklentiye aittir; `.codela-my-account-layout` kapsamına ortak tema form/card/nav stilleri taşımayın.
- Kaynak isimleri platform/cihaz adlarından bağımsızdır. Standart semantik HTML, reduced-motion, 44px hedefler ve erişilebilir isimler korunur.
- **Ortak UI kapsamı:** 0.1.52 Button/IconButton büyüme, esnek bırakma ve saydam yüzey kuralları tokens/components içinde uygulanmıştır. Güncel HEAD kontrolü yapın; F5 için bu stilleri geri almayın veya sayfa CSS’ine kopyalamayın. Yayın kanıtı üstteki devam noktasında tutulur.

## Her yeni tema çalışmasına başlarken

1. Bu dosyayı ve `docs/storefront-theme.md` dosyasını oku.
2. Güncel dalı, son commitleri ve ilgili kodu incele. Belgelerdeki tarihli durumun hâlâ geçerli olduğunu doğrula; tamamlanmış işleri yeniden yapma.
3. Kullanıcıdan burada kayıtlı tercihleri tekrar anlatmasını isteme. “Codela temasına devam” talebinde aşağıdaki sıradaki işlerden ve güncel durumdan devam et.
4. Her anlamlı çalışma sonunda `docs/storefront-theme.md` içindeki durum, testler, eksikler ve sonraki adımı güncelle. Kalıcı ürün kararları değişirse bu dosyayı da güncelle. Yapıldı, test edildi ve canlıya dağıtıldı durumlarını birbirine karıştırma.

## Her gerçek sürüm yükseltmesinde zorunlu kapanış

Bu kural tema ve eklentinin gerçek sürüm yükseltmeleri için geçerlidir; kullanıcının hatırlatmasını bekleme.

- Sürüm koduyla birlikte bu dosyanın **Son doğrulanmış devam noktası** bölümünü ve ilgili teknik durum belgesini güncelle. Tema için belge `docs/storefront-theme.md` dosyasıdır.
- Tarih, ilgili bileşen ve eski → yeni sürüm numarasını yaz. Tema ile eklenti sürümlerini ayrı belirt.
- **Biten işler:** bu sürümde gerçekten tamamlanan değişiklikleri somut olarak yaz; bitenleri sıradaki iş listesinden çıkar.
- **Doğrulama:** yapılan testleri ve sonuçlarını, yapılmayan kontrollerden ayır.
- **Yayın durumu:** kodun commit/tag bağlantısını ve varsa dağıtım/yayın sonucunun kanıtını kaydet. Kodun hazırlanması, paketin yüklenmesi, temanın etkinleşmesi ve WordPress.org yayını farklı durumlardır.
- **Kalanlar:** bilinen eksikleri, hataları ve engelleri açıkça yaz.
- **Sıradaki iş:** bir sonraki sohbetin doğrudan başlayabileceği somut ilk işi ve tamamlanma ölçütünü belirt.
- Sürüm commit'inde yalnız o anda doğrulanmış bilgileri yaz. Commit SHA veya dağıtım sonucu sonradan belli olursa belgeleri takip eden bir dokümantasyon commit'iyle tamamla; bekleyen ya da başarısız yayını başarılı gösterme.
- Bu iki durum kaydı güncellenmeden sürüm çalışmasını tamamlandı diye kapatma. Çalışma yarıda kalırsa mevcut aşamayı ve devam adımını kaydet.
- Ayrıntılı sürüm geçmişini teknik belgede koru; AGENTS.md içindeki devam noktası en güncel durumu kısa ve tutarlı biçimde göstermeli.
- Yalnız dokümantasyon değişikliği için ürün sürümünü artırma veya yeni ürün yayını başlatma. Bu kayıtlar yeni bir yayın yetkisi vermez.

## Tema için kalıcı ürün kararları

- Öncelik sırası: **hız → sağlam altyapı → kullanım kolaylığı → görsel tasarım**. Renkler ve görünüm değişebilir; altyapı bu önceliklere göre kurulmalı.
- Mobil uygulama hissi; hızlı tepki, tutarlı gezinme ve düzgün geçişler demektir. Bu his için gereksiz kod, ağır bağımlılık veya SPA/headless mimarisi ekleme.
- Modern WordPress blok tema, theme.json ve Interactivity API kullanılır. Sepet işlemlerinde WooCommerce Store API esas alınır; para, stok ve miktar hesabının kaynağı sunucudur.
- **Tema Codela eklentisine bağımlıdır; eklenti temadan bağımsız çalışır.**
- Tema ayarları mevcut Codela ayar sayfasında yönetilir. Ortak görünüm ayarları yeniden oluşturulmaz.
- Tema ayarlarının altında Header (Üst alan), Footer (Alt alan) ve geliştirilen diğer bölümler için ayrı alt menüler bulunmalı; tüm ayarları tek uzun forma yığma. Bir tema bölümü geliştirilirken gerekli ayarları aynı çalışmada ilgili alt menüye ekle; temanın tamamlanmasını bekleme.
- Küçük değişikliklerde de mevcut codela.dev otomatik dağıtımı açık kalır. Bağlantılı değişiklikleri topluca yap, yalnız ilgili dosyaları incele ve dağıtım sonuçlarını gereksiz tekrarlarla sorgulama. WordPress.org yayını ayrı yetki gerektirir.
- Tasarım sade ve ürün odaklıdır. Kullanıcının aradığı özgünlük, karmaşık veya bilim kurgu dekorları eklemek anlamına gelmez. Sayfaları kullanım amacı ve örneklerle değerlendirerek tek tek geliştir.
- Header: mobil alt menü varsayılan açık ve Header ayarından kapatılabilir. Açıkken logo solda/menü sağda; kapalıyken desktop ile ortak menü/marka/arama-sepet-hesap düzeni. Masaüstünde alt menü yok, Hesabım dahil araçlar header içinde.
- Menü, arama ve sepet aynı görsel/etkileşim dilinde **tam ekran** açılır. Onaylanan yön Apple örneğindeki tam ekran menüdür; sayfayı yana iten menü önceki alternatifti.
- Menü/arama/sepet aynı native dialog içinde açılır. Güncel kaynakta dialog geometrisi sabit kalır; overlay controller içerik geçişlerini ve Menu/X açma-kapama zamanlamasını yönetir. 0.1.35 ile gelen aynı DOM düğmesinin animasyonlu Menu/X dönüşümü korunur; eski “kapatma bekletmez” notuna dönülmez. Dialog'a ikon kökenli büyüme uygulanmaz. Hareket azaltma tercihi, klavye, odak ve kaydırma konumu korunur.
- Arama hızlı ve doğru olmalı; gecikmiş eski sonuç yeni sorguyu ezmemeli. Mevcut sürümün yazım hatası toleransı olmayan aramasını gelişmiş arama gibi tanıtma.
- Tutarlı ikon dili: Lucide temelli 24×24 çizim alanı, 2 birim çizgi, yuvarlatılmış uç/köşe ve tek renk. Temada yalnız kullanılan yerel SVG dosyaları yüklenir; tüm paketi, ikon fontunu, CDN veya ikon JavaScript çalışma zamanını ekleme. Eklentinin mevcut SVG maskeleri korunur; yeni/değişen ikonlar bu standarda kademeli geçirilir. Yönetim ikon CSS dosyasını mağazaya yükleme.
- Ana sayfa, hakkımızda ve iletişim içerikleri kullanıcı tarafından rahatça düzenlenebilmelidir. İçerik düzenleme deneyimi henüz kesinleşmedi; mevcut WordPress metin/blok alanının tek başına kullanıcı ihtiyacını çözdüğünü varsayma. Elementor veya başka ağır bir sayfa oluşturucuyu kendiliğinden ekleme.
- Ürün, mağaza, sepet ve ödeme sayfalarının standart tasarımını tema yönetir; bunlar için kullanıcıya sayfa oluşturucu düzenleme zorunluluğu getirme.

## Depo ve yayın sınırları

- Güncel tema kaynağı bu depoda: `theme/codela-storefront/`.
- Eklenti ayarları, REST köprüsü ve yükleyici `muhammetdkaya/codela` deposunda kalır.
- Eski eklenti paketindeki 0.1.1 tema kopyası yalnız dondurulmuş ilk kurulum yedeğidir; tema değişikliklerini oraya tekrar yazma.
- `muhammetdkaya/codela-site` tanıtım temasını değiştirme.
- Küçük tema değişiklikleri bu deponun bağımsız dağıtımıyla canlıya gidebilir. Gerekli ayarları ilgili eklenti alt menüsüne aynı geliştirme kapsamında GitHub'da ekle; eklenti ayar değişikliklerini ara ara toplu yayınla.
- Şifreleri kodda, belgede veya günlükte tutma.

