# Ürün alt alanı, menü kaydırması ve yönetilebilir ana sayfa
Tarih: 17 Ekim 2026  
Durum: **Yalnız analiz ve uygulama planı. Henüz kodlanmadı, test edilmedi veya yayımlanmadı.**
İncelenen Storefront HEAD: `05ccc0e7cad52cec5c2582a1a51f49a1b457520a`; mevcut sürüm 0.1.133.
Kullanıcı sonraki çalışmada uygulama isteyecek. Bu kayıt uygulamaya başlama veya yayın talebi değildir.

## Kullanıcının dört talebi
1. Ürün sayfasındaki alt menü/satın alma alanının altında biraz daha boşluk olsun; tarayıcıya yapışmasın.
2. Ürün sayfasında menüyü açıp kapatınca sayfanın en altına atma hatası giderilsin.
3. Ana sayfanın en üstüne mevcut ürün galerisi altyapısıyla yatay slider gelsin. Başlık, alt metin ve diğer içerikler Codela → Ayarlar → Tema içinden düzenlensin. Sıfırdan galeri yazılmasın.
4. Ana sayfa sırası slider → kategori tanıtımları → yönetilebilir en fazla dört ürün bölümü olsun. Bölümlerin adı, sırası ve kategori filtresi seçilsin; Yeni ürünler / Çok satanlar gibi sorgu türleri desteklensin.

## Kaynak incelemesi ve sınırlar
- `theme/codela-storefront/templates/front-page.html` mevcut `codela/storefront-home` dinamik bloğunu kullanır. `inc/render.php::codela_sf_home()` dolu statik ana sayfa içeriğine öncelik verir; yoksa tek hero ürün + son ürünleri basar.
- `config/settings.json` temaya ait ayar şemasıdır. Homepage bölümünde yalnız `hero_product_id` vardır. Header/Product/Footer ayrı bölümlerdir.
- Eklentide `codela-commerce-toolkit/includes/theme-support.php` içindeki `codela_theme_settings_sections()` yalnız text/menu/product/checkbox kabul ediyor. Şema sürümü 1; dosya 16 KB, bölüm 12, bölüm başına alan 20 sınırı var. `codela_theme_save_section()` yalnız skaler alanları kaydediyor. Görsel/kategori/seçim/tekrarlı satır eklemek yalnız JSON değiştirerek mümkün değil.
- `inc/media.php`, `assets/styles/gallery.css` ve `assets/scripts/gallery-defer.js` mevcut galeri sistemidir. Haricî bir slider paketi kullanılmıyor: CSS native scroll-snap ve küçük Woo adaptörü var. Core Gallery için de yatay `is-style-sf-media-slider` desteği mevcut.
- Ürün JS'i Woo DOM, zoom, varyasyon, dikey belge kaydırması, ilgili ürünler ve sheet ile bağlantılıdır. Dosyayı olduğu gibi ana sayfaya yüklemek/kopyalamak doğru yeniden kullanım değildir.
- `assets/scripts/overlay-controller.js` menü açılışında scrollY ve body stilini kaydeder, body'yi fixed yapar; kapanışta dialog/dock/menu düğmesini geri taşır, body stilini ve scrollY'yi geri yükler. `product.css` mobil ürün belgesinde root mandatory snap kullanır; `product-information.js` scroll üzerinde discovery durumunu günceller.
- `tokens.css` ortak alt boşluğu `--sf-ui-bottom-bar-gap:4px` tanımlar. Ürün paneli ve gezinme alt barı bunu safe-area ile tüketir.
- Theme kaynakları bu depoda; genel ayar arayüzü/saklama köprüsü `muhammetdkaya/codela` deposundadır. Dondurulmuş plugin tema kopyasına ve `codela-site` deposuna dokunulmaz.
- Mevcut AGENTS ve design-system kararları geçerlidir: hız, tek ortak UI, tek overlay/store/dock, özgün Woo form/kart, kullanıcı verisini koruma.

