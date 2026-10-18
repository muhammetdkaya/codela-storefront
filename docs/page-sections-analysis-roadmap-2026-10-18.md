# Codela sayfa bölümleri: analiz ve uygulama yol haritası
Tarih: 18 Ekim 2026. Durum: **öneri ve kaynak incelemesi; uygulama/yayın yapılmadı.**

## 1. Karar özeti

Tek bir **Codela Sayfa Düzeni** düzenleyicisi öneriyorum. Sayfaya ait içerik WordPress sayfasında tutulur; Codela → Tema → Sayfalar menüsü aynı düzenleyiciye giriş sağlar. Genel logo, header, footer ve tasarım varsayılanları tema ayarlarında kalır. İki ayrı kaydetme alanı ve iki ayrı içerik kaynağı olmaz.

Düzenleyici WordPress blok altyapısını kullanan, Codela bileşenleriyle sadeleştirilmiş bir bölüm listesi olmalıdır. Kullanıcıdan ham blok/JSON yönetmesi beklenmez. Mevcut genel repeater formunu giderek büyütmek yerine sayfa düzenleme modeli yeniden kurulmalıdır. Galeri, ürün kartları, WooCommerce davranışları ve ortak görsel bileşenler korunmalıdır.

Kullanıcının istediği kapsam: tek ana vitrin slider tasarımı; önceki kategori tasarımlarının seçilebilir olması; diğer slider tasarımlarının aralara yerleşebilen tanıtım bölümlerine dönüşmesi; yaklaşık 10 sıralanabilir bölüm; diğer içerik sayfalarında aynı sistem; hız ve temiz mimari.

## 2. İncelenen kaynak ve bulgular

İnceleme tabanı: tema dfbff735faad7746ce98bc34c1000bea9ee69bec; eklenti c2722e3012e15a14163d73182bfc6d2c81830c42. Aşağıdaki yollar ilgili deponun köküne göredir. Canlı veritabanı, gerçek yönetim oturumu ve cihaz performansı bu çalışmada ölçülmedi. Kaynak bulgusu, risk ve öneri birbirinden ayrılmıştır.

| Bulgu | Kaynak | Sonuç / yapılacak iş |
|---|---|---|
| Ana sayfa slider + kategori + en fazla dört ürün bölümü olarak sabit birleştiriliyor | Tema: theme/codela-storefront/inc/homepage.php, codela_sf_home_sections | Üst seviye bölüm sırası ve türü veriyle tanımlanmalı |
| Slaytlar, kategoriler ve ürün alanları farklı global option anahtarlarında | Aynı dosya; config/settings.json | Sayfa başına tek içerik kaynağına geçilmeli |
| Repeater yalnız tek seviye; en fazla 12 satır/12 alt alan | Eklenti: includes/theme-support.php | Bölüm → slayt/kategori öğeleri modeli mevcut forma koşullar eklenerek büyütülmemeli |
| Mobil slider yazı alanı son CSS kuralında %56 yükseklik ve alta hizalama alıyor | Tema: assets/styles/homepage.css | Görselden kopuk boş alanın yapısal nedeni; vitrin kompozisyonu temizce yeniden tanımlanmalı |
| Kategori görünümü sabit 4:5 görsel, masaüstü dört/mobil iki sütun | Aynı CSS | Ürün kartına benzeyen tek görünüm yerine kategori varyantları gerekli |
| Form satırları açık fieldset; genel “Satır ekle”, sınırlı özet/önizleme | Eklenti: includes/theme-settings-fields.php; admin/assets/js/theme-settings.js | Daraltılabilir bölüm kartları, tür seçimi, küçük önizleme ve çoğaltma gerekli |
| Kategori select alanı her çizimde 500 terime kadar seçenek üretiyor | includes/theme-settings-fields.php | Aramalı ve sayfalı seçim; tekrar eden dev DOM listeleri kaldırılmalı. WP önbelleği nedeniyle her alanın ayrı DB sorgusu yaptığı iddia edilmez |
| Tema formu kendine ait küçük CSS ve standart WP form elemanları kullanıyor | admin/assets/css/theme-settings.css; admin/views/partials/settings-theme.php | Codela ortak kart/alan/boşluk/renk sözleşmesine bağlanmalı; admin.css tamamı sayfa editörüne taşınmamalı |
| Tema kurulum/sürüm kartı içerik sekmelerinin üzerinde tekrar ediyor | settings-theme.php; includes/theme-support.php | Kurulum/güncelleme yönetimi içerik düzenlemeden ayrılmalı; uzaktaki sürüm sorgusu editör açılış yolundan çıkarılmalı |
| Global option kaydı sayfa taslak/revizyon akışına dahil değil | includes/theme-support.php | Sayfa içeriği native kayıt, önizleme ve yetki akışını kullanmalı |
| Homepage varlık yükleme ve gezinme kararları is_front_page koşuluna bağlı | Tema: functions.php; inc/navigation.php; inc/document-continuity.php | Sayfadaki bölüm yeteneklerine göre CSS/JS ve güvenli gezinme kararı gerekli |

