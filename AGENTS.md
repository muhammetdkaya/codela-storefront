# Codela Storefront — güncel çalışma kuralları

## 14 Ekim 2026 / 0.1.76 — galeri yerleşimi ve önizleme indirmeleri (yayın bekliyor)

- 0.1.75 canlı audit 38540948506: mobil ürün cold LCP 1.504s, CLS 0.231; deploy 38540669202 başarılı.
- Canlı teşhis [38546872117](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38546872117): Woo başlangıcında sonraki slaytlar ikinci satırda; galeri 984→487.5px, özet y=1008→511.5px. Üç baseline örnekte CLS 0.231; aynı sayfaya sabit yükseklik/overflow uygulanan üç örnekte CLS 0.
- 0.1.76: galeri dış alanı mevcut responsive yükseklikte tutulur; slaytlar gizlenmez, native track/zoom/lightbox değiştirilmez. Önizleme sizes 100px yerine gerçek 46–48px alana uygun 48px; mevcut srcset korunur.
- Çok görselli başlangıç regresyonu eklendi. CI, canlı deploy ve standart 24 cold/warm ölçüm henüz bekliyor. Teşhiste LCP adayı eski sayfada logo, düzeltilmiş sayfada ürün başlığı: bunu ürün görselinin görünme süresi olarak yorumlamayın.
- Kalan: WebP/AVIF mevcut medya türevlerini dönüştürme, görünmeyen tam galeri görselleri, gerçek Safari/ürün türü kabulü. Önce bu sürümün canlı CLS ve native galeri kontrollerini doğrula.

## 14 Ekim 2026 / 0.1.75 — 0.1.74 CLS regresyonu geri alma (dağıtım bekliyor)

- 0.1.74 [24 canlı performans ölçümünde](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38539801980) mobil ürün soğuk CLS'yi **0.231'den 0.462'ye yükseltti**; LCP 1.620s, galeri CSS geçici slayt gizleme hipotezi başarısız. Bu sürümün [deploy](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38539458112) başarılı olsa da **performans kabulü başarısız**. Ölçüm testindeki arama cleanup hataları giderildi, checkout-pro.css katalogda yüklenmiyor, tokens.css 0.1.74.
- 0.1.75'te yalnız 0.1.74'ün CLS regresyonuna neden olan slayt gizleme CSS kuralı ve bunu yanlış güvenle onaylayan dört görselli fixture geri alınıyor; 0.1.73'ün LCP/asset iyileştirmeleri kalır. Önceki 0.1.73 CLS 0.231 idi; **0.1.75 CLS değeri canlı ölçümle yeniden doğrulanmalı**. Hâlâ kabul hedefi ≤0.1 altında değil; sorunun gerçek tetikleyicisi belirlenmeden yeni CSS varsayımı yapılmamalı.
- Sıradaki: 0.1.75 test + deploy → canlı audit; derin yükleme/CLS teşhisi (Woo galerinin başlangıç CSS ve JS koşulları, kullanıcıya görünen özet alanı). Saha Safari ve gerçek ürün türü kabulü ayrı açık.

## 14 Ekim 2026 / 0.1.74 — CLS takip düzeltmesi (CI ve canlı onayı bekliyor)