## 1. Ürün alt boşluğu
**Önerilen başlangıç:** yalnız mobil ürün bağlamında mevcut 4 px boşluğu 12 px yaparak +8 px nefes alanı; fiziksel Safari görüntüsüne göre son kabul. Bu ölçü kullanıcı tarafından kesinleştirilmiş değil, tasarım önerisidir.

- İç padding veya buton yüksekliği artırılmayacak; dış alt uzaklık düzenlenecek.
- Ortak token ürün kapsamından tüketilecek; bütün sitenin alt barı istemeden yükseltilmeyecek. Ürün üzerinde açılan overlay dock'u aynı alt çizgiye uyacak.
- Safe-area yalnız bir kere eklenecek. Pending native summary ile mount edilmiş sheet ilk karede aynı alt konumu kullanacak.
- Açık/kapalı sheet, satın alma alanı olmayan üründeki normal dock, sayaç + ziyaretçi metni, önizleme rayı, son içerik rezervi ve mevcut fotoğraf inset hesabı birlikte denetlenecek. Sayaçlar panelle çakışmayacak; galeri dışındayken birlikte gizlenmeye devam edecek.
- Panelin yüzeyi, 28 px mevcut köşeleri, boyutu ve tek Woo form korunacak. Fotoğraf ile alt panel arasına yeni beyaz şerit veya sayfa sonuna gereksiz kuyruk eklenmeyecek.

## 2. Menü aç/kapa sonrası aşağı atlama
**Kullanıcı tarafından bildirilen açık hata; kök neden bu analizde kesinleştirilmedi.**
İlk hipotez: body fixed/unlock, native dialog odak geri dönüşü, root scroll-snap ve ürün discovery ölçümlerinin zamanlaması çakışıyor.

Uygulama sırası:
1. Canlı/gerçek Woo bağlamında ilk, orta, son fotoğrafta ve ilgili ürünlerde yeniden üret. Açılış öncesi, body kilitli, dialog kapanırken ve sonraki frame'lerde scrollY, body.top, aktif odak, discovery/snap ve fotoğraf indeksi kaydet.
2. Aynı testi detay paneli açıkken, menüden arama/sepet geçişinde, hızlı aç-kapada, admin bar ile ve olmadan yap. Sabit body yüzünden geçici ölçümlerin discovery'yi yanlış değiştirdiğini ayrıca denetle.
3. Kanıtlanan noktayı mevcut overlay controller / galeri adaptörü içinde düzelt. Gerekirse mevcut overlay durumuna bağlı geçici snap/discovery askıya alma ve tek kontrollü geri yükleme uygula; kesin yöntem test sonucuna göre belirlenecek.
4. İkinci scroll yöneticisi, kalıcı scroll-snap kapatma, belirsiz setTimeout veya peş peşe scrollTo yamaları ekleme. Odak geri dönüşü preventScroll sözleşmesini korusun. Sayfa navigasyonu varsa eski scroll'u geri yükleme.

Kabul: menü kapanınca aynı fotoğraf/aynı ilgili ürün konumu ve aynı panel durumu korunur; normal koşullarda scrollY farkı <=2 px. Tarayıcı çubuğu/viewport değişmişse ham scrollY yerine aynı görsel anchor korunur. Belge sonuna/başına sıçrama, fotoğraf indeksi değişimi, açık kalmış kilit veya görünmez odak olmaz.

## 3. Ana sayfa tasarım kurgusu
### Genel düzen
Mevcut ortak header → yatay görsel slider → kategori tanıtımları → ürün bölümü 1–4 → mevcut footer.
Header/dock görünümü ve sayfa geçiş altyapısı korunur. Açık renkli, sade tema; yeni yüzey/buton sistemi yok.