Korunacak iyi parçalar: URL/medya/taksonomi doğrulaması, nonce/yetki kontrolleri, kararlı satır kimlikleri, klavyeyle sıralama ve odak koruma; native medya seçici; Woo görünürlük/stok kuralları; gerçek total_sales sıralaması; ortak codela_sf_product_grid; ortak galeri altyapısı.

Galeri adaptörü zaten birden fazla data-sf-gallery örneği seçiyor. Sorun “tek galeri çalışıyor” değildir. Kontrol sınıfları ana sayfaya bağlı ve başlatma belge yükleme anında gerçekleşiyor. Ortak yatay adaptör bu bağımlılıklardan ayrılmalı; ürün zoom/galeri davranışı yeniden yazılmamalıdır.

Mevcut PHP testi üretim renderer'ını WordPress/Woo taklitleriyle sınar; tarayıcı testi üretilmiş fixture kullanır. Bunlar yararlıdır ancak gerçek sayfa revizyonu, mobil admin, 10 karışık bölüm ve gerçek Woo entegrasyonunun kanıtı değildir.

## 3. Düzenleme nerede olmalı?

| Seçenek | Değerlendirme |
|---|---|
| Tüm içerik Tema ayarlarında | Ana sayfa için basit; çok sayfada global veri ve ayrı taslak/revizyon sistemi gerektirir. Önerilmiyor |
| Sayfanın en altında ayrı meta kutusu | Sayfanın normal içeriği ile ikinci düzen alanı oluşur; önizleme/sıra/kayıt belirsizleşir. Önerilmiyor |
| Sayfa editöründe tek Codela düzen alanı | Önerilen. İçerik sayfaya, tasarım seçenekleri ortak sisteme ait olur |

Önerilen teknik temel: post_content içinde sürümlü Codela blokları; bir düzen kökü ve izin verilen bölüm çocukları. WordPress InnerBlocks izin verilen çocuk türlerini ve sıralamayı destekler. Codela'nın 10 bölüm sınırı, tür kuralları ve sade panel deneyimi ayrıca geliştirilecektir; bunların hazır bir WordPress ayarı olduğu varsayılmamalıdır.

Düzen kökü içine sınırsız kolon/grup/HTML yerleşimi açılmamalı. Kullanıcı Bölüm Ekle → Tür → Görünüm → İçerik akışını izlemeli. Yerleşim sayfalarında bu alan ana çalışma alanı olmalı; standart metin sayfaları mevcut editörle çalışmaya devam etmeli. Bütün sayfalara zorunlu şablon uygulanmamalı.

Ürün detayı, mağaza/arşiv, sepet, ödeme ve hesap ekranları ilk kapsamda serbest bölüm düzenine çevrilmez. Ana sayfa, kampanya, koleksiyon tanıtımı ve normal içerik sayfaları ilk kapsamdadır. Arşiv üst/alt yerleşimleri ileride aynı renderer'a bağlanabilir; Woo akışı ayrıca değerlendirilir.

## 4. Bölüm ve tasarım kataloğu

| Tür | Seçenekler ve içerik |
|---|---|
| Ana vitrin | Tek görünüm. Fotoğraf baskın, küçük başlık/alt metin/isteğe bağlı CTA; yatay kaydırma, ok ve sayaç. Tek sayfada en fazla bir adet, ilk sırada |
| Kategoriler | Kompakt yatay kartlar (A); görsel ve metnin yan yana olduğu editoryal satırlar (B); tam genişlik görsel bantlar (C); bir büyük + iki küçük kompozisyon; sonraki kartın göründüğü yatay galeri; mevcut sade ızgara |
| Ürünler | Başlık, isteğe bağlı açıklama, yeni ürünler/çok satanlar, kategori filtresi, 4/8/12 ürün, tümünü gör bağlantısı. Mevcut ortak Woo kartları |
| Tanıtım | Önceki slider fikirlerinden kompakt çerçeveli görsel, metin–görsel bölünmüş düzen, editoryal başlık + fotoğraf, geniş görsel bant. Tek görsel veya birden çok öğede ortak yatay galeri |