- 0.1.73 üretimde, [Actions 38537660826](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38537660826) validate/deploy başarılı. [Canlı 24 ölçüm](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38537975758) product mobile cold LCP'yi 2.940→1.524s, home LCP'yi 2.472→2.240s gösterdi. Hero eager/high ve tokens.css 0.1.73 canlıda; CLS 0.231 kaldı. Detay: [performans raporu](docs/performance/2026-10-14.md).
- 0.1.73'ün min-height önlemi tek başına CLS'yi çözmedi. 0.1.74'te FlexSlider başlangıcından önce wrapper içinde yalnız ilk galeri slaytı yer kaplar; native flex-viewport kurulduğunda diğerleri yeniden görünür. Dört görselli tarayıcı regresyonu ve audit arama X seçici düzeltmesi eklendi.
- [PR #19](https://github.com/muhammetdkaya/codela-storefront/pull/19): Kod/test/doküman aşamasında; CI doğrulaması ve **0.1.74 canlı dağıtımı henüz doğrulanmadı**. Sıradaki: CI → merge → gerçek deploy → 24 cold/warm audit. Beklenen CLS ≤0.1; ulaşmazsa kaymanın başka tetikleyicisi için tekrar teşhis yapılmalı.
- Gerçek Safari, uzun kaydırma, dolu sepet ve Woo ürün türleri için saha kabulü ayrıca açık.

## 0.1.73 performans düzeltmesi — 14 Ekim 2026 (doğrulama/yayın devam ediyor)

- 14 Ekim [ilk ölçümü](docs/performance/2026-10-14.md) esas alındı: mobil ürün cold LCP 2.940s, CLS 0.231. Bu değerler **önceki sürüme** aittir, 0.1.73 için yeni sonuç uydurulmaz.
- 0.1.72 → 0.1.73: Woo ürün galerisinde yalnız öne çıkan görsel eager/high, diğer görseller native davranışta; FlexSlider kurulurken galeri/viewport yüksekliği ayrılıyor. Logonun srcset sizes bilgisi boyut oranına göre düzeltiliyor.
- Tüm tema CSS'leri style.css Version üzerinden aynı cache anahtarını kullanıyor. Codela checkout-pro stil handle'ı sadece katalog/ürün gibi checkout/hesap dışı sayfalarda dequeue edilir; Woo veya sepet/ödeme JS'i değişmedi.
- Tarayıcıda FlexSlider başlangıç kaymasını doğrulayan test ve CI'dan sonra canlı read-only performans audit çalıştıran otomasyon eklendi. İlk PR CI sonucu incelenmeli, ölçümler canlı dağıtım **sonrasında** tekrar alınmalı.
- Kaynak: [PR #18](https://github.com/muhammetdkaya/codela-storefront/pull/18). Sonraki iş: validation başarısını, gerçekten gerçekleşen dağıtımı ve live audit LCP/CLS/hero/CSS URL değerlerini kontrol edip raporlamak. Gerçek mobil Safari ve Woo ödeme/çeşitli ürün tipi kabulü ayrı açık.


## Hız önceliği — 14 Ekim 2026

Kullanıcı yeni özellik/tasarım öncesinde hız testi istedi. Canlı tema değiştirilmeden 24 cold/warm sayfa ölçümü ve üç hedefli mobil teşhis tamamlandı. [Rapor](docs/performance/2026-10-14.md), [ham sonuçlar](docs/performance/2026-10-14-results.json). Mobil cold medyan LCP: ana sayfa 2.472s, ürün 2.940s; ürün CLS 0.231. İlk ürün görseli lazy, ürün özeti ilk yüklemede kayıyor. Popup ilk tepki yaklaşık 34–59ms medyan; ağır JS kilitlenmesi gözlenmedi. Ortak tokens.css hâlâ 0.1.71 URL'siyle ve bir haftalık cache ile servis ediliyor. Sıradaki iş: hero yükleme önceliği + galeri başlangıç geometrisi; ardından koşullu CSS ve tek asset sürüm kaynağı. F6 kapatılmadı; fiziksel Safari/GPU ve gerçek kullanıcı ölçümü hâlâ açık. Bu turda optimizasyon/canlı yayın yapılmadı, tema 0.1.72.

## Son doğrulanmış devam noktası — 14 Ekim 2026 / 0.1.72

- Tema 0.1.71 → 0.1.72: açık zeminde kaybolan ortak cam yüzeyin ayrımı tek dış gölgeyle artırıldı (0 3px 12px / %10). İç üst ışık kaldırıldı; ikinci dolgu, iç çerçeve veya yeni katman eklenmedi. Cam brightness 1.5 → 1.42; 28% tint, blur ve saydam kenar korunur.
- Header, alt menü ve satın alma ortak token değişikliğini tüketir. Ölçüler, etkileşimler ve koyu birincil buton değişmedi.
- Doğrulama: PHP/JS ve 23 paket testi, ortak UI, gezinme, ürün, ödeme ve hesap tarayıcı kontrolleri CI'da başarılı. İlk çalışmadaki eski 0.1.71 test beklentileri 0.1.72'ye güncellendi. Fiziksel mobil görsel kabul henüz yapılmadı.
- Yayın: [kaynak e8f2415](https://github.com/muhammetdkaya/codela-storefront/commit/e8f24154dfe7cf7985ddfa37436b2ade28635dd7); [Actions 38514144873](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38514144873) validate=success, deploy=success. Gerçek Deploy Storefront only adımı ve deploy.py 'Storefront deployed; checks passed.' logu doğrulandı (14 Ekim 2026 05:00 UTC).
- Kalan/sıradaki: fiziksel mobil açık zemin üzerinde tek yüzey görünümünü kontrol et. Önceki safe-area, gerçek Woo ürün türleri, F3/F4/F5/F6 kabulleri açık; slider duraklatıldı.

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