### Slider
- Ana sayfanın ilk görsel odağı; tek kare görünür, sağa/sola kaydırma. Ürün sayfasının dikey belge snap davranışı ana sayfaya taşınmaz.
- Masaüstünde geniş yatay, mobilde daha dik ama zorunlu tam ekran olmayan önceden ayrılmış oran. Mobilde kategorilerin başladığı hissedilir. Gerçek içerikle oran kabulü yapılır.
- Her slide: görsel, isteğe bağlı mobil görsel, başlık, alt metin, isteğe bağlı tek CTA metni + hedef URL, etkin/pasif; liste sırası. Görsel alt metni medya kütüphanesinden gelir; dekoratif görselin boş alt metni geçerlidir.
- Başlık ve kısa açıklama okunur bir bölgede; metin görsel içine gömülmez. Ortak Button/IconButton, ortak tipografi ve sade sayfa göstergesi kullanılır. Mobilde taşan uzun metin kontrol edilir; CTA başka linkin içine gömülmez.
- Varsayılan autoplay kapalı; sonsuz döngü/klon slide yok. Kullanıcı bu özellikleri istemedi. Tek slaytta gereksiz navigasyon gizlenir; sıfır geçerli slaytta bölüm boş alan bırakmadan atlanır.
- Yönetimde önerilen sınır 8 slide; bu bir uygulama varsayımıdır. Ekle/sil, yukarı/aşağı taşı ve sürükle desteği; klavye ile taşıma da mümkün olmalı.
- **Yeniden kullanım:** gallery.css içindeki mevcut native yatay track/slide düzenini ortak sınıf sözleşmesine çıkar/uyarla. Ortak indeks/gösterge/görsel hazırlama gereksinimi varsa mevcut galeri adaptöründen küçük bağlamdan bağımsız çekirdek ayır; ürün adaptörü Woo'ya özgü zoom/varyasyon/sheet kısmını tutar. Ana sayfa yalnız yatay sunum + metin katmanını ekler. Core Gallery uyumluluğu korunur. İkinci carousel kütüphanesi, kopya galeri motoru veya ana sayfada Woo zoom bağımlılığı yüklenmez.
- Kaydırma sırasında sayfanın normal dikey hareketi engellenmez; klavye/focus, reduced-motion ve ekran okuyucu isimleri korunur. Birden fazla galeri örneği birbirinin indeksini değiştirmez.

### Kategori tanıtımları
Ürün kartı görünümü kullanılmaz: büyük kategori görseli + kategori adı + isteğe bağlı kısa tanıtım. Fiyat, stok, sepet düğmesi yok; kart kategori arşivine gider.
- Yönetim: bölüm başlığı, göster/gizle, seçili kategoriler, sıra; satırda opsiyonel ad/açıklama/görsel override.
- Varsayılan görsel Woo kategori görselidir; yoksa ortak sakin placeholder. Seçilmiş kategori silinirse kart atlanır; kendiliğinden başka kategori gösterilmez.
- Mobilde kompakt iki sütun, masaüstünde alanı paylaşan tanıtım kartları; kategori sayısına uyumlu grid. İkinci slider zorunlu değil.
- Önerilen başlangıç 4 kategori, yönetimde üst sınır 12. Bölüm yapılandırılmamışsa boş başlık/placeholder kategori üretilmez.

### En fazla dört ürün bölümü
Dört bağımsız, açılıp kapanabilen slot. Ekrandaki sıraları yönetimden değişir; slot kimliği sıra değişince bozulmaz.
Her slot:
- Etkin/pasif.
- Serbest başlık (ör. Yeni ürünler / Çok satanlar).
- İçerik türü: Yeni ürünler veya Çok satanlar. İlk kapsam için bu ikisi yeterli; sonradan tür eklenebilir.
- Kategori filtresi: Tüm kategoriler veya tek product_cat seçimi; alt kategoriler varsayılan dahil. Başlık kategori/sorgu türünden bağımsızdır.
- Ürün adedi: varsayılan 4, önerilen seçenekler 4/8/12.
- İsteğe bağlı “Tümünü gör” bağlantısı; aynı kategori ve sıralamaya giden gerçek arşiv URL'si. Filtreyi kaybeden genel mağaza linki kullanılmaz.
- Sıra: dört slotun sürükle / yukarı-aşağı taşınması.

Ürünler mevcut `codela_sf_product_grid()` ve native Woo kartlarından render edilir; ana sayfaya özel kopya kart yok. Mobilde iki sütun, geniş ekranlarda mevcut katalog grid'i. Yeni ürünler yayın tarihine göre; Çok satanlar Woo'nun gerçek satış verisine göre, eşitlikte kararlı sıralama. Satış yoksa sahte çok satan etiketi/sayısı üretilmez. Sonuçsuz veya kapalı bölüm başlığıyla birlikte gizlenir. Bölümler arasında aynı ürün çıkabilir; ilk kapsamda örtük ürün tekilleştirme yok.