Kategori varyantı değişince kategori, başlık, açıklama ve görsel seçimleri korunur. Varyant yalnız yerleşimi değiştirir. Kategori görselleri tek ürün satışı yerine ortam/koleksiyon hissi vermeli; fiyat ve sepete ekle bulunmamalı. Bir büyük + iki küçük görünüm eksik öğelerde boş kutu üretmemeli; tek öğe geniş, iki öğe dengeli, üçten fazla öğe sonraki kompozisyon grubunda gösterilmeli.

Vitrin metni görseli kapatmayan sınırlı genişlikte olmalı; her slaytta fotoğraf odak noktası ve mobil görsel seçilebilmeli. Metin isteğe bağlıdır. Başlığın uzaması boşluk/taşma üretmemeli; editör gerçek mobil önizleme ve uzunluk önerisi göstermeli. Otomatik oynatma varsayılan olarak kapalı olmalı.

Tüm görünümler ortak font, renk, köşe, kenar boşluğu ve düğme bileşenlerini kullanır. Her varyant için yeni düğme/kart sistemi yapılmaz. Fotoğrafın kompozisyonu tasarım kalitesini etkiler; aynı fotoğraf her kırpmaya uygun olmayabilir.

## 5. Yönetim deneyimi

Tek listede örnek: Vitrin → Kategoriler / yatay → Yeni ürünler → Tanıtım / bölünmüş → Kategoriler / bant → Çok satanlar. En fazla 10 üst seviye bölüm; iç slaytlar bu sayıya dahil değildir.

Her bölüm kapalıyken tür, başlık, görünüm adı, küçük görsel ve görünürlük durumu gösterir. Açılınca yalnız ilgili alanlar görünür. Bölüm ekleme listenin sonunda ve iki bölüm arasında bulunur. Sürükleme yanında klavye ve dokunmatik için yukarı/aşağı taşıma düğmeleri kalır. Çoğalt, gizle/göster ve sil işlemleri; silmede geri alma; sırayı değiştirince odak aynı bölümde kalır.

Vitrin ilk sıraya özel alandır; diğer türler serbestçe sıralanır. Bir sayfada farklı görünümlerde birden fazla kategori ve ürün bölümü kullanılabilir. Tür değiştirme veri kaybettirecekse önce açıklama ve geri alma olmalı; farklı türlerin ilgisiz alanları körlemesine dönüştürülmemeli.

Taslak/önizleme/yayınlama sayfa editörünün tek kayıt akışında çalışır. Codela menüsünden giriş ikinci kayıt modeli oluşturmaz. Yayındaki içeriği yanlışlıkla anında değiştiren alan başına autosave davranışı kurulmaz.

## 6. Sorumluluk ve veri modeli

Eklenti: kalıcı bölüm türleri/veri sözleşmesi, editör bileşenleri, doğrulama, yetkiler, medya/taksonomi seçimleri ve geçiş aracı. Tema: görünüm kataloğu, server renderer'lar, ortak tasarım token'ları, CSS ve ihtiyaç duyulan mevcut galeri adaptörü. İletişim açık sürümlü kayıt/hook sözleşmesiyle olmalı; admin tarafında keyfi tema dosyası include eden bir mekanizma eklenmemeli.

Her bölümde şema sürümü, kararlı kimlik, açık/kapalı, görünüm anahtarı ve tipe özel alanlar bulunur. Kategori/slayt öğeleri sınırlı çocuk veri yapılarıdır; bölüm içinde yeniden bölüm kurulamaz. Başlangıç sınırı: 10 bölüm, vitrin/tanıtım için en fazla 8 slayt, kategori bölümünde en fazla 12 öğe. Aynı sayfada ilk sunucu çıktısındaki toplam ürün sayısı için önerilen bütçe 48; gerçek ölçümle kesinleştirilecek. Böylece 10 adet dört ürünlük bölüm mümkün olur.

Kimlikler çoğaltmada yenilenir; sıra dizi/blok sırasıdır. Varyant ve türler allowlist; medya gerçek attachment; kategori gerçek product_cat; URL güvenli HTTP(S)/site içi; çıktı bağlama göre escape edilir. Kayıt ve render sınırları sunucuda da uygulanır. Editör kısıtları tek güvenlik katmanı değildir. Geçersiz kayıtta mevcut içerik sessizce kesilip kaydedilmez; alan hatası gösterilir.

