# Ürün deneyimi — uygulama sırası

13 Ekim 2026. Kullanıcının 0.1.59 sonrası yönlendirmesi ürün sayfası için önceliklidir.

## 1. Ortak slider — 0.1.60 kapsamı

- Galeri mobil/masaüstünde ekran genişliğini kaplar ve sabit header arkasından başlar. Ürün bilgileri altında kalır. Yönetici çubuğunun kendi alanı korunur.
- Görselin tamamı oranı korunarak gösterilir; yükseklik 82svh ile sınırlanır. Görsel dosyasının kendi boşlukları kırpılmaz.
- WooCommerce ürün galerisinde mevcut kaydırma, varyasyon görseli, zoom/lightbox sahipliği korunur. Otomatik oynatma/sonsuz döngü yoktur. Yeni slider motoru veya runtime JS eklenmez.
- Ortak sunum: inc/media.php + assets/styles/gallery.css. Aynı tasarım **standart Galeri bloğu → Stiller → Kaydırılabilir galeri** ile başka sayfalarda/şablonlarda kullanılabilir. Core Gallery tarayıcının scroll-snap davranışını kullanır; Woo track'ine ikinci kaydırma davranışı bağlanmaz.
- Galeri küçük görselleri mevcut Codela tema ayar köprüsündeki **Ürün sayfası** alt bölümünden kapatılabilir. Ayrı yönetim paneli yoktur.
- Galeri açma kontrolü ortak IconButton sunumunu kullanır. Başka sayfalarda kenar/gölge/basma kodu kopyalanmaz.
- Tek görselde ikinci slayt yoktur. Gerçek kabul en az üç görselli ve varyasyon görseli olan ürünle yapılmalı; PHP/CSS fixture testleri gerçek Woo swipe/zoom/lightbox kabulü sayılmamalıdır.

## 2. Alt menünün yerine satın alma alanı — sıradaki iş

- Ürün sayfasında mevcut cam/pill dilinde **tek alt satın alma barı** hedeflenir; genel dock ile üst üste iki sabit bar oluşturulmaz.
- Önce eklentinin mevcut **assets/js/codela-sticky-cart.js** entegrasyonunu kullan. Kod zaten .codela-sticky-cart üretir, gerçek Woo formuna bağlanır, boş varyasyonları ilgili alana yönlendirir ve fiyat/stok olaylarını izler. Temada ikinci satın alma motoru yazma.
- Uygulamadan önce eklenti ayarını, görünürlük eşiğini ve tema dock'unun mevcut dialog içine taşınmasını birlikte incele. Ürün belgesi ile Menu/Search/Cart/Account açılınca bar sahipliği açık olsun.
- Basit/varyasyonlu/grup/harici/stok dışı ürünlerde doğru eylem ve disabled durumu korunmalı. Tutar/stoğu tema hesaplamamalı; tek eylem tek sepete ekleme üretmeli.
- Ortak Button/IconButton/material kullan. Tamamlanma: tek görünür bar, safe-area/klavye uyumu, doğru fiyat/stok, tek submit, doğru rozet ve popup sonrası doğru barın geri gelmesi.

## 3. Codela dönüşüm araçlarıyla bütün tasarım

- Kaynak: eklentide **includes/conversion-tools.php**, **modules/growth/assets/conversion-tools.css**. Mevcut tek tasarım dili calm.
- Araçlar: live-visitor, urgency-badge, free-shipping-bar, delivery-eta, trust-badges, whatsapp-button.
- Mevcut yerleşimler: afterprice, afterexcerpt, beforecart, aftercart, aftermeta. Kullanıcının kayıtlı konumları ve açık/kapalı durumu Codela'ya aittir; sessizce değiştirilmez.
- Önerilen sıra: galeri → başlık/fiyat → seçenek/stok → satın alma. Kargo/teslimat/güven bilgileri yakınında sakin bir bilgi grubu olarak ele alınır.
- Her araca ayrı tema kartı/gölgesi/rozet kodu ekleme; mevcut tasarım değişkenleri ve konum sözleşmesini bağla. Tüm araçlar açıkken de kapalıyken de düzen çalışmalı, bilgi iki kez gösterilmemeli.

## Kapsam ve kabul

0.1.60 yalnız ilk aşamayı uygular. Satın alma barı ve dönüşüm araçlarının tema uyarlaması henüz tamamlanmış değildir. Fiziksel cihaz/gerçek Woo kabulü ve F3/F4/F5/F6 açık kalır.

### 0.1.61 canlı DOM düzeltmesi

Woo blok şablonunun `.woocommerce` sınıfı body üzerinde; descendant wrapper varsayımı kaldırıldı. Hero `cover` kullanır (kenar kırpması olabilir), diğer galeri kullanımları contain kalır. Galeri kontrolü sağ altta. Regresyon gerçek legacy-template kapsayıcısını içerir. Kullanıcı yaklaşık 20 galerili test ürünü eklenmesini yetkilendirdi; yönetim girişi gerekli, henüz oluşturulmadı.

### 0.1.67 satın alma kararı — slider duraklatıldı

Kullanıcı 13 Ekim 23:37'de slider'a ara verilmesini, sepete ekleme eyleminin alta alınmasını istedi. Eklenti sticky-cart kaynağı incelendi; classic/swipe/layout-ready koşulları ve scroll-past görünürlük bu tema akışına uygun değil. Native Woo formundaki gerçek miktar ve butonun hook ile ortak yüzeyde sabitlenmesi seçildi. Yeni satın alma motoru veya eklenti kopyası yok; bu adım için eklenti yayını gerekmez. Genel dock yalnız ürün belgesinde ve satın alma alanı varsa gizlenir; dialogda tek dock korunur. Masaüstü inline form, stok dışı dock, native varyasyon/grup/harici akış korunur. Fiyat/stock tema tarafından hesaplanmaz. Fiziksel klavye/safe-area ve tüm gerçek ürün türü kabulü açık; önce canlı satın alma görünümü kabulü.