## 4. Ayarlar ve veri sahipliği
Yol: **Codela → Ayarlar → Tema → Ana Sayfa**.
Bu alanın içinde düzen/mod seçimi, Slider, Kategori tanıtımları ve Ürün bölümleri ayrı gruplar/alt görünümler olacak; tek uzun karmaşık forma yığılmayacak.

Önerilen veri sözleşmesi (alan adları uygulamada mevcut şemayla kesinleştirilir):
- `homepage_mode`: legacy / sections / page_content.
- `homepage_slides`: sıralı, sınırlı satırlar; kalıcı id, enabled, image_id, mobile_image_id, title, subtitle, button_label, button_url.
- `homepage_categories`: enabled, title ve sıralı kategori satırları (term_id, opsiyonel title/description/image_id).
- `homepage_sections`: en fazla dört slot (id, enabled, title, source, category_id, include_children, limit); dizi sırası gösterim sırasıdır.

Tema alan tanımları ve frontend renderer'ın sahibidir. Eklenti yalnız genel güvenli şema okuma, medya seçimi, kategori seçimi, tekrarlı alanları çizme/validasyon/kaydetme köprüsünü genişletir; tema kodunu admin içinde çalıştırmaz. Gerekli türler: textarea, URL, attachment image, product_cat, select ve sınırlandırılmış bir seviyeli repeater/group. Sınırsız iç içe form üreticisi kurulmaz. Yönetim medya scriptleri yalnız ilgili ayar ekranında yüklenir.

Mevcut `codela_theme_settings` option kimliği, diğer bölüm değerleri, yetki/nonce ve bölüm bazlı kaydetme korunur. Nested yapı doğrulama kayıt öncesinde tamamen yapılmalı; hatalı satır kısmi kayıt oluşturmamalı. Alan/karakter/adet sınırları, MIME/attachment kontrolü, gerçek product_cat, allowlist sorgu türü, güvenli URL ve çıktıda escaping şarttır. Bilinmeyen alanlar kaydedilmez. Şema 16 KB/20 alan sınırları hesaba katılır; sınır artırmak yerine kompakt genel tanımlar tercih edilir. Sürüm/kabiliyet sözleşmesiyle eski eklentide yeni alanların sessizce kaybolması engellenir; admin'e gerekli güncelleme açıkça gösterilir, frontend eski görünümle çalışır.

### Mevcut ana sayfa içeriğini koruma
Statik dolu sayfa şu an renderer'dan önce geliyor. Yeni bölümlerin kaydedilip görünmemesi riskini çöz:
- Eski kurulumlarda mod seçilmemişse bugünkü davranış korunur (legacy).
- Kullanıcı “Tema bölümleri” seçtiğinde yeni düzen gösterilir; mevcut WordPress sayfa içeriği silinmez.
- “Sayfa içeriği” modu açık alternatif olarak korunur; yönetimde hangi modun yayında olduğu belli olur.
- `hero_product_id` silinmez; geçiş yapılana kadar legacy fallback'tir. Otomatik slide/veri üretimiyle içeriği değiştirme.
- Site Editor'da özelleştirilmiş front-page template varsa tespit edip belgele; kullanıcı özelleştirmesini sessizce ezme.