Sayfa düzenleme edit_post, yayınlama ilgili publish yetkisi, medya seçimi ilgili medya yetkisini kullanır; içerik editörüne manage_options verilmez. Bilinmeyen şema/tema varyantında içerik silinmez; desteklenmeyen durum editörde görünür. Tema değişiminde temel metin/görsel/link fallback stratejisi prototipte doğrulanmalı; eski fiyat HTML'i yedek olarak yayınlanmamalı.

## 7. Hız ve mevcut davranışların korunması

- İçerik sunucuda HTML üretilir; ilk görüntü için tarayıcıda veri çekip sayfa kurma zorunluluğu olmaz. Editör kodu ziyaretçiye gönderilmez.
- Bölüm yetenekleri sayfa render öncesi sınırlı blok taramasıyla bulunur. Kullanılmayan varyantın galerisi/JS'i yüklenmez; ortak dosya bir kez yüklenir. WP block metadata araçları kullanılmalı; gerçek ağ çıktısı ayrıca doğrulanmalı.
- Sayfa genelinde yalnız ana LCP adayı yüksek öncelikli olur. Mevcut slider fonksiyonunu kopyalamak her bölümün ilk fotoğrafını eager/high yapar; bu düzeltilmelidir. Alt tanıtım ve kategoriler lazy, responsive srcset/sizes, ayrılmış ölçüler ve uygun görsel boyutları kullanır.
- Yeni slider kütüphanesi, autoplay zamanlayıcısı, klon slayt veya ikinci gezinme motoru eklenmez. Mevcut yatay kaydırma adaptörü ortaklaştırılır. Çoklu örneklerin kontrol/sayaç/kimlikleri birbirinden bağımsız olur.
- Aynı normalize ürün sorgusu aynı istek içinde tekrar çalıştırılmaz. Önce istek içi memoization; kalıcı ID önbelleği ancak stok/görünürlük/satış/kategori değişikliklerinde invalidation açıkça çözülürse. Kişiye özel fiyat, sepet veya müşteri HTML'i ortak cache'e konmaz.
- Ürün sorguları sınırlı ve sayfalama sayımı gerektirmeyen biçimde kalır. Görünürlük, stok, alt kategori ve gerçek çok satanlar kuralları korunur.
- CSS düzeni ortak token'lara dayanır; homepage'e özel home seçicileri genel bölüm kapsamına taşınır. Header/footer ve plugin hesap alanına stil sızmaz.
- Mevcut güvenli gezinme kararı korunur. Woo/galeri içeren yeni sayfalar başlangıçta tam belge gezinmesini kullanır; router allowlist'e körlemesine eklenmez. Mevcut document continuity yolu bölüm yetenekleriyle uyarlanır.
- Menü scroll lock, üründe konum koruma, alt panel güvenli boşluğu, geri/ileri konumu ve azaltılmış hareket davranışı regresyon kapsamındadır.
- Tek H1 sayfa düzeyinde belirlenir; her tanıtım/slider ilk slaytı otomatik H1 üretmez.

Performans kabulü aynı içerik/cihaz/ağ koşulunda önce-sonra ölçüm ister. Hedefler LCP ≤2.5 saniye, CLS ≤0.1, INP ≤200 ms; bunlar mevcut canlı ölçüm veya garanti değildir. Gerçek içerikle mobil laboratuvar ölçümü ve mümkünse saha p75 verisi ayrı raporlanmalıdır. 10 bölüm senaryosunda sorgu sayısı/süresi, aktarılan medya/JS/CSS ve DOM büyüklüğü kaydedilmeli. Editörde kategori araması ve sürükleme 10 dolu bölümle denenmeli.

## 8. Temiz geçiş; yama biriktirmeme

