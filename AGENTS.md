
## Storefront 0.1.33 — compact dock and menu motion (11 October 2026)

- Dock surface reduced by 6px, with 48px tab targets (above the 44px minimum); icon and label sizes unchanged. Shared menu glyph is a clean two-line 1.8px stroke.
- Menu opens with a 220ms surface fade and 260ms vertical content reveal; closes with a 180ms fade/lift before restoring scroll and focus. The dialog is never transformed. Reopening cancels pending closure; reduced-motion closes immediately. Search/cart behavior is unchanged.
- Validation and deployment pending. Next: confirm CI/FTPS release, then physical-device acceptance of compact dock and menu open/close.

## Storefront 0.1.32 — fixed light header (11 October 2026)

- User request: home product hero reaches the top behind a fixed header; logo is vertically centered; logo/menu/X use light surfaces. This supersedes the 0.1.31 dark surface decision.
- Shared glass tokens now provide light translucent surfaces and dark controls. Custom logo colors are preserved; block image and centered flex link remove baseline misalignment. Header stays fixed during scrolling; its transparent empty area does not block content interaction.
- Home hero has no header spacer; text-led pages retain 76px/68px clearance. Existing overlay controller synchronizes fixed header position with visible WordPress toolbar height. Dock and plugin-owned account remain unchanged.
- Validation/deployment pending. Next: verify CI and independent deployment, then physical mobile acceptance of hero, logo alignment and fixed header.

## 0.1.27 — Search and cart controllers

The main `assets/storefront.js` module is now the single owner of dialog
routing, WordPress Interactivity actions, modal focus, floating navigation,
scroll position and panel transitions. Independent feature controllers are
instantiated once with explicit dependencies (query selector, config, labels,
active view, dialog):

- `assets/scripts/search-controller.js`: input/debounce/clear, stale-result
  invalidation via request sequence, abort, skeleton, endpoint data, empty/error
  messages. Public API: `bind()`, `cancel()`, `start()`, `retry()`.
- `assets/scripts/cart-controller.js`: Store API nonce handling, GET/POST,
  quantity and remove mutations, retry, active footer, subtotal and cart badges,
  external cart invalidation events. Public API: `bind()`, `getData()`,
  `refresh()`, `change()`, `invalidate()`.
- `assets/scripts/format.js`: the same shared escaping, safe URL, decoding and
  currency formatting used by both feature controllers.

Every controller is created once. No duplicate dialog, dock or event listener
is added. Pending searches are aborted when leaving search; repeated cart GET
requests coalesce; nonce refresh and the original Store API integration remain
unchanged. The browser fixture runs the actual module sources and the existing
end-to-end search/cart/nav checks. The signed-in account UI remains plugin-owned.

Platform-neutral identifiers are mandatory. Keep the modal/dock ownership
unified while considering future extraction of the overlay controller; never
create parallel stores or second navigation listeners.


## Storefront 0.1.26 — shared JavaScript format module

- The reusable HTML escape, HTML decode, URL safety and currency formatting functions are extracted from the storefront main module into `assets/scripts/format.js`. The main ES module imports their named exports. Function behavior and Store API search/cart logic are deliberately unchanged.
- Relative module import is browser-native; WordPress registers the entry module as before and packages the referenced local file. The browser integration fixture inlines the actual helper module when injecting a test-only WordPress API stub; it does not maintain a second copy.
- `tests/format.cjs` asserts escaping, protocol rejection and currency formatting. PHP/theme/package tests and JavaScript syntax checks cover the new dependency.
- Source naming is intentionally device/vendor/OS-neutral. Continue extracting modal/search/cart controllers in later guarded versions; maintain a single navigation state and preserve registered WordPress action semantics.
- Validation/deployment must be verified after this source release; test automation is not physical-device acceptance.


## Storefront 0.1.25 — overlay stylesheet + neutral source naming + private visual references

- The popup/search-toolbar/results styles were extracted from `assets/storefront.css` into `assets/styles/overlay.css`. The production stylesheet order is tokens → layout → overlay → navigation → components → conditional account, preserving the existing semantic CSS and interactive behavior.
- Source code comments, fixture assertions and documentation use device-independent names: touch gestures, delayed native clicks, overlay surfaces, safe-area and scrolling. Never use a device/operating-system/vendor name to identify a component or animation.
- The non-public `tests/ui-kit-preview.cjs` renders actual PHP component examples and header markup with the real CSS into visual screenshots for two viewport widths. `qa/storefront-ui-kit-390.png` and `qa/storefront-ui-kit-1280.png` are uploaded only as temporary CI artifacts, not served by the theme or included in its package.
- Existing browser/navigation/account regressions are updated for the new stylesheet and the 0.1.25 version. Continue modularizing feature controllers only after behavior-equivalence tests; do not split the dock controller without guarding the single node/state lifecycle. Plugin-owned authenticated account markup remains excluded.
- Source commit is not proof of live deployment. After CI, check both validate and standalone deploy success; real mobile device checks remain separate.

# ACTIVE: Codela Storefront UI Kit architecture (from 0.1.22)

A general semantic Button (primary/secondary/quiet; disabled/loading; real links and form actions) and IconButton are the single sources for all new theme controls.\n\nAll new theme controls MUST reuse the primitives documented in
[`docs/design-system.md`](docs/design-system.md). Do not copy Header icon,
popup X, search clear, checkout/primary action or tap animation CSS into
individual pages. The shared files are
`inc/ui.php`, `assets/styles/tokens.css`, `assets/styles/components.css`;
specialized navigation/search/cart behavior remains feature-owned until
independently tested modules replace it. Source CSS import order is
tokens → storefront layout → navigation → components → account (conditional). Use `sf-ui-*` namespace and
semantic HTML. Preserve the latest user-approved mobile Header and dock
appearance, gestures, collapsed handle and accessibility.

STRICT BOUNDARY: signed-in Codela account/orders/shipping UI is owned by
the plugin and must NEVER receive this theme's shared account/card/nav
styling. Guest sign-in presentation is theme-owned. Existing Codela theme
bridge supports design variables; do not create an independent competing
settings panel.

For all substantial UI changes: update source + shared contract tests +
design-system documentation; run GitHub Actions validate AND deploy,
and do not claim real iPhone acceptance from a desktop browser test.

# Codela — çalışma ve devamlılık kuralları

Bu dosya depo genelinde çalışan asistanlar içindir. Kullanıcının güncel talimatları önceliklidir.

## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.21

- Tema 0.1.20 → 0.1.21: tam sayfa gezinmesinde kapsülün önce solda oluşup aktif sekmeye kayması düzeltildi. Header PHP çıktısı `has-selection` ve doğru `--sf-dock-index` değerini ilk HTML'de verir; Hesabım index 3, Ana Sayfa index 0. JS başlangıcı aynı konumu korur, kullanıcı sekme değiştirdiğinde mevcut animasyon çalışır.
- Doğrulama: render PHP lint, 14 Python testi ve gerçek PHP çıktılı Chromium navigation geçti. Ana Sayfa/Hesabım yeni belge yüklemesinde JS öncesi doğru konum + görünürlük ve JS sonrası transform geçişi olmaması sınandı. Önceki touchend/cancel/scrub/panel testleri geçti. Gerçek iPhone Safari elle test edilmedi.
- Yayın: kaynak `fd3b57ec608ea877e2299b3985369506aa9af929`, [Actions 38139646274](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38139646274) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: iPhone'da Hesabım ve Ana Sayfa tam sayfa geçişlerinde soldan gelişin olmadığını kontrol et.

## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.20

- Tema 0.1.19 → 0.1.20: touchend/pointerup sırasında kapsülün eski aktif sekmeye dönüp click ile tekrar hedefe kayması düzeltildi. Geçerli tap/scrub bırakışında sadece basılı görünüm temizlenir; hedef kapsül native click veya sayfa geçişine kadar korunur. İptal/dışarı bırakma eski aktif sekmeyi geri getirir.
- Doğrulama: JS syntax, Node dock gesture, 14 Python testi ve gerçek PHP çıktılı Chromium navigation geçti. Regresyon: Ana Sayfa → Sepet (sağ), Sepet → Ara (sol); touchend sonrası click 100ms geciktirilince hedef indeks korunur, panel açıldığında aynı hedef kalır. Mevcut cancel/hold/scrub/safe-area/reduced-motion testleri geçti. Gerçek iPhone Safari elle test edilmedi.
- Yayın: kaynak `581e70edb0eccd541e6a55f12181181758ea57bf`, [Actions 38138481833](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38138481833) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: iPhone'da sekmelerde dokun-bırak ve sayfa geçişinde geri sıçrama olmadığını kontrol et.

## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.19

- Tema 0.1.18 → 0.1.19. Kullanıcının App Store görseline göre alt bar hafif saydam açık yüzey, tek 20px backdrop blur + doygunluk, ince aydınlık kenar ve yumuşak gölge kullanır. Blur desteklenmiyorsa opak fallback; reduced-transparency tercihi de opak yüzeyi seçer. Blur/gölge animasyonu yok.
- Dokunmada seçili arka plan kapsülü %6 büyür; dokunulan sekme touchstart/pointerdown anında önizlenir, basılı tutma/sürükleme boyunca parmağı izler. İptalde doğru aktif sekme ve normal ölçek geri gelir. İkonlar 20 → 22px; ikon dokunma tepkisi hafif büyüme. 44px hedefler ve 0.1.18 gizleme/çizgi davranışı korunur.
- Doğrulama: 14 Python testi, Node arama/footer/dock gesture, JS syntax ve gerçek PHP çıktılı Chromium navigation geçti. Yeni gerçek DOM touch testi: kapsül büyümesi, gezinmeden anında önizleme, cancel sonrası ölçek/aktif sekme geri dönüşü. Mobil görüntü incelendi; iPhone Safari'de native hissin birebir eşitliği veya performans ölçümü yapılmadı.
- Yayın: kaynak `214ca8fc5b458984377a0c0e5dd995a2c0da4a85`, [Actions 38135019365](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38135019365) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: gerçek iPhone'da ürün görseli/metin üstünde barın okunurluğu, dokunma ve sürükleme hissini kontrol et.

## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.18

- Tema 0.1.17 → 0.1.18: gizlenince kalan çizgi 12px aşağı taşındı; sabit 44px dokunma hedefi ekran içinde kaldı.
- Barın aşağı kayıp küçülmesi / yukarı çıkıp büyümesi 380ms → 480ms. Daha yavaş başlangıçlı easing ve %48 son ölçek; opaklık son 100ms'de söner. Çizgi 320ms gecikmeyle belirir. Reduced-motion değişmez; yalnız transform/opacity hareket eder.
- Doğrulama: 14 Python paket/dağıtım testi ve gerçek PHP çıktılı Chromium nav regresyonu geçti (ara-kare küçülme/büyüme, safe-area, 44px çizgi hedefi, dokunma, paneller ve dört ekran genişliği). Gerçek iPhone Safari hissi elle doğrulanmadı.
- Yayın: kaynak `b84badc875b7da4af38efe65ccf942211e91a3a4`, [Actions 38133847797](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38133847797) validate (nav/account browser dahil) + bağımsız tema FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Eklenti değişmedi. Sıradaki iş: iPhone'da çizgi konumu ve belirginleşen geçişi kontrol et.

## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.17

- Güncel `c35e0ea` / 0.1.16 üzerine çalışıldı: tek satır footer, guest login ve Codela oturum içi Hesabım sahipliği/izolasyonu aynen korunur. Tema **0.1.16 → 0.1.17**, CSS/JS cache beraber yükseldi.
- Header şemasında `mobile_dock_enabled` checkbox, varsayılan açık. **Codela > Ayarlar > Tema > Header > Mobil alt menü** kapatılınca alt nav HTML'si üretilmez; boş alt padding/checkout clearance kalmaz. Kapalı mobil mod ve desktop aynı arama/sepet/hesap linklerini kullanır. Desktop'a mevcut yerel user-round ikonu ile Hesabım eklendi. Mobil kapalı mod desktop sırasını (menü/marka/ara-sepet-hesap) dar ekrana sığdırır; açık modda logo solda/menü sağda düzeni korunur. Ödeme ekranında dock hâlâ yoktur.
- Alt barın ikonları, yüzeyi ve seçili kapsülü tek `.sf-dock-surface` içinde beraber hareket eder. Sabit nav ve 44px çizgi hedefi korunur. Aşağı kaydırırken 380ms boyunca aşağı iner ve %58 ölçeğe küçülür; opaklık ancak son 100ms'de söner. Yukarıda/çizgiye dokununca büyüyerek geri gelir. Dokunma, scrub, aktif kapsül ve reduced-motion korunur.
- Ayar motorunda generic checkbox desteği için bağımsız Codela köprüsü `07418c938e2d099e330e6c03d332a826e3c3b67f`. Eklenti 1.1.1; WordPress.org yayını yok. Tema seçeneğinin tanımı hâlâ tema şemasındadır.
- Doğrulama: PHP lint, Node arama/dock/footer, 14 Python testi ve gerçek PHP çıktısı kullanan Chromium nav testi geçti. 320/390/700/1024px açık/kapalı header, arama/sepet, hesabım URL'si, varsayılan ayar, checkout, phantom padding ve görünür ara-kare küçülme/büyüme kontrol edildi. GitHub CI içinde güncel account/footer testleri de geçti; canlı Safari kabulü yapılmadı.
- Yayın: tema kaynak `5679b4a6ef9f24b1eb7fa0ac7d3fb9555c76dca8`, [Actions 38130928343](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38130928343) validate + FTPS deploy başarılı; log: `Storefront deployed; checks passed.` Köprü `07418c938e2d099e330e6c03d332a826e3c3b67f`, [Actions 38130707958](https://github.com/muhammetdkaya/codela/actions/runs/38130707958) validate + deploy başarılı: 983 dosya checksum ile doğrulandı, bootstrap geçişi ve public sağlık kontrolleri geçti. Free edition [38130707988](https://github.com/muhammetdkaya/codela/actions/runs/38130707988) başarılı. Sıradaki iş: canlı Header ayarını kapat/aç ve iPhone Safari'de bar küçülme/büyüme hissini kontrol et. Canlı müşterilerin ayarı bu çalışma sırasında kendiliğinden kapatılmadı.

## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.13

- Kullanıcının header, alt menü, hız ve geçiş kalitesini iyileştirme isteği uygulandı. Tema **0.1.12 → 0.1.13**; eklenti sürümü değişmez.
- Biten: gerçek PHP alt menü bağlantılarındaki eksik `data-dock-view` kimlikleri eklendi. Sürükleyip Ara/Sepet'e bırakmak artık tam ekran paneli açar; seçili kapsül doğru sekmeyi izler. Alan dışında bırakma iptal edilir, mouse/pen sürüklemesi capture ile izlenir; normal link tıklaması korunur.
- Alt menü: tek kayan kapsül, yalnız transform/opacity animasyonu; dokunma hedefleri yer değiştirmez. Kaydırma her karede bir kez işlenir, küçük hareketler birikir, bounce sınırlandırılır. Safe-area dahil gerçek gizlenme mesafesi ve ayrı sabit 44px erişilebilir çizgi hedefi; yalnız durum değişiminde DOM güncellenir.
- Header: mobil logo solda/menü sağda; 68px ortak yükseklik, 20px yan boşluk ve 44px kontrolle Menu/Search/Cart X hizası. Masaüstü ortalı logo korunur. Eski CSS geçiş yama blokları azaltıldı.
- **Güncel hareket kararı:** kullanıcının bu talebiyle içerik geçişi 160ms/8px, alt kapsül 220ms, gizlenme 240ms. Tam ekran dialog dönüştürülmez, ikon kökenli büyüme yoktur. Kapatma anında; hızlı geçiş önceki animasyonu iptal eder; reduced-motion hareketi kapatır. Önceki tamamen animasyonsuz içerik kararı bu kapsamda güncellenmiştir.
- Native dialog açılmadan önce görünür bölüm ve metin dışı autofocus hazırlanır; aramayı tekrar açarken geçici input odağı engellenir. Aktif sekmeye tekrar dokunmak ağ isteği başlatmaz. Sepete dönüşte mevcut toplam kaybolmaz; arka plandaki sepet mutasyonu mesajı başka panele sızmaz. Body kilidi/scroll/admin bar ve dock'un asıl DOM yeri geri yüklenir.
- Doğrulama: PHP lint, JS syntax, 12 Python paket/dağıtım testi, Node arama/dokunma testleri geçti. Yeni Chromium testi gerçek PHP çıktısı + tam JS ile 320/390/700/1024px, sekme tap/touch/hold/outside cancel, safe-area, yavaş ve modal scroll, focus/reopen, gecikmiş arama, hızlı geçiş, reduced-motion ve WordPress toolbar konumunu sınar. WP action bağlama ve API yanıtları test sınırında simüledir; gerçek WP/Woo entegrasyon kabulü değildir.
- **Yayın doğrulandı:** kaynak `fe5d8104a0b102bce5fd899bd9195a011e6f39a3`, gesture düzeltmesi `b43479da9d52e5e08f7dca34a8eb35534da295e0`; [Actions 38114065497](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38114065497) validate (browser dahil) ve deploy **success**. Bağımsız FTPS tema 0.1.13 dağıtımı tamamlandı. Gerçek iPhone/Safari ve gerçek ödeme akışı bu ortamda test edilmedi.
- Sıradaki iş: canlı iPhone'da sekmeler arası sürükleme, klavye/safe-area ve geçiş hissini kontrol et. Otomatik Chromium başarısını iPhone/Safari kabulü veya gerçek cihaz hız ölçümü olarak sunma.

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
- Menü/arama/sepet aynı native dialog içinde açılır. Güncel 0.1.13 kararı: dialog geometrisi sabit, içerik 160ms kısa geçiş; kapatma bekletmez. İkon kökenli büyüme uygulanmaz. Hareket azaltma tercihi, klavye, odak ve kaydırma konumu korunur.
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

## Son doğrulanmış devam noktası — 10 Ekim 2026

- Tema 0.1.1 kaynakları değişmeden ayrı depoya taşındı; eklenti 1.1.1.
- Bağımsız FTPS dağıtımı, ZIP/manifest ve geri alma hazırlandı.
- Altı yerel paket/dağıtım testi, CI PHP lint ve JS sözdizimi geçti.
- Kullanıcının FTP_PASSWORD, FTP_SERVER ve FTP_USERNAME secret adları eşleştirildi. Commit 4cbcddcbe3a209220dc2f85f9484f8110bafaa00, Actions 38051799079: validate başarılı; üç secret mevcut. Deploy connect (gaierror) ile DNS çözümlemesinde durdu; dosya aktarımı yapılmadı. FTP_SERVER değeri yalnız sunucu hostname'i olmalı; mevcut altyapı adresi server38.shared.spaceship.host.
- Header/Footer ayrı ayar alt menüleri henüz uygulanmadı; sonraki tasarım çalışmasında ilgili ayarları bu menülerde ekle.
- Sıradaki iş: secret eklendikten sonra bağımsız dağıtımı doğrula; kurulu 0.1.1, admin barlı üç panel ve ortak köşe ayarlarını gerçek tarayıcıda kontrol et.

- Eklenti köprü doğrulaması: 564761563339c268fc3a1a8e07a0fbb51fc05969, Actions 38051382397 validate başarılı (manifest doğrulaması, offline yedek, PHP lint ve mevcut eklenti kontrolleri). Eklenti dağıtımı kuyruğa alındı; tamamlandı diye kaydedilmedi.

- 10 Ekim bağlantı farkı: codela-site başarılı Actions 37810396274 workflow'u FTP_SERVER secret'ını kullanmadan server38.shared.spaceship.host adresine bağlanıyor. Storefront workflow da aynı kanıtlanmış adrese sabitlendi; FTP_USERNAME ve FTP_PASSWORD secret'lardan okunur. Önceki connect (gaierror) FTP_SERVER değerinin DNS çözümlemesinde oluştu. Yeni dağıtım sonucu bekleniyor; mevcut FTP_SERVER secret'ının silinmesi gerekmez.

- **Güncel yayın sonucu:** tema 0.1.1 bağımsız dağıtımı başarılı. Commit 4478aef485605e8db5166c7054bddf3a482eaa89, Actions 38052248910: validate ve deploy başarılı; FTP kökünün doğrudan Storefront olması kimlikle tanındı, public mapping/kaynak/mağaza sağlık kontrolleri geçti. Sunucu codela-site ile aynı sabit server38.shared.spaceship.host; FTP_USERNAME ve FTP_PASSWORD secret'lardan. Gerçek kullanıcı admin bar/panel görsel testi ayrıca yapılmalı. Sıradaki iş: canlı 0.1.1 panel kontrolü ve gerekli Header/Footer ayar alt menüleri.


## Sonraki sürüm çalışması — 10 Ekim 2026 (0.1.2 kaynak)

- Tema Header, Homepage ve Footer seçeneklerini `config/settings.json` dosyasında kendisi tanımlar. Genel ayar formu ve iç içe alt menüler Codela eklentisinde otomatik oluşturulur; alan tanımları Codela eklentisinde tekrar edilmez.
- Eklenti değişikliği `c5a383df1c8cf786c583e73daf5c93ad95654e34`; tema sürümünün 0.1.1 → 0.1.2 kaynak değişikliği bu depodadır. Mevcut ayarlar korunur; Footer notu isteğe bağlıdır.
- Bu kayıt canlı yayın veya gerçek cihaz testi tamamlandı anlamına gelmez. İlk iş: plugin + tema Actions sonuçlarını doğrula; kurulu temayı 0.1.2'ye güncelle; alt menü ve üç tam ekran paneli gerçek tarayıcıda kontrol et. Sonra sayfa tasarımına geç.


## Doğrulanmış 0.1.2 dağıtım sonucu — 10 Ekim 2026
- [Storefront Actions 38078468464](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38078468464): 0.1.2 tema dağıtımı başarılı; commit `f8e6200`.
- [Codela Actions 38078271353](https://github.com/muhammetdkaya/codela/actions/runs/38078271353): tema ayar köprüsü eklenti dağıtımı başarılı; `c5a383d`. Eklenti sürümü 1.1.1.
- Yeni settings şema/kaydetme regresyon testleri [Actions 38078903175](https://github.com/muhammetdkaya/codela/actions/runs/38078903175) ile geçti. Tema ana menüsünün açılır kalması `codela@3cded41` commit'inde düzeltildi; bu küçük düzeltmenin CI/deploy doğrulaması bekleniyor.
- Sıradaki iş CI/deploy doğrulaması, canlı kurulum/etkinlik kontrolü ve gerçek yönetim ekranı+mobil testleri. Belgelendirilmiş otomatik başarıları gerçek tarayıcı/cihaz kabul testiyle karıştırma.

## 0.1.3 sıradaki doğrulama — 10 Ekim 2026
- Kullanıcı iPhone ekranlarında Arama inputunun ve Sepet/Menü X butonunun etrafında kalın siyah çerçeve gördü. 0.1.3 kaynak düzeltmesi: panel kontrollerinde tarayıcı/tema kenarlıkları ve otomatik odaktaki siyah halka temizlendi; manuel klavye Tab odak göstergesi korunuyor. Arama formunun ince gri çizgisi bilerek korundu.
- Tema 0.1.2 → 0.1.3, JS/CSS önbellek sürümü beraber yükseltildi. Değişiklik `assets/storefront.css`, `assets/storefront.js`, `functions.php`, `style.css` ve testlerde; AGENTS ve teknik dokümana da kaydedildi.
- Commit sonrası CI, bağımsız FTPS ve gerçek iPhone/Safari kontrolleri ayrıca doğrulanacak. Sonraki iş bu üç panelin çerçevesiz açılışını ve klavye erişilebilirliğini canlı ortamda test etmek.


## 0.1.3 doğrulanmış dağıtım — 10 Ekim 2026
- Tema 0.1.2 → 0.1.3 kaynak commit'i: [2475210](https://github.com/muhammetdkaya/codela-storefront/commit/24752104aca41fe8e70cfae14537add464bd1d73).
- [GitHub Actions 38080286355](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38080286355) `validate` ve `deploy` başarıyla tamamlandı. CSS/JS sürümleri 0.1.3; yeni ZIP/manifest dağıtımı otomatik yapıldı.
- Gerçek iPhone/Safari'de açılan Search/Cart/Menu görsel testi **henüz tekrar yapılmadı**. Sonraki somut adım: telefonda üç paneli tekrar açıp ilk odakta siyah çerçeve kalmadığını teyit etmek. Klavye Tab odak göstergesinin korunmasını da kontrol et.
- Tema kaynağı bağımsız depoda kalır; Codela eklentisinin tamamının tekrar yayımlanmasına gerek yoktur.

## Storefront 0.1.4 kaynak güncellemesi — 11 Ekim 2026

- Arama ve sepet tam ekran panellerinde gereksiz tekrarlar temizlendi. Arama panelindeki görünür üst başlık gizlendi; diyalogun erişilebilir etiketi korundu. Arama alanının placeholder'ı yalnızca mevcut yerelleştirmedeki **Ürün ara** ("Search products") oldu. İlk açılışta ve 1 karakterde gösterilen "En az iki karakter yazın" mesajı kaldırıldı; 2 karakter eşiği ve gerçek ürün araması korunuyor.
- Sepette zaten sepet içinde görüntülenen içeriğin altında tekrar eden **Sepeti görüntüle** bağlantısı kaldırıldı. Ara toplam, ödeme bağlantısı ve kargo bilgilendirmesi korunuyor. Menü paneli değişmedi.
- Sürüm 0.1.3 → **0.1.4**; tema JS/CSS önbellek sürümleri beraber güncellendi. Sadece `codela-storefront` kaynağı değişir; `codela` eklentisi ve tanıtım sitesi bu çalışma kapsamında değişmez.
- Doğrulama: paket testlerine başlık/placeholder/boş durum/sepet linki regresyonu eklendi. **CI ve FTPS dağıtım sonuçları henüz kontrol edilmedi; gerçek iPhone/Safari görsel kabul testi yapılmadı.**
- İlk sıradaki iş: 0.1.4 Actions validate/deploy sonucunu doğrula; telefonda arama ve sepeti açarak tekrarların gitmesini ve ödeme/aramanın çalışmasını kontrol et. Önceki 0.1.3 odak çerçevesi hatasının tekrarlamadığını da kontrol et.


## Storefront 0.1.4 — doğrulanmış bağımsız yayın (11 Ekim 2026)
- Kaynak commit: [b7445b8](https://github.com/muhammetdkaya/codela-storefront/commit/b7445b8a0e1d39b78f9e1d1be9dc95d51ccd31c9); tema sürümü 0.1.3 → 0.1.4. 8 kaynak/belge/test dosyası güncellendi.
- [Actions 38086088464](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38086088464): **validate ve deploy başarılı**. Kaynak/tema ZIP/manifest bağımsız tema hattıyla codela.dev'e dağıtıldı. Codela eklenti sürümü değişmedi; WordPress.org sürüm yayını yapılmadı.
- Biten: Arama kutusu görünür placeholder'ı "Ürün ara"; görsel tekrarlayan arama başlığı gizli ancak ekran okuyucu başlığı var; başlangıç iki karakter uyarısı kaldırıldı (minimum arama 2 karakter olmaya devam eder); sepet panelindeki "Sepeti görüntüle" bağlantısı kaldırıldı. Testler CI'da başarılı.
- Kalan: Kullanıcı iPhone/Safari'de canlı görsel kontrol ve arama/ödeme tıklama testleri; klavyeyle erişim; WordPress etkin tema bilgisi ayrıca doğrulanmadı.
- Sıradaki somut iş: Canlı iPhone'da arama panelini açıp "Ürün ara" yazısını, ilk durumun boş olmasını, iki harfle sonuç gelmesini; sepet panelinde "Sepeti görüntüle" yerine doğrudan ödemeyi; menü/arama/sepet X çerçevesinin temiz kaldığını doğrula.

## Son doğrulanmış devam noktası — 11 Ekim 2026 / Storefront 0.1.5 kaynağı
- **Yeni tasarım kararı:** Header: Menü sola, logo tam ortaya, arama ve sepet sağa yan yana. Eski logo-solda/menü-sağda kararı geçersiz. Üç panel hâlâ tam ekran ancak eski yukarıdan kayma animasyonu yerine doğrudan tıklanan ikondan büyüyen/kapanırken ikona dönen `clip-path:inset(... round ...)` geçişi kullanır. Native dialog, arka plan scroll kilidi, admin bar ve klavye odak yönetimi korunur; eski kaydırma desteksiz tarayıcı yedeğidir.
- Arama inputu üstte 50px kompakt çerçevede, 16px yazı ve "Ürün ara" metniyle. Dinamik sonuçlar altında, başlık tekrarı olmadan gösterilir; arama eşik/Store API etkilenmez.
- Storefront 0.1.4 → 0.1.5; HTML, JS, CSS, sürüm/asset versiyonu, paket ve yeni JS davranış testi. Uygulama kaynak commit'i ve Actions doğrulaması tamamlandıktan sonra aşağıya kayıt eklenecek; bu hazırlık canlı dağıtım veya gerçek Safari görsel testi sayılmaz.
- Sıradaki iş: CI + bağımsız deploy sonucu; iPhone'da sol menü, ortalanmış logo, sağ arama/sepet, ikon kökenli açılış/kapanış ve arama ölçüleri, admin bar ile scroll/odak/klavye testleri. Durum kayıtlarını sürümden sonra kesinleştir.


## Storefront 0.1.5 — doğrulanmış dağıtım (11 Ekim 2026)

- Kaynak commit: [f166db8](https://github.com/muhammetdkaya/codela-storefront/commit/f166db8f49e9965ca41f29831948f6b7e704226e). Tema 0.1.4 → 0.1.5; Codela eklenti sürümü ve WordPress.org yayını değişmedi.
- [Actions 38094292898](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38094292898): **validate + deploy başarılı**. PHP lint, JS sözdizimi, Python tema paket/doğrulama ve JS panel köken geometrisi testleri geçti. Bağımsız tema dağıtımı yapıldı.
- Header menü-solda / logo-ortada / arama+sepet-sağda; ikon çıkış noktasından büyüyen tam ekran paneller ve üstte 50px kompakt arama alanı kaynak olarak hazır ve canlıya aktarıldı.
- **Henüz yapılmayanlar:** gerçek iPhone/Safari görsel kabul testi, farklı ekranlarda aktif tema/kurulu sürüm denetimi, admin bar görünürken animasyonun görsel doğrulaması ve klavye/odak navigasyonu manuel testi. Otomatik test ve FTPS dağıtım başarısı bunların yerine geçmez.
- **Sıradaki somut iş:** kullanıcı iPhone'da üç paneli açıp animasyon yönünü, logo hizasını, arama kutusunun ölçüsünü ve panelin açılıp kapanmasını incelesin; gerçek cihazda görülen sorunları bağımsız tema deposunda düzelt. Sayfa ve Footer tasarımına bu kabulden sonra geç.

## GÜNCEL karar — Storefront 0.1.6 — 11 Ekim 2026

- Kullanıcının 0.1.5 ikon kökenli büyüme/kapanma animasyonu kararı **geri alındı**: animasyonu şimdilik kaldır. JS içindeki panel kökeni hesaplayıcısı ve gecikmeli kapanış kaldırıldı. Menü, sepet ve arama dialog olarak **anında** açılıp kapanır; arka plan kaydırma kilidi, WordPress admin bar hizalaması ve odak geri yüklemesi devam eder. Animasyonu kullanıcı istemedikçe tekrar ekleme.
- Son görsel referans koyu renkli iPhone arama başlığıdır: solda büyüteç, koyu ve yuvarlatılmış arama alanı, placeholder yalnız **"Ara"**, sağda ayrı yuvarlak X (İptal butonu kullanılmaz). Bu karar eski "Ürün ara" placeholder tercihini bu ekran için günceller. Arama paneli koyu #0b0d12 zeminlidir; diğer menü/sepet panellerinin mevcut açık renk tasarımı aynı kalır. Header menü-solda/logo-ortada/arama+sepet-sağda korunur.
- Kullanıcı yazdığında en az 2 karakterden sonra kendi arama terimi bir öneri satırında görünür; WooCommerce/Codela gerçek ürün sonuçları yüklenirken **animasyonsuz** altı iskelet satırı çıkar. Yanıt gelince iskelet kaldırılır; hayali ürün/sonuç gösterme. Input içi küçük temizleme X'i yalnız yazı varken görünür. Arama kutusundaki X sağda paneli kapatır.
- Temanın 0.1.5 → 0.1.6 kaynak sürümü, CSS/JS cache versiyonu ve Türkçe çeviri değişti. `tests/panel-origin.cjs` yerine `tests/search-panel.cjs` çalıştırılır. Tamamlandı/sunucuya yüklendi bilgisini yalnız yeni CI/deploy sonucu geldikten sonra kaydet.
- **Sıradaki iş:** GitHub Actions PHP/JS, paket, yeni arama testi ve FTPS dağıtım sonuçlarını kontrol et. iPhone/Safari'de son görsel gibi üst barı, koyu alanı, "Ara" yazısını, tek X'i ve iki karakterden sonra arama sonuçlarını; animasyonun kalktığını teyit et. En önemlisi eski menü/sepet fonksiyonları ve admin bar kontrolü.


## Storefront 0.1.6 bağımsız dağıtım sonucu — 11 Ekim 2026

- Kaynak commit: [66c6d40](https://github.com/muhammetdkaya/codela-storefront/commit/66c6d40ed962ee267dd4f497ed04f9d73ce4ad43). Tema sürümü 0.1.6, CSS/JS cache anahtarları da 0.1.6.
- [GitHub Actions 38094834292](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38094834292): **validate ve deploy başarılı**. Python paket/doğrulama, PHP lint, JS sözdizimi ve `tests/search-panel.cjs` arama durumu testi geçti; bağımsız FTPS tema dağıtımı tamamlandı. Codela eklentisi yeniden yayımlanmadı.
- Kullanıcının son arama ekranı görseli temel alındı: koyu zemin, sol büyüteç, placeholder "Ara", sağda yuvarlak X, dinamik öneri, gerçek sonuçlar ve istek sürerken statik iskelet satırlar. Üç panelde geçiş animasyonları kaldırıldı. Menu/logo/arama/sepet header sıralaması korunur.
- **Doğrulanması gerekenler:** Canlı WordPress'te etkin tema ve gerçek iPhone Safari görünümü, klavye/odak, admin toolbar ve arama/sepet API etkileşimleri manuel olarak test edilmedi. FTPS deploy ve CI başarısı gerçek tarayıcıda kabul testi değildir.
- **Sıradaki ilk iş:** iPhone'da arama ekranını açarak son referansa uygun görünümü, X kapamayı, sonuçların gelmesini ve animasyonun olmadığını test et. Sonra menü/sepeti kontrol et ve görsel sorun varsa düzelt.

## GÜNCEL tasarım kararı — Storefront 0.1.7, 11 Ekim 2026

- Kullanıcı 0.1.6 koyu arama panelini **beyaza** çevirmeyi ve Menü, Arama, Sepet panelinin **aynı tasarım dili, ölçüler ve boşluklarla** çalışmasını istedi. Bu karar eski "koyu arama paneli" talimatının yerine geçer.
- Tüm modal yüzeyler beyaz (#ffffff), metin koyu. Her panelin üst araç çubuğu 68px asgari yüksekliğe, aynı yatay boşluk değişkenine, ince açık gri ayırıcıya ve 44×44px çerçevesiz/açık gri dairesel X düğmesine sahiptir. Görünür X SVG 19px; iPhone'da tıklanabilir alan 44px kalır.
- Arama formu üstte tek satır, açık gri (#f3f3f3), 46px yüksekliğinde, yumuşak 15px köşeli; sol büyüteç 20px; yazı 16px, placeholder yine "Ara". Input içindeki küçük temizleme X'i ve arama önerisi korunur. Arama sonuçları/iskelet satırlar siyah yazı/beyaz zemine geçirildi.
- Açılış/kapanış animasyonu **kapalı kalır**. Menü ve sepet işleyişi ile header sıralaması (menü solda, logo ortada, arama+sepet sağda) değişmedi. Eklenti deposuna dokunulmaz.
- Tema kaynak, CSS ve JS asset versiyonu 0.1.6 → 0.1.7. `tests/package.py` ve `tests/search-panel.cjs` beyaz palette, ortak boyut tokenlarına ve küçük X'e göre güncellendi.
- Yeni kaynak commit'i sonrası CI/FTPS sonucu doğrulanmadan canlı yayımlandı denmez. Sonraki iş: dağıtımı doğrula, sonra iPhone/Safari'de üç panelin X ölçüsü ve üst satır hizasını, arama odak/temizle/sonuçları ve eski admin bar davranışını kontrol et.


## Storefront 0.1.8 — gereksiz iki tekrar kaldırıldı (11 Ekim 2026)

- **Boş sepet:** "Alışverişe devam et" düğmesi kaldırıldı. Boş sepet mesajı kalır, dolu sepetin ürün satırları, toplam ve ödeme işlevleri değişmez.
- **Arama:** Giriş alanına yazılan sorgunun hemen altında aynen tekrarlandığı `sf-search-suggestion` satırı (ikon+kelime) HTML/JS/CSS'ten tamamen çıkarıldı. Input içindeki temizleme X'i, 2+ karakter sonrası gerçek sonuçlar, sorgu sürerken statik iskelet satırlar korunur.
- Beyaz Menu/Search/Cart tasarım ölçüleri ve animasyonsuz açılış/kapanış değişmez. Tema, CSS ve JS asset sürümü 0.1.7 → 0.1.8; Codela eklentisi değiştirilmez.
- Python paket/testler ve Node arama kontrol testi "öneri satırı ve boş-sepet CTA yok" regresyonlarını içerir.
- **CI/deploy henüz doğrulanmadan canlı yayımlandı kabul edilmez.** Sıradaki iş: Actions doğrula, iPhone'da arama/boş sepeti incele ve arama API / dolu sepet ödeme akışını kontrol et.


## Storefront 0.1.8 — doğrulanmış yayın sonucu (11 Ekim 2026)

- Kaynak commit: [a47d3f9](https://github.com/muhammetdkaya/codela-storefront/commit/a47d3f91668d4028b523873f3d7359412b2f2bdf).
- [Actions 38095656942](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38095656942): **validate + deploy başarılı**. Arama tekrarı ve boş sepet CTA regresyonları geçti; FTP üzerinden bağımsız tema dağıtımı tamamlandı. Eklenti WordPress.org sürümü değiştirilmedi.
- **Geçerli UI:** boş sepet sadece boş mesajını gösterir; arama yazarken aynı sorgu altında yeniden görünmez. Gerçek sonuçlar, arama temizle kontrolü, 2 karakter eşiği ve yükleme iskeleti korunur; ortak beyaz tema ve animasyonsuz paneller değişmedi.
- **Kalan kabul testi:** Kullanıcının iPhone/Safari'de boş sepet ve arama sonucunu görsel olarak tekrar doğrulaması; manuel canlı API testi yapılmadı.


## GEÇERLİ MOBİL NAVİGASYON KARARI — Storefront 0.1.9, 11 Ekim 2026

- Kullanıcı mobil Header'daki Menü düğmesini **sağa** istedi; menü simgesinin dokunma alanı menü/sepet panelindeki **X kapatma düğmesiyle aynı konumda** olmalı. Mobil üstte menü sağda, logo optik/gerçek merkezde; header'ın sağındaki arama ve sepet ikonları mobilde gizli. Masaüstündeki mevcut menü-solda/logo-ortada/arama+sepet-sağda düzeni korunur.
- Mobilde (<=700px) yüzen koyu dört sekmeli alt navigasyon: **Ana Sayfa / Ara / Sepet / Hesabım**. Yerleşim ekranda yatay merkezde, alt safe-area'nın 12px üstünde, 4 eşit genişlikte sekme; aktif sayfa daha açık kapsül. Arama ve Sepet alt düğmeleri eskiden çalışan WP Interactivity dialog açma işlemlerini kullanır, ikinci bir arama/sepet sistemi kurmaz. Erişilebilir etiketler ve 44px+ dokunma alanı vardır.
- Header/Menu X geometrisi: mobil Header yan boşlukları 20px, sağ Menü 44px; panellerde `--sf-overlay-gutter:20px` ve `--sf-overlay-control-size:44px`. Böylece ikon merkezleri aynı x konumundadır.
- Sepet rozeti iki yerde görünürse tüm `.sf-badge` elemanları ve `data-panel="cart"` etiketleri birlikte güncellenir. `is_front_page()` ve `is_account_page()` mevcut sayfayı belirtir.
- WooCommerce `is_checkout()` sırasında alt nav hiç oluşturulmaz; ürün/alt içerik yüzen nav arkasına düşmesin diye mobil body altına safe-area'lı boşluk ayrılır. Masaüstünde nav CSS ile kapalıdır. Bütün ekran panel animasyonları hâlâ **kapalı**.
- Yeni Lucide `house.svg` ve `user-round.svg` ikonları tema içindeki açık lisanslı ikon klasörüne eklenmiştir. Tema/JS/CSS kaynak sürümü 0.1.8 → 0.1.9. `tests/package.py` mobil hiyerarşi, yerleşim, rozeti ve sayfa bağlamını denetler.
- Bu not kaynak sürümü için yazıldı: CI/FTPS sonucu görülmeden canlı yayınlandı sayma. Sıradaki iş: CI/deploy doğrulaması, iPhone Safari'de sağ Header Menü/X hizası, alt dört sekme, safe area, sepet rozeti, arama/sepet açılışı, ödeme gizleme ve masaüstünün değişmediği kontrolleri.


## Storefront 0.1.9 — CI ve bağımsız dağıtım doğrulandı (11 Ekim 2026)

- Uygulama commit'i [b81cb08](https://github.com/muhammetdkaya/codela-storefront/commit/b81cb08042b65a63f28d6d542c07ab703b1d0bfc).
- [GitHub Actions 38107590141](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38107590141): **validate ve deploy success**. PHP lint, JavaScript sözdizimi, Python tema/paket ve Node arama testleri geçti. Tema ZIP/manifest bağımsız tema FTP hattıyla yayımlandı. WordPress.org Codela eklenti yayınına dokunulmadı.
- Son geçerli mobil tasarım: Header Menü **sağda**, orta logo; X kapatma ile sağ kenardan aynı 20px boşluk ve 44px hedef. Arama ve Sepet Header'da mobil gizli, koyu yüzen 4 sekmeli alt menüde. Ana Sayfa/Ara/Sepet/Hesabım tabları, checkout ekranında gizleme; desktop önceki Header ile devam.
- **Gerçek iPhone/Safari manuel kabul testi henüz yapılmadı.** Menü-X hizası, sabit alt bar, ürün ayrıntısı, alt safe-area, sepet rozeti ve giriş/checkout yönlendirmeleri cihazda ayrıca gözden geçirilmeli.


## Storefront 0.1.10 — mobil logo sola, alt menü kısa ve açık (11 Ekim 2026)

- Kullanıcı onayıyla mobil Header'daki **logo sola hizalandı**. Menü sağda kaldı ve açılan panel X ile aynı sağ kenar/tıklama alanını (`20px` kenar boşluğu, `44px` kontrol) paylaşmaya devam ediyor. Masaüstü Header düzenine dokunulmadı.
- Koyu mobil yüzen alt bar önceki `76px` yüksekliğinden `62px` asgari yüksekliğe indirildi; sekme içi minimum yükseklik `66→54px`. Sekme içi boşluk `7→5px`, ikon `22→20px`, yazı `11→10px`. Dört sekme, safe-area ve ödeme ekranında gizlenme korunuyor.
- Alt bar **açık gri** (`#f5f5f6`), aktif sekme hafif koyu gri (`#e2e2e6`), ikon/yazı koyu (`#28282c`); gölge yumuşatıldı. Sepet rozetinin koyu zemini ve beyaz yazısı kontrastı korur.
- Mobil içerik alt boşluğu yeni kısa bara göre `105→90px` olarak ayarlandı. Önceki animasyonsuz panel ve arama/sepet işlevlerine dokunulmadı.
- Tema ve CSS/JS cache sürümü **0.1.10**. Otomatik testler hizalama, alt bar ölçüleri/palet ve sürümü doğrular.
- Bu kayıt kaynak değişikliği içindir. Yeni CI/FTP yayın sonucunu kontrol etmeden canlıda tamamlandı demeyin. Sonraki iş: Actions sonucu, iPhone'da logo solda/menü sağda, X hizası ve açık kompakt alt navigasyonu incelemek; gerçek cihaz kabulü halen gerekli.


## Storefront 0.1.11 — Alt navigasyon modal içinde aktif + iOS sürükleyerek seçim (11 Ekim 2026)

- **Yeni kesin istek:** Kullanıcı arama ve sepet tam ekran panellerindeyken alt dört sekmeli mobil navigasyon görünür ve tıklanabilir olmalı; arama ⇄ sepet geçişi X'e basmadan doğrudan aynı modal içinde yapılmalı. Diğer sayfalarda alt nav mevcut şekilde çalışır; checkout ekranında hâlâ yoktur.
- Önemli teknik gerekçe: `<dialog>.showModal()` dışındaki bütün düğmeleri inert (etkileşime kapalı) yapar. Bu nedenle `mountDock()` ile var olan `.sf-mobile-dock` node'u dialog açılmadan önce **dialog içine taşınır**. Kapanırken `restoreDock()` aynı node'u orijinal yerine (`dialog.before`) koyar. İkinci/duplicate nav üretilmez; WooCommerce badge ve mevcut WordPress Interactivity handler'ları aynı DOM elemanında kalır.
- Arama ve sepet arası mod değişiminde dialog kapanmaz: `open('search'|'cart')` içerik bölümünü değiştirir, `markDockActive` aktif kapsülü günceller. Aramadan ayrılırken eski gecikmiş sorgu iptal edilir; cart mutasyonu/Store API bozulmaz. Menü popup açılınca dock gizlenir; X kapatıldığında asıl sayfa sekmesi geri seçilir.
- iPhone benzeri görsel tepki sadece alt menü sekmelerinde: `pointerdown` anında `.is-pressed` + hafif küçülme, bırakınca normal durum; basılı tutunca (`220ms`) veya yatay 10px üzerinde hareket edince `.is-scrubbing` başlar, parmak altındaki `.is-preview` kapsül büyüyerek/tonlanarak seçimi gösterir. `pointerup` seçilen sekmeyi açar (Ara/Sepet aynı modal, Ana Sayfa/Hesabım navigasyon); basit tıklamada native `<a>` davranışı korunur. `pointercancel`, kaydırma yönü, contextmenu, çift click ve `prefers-reduced-motion` ele alınır.
- Search/Cart içerikleri yüzen alt nav'ın altında gizlenmesin diye mobilde sonuç listesi ve sepet alt toplam/ödeme alanının alt boşluğu güvenli alanla birlikte artırıldı; tab z-index üstte.
- Tema, CSS/JS cache sürümü **0.1.10 → 0.1.11**. `tests/dock-gesture.cjs` ile gerçek JS helper'ları çalıştırılarak mount/restore, aktif sayfa, pointer seçimi, hold, iptal/duplicate click; `tests/package.py` ile statik sözleşme korunur. CI workflow Node testini çalıştırır.
- **Henüz CI/deploy çalıştırılmamış kaynak hazırlığıdır**; test ve üretim durumunu kontrol etmeden başarı iddia etme. Sonraki iş: GitHub Actions doğrulama + FTPS dağıtım sonuçlarını al, iPhone'da Arama ↔ Sepet ve Ana Sayfa/Hesabım bırakma, klavye/safe-area, X/focus, checkout CTA ve gerçek cihaz görünümünü test et.

## Storefront 0.1.11 deployment verified — 11 Oct 2026
- Source commit `2db0a69`, test fixture fix `c99479c`. [Actions 38112420622](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38112420622) validated and deployed successfully. The previous run failed on incomplete test fixture geometry, not the browser implementation.
- Native Search/Cart dialogs now retain the floating mobile dock within their top layer for direct switching. Press/hold-and-scrub tabs have CSS feedback and pointer tests. Theme and assets are 0.1.11; no Codela plugin release.
- Remaining: manually test on real iPhone Safari, especially dock during keyboard input, press-and-scrub selection, the subtotal/checkout button, modal focus and safe-area. CI success is not proof of visual acceptance.


## Storefront 0.1.12 — iPhone klavye, sürükleme, kayan alt bar (11 Ekim 2026)

- Kullanıcı arama paneli ve Hesabım sayfası açılınca klavyenin **otomatik açılmamasını** istedi. Aramada ilk odak artık `#sf-query` yerine metin girişi olmayan `.sf-search-cancel` X düğmesidir; kullanıcı alana dokununca normal klavye çalışır. WooCommerce Hesabım giriş/kayıt alanlarındaki otomatik odak, ilk kullanıcı etkileşiminden önce kısa süreli (`1600ms`) ve yalnızca hesap sayfası kapsamıyla sınırlandırılan `preventInitialAccountAutoFocus()` korumasıyla engellenir; manuel dokunma/klavye ile odak kaldırılmaz.
- iPhone'da önceki yalnız `pointer` yaklaşımı sürüklemede çalışmıyordu. 0.1.12 `touchstart/touchmove/touchend/touchcancel` ile doğrudan Safari dokunma akışını takip eder; 240ms basılı tutma veya 9px yatay hareket sürüklemeyi başlatır. Parmak altındaki dört sekme görünür önizleme olur ve bırakınca ilgili sekme/panel açılır. Mouse/pen için pointer yolu korunur; sentetik click engeli ve dikey sayfa kaydırması ayrıştırılır.
- Aşağı kaydırıldığında yüzen alt menü `260ms` yumuşak kayarak ekranın altına gizlenir; altta ince `42×4px` çizgi kalır. Yukarı kaydırınca veya çizgiye dokununca geri görünür. Ana sayfa, Hesabım ve içeriği kaydırılabilen Arama/Sepet modalının scroll olayları desteklenir. Gizli sekmeler inert; çizgi klavyeyle açılabilir; `prefers-reduced-motion` geçişi devre dışı bırakır. Nav açık gri kalır ve ödeme sayfasında hiç render edilmez.
- Kaynak sürüm 0.1.11 → **0.1.12**; CSS/JS asset sürümleri de yükseldi. `tests/dock-gesture.cjs` touch, hold, scroll hide/show ve odak davranışını test edecek şekilde güncellendi; Python tema testleri ve Türkçe `Show navigation` çevirisi eklendi.
- Kaynağın commit'i ve CI/FTP sonucu ayrıca doğrulanacak. Gerçek iPhone Safari klavye/gesture/safe-area manuel kabulü henüz yapılmadı. Sıradaki iş CI testleri ve deploy, sonra üç kullanım durumunun gerçek cihaz kontrolü.

## 0.1.12 dağıtım doğrulaması — 11 Ekim 2026
- Ana kaynak: `181290a30e050bc8d567d9ea0616bb1c7b2fa5db`; test mock güncellemesi: `7b8966bd5e6b786dd67c8f7cb840030edabd0899`.
- [GitHub Actions 38112985514](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38112985514) **validate + deploy success**: PHP lint, JS syntax, Python paket testleri, iOS touch/hold/scroll davranışı için Node testi geçti; bağımsız tema FTPS dağıtımı başarılı. Codela eklentisinin güncellenmesi gerekmiyor.
- Güncel iş: iPhone Safari'de arama/hesap ilk açılışında otomatik klavye olmadığını, basılı tutup yan sekmeye sürükleme-bırakmayı, sayfa ve modal aşağı/yukarı kaydırmalarında alt bar gizleme-açmayı ve çizgiye dokunmayı manuel teyit et. Bu testler gerçek cihazda henüz yapılmadı.


### 0.1.13 CI edge-case correction — 11 October 2026
Source `fe5d8104a0b102bce5fd899bd9195a011e6f39a3`; Actions 38113974270 passed PHP/Node/Python but browser test stopped deployment: a reveal-handle press within 700ms of a canceled scrub was swallowed by the synthetic-click guard. New physical presses now reset that guard even when the target is the handle, with a deterministic regression test. Theme stays 0.1.13; deploy remains pending until the corrected run succeeds.

### Verified 0.1.13 deployment — 11 October 2026
[Source b43479d](https://github.com/muhammetdkaya/codela-storefront/commit/b43479da9d52e5e08f7dca34a8eb35534da295e0), [Actions 38114065497](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38114065497): validate and deploy completed successfully. PHP/JS/Node/Python and the new real-rendered-markup Chromium suite passed. Standalone FTPS theme/ZIP/manifest distribution completed; no Codela plugin release. This supersedes the pending status in the CI correction note. Real iPhone Safari and live checkout acceptance remain unverified; next work starts with that device check, not repeating the implemented navigation refactor.


## 0.1.14 — Tek satırlık minimal Storefront footer (11 Ekim 2026)

- Kullanıcının istediği tek satırlık, sade/kullanışlı footer hazırlandı: solda **© geçerli yıl + mağaza adı**, sağda yalnızca WordPress'te mevcut/published olan **Gizlilik** ve WooCommerce **Koşullar** sayfaları. Sahte bağlantı veya sabit yıl yok. Mağaza adı ana sayfaya gider.
- Eski `footer_text` tema ayarı korunur; kısa not masaüstünde aynı satır içinde gösterilip uzun metin kesilir, mobilde tek satırı ve gerekli yasal bağlantıları korumak için gizlenir. WordPress Custom Logo/brand tercihi bozulmaz.
- Beyaz, ince ayırıcı çizgili, düşük yükseklikte footer; masaüstü ve mobilde `flex-wrap:nowrap` ile bir sıra, marka fazla uzunsa ellipsis; mobilde 11px gövde/bağlantı. Diğer tema bölgeleri ve dört sekmeli alt nav değiştirilmedi.
- Sürüm **0.1.13 → 0.1.14** (theme + CSS/JS cache). Türkçe `Terms=Koşullar`, `Legal links=Yasal bağlantılar`. Var olan schema field ID'leri değiştirilmedi, footer not açıklaması güncellendi.
- Test: `tests/render-footer.php` gerçek render callback'i WordPress stub'larıyla çalıştırır; `tests/footer.cjs` boş vs yayımlanmış legal linkleri ve HTML/satır sözleşmesini kontrol eder; `tests/navigation-browser.cjs` gerçek HTML/CSS ile 390px mobilde aynı satırı kontrol eder; Python regresyon ve CI Node footer testi eklendi.
- Kaynak kaydedilirken CI/deploy henüz doğrulanmış sayılmaz. Sıradaki iş: Actions validate + deploy status, canlı iPhone Safari footer düzeni ve uzun mağaza adları.

### 0.1.14 deployment verified — 11 October 2026
Source [8308f35](https://github.com/muhammetdkaya/codela-storefront/commit/8308f354808c813a88c2163f4a3586eb2d89327a), footer test assertion corrected in `b55b14f`. [Actions 38123576016](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38123576016): **validate and independent FTPS deploy success**. PHP output, footer legal link visibility, Python contract and real Chromium 390px one-line layout passed. Current version 0.1.14. Footer is copyright year/store name left; published Privacy and Terms links right; theme footer note kept on desktop, hidden on mobile to remain single row. Existing bottom dock untouched. Live Safari visual review is still pending; do not represent CI as an iPhone device test.


## Storefront 0.1.15 — WooCommerce Hesabım giriş, kayıt ve oturum içi arayüz (11 Ekim 2026)

- Kullanıcının isteği: mobil alt menü **Hesabım** bağlantısının açtığı gerçek WordPress/WooCommerce müşteri sayfasına sade, minimal, güvenli bir giriş tasarımı. Codela Site tema arayüzünün beyaz/monokrom, düşük yoğunluklu görsel dilini kullan.
- Temaya `inc/account.php` eklendi. WooCommerce'nin **mevcut** `woocommerce_before_customer_login_form` ve `woocommerce_before_account_navigation` hook'larında; yalnız `is_account_page()` sırasında kısa, erişilebilir, çevrilebilir başlık+alt açıklama basılır. Oturum açma, hesap oluşturma, şifre sıfırlama, CAPTCHA/üçüncü parti hook'ları, nonce ve WooCommerce kendi form şablonları korunur; kendi giriş endpoint'i veya yeni eklenti bağımlılığı eklenmedi.
- Giriş sayfasında ortalı `Welcome back` girişi, beyaz 500px max genişlikte tek kart, 48px açık gri input, siyah tam genişlik giriş düğmesi, sade remember-me/lost-password. WordPress/WooCommerce kayıt açıksa mevcut `#customer_login` login/register paneli masaüstünde 2 sütun, mobilde alt alta. Hesap kurtarma, profil düzenleme ve hesap metinleri aynı CSS paletiyle tasarlandı.
- Oturum açmış müşteride WooCommerce kendi `.woocommerce-MyAccount-navigation` menüsü ve `.woocommerce-MyAccount-content` mevcut kalır; masaüstü ince açık gri kenarlıklı sidebar+kart, mobil yatay kaydırılabilir menü+tam genişlikte içerik. WordPress post-title, `.sf-account-intro` mevcutsa gizlenir; gereksiz iki başlık olmaz. Otomatik mobil klavye engellemesi korunur.
- Sürüm **0.1.14 → 0.1.15**, CSS ve JS asset versiyonları aynı. TR metin çevirileri eklendi. Tema haricinde WordPress.org Codela eklentisi değiştirilmedi; ana header/mobile alt navigasyon/footer korunur.
- Doğrulama: `tests/render-account.php` gerçek account hook çıktılarını üretir. `tests/account-browser.cjs` Woo native login/register/dashboard sınıf-kontratlarının stilini 390px/1280px Chromium'da ve giriş alanının otomatik odağı olmamasını test eder. Python package tests ve GitHub Actions browser stage güncellendi.
- Kaynak oluşturma notu: Actions validate/deploy bitmeden canlı denmez. Sonraki iş: CI, standalone FTPS deploy kontrolü, gerçek iPhone Safari + codela.dev My Account'ta kullanıcı login/kayıt/şifre sıfırlama/oturum açma kabul testi.

### Verified Storefront 0.1.15 release — 11 October 2026
- Implementation [8e6786e](https://github.com/muhammetdkaya/codela-storefront/commit/8e6786ea9d461dfd66ef3e4b523fa0902aa80f2c). [GitHub Actions 38128015885](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38128015885): **validate and deploy success**. PHP lint, Node unit tests, Python package tests, existing mobile navigation browser checks, and new 390px/1280px account login/register/dashboard Chromium layout tests passed. Independent FTPS theme deployment completed.
- The design customizes the WooCommerce customer account experience only through theme CSS and display hooks. Authentication, registration enablement, WooCommerce nonce handling, lost-password workflows, and endpoint links remain WooCommerce-owned. The Codela plugin is unchanged.
- Manual acceptance still needed on live iPhone Safari: verify My Account login, login error notice, lost password, optional registration, and after-login orders/addresses dashboard. No live user credentials were used in automated tests.


## Storefront 0.1.16 — Codela My Account çatışmasının giderilmesi (11 Ekim 2026)

- Kullanıcının iPhone ekran görüntüsünde, Storefront 0.1.15'in `HESABINIZ / Hesabım / Siparişlerinizi...` giriş ekranı başlığını **giriş yapmış Codela hesap panelinin ÜSTÜNE** yerleştirdiği gözlendi; Codela'nın kendi Hesabım başlığı, avatar, son sipariş, gönderi takibi ve modül bağlantıları zaten mevcut. Kullanıcı bunların bozulmamasını istiyor.
- Gerçek kodla doğrulama: bağımsız plugin `muhammetdkaya/codela` içinde `codela-commerce-toolkit/includes/my-account-layout.php` yerleşik `Codela\Includes\MyAccountLayout` sınıfı, login durumunda `codela-my-account-layout` body class'ı ve kendi CSS/JS'i, Woo navigation/dashboard hook'ları, mobil uygulama tarzı hesap paneli, sipariş/kargo vb. sağlıyor. `woocommerce_before_account_navigation` hook'unu çağırdığı için temanın hesap başlığı ekleniyordu. `assets/css/codela-my-account.css` plugin'ın stil kaynağı. Plugin'e müdahale edilmedi.
- Temada `inc/account.php` artık **yalnız giriş yapmamış kullanıcı** için `woocommerce_before_customer_login_form` hook'una bağlı; `woocommerce_before_account_navigation` hook'u tamamen kaldırıldı; ayrıca `is_user_logged_in()` koruması var. Oturum açmış kullanıcıda tema girişi artık yok.
- 0.1.15 ile eklenen 90 `body.woocommerce-account` CSS seçicisinin tamamı `body.woocommerce-account:not(.codela-my-account-layout)` ile sınırlandırıldı: Codela'nın authenticated account görünümü, sipariş listeleri, adres kayıtları ve tab/kargo/diğer modülleri tema CSS'iyle yeniden tasarlanmıyor. Sadece Codela sayfasındaki varsayılan WordPress block post title `body.codela-my-account-layout .sf-content > .wp-block-post-title` gizlenerek mevcut panelde ikinci sayfa başlığı engelleniyor. Giriş/kayıt/şifre sıfırlama tasarımı ve Codela devre dışıyken temel WooCommerce hesap teması devam ediyor.
- `tests/render-account.php` signed-in ve guest davranışı ile fixture'ı güncelledi; `tests/account-browser.cjs` 390/1280px Chromium'da guest auth, vanilla Woo hesap fallback ve Codela signed-in örneğinde başlık/uygulama menüsü/çakışmayan stilleri doğruluyor. Python testleri guest-only hook'u ve CSS isolation guard'larını denetler.
- Sürüm **0.1.15 → 0.1.16**, theme / JS+CSS cache. Codela eklentisi değiştirilmedi. Kaynağı kaydetmek CI veya canlı dağıtım kanıtı değildir; sonraki adım Actions validate+deploy başarısını görmek, gerçek iPhone Safari'de Codela Hesabım, adresler ve siparişler için manuel kabul.

### 0.1.16 rollout verified — 11 October 2026
The double account heading shown on iPhone was reproduced by reviewing source ownership: Codela's `MyAccountLayout` fires Woo's `woocommerce_before_account_navigation` hook, which the theme's 0.1.15 intro had subscribed to. The theme 0.1.16 removes its signed-in intro, keeps only guest login markup, and excludes `body.codela-my-account-layout` from all 90 new account CSS selectors. Only the redundant WordPress post title is suppressed when Codela is active. [Commit c8c5d0b](https://github.com/muhammetdkaya/codela-storefront/commit/c8c5d0b8b32bf76ccb9d39cf7457b944a43703db), [Actions 38129810982](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38129810982): validate **success**, FTPS deploy **success**. Codela plugin repository unchanged. Pending manual acceptance: logged-in iPhone Safari orders, shipment tracking, addresses, overlays, guest login, logout and screenshots.



## Codela UI Kit release verification — 11 October 2026 / 0.1.24

The new shared UI Kit was released in three separately validated stages:
- [0.1.22 / Actions 38144147938](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38144147938): shared PHP IconButton/primary CTA, CSS tokens and reusable pressable states, UI Kit security/accessibility contract.
- [0.1.23 / Actions 38144588453](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38144588453): navigation CSS isolated and account CSS conditional, legacy layout substantially smaller.
- [0.1.24 / Actions 38145114992](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38145114992): one generalized semantic Button renderer for link/button, primary/secondary/quiet, disabled/loading, optional icon; both unit and browser state tests.

All three GitHub Actions runs finished with **validate + deploy success**. The 0.1.24 implementation commit is [566fc86](https://github.com/muhammetdkaya/codela-storefront/commit/566fc866c8ec5efd0c6d428d3e645d4bdf35d045). Shared controls live in `inc/ui.php` and `assets/styles/{tokens,components}.css`. Navigation and guest account CSS are separate and plugin-owned signed-in My Account remains untouched. The Codela plugin repo was not changed.

**Remaining follow-up:** Gradually separate overlay/search/cart CSS and modularize feature JavaScript without changing production UI or WordPress Interactivity semantics. Add non-public UI Kit visual preview. Verify the physical iPhone Safari appearance/gestures manually (CI Chromium passing is not device acceptance). Before a new UI feature, read `docs/design-system.md` and reuse the existing components.


## Verified 0.1.25–0.1.26 modular UI Kit rollout (11 October 2026)

- [0.1.25 source 8ead856](https://github.com/muhammetdkaya/codela-storefront/commit/8ead856850d9ecd3ce4d42b47586b7a166ff4271), [Actions 38146397263](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38146397263): `validate` and independent `deploy` **success**. `assets/styles/overlay.css` owns the popup toolbar, search input/results and associated focus rules; no public visual changes intended. Private UI Kit references are downloadable as `codela-storefront-ui-reference` from the workflow artifacts. Source identifiers, new comments, tests and documentation are platform-neutral.
- [0.1.26 source 073eca6](https://github.com/muhammetdkaya/codela-storefront/commit/073eca6a1beb9e3403a159cd3b25a16bd24b61ba), [Actions 38146791734](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38146791734): `validate` and independent `deploy` **success**. Reusable HTML escaping, decoding, URL validation and currency formatting are exported by `assets/scripts/format.js`, imported by the main module and covered by extra security/format tests.
- The Codela plugin is unchanged. The Header, mobile dock gestures, search/cart behavior, footer and authenticated account layout continue using their existing contracts.
- Next priority: extract popup/search/cart state controllers into carefully tested modules while preserving a *single* dialog and navigation state, and avoid duplicated gesture listeners. Do not claim manual touch-device acceptance from automated Chromium passing.


## 0.1.27 module isolation verified — 11 October 2026

- Source changes: [bf8d339](https://github.com/muhammetdkaya/codela-storefront/commit/bf8d33950bf8ac37ed899fd24d3efbc1c995dd86); contract-only fixture correction: [b616853](https://github.com/muhammetdkaya/codela-storefront/commit/b616853d6d6f54fd7172a4179d5409210ada6ee2).
- [Actions 38148006178](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38148006178) finished **validate success / standalone deploy success**. First run failed because an old format unit test looked for an import in the main module rather than both new feature modules; this test fixture was corrected before publishing.
- `assets/scripts/search-controller.js` owns debounced requests, abort, response sequence and result rendering. `assets/scripts/cart-controller.js` owns Store API nonce, coalesced GET, quantity/remove operations, error recovery and external cart events. `assets/storefront.js` continues to own one WordPress Interactivity store, one native panel, one mobile navigation state and all panel focus/transition behavior.
- Existing browser tests passed with production module implementations injected into the test harness; no parallel fake search/cart implementations were used. Codela plugin unchanged. Physical mobile-device interaction has not been manually accepted. Next: consider moving the single overlay controller out of the entry module, preserving shared dock and search/cart references with explicit lifecycle contract and regression tests.


## Storefront 0.1.28 — Single overlay controller extraction

- `assets/scripts/overlay-controller.js` is the **one** owner of the active modal name, native `<dialog>`, initial focus, panel transitions, admin toolbar offsets, document scroll lock and exact scroll/focus restoration. The only exported factory is `createOverlayController()`; it is instantiated **once** by the main entry module.
- The entry module continues to own **one** floating navigation element and touch/scrub/scroll listeners. The overlay accesses navigation using callbacks `mountDock`, `restoreDock`, `setDockCollapsed`, `markDockActive`, `mobileDock`. Search and cart controllers keep their separate request/nonce states and ask the overlay for its active view and dialog, without parallel state.
- The controller exposes `bind()`, `open()`, `close()`, `animateContent()`, `getCurrent()`, and `getDialog()`. Menu nesting remains in the entry module and is reset via `onMenuOpen`; native `cancel`, keyboard focus clearing, and viewport offset updates are installed once in `bind()`.
- Regression fixtures load the **actual** overlay module alongside format/search/cart modules; no separate browser-only implementation. Component names remain platform-neutral. Signed-in Codela account UI remains plugin-owned.
- This source change is **pending validation/deployment** until GitHub Actions confirms both stages; manual mobile acceptance remains a separate check. Next: make a controller-level lifecycle regression for open/switch/close/focus if needed, then consider isolating navigation gestures while preserving one DOM element and event installation.


## 0.1.28 release verified — 11 October 2026

- Implementation: [441fdb5](https://github.com/muhammetdkaya/codela-storefront/commit/441fdb5dda012535781969ddd665e3512bc51c10); test-only contract corrections: [2b67742](https://github.com/muhammetdkaya/codela-storefront/commit/2b677425c7a5d34299fc271819d5219f663d65d5), [448d8fe](https://github.com/muhammetdkaya/codela-storefront/commit/448d8fe0763b2e61311e0d0bf28439e2ab26b325).
- [GitHub Actions 38151165256](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38151165256) finished with **validate success and standalone FTPS deploy success**. Native panel open/switch/close, focus restoration, dock touch/scroll/navigation, cart and search requests, compact UI rendering and account ownership passed the existing tests.
- `assets/scripts/overlay-controller.js` is the single owner of modal name and dialog lifecycle; `assets/storefront.js` keeps one dock node and one navigation gesture handler. The search/cart controllers remain independent; signed-in customer account remains owned by the Codela plugin. No platform-specific UI identity was introduced.
- Real mobile device acceptance of scroll/focus/touch remains pending; passing automated browser tests does not prove a physical device test. Next controlled task, if needed: isolate the dock gesture controller under an explicit lifecycle contract while preserving the single DOM node and current behavior, or expand controller-level tests before further changes.


## 0.1.29 — Mobile dock controller isolated (11 October 2026)

- Implementation commit [ff74ca8](https://github.com/muhammetdkaya/codela-storefront/commit/ff74ca82061ca18d3096bb23ae0093be5d1e5460); [GitHub Actions 38152743058](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38152743058) completed **validate success and independent Storefront deploy success**.
- `assets/scripts/dock-controller.js` now exclusively owns the **single existing** `.sf-mobile-dock` DOM element, dialog mount/restore, tab active indicator, scroll collapse/reveal, 240ms long-press, touch/pointer scrubbing, release navigation and ghost-click suppression. Its `init(dialog)` is idempotent; no duplicate listeners. Public methods: `init`, `mobileDock`, `setDockCollapsed`, `mountDock`, `restoreDock`, `markDockActive`, and shared `dockScrollPositions`.
- `assets/storefront.js` is the composition root for the one WP Interactivity store, search, cart, overlay and dock. The dock receives only callbacks to the overlay (`getDialog`, `getCurrent`, `open`); the overlay receives dock methods. There is no second active panel state and no duplicated navigation DOM. Main entry shrank from 15,005 to 5,263 bytes.
- `tests/dock-gesture.cjs` exercises the real extracted module and asserts one-time listener installation; the browser fixture uses the real dock, overlay, search and cart modules. `tests/package.py` validates the new module boundaries. No Codela plugin files changed.
- Automated tests are not physical iPhone/Safari acceptance. **Next:** verify on a real iPhone: home→search→cart switching, hold-and-scrub across tabs, down/up scroll collapse, reveal handle, keyboard focus, safe-area and checkout CTA. Fix only evidenced regressions, and keep design system/module ownership documented here.


## Storefront 0.1.30 — separated header surfaces and shared controls (11 October 2026)

- Header menu now uses the **same `sf-ui-icon-button--soft` variant** as both panel close controls; formerly the header was `bare` while X was `soft`. Both inherit the 44px hit target, 999px radius, press scaling, keyboard focus and reduced-motion contract from `assets/styles/components.css` and `assets/styles/tokens.css`.
- `assets/styles/navigation.css` composes three independent soft header surfaces: brand/logo pill, menu circle and (when dock is disabled or on desktop) one grouped search/cart/account tools pill. The full header bar is transparent, without the old divider. Surface, border and shadow use shared `--sf-ui-header-*` tokens, with blur fallback and reduced-transparency handling.
- Mobile dock enabled: preserve approved brand-left/menu-right order, with the menu/X hit target at the same coordinates; dock disabled: menu-left/brand-center/tools-right. Desktop retains centered brand. No new icon implementations or duplicated JavaScript handlers. The Codela plugin is untouched.
- Regression coverage: `tests/ui-kit.cjs` validates the common soft variant and surface tokens; `tests/navigation-browser.cjs` validates geometry, brand/menu shared surface, 44px hit target, transparent shell and pre-existing menu/X alignment across widths.
- Reference image is a visual direction rather than a dark-mode mandate: storefront uses its own light theme palette. Physical mobile-device review remains pending.


## Storefront 0.1.31 — Shared floating header surfaces (11 October 2026)

- The user reference calls for **separate** logo and menu surfaces rather than one filled header strip. Brand and optional desktop tool group use the `sf-ui-surface` primitive. Menu and dialog X use the **same** `sf-ui-icon-button--soft` variant: shared 44px hit target, 22px icon, pill radius, translucent graphite surface, white icon, elevation, press transform, keyboard focus and reduced-motion/transparency fallback. Search clear remains the intentional smaller `clear` variant.
- Source of truth: `assets/styles/tokens.css` owns glass color/border/shadow and control metrics; `assets/styles/components.css` owns shared paint and interaction; `assets/styles/navigation.css` owns **only header layout**, not separate menu paint. `assets/styles/overlay.css` must not reset common button chrome. Preserve custom logo visibility and high-contrast white brand text.
- Mobile with bottom navigation enabled retains logo left/menu right; desktop and bottom-navigation-disabled mobile retain their established layouts. No redundant header cart/search icons were introduced when the bottom dock is active. The reference screenshot is a visual inspiration, not a request to copy unrelated controls.
- Automated tests include comparing menu/X computed background, border radius, icon size and elevation across 320/390/700/1024px, UI Kit rendering, and existing navigation/overlay regressions. [Actions 38154258333](https://github.com/muhammetdkaya/codela-storefront/actions/runs/38154258333): **validate success / standalone deploy success**. Implementation [eb83ea4](https://github.com/muhammetdkaya/codela-storefront/commit/eb83ea43ead07a0270956bb504addd5cc9d19e63), follow-up CSS/test fixes [2057f87](https://github.com/muhammetdkaya/codela-storefront/commit/2057f878735eeff4c933f4180cfc3e765b063e47), [6390cae](https://github.com/muhammetdkaya/codela-storefront/commit/6390cae3c950975d3e536fcdb39e66394c4198c7), [9dd80f1](https://github.com/muhammetdkaya/codela-storefront/commit/9dd80f1bb753348f5dc58ad348b77bfe02fba82a).
- Physical mobile browser acceptance remains pending. Future work: do not reintroduce per-page button styles; extend shared variants/tokens only when there is a real semantic distinction.