## 5. Hız ve doğruluk
- İlk görünür slider görseli sunucu HTML'inde width/height, uygun responsive srcset/sizes ve yüksek öncelikle; diğerleri düşük öncelikli/gecikmeli. Mobil/masaüstü alternatifleri picture ile tek uygun kaynak seçsin.
- Mevcut medya optimizasyon yolunu kullan; 2 MB orijinalleri her slaytta peş peşe indirme. Alan yüksekliği ilk karede ayrılmış olsun; geç açılan metin/ayar yüzünden CLS oluşmasın.
- Ana içerik sunucudan render edilir, ilk açılışta dört ayrı REST isteği beklenmez. En fazla dört sınırlı ürün sorgusu; gereksiz toplam sayım/tüm katalog taraması yok.
- Yayımlanmamış, şifreli, katalogdan gizli ürünler ve Woo'nun gizle ayarına tabi stoksuzlar sızmaz. Varyasyonlar bağımsız ürün gibi listelenmez; fiyat/stock/sepete ekleme Woo'da kalır.
- Müşteriye/vergiye bağlı fiyat HTML'ini herkese ortak yeni cache'e koyma. Cache ancak ölçülen ihtiyaçla ve doğru invalidation ile; ilk sürümde gereksiz cache sistemi kurma.
- Yeni script yalnız ihtiyaç olan sayfalarda; ortak modül WordPress mevcut kayıt/versiyon sisteminde bir kez yüklenir.

## 6. Uygulama sırası ve kabul
1. Güncel HEAD/açık PR/AGENTS tekrar kontrolü. Menü hatasını yeniden üret, regresyon testi ekle ve mevcut owner'da düzelt.
2. Ürün alt boşluğu; pending/mounted eşitliği ve sayaç/galeri ilişkisini doğrula.
3. Eklenti genel ayar türleri + tema şeması/geriye uyum; kaydetme ve geri okuma testleri.
4. Mevcut galeri ortaklaştırma + ana sayfa sliderı; ürün galerisi davranışları değişmeden.
5. Kategori tanıtımları + dört slotun native katalog render'ı.
6. Gerçek WP/Woo kabulü, görsel/hız ölçümü ve ancak uygulama talebi kapsamındaki yayın akışı.

Test matrisi:
- 320/390/700 px ve masaüstü; Chromium + WebKit; fiziksel Safari'de açık/kapalı tarayıcı çubuğu ve safe-area ayrı son kabul.
- Ürün: 1 ve çok fotoğraf, varyasyon, satın alınamayan ürün, ilgili ürünler, açık/kapalı detay, overlay panel geçişleri, hızlı aç/kapa, admin bar, geri/ileri.
- İlk ve son panel konumu/yüksekliği farkı <=3 px; mevcut 0.1.133 sayaç gizlenmesi, üç yuvarlak önizleme, tek Woo form, aynı dokunma hissi korunur.
- Slider 0/1/çok, uzun Türkçe başlık, eksik medya, link/klavye/dokunma, JS kapalı, reduced-motion; yatay taşma ve sayfa kaydırma kilidi yok.
- Ayar ekle/sil/sırala/kaydet/yenile, dört slot sınırı, yanlış kategori/attachment/URL, yetkisiz POST, diğer alanların korunumu, eski eklenti/tema kombinasyonu.
- Yeni/çok satan sorgularını bilinen ürün ve gerçek satış fixture'ıyla doğrula; kategori+alt kategori, gizli/stoksuz/silinmiş kayıt, boş sonuç, link filtreleri.
- Mevcut ürün, katalog, navigasyon, galeri ve shell testleri; canlı WP/Woo kanıtı sentetik fixture'dan ayrı.
- Ana sayfa cold/warm LCP/CLS ve indirilen görsel boyutlarını önce/sonra aynı koşullarda kaydet; eski performans açıklarını çözüldü sayma. Hedef LCP <=2.5s, CLS <=0.1; ölçülmeyeni başarılı ilan etme.

## Sonraki çalışmaya başlangıç
Kullanıcı uygulama istediğinde **menü aç/kapa konum kaybının yeniden üretimiyle başla**. Sonra yukarıdaki sırayla ilerle; dört talebin her biri ayrı tamamlanma kanıtı taşısın. Tema/eklenti sürümü, hazırlanmış kod, CI ve canlı dağıtım durumlarını ayrı kaydet. Bu doküman hiçbir talebin uygulanmış olduğunu iddia etmez.

Bu plan için yalnız docs ve AGENTS değişir. Deploy workflow path filtresi theme/scripts/tests/workflow dosyalarını izlediğinden salt belge commit'i ürün dağıtımı başlatmaz. Sürüm artırılmaz.