1. Mevcut option, ön sayfa ataması ve varsa sayfa içeriğinin geri dönüş snapshot'ı alınır.
2. Eski slider/kategori/dört ürün alanı yeni modelin tek seferlik girdisi olur; canlı yapı değiştirilmeden taslak/önizleme hazırlanır.
3. Statik ana sayfa mevcutsa onun içeriği incelenir. Dolu post_content üzerine otomatik yazılmaz. Ön sayfa atanmadıysa yeni taslak hazırlanır; atama yayın adımında yapılır.
4. Geçiş kimliği ve kaynak hash'i tekrarlı çalıştırmada aynı içeriği çoğaltmayı önler. Taslak hazırlandıktan sonra eski ayarlar değişmişse yeniden karşılaştırılır.
5. Doğrulanan sayfa yayınlanınca tek içerik kaynağı yeni model olur. Eski ana sayfa düzenleme formları kaldırılıp yeni editöre yönlendirilir; iki canlı yazıcı bırakılmaz.
6. Global tema ayarları ve kurulum sistemi ayrı sorumluluklarla devam eder. Eski homepage composer/CSS ve yalnız ona ait form kodu geçiş kabulünden sonra kaldırılır. Geri dönüş snapshot'ı korunur; uyumluluk katmanı kalıcı ikinci sistem olmaz.

Tüm eklentiyi sıfırdan yazmak gerekli değil. Yeniden kurulacak parça sayfa düzeni ve onun editörüdür. Galeri, ürün kartları, doğrulama yardımcıları ve ortak UI'nin yeniden yazılması maliyet ve regresyon riskini artırır.

## 9. Uygulama sırası ve bitiş kapıları

| Aşama | Teslim | Çıkış ölçütü |
|---|---|---|
| 1. Sözleşme ve editör prototipi | Veri modeli, sorumluluk sınırı, 10 bölüm listesi, tür/görünüm seçimi | Codela görsel uyumu; masaüstü/mobil/klavye sıralama; tek kayıt kaynağı |
| 2. Uçtan uca temel | Vitrin ve ürün bölümünün gerçek WP sayfasında kayıt/önizleme/SSR akışı | Taslak, revizyon, yetki, tek H1, native Woo eylemleri |
| 3. Tasarım kataloğu | Tüm kategori ve tanıtım görünümleri, ortak galeri adaptörü | Aynı içeriğin varyant değişiminde korunması; tek/eksik/uzun içerik kabulü |
| 4. Hız ve gezinme | Koşullu varlıklar, sorgu tekrarını önleme, medya önceliği | 10 karışık bölüm ölçümü, tek LCP önceliği, çoklu galeri ve geri/ileri kabulü |
| 5. Geçiş ve eski kodun kapanışı | İdempotent dönüştürme, karşılaştırmalı önizleme, eski formların kaldırılması | Veri kaybı olmaması; dolu sayfa koruması; eski kaynağa geri dönüş |
| 6. Sürüm ve yayın | Mevcut doğrulamalar, sabit kaynakla paketleme/atomik yayın | Kaynak/test/canlı kanıtı ayrı kaydedilir; gerçek admin kayıt turu ve mobil kontrol |

Aşamalar geliştirmenin sırasıdır; ilk iki bölümün yapılması tüm tasarım kataloğunun teslimi sayılmaz. Kullanıcının uygulama talebinden sonra bütün kapsam tamamlanmalıdır.

Kritik testler: 0/1/10/11 bölüm; silinmiş medya/kategori; 500'den çok kategori arama; yanlış URL/kimlik; yetkisiz kayıt; aynı sayfayı iki editör; taslak/revizyon geri alma; çoğaltma kimlikleri; klavye odağı; iOS/Android sıralama; bir sayfada çoklu galeri; no-JS içerik; Woo stok/fiyat/görünürlük; mobil menü ve ürün scroll lock; silme/ekleme sonrası migration rollback.

## 10. Bu çalışmanın sınırları ve kaynaklar

Bu commit yalnız rapor ve çalışma notudur; runtime sürümü, kullanıcı içeriği, canlı ön sayfa ataması ve dağıtım değiştirilmedi. Yeni runtime testi veya canlı hız testi çalıştırılmadı. Rapor kaynak incelemesidir; önerilerin uygulama kabulü yukarıdaki kapılara bağlıdır.

Açık PR incelemesi: tema #14 sepet yarış koşulları taslağı bu kapsamdan bağımsızdır, birleştirilmez. Eklentide inceleme anında açık PR yoktu. Mevcut hızlı delta/atomik dağıtım yaklaşımı korunur; bu rapor için yayın başlatılmaz.

Resmi teknik dayanaklar:
- https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/
- https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/

Bu belgeler native bölüm yapısı ve editör/ön yüz varlık ayrımını destekler. Özel Codela UX, sınırlar, geçiş ve performans bütçeleri bu raporun mühendislik önerileridir. Minimum desteklenen WordPress sürümünde API uyumluluğu prototip aşamasında doğrulanmalıdır.
