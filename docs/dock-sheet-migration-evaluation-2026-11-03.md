# Dock ve native Woo ürün paneli: Aşama 3 değerlendirmesi

Tarih: 3 Kasım 2026. Kapsam: kaynak incelemesi, yerel sözleşme testleri ve inceleme sonrasında verilen uygulama yönlendirmesiyle dar native yaşam döngüsü düzeltme adayı. **Motion kapsamı, CSS/süreler, native Woo formu ve görünüm değiştirilmedi. Commit, push veya yayın yapılmadı.**

## Karar

**Dock ve ürün sheet’inin mevcut CSS/native hareketlerini koru. Aşama 3’ü zorunlu Motion geçişi olarak değil, küçük yaşam döngüsü sağlamlaştırması ve karşılaştırmalı kabul kapısı olarak yürüt.** İncelenen iki yüzeyde Motion’un kaldıracağı anlamlı bir davranış motoru yoktur. En riskli işler hâlâ Codela’ya aittir: tek Woo formu, pointer kimliği, ölçüm, snap kararı, odak, responsive geri yükleme ve gezinme.

İlk sepet pilotunun tarayıcı, ekran, kesinti ve performans kabulü tamamlanmadan Aşama 3 kabul edilmiş veya Motion yayılımına hazır sayılmamalı. Ana planın ayrı Embla pilotu da bu çalışmayla birleştirilmemeli. Aşama 1’in kabulü, ürün formu veya dokunma kabulünün yerine geçmez. İnceleme sonrasında istenen dar native düzeltmeler ayrı ve henüz browser kabulü olmayan aday olarak hazırlanmıştır.

Hazırlanan en küçük paket, **Motion eklemeden** iki controller’ın gecikmiş iş/kimlik sınırlarını düzeltir. Motion ancak aynı davranışı daha az özel kodla ve ölçülmüş yararla sağlayan ayrı deney başarılı olursa yeniden değerlendirilir. “Vendor zaten yükleniyor” tek başına benimseme gerekçesi değildir.

### Hazırlanan adayın özeti

- Dock `pointercancel/lostpointercapture` yalnız etkin non-touch pointer’ın eşleşen kimliğini iptal eder.
- 700px sınırı değişince bekleyen collapse timer ve scroll frame temizlenir; yeni scroll başlangıcı alınır. Timer ayrıca masaüstünde hide uygulamaz. Mevcut yerleşmiş collapse state’i ve eşikler değişmez.
- Ürün validation focus işi tek frame/nesil sahibine bağlıdır. Close, unmount veya yeni `setOpen` isteği önceki işi iptal eder; bağlı ve aynı sheet içindeki güncel alan dışında odak/scroll uygulanmaz.
- Node regresyonları geçti; eski 195 kaynakları pointer kimliği ve stale-focus negatif kontrollerinde beklenen biçimde başarısız oldu. Üç motor için yeni browser fixture hazırdır, **çalıştırılmadı**. Geniş capture-release, pagehide/route veya drag/settle yeniden yazımı eklenmedi.

## İncelenen kaynak ve kanıt sınırı

- Başlangıç: `687ef83e13621f6117264d04f220fa13c8836bb4`, kararlı tema 0.1.195. Çalışma dalı: `work/library-migration-20261103`.
- İlk incelemede dock ve ürün script’i başlangıç kaynağıyla byte düzeyinde aynıydı. Bulguların eski kaynak Git blob kimlikleri: dock `9f42741b697753d0404d92e049b0fff164a8c681`; ürün `f3fe93a6ed01a9392d93fc05e6b23ee0f4980e3f`. Ardından yalnız yukarıdaki dar aday değişiklikleri uygulandı.
- Yeni ortak `panel-motion.js` incelenen blob: `dead21872d7ee12307aa7aea4a84a80967d49449`. Bu belge, yakalanan dinamik vendor import’u ve ilk eylemde native fallback içeren adayı değerlendirir. Paylaşılan dalda başka işlerin devam etmesi nedeniyle entegrasyonda tekrar kontrol edilmelidir.
- Güncel AGENTS, teknik durum, tasarım sistemi, 3 Kasım dönüşüm planı; dock/ürün/panel controller’ları; ilgili CSS; native belge/core-router/feedback sahipliği ve ilgili testler okundu. Tarihî “satın alma yoksa ürün dock’u görünür” notları uygulanmaz: 0.1.192’nin **tüm ürünlerde gizli dock** kararı üstündür.
- Bu turda yeni tarayıcı çalıştırılmadı. Üst görevde doğrulanan yerel Chromium OS/socket engeli devam eden kabul sınırıdır; CI sonucu ve ekranlar ayrıca gerekir. Fiziksel iPhone, sanal klavye, gerçek Woo eklentileri veya gerçek satış kabulü yapılmış sayılmaz.
- Aşağıdaki VM gözlemleri gerçek kaynak fonksiyonlarını çalıştırır; tarayıcı yerleşimi, native pointer dağıtımı veya görünen odak sonucu değildir.

Tema yolları `theme/codela-storefront/` köküne göredir. Satır aralıkları ilk incelenen 195 anlık görüntüsüne aittir; aday eklemeleri satırları kaydırır.

## 1. Ne kalmalı, ne ayrılabilir, ne reddedilmeli?

| Yüzey | Mevcut sahip ve davranış | Karar | Motion’a özgü yarar |
|---|---|---|---|
| Dock seçim kapsülü | `dock-controller.js:107–118,193–203`; CSS `::before`, kesirli `--sf-dock-index` | Mevcut pseudo-element ve CSS korunsun | Kanıtlanmadı. Mevcut helper yalnız gerçek element `transform`’unu animasyonlaştırır; pseudo-element/hedef değişken sözleşmesi sağlamaz. |
| Dock bırakma/tap | Scrub sırasında transition kapalı; normal seçimde 220ms CSS | Korunsun | Ayrı animasyon oluşturma/iptal/inline temizleme kodu ekler. |
| Dock scroll gizlenme | Tek controller; 44px aşağı/28px yukarı, 650ms dinlenme; 480ms CSS | Eşikler/süreler korunsun; bekleyen zamanlayıcı sınırı test edilsin | Hareket motoru dinlenme/scroll niyetini çözmez. |
| Dialog içinde tek dock | Aynı node native dialog’a taşınır; çizilmiş kapsül pozisyonu taşınır | `preserveDockPosition` korunmalı | CSS yeniden ebeveynlenme sürekliliği zaten var. Motion bunun yerine geçecekse aynı anda iki sahip olmamalı. |
| Ürün açık/kapalı yerleşimi | `setOpen`, tek form ve ölçülen CSS yükseklikleri | Korunsun | Motion form/validasyon/odak/viewport yönetmez. |
| Ürün sürükleme | Her pointer örneğinde state; frame başına tek height yazımı | Korunsun | 195’te tamamlanmış optimizasyon; Motion kazanımı olarak yeniden yazılmaz. |
| Ürün bırakma | Son drag yüksekliği → sınıf hedefi; 160ms CSS height geçişi | Native bırakma korunsun | Yeni `height` adaptörü ve CSS ile sahiplik devri gerekir; mevcut transform helper yeterli değildir. |
| Klavye/hata/resize/geçmiş | Native Woo, mevcut controller’lar ve tarayıcı | Küçük iptal/kimlik testleri ve gerekiyorsa düzeltmeler | Vendor’dan bağımsız doğruluk işi. |

**Reddedilenler:** React/Magic UI dock kopyası, yeni sheet/dialog/router, form klonu/proxy submit, genel drag kütüphanesi, yeni spring/bounce, snap eşikleri değişikliği, süreleri drawer’ın 240/180ms değerlerine eşitleme, ürün sheet’ini translate/scale ile taklit etme, tüm ürünü ES modüle taşıma, yeni VisualViewport/scroll sahibi ekleme. Bunlar bu aşamanın “aynı görünüm/davranış” sınırını aşar veya ölçülmüş yarar sunmaz.

## 2. Korunacak ayrıntılı sözleşmeler

### Dock

- `createDockController` bir kez başlatılır; açık panel state’i `getCurrent/open/close` ile tek overlay sahibinden gelir. Dört dock öğesi ve yerel sayfa bağlantıları kalır.
- Aynı dock dialog top layer’ına taşınır ve yorum işaretine döner. Ürünlerde `hidden=false` ayarlanabilmesi, dock’un görünür olduğu anlamına gelmez: ürün CSS’i bağımsız olarak gizler. Bu CSS güvenliği kaldırılmamalı.
- Touch yolu özgün touch identifier ile çalışır; touch pointer olayları ikinci kez işlenmez. Pen/mouse yolu pointer capture kullanır. 240ms uzun basma, yatay 9px başlama ve dikey 18px vazgeçme eşikleri korunur.
- Hit testing büyüyen ikonlara değil sabit dock yerleşim yuvalarına dayanır. Scrub seçimi kesirli konum izler; bırakma gerçek ikon merkezine oturur. Native tap/klavye bağlantısı, geçerli sayfa seçilince popup’ı kapatma ve 700ms sentetik click koruması korunur.
- Scroll olayları bir rAF içinde okunup yazılır (`141–175`). **Dock pointer/touch preview’su rAF toplamasına sahip değildir:** her move’da aday/ölçüm/sınıf/CSS değişkeni güncellenir (`193–203,227–236`). Bunu varmış gibi raporlamayın. Ölçülmüş layout maliyeti olmadan yeni zamanlama katmanı eklemeyin.
- Dock reparent sonrası geçici `--sf-dock-position` bir rAF sonra silinir (`61–83`). Bu frame, scroll frame’i ve collapse zamanlayıcısı ayrı iş sahipleridir; yeni bir motor bu üç işi kendiliğinden ortadan kaldırmaz.

### Tek gerçek Woo formu ve responsive geri yükleme

- Yalnız boş sunum template’i klonlanır. Gerçek title/price/summary/form, nonce/variation/extension input’ları, quantity ve submit düğümü **taşınır**, kopyalanmaz (`product-information.js:52,77–83,138–197`). Template klonlamasını form klonlaması sanıp yanlış bir yeniden yazım başlatmayın.
- Form hiyerarşisi ve native submission kalır. Quantity düğmeleri gerçek input üzerinde `stepUp/stepDown` ve native `input/change` olaylarını kullanır. Miktar/fiyat/stok otoritesi bu script’e taşınmaz.
- `originals` içindeki yorum işaretleri ters sırada çözülür. Delivery/reassurance/ilgili ürünler doğru yerlerine döner; açıklama düğümünün özgün konumu ve açık durumu ayrıca geri yüklenir (`198–244`). Form/input kimliği, değerleri, listener’ları ve native `form` ilişkisi her breakpoint döngüsünde aynı kalmalı.
- Mobil sınır ≤700px’dir. 701/900px tablet ve 901px+ masaüstü ilk HTML düzeni aynı kalmalı. Aynı script tekrar yükleniyormuş gibi yeni instance/dispose altyapısı eklenmez: ürün bağlantıları mevcut mimaride normal belge navigasyonudur.
- Satın alınamayan, fiyatsız ve stok dışı ürünler yeni CTA/form veya dock kazanmaz. Header sepeti ve menüdeki arama/hesap erişimi korunur.

### Drag ve bırakma

- Pointerdown çizilmiş mevcut yüksekliği önce örnekler; sürmekte olan CSS settle sırasında yeniden tutma sıçramaz (`252–267`). Header `touch-action:none`; form kontrolleri drag başlangıcından dışlanır.
- Drag için 8px yön kararı, min/max clamp, hız/mesafe ve açık/kapalı progress eşikleri aynı kalır. Her pointermove state’i günceller; sadece `paintDrag` yükseklik yazar. Pointerup/cancel son **kaydedilmiş move örneğini** frame beklemeden yazar (`268–308`).
- `pointercancel`, eşleşen `lostpointercapture`, blur ve genişlik değişimi başlangıçtaki açık/kapalı duruma döndürür. Aynı genişlikte yalnız viewport yüksekliği değişirken parmak altındaki panel iptal edilmez (`344–348`).
- Bırakma sırasında inline height temizliğinden önce sınıf hedefi kurulur; sonraki rAF CSS height geçişini başlatır. Gallery boyu ve belge scroll konumu drag frame’lerinde ölçülmez/değiştirilmez.
- **Ürün height süresi 160ms**, easing `--sf-ui-ease-press`; dock seçim süresi 220ms, gizlenme 480ms, engage/release 110/360ms’dir. Sepet drawer’ının 240/180ms token’ları bunların yerine konmaz.

### Klavye, hata ve erişilebilirlik

- Sheet normal sayfa bileşimidir; ikinci modal/focus trap değildir. Açılınca galeri `inert`, içerik scroll edilebilir; kapanınca iç içerikteki odak gerektiğinde toggle’a döner. Escape önce drag’i iptal eder, sonra açık sheet’i kapatır.
- Eksik varyasyon seçimi ve kapalı grouped form gerçek alanı görünür yapar; submit proxy’si yoktur. Capture-phase `invalid` gerçek hatalı alanı açar. Başlangıçta hash veya Woo error/message varsa sheet açılır; review hash native disclosure’ı açar (`193–194,320–373`).
- Bu kodda ürün sheet’ine özel VisualViewport/keyboard controller yoktur. CSS `100svh` max-height/`100dvh` açık yükseklik, native scroll ve resize ölçümü kullanılır. Sanal klavyede görünür alan ve hata alanının ulaşılabilir olduğu fiziksel cihazda ayrıca doğrulanmalıdır. Masaüstü viewport resize testi, iPhone klavyesi kabulü değildir.
- Sonradan gelen üçüncü taraf Woo notice/validation davranışı için otomatik gözlemci varmış gibi kabul yapılmaz. Yerel `invalid`, eksik variation ve başlangıç notices kapsamı, gerçek eklenti davranışından ayrıdır.
- Reduced-motion için token’lar sıfırlanır; shell içinde tüm CSS animasyon/geçişler ayrıca kapatılır (`storefront.css:207–209`). Ürün height token’ı sıfır olur. Yeni JS motion varsa hem ilk tercihi hem hareket sırasında tercih değişimini ele alması gerekir; şu anki CSS yoluna ekstra JS şart değildir.

### Ürün dock gizliliği ve gezinme

- `product.css:474–477` ürün belgesindeki dock’u, dialog içine taşındığında da gizler. Tek istisna **normal hedefe geçerken** feedback’in hedef dock önizlemesidir (`data-sf-navigation-bottom="dock"`). Bu önizleme ürün üzerinde yeni kalıcı gezinme değildir; inert’tir ve iptalde eski görünürlük geri döner.
- `navigation-feedback.js` tek geçici sunum sahibi; `codela:before-route` önce overlay’i beklemeden kapatır, sonra dock/ARIA/style snapshot’larını alır. Ürün/normal hedef değişimi ve iptal bu pakette kalır.
- `navigation-controller.js` yalnız işaretli core-router bağlantılarını işler. Ürün/Woo/auth/checkout akışları native belgede kalır. Ürün script’ine core-router sayfa değiştirme görevi verilmez.
- Dock `pageshow`’da collapse/scroll state’i sıfırlar; feedback `pageshow`’da kendi snapshot’ını geri yükler. Ürün script’inde özel `pagehide/pageshow` drag/focus temizleme yolu yoktur. Normal BFCache restore’daki form/scroll/disclosure state’i korunmalı; varsa geçici gesture/focus işi eski sayfadan dönüp yeni eylemi bozmamalı.
- Back/Forward sırasında yeni bir `pushState`, URL/focus/scroll sahibi veya zorunlu yeniden mount eklenmez. Ürün → normal → Back/Forward, açık sheet ve modal içinden gezinme, beklerken Escape/timeout ve BFCache ayrı test edilir.

## 3. Aşama 1 hareket sözleşmesinden ne aktarılabilir?

İncelenen `panel-motion.js` şu küçük sözleşmeyi sağlar:

1. Vendor yakalanan dinamik import ile hazırlanır. İlk eylem vendor beklemez; native WAAPI hemen kullanılabilir. Vendor hatası ve native animasyon yokluğu işlevi bloklamaz.
2. Süre girişte ms, Motion’da saniyedir; aynı CSS bezier korunur.
3. `cancel()` idempotent’tir. Motion’da `stop()` eski native finish handler’ını ayırır; sırf `cancel()` çağırmak yeterli değildir. Pinned runtime negatif kontrolü kuyruktaki eski finish’in inline endpoint yazabildiğini gösterir.
4. Animasyonun sahip olduğu inline `transform` değeri ve priority geri yüklenir. Tamamlanan hareketin de controller tarafından temizlenmesi gerekir.
5. Aktif animasyon kimliği, çizilmiş değeri **iptalden önce** örnekleme ve eski completion’ın yeni state’i değiştirmesini önleme hâlâ overlay controller’ın işidir. Adapter tek başına “son eylem kazanır” controller değildir.

**Aktarılacak ilke, vendor zorunluluğu değil sahipliktir:** bütün gecikmiş callback’lerin hangi gesture/mount/görünüm nesline ait olduğu bilinmeli; iptal callback’i ve inline artıkları temizlemeli. Aynı ilke native rAF/timer/CSS sınırlarına uygulanabilir.

Ürün sheet’inde `height` animasyonu layout maliyetini Motion kullanınca ortadan kaldırmaz. Transform’a geçmek ise gerçek form/purchase fixed containing block, clipping, içerik scroll’u ve görsel geometriyi değiştirir. Dock kapsülü pseudo-element’tir; mevcut helper’ın gerçek element transform API’siyle doğrudan eşdeğer bir değişim yoktur. Bu nedenle şimdi genel “her property” helper’ı yaratmak da önerilmez.

## 4. Başlangıç kaynağında doğrulanan dar açıklar

Bu bulgular **başlangıçtaki 195 controller davranışıdır**, yeni Motion regresyonu değildir. Üçü için dar native aday hazırdır; VM sonucu kullanıcıya görünen hasarın büyüklüğünü kanıtlamaz. Düzeltmelerin native tarayıcı etkisi ayrıca doğrulanmalıdır.

| Bulgu | Kaynak/yerel kanıt | En dar çözüm | Vendor yararı |
|---|---|---|---|
| Farklı pen/mouse pointer’ın cancel/lost-capture olayı etkin scrub’ı temizleyebilir | Dock `285–286` yalnız `pointerType !== 'touch'` kontrol eder, `press.id` karşılaştırmaz. Gerçek dock harness’inde id301 scrub sırasında id302 cancel ve id401 sırasında id402 lost-capture, `.is-scrubbing`’i temizledi. | Cancel/lost-capture için aktif pointer kaynağı ve eşleşen id guard’ı; doğru id’de mevcut iptal korunur. | Yok |
| Validation için kuyruktaki focus callback’i kapanış/unmount sonrası da çalışır | Ürün `113–116` rAF referansını saklamaz ve callback’te mounted/expanded/identity kontrolü yapmaz. Gerçek `setOpen` fonksiyonunu çalıştıran VM’de aç → aynı görevde kapat veya mounted=false → frame; her ikisinde `focus/scrollIntoView` yine çağrıldı. | Tek focus frame + generation; kapanış/unmount/gezinmede iptal; callback’te güncel açık ve bağlı hedef kontrolü. | Yok |
| Bekleyen mobil collapse geniş ekran olduktan sonra da uygulanabilir | Dock timer `49–56` width kontrol etmez; resize yalnız gesture/submenu temizler. Harness’te mobilde queued hide → 900px resize → timer, `.is-collapsed=true` oldu. | Mobil sınır terk edilirken pending scroll/collapse iptali; timer’da mobile guard; mobile’a dönünce yeni scroll niyeti bekle. Mevcut görünür state’i sebepsiz sıfırlama. | Yok |

Ek araştırma/test adayları, henüz doğrulanmış kullanıcı hatası değil:

- Dock’un capture alma çağrısı ve ürün header capture çağrısı exception-safe değil; browser aktif pointer’ı kaybettiğinde senaryo denenmeli. Capture release sırasında referans önce temizlenmeli ki `lostpointercapture` yeniden girip yeni gesture’ı iptal etmesin.
- Ürün `settleFrame`, `dragFrame`, validation focus işi; dock `dockPositionFrame`, scroll frame’i ve timer’ı için pagehide/route başlangıcı/reduced-motion değişimi kombinasyonları test edilmeli. Normal responsive döngüde formu yeniden yaratma gerekçesi değildir.
- Dock `preserveDockPosition` frame’i ile navigation feedback’in aynı inline style’ı snapshot/restore etmesi için açık panel → route begin → frame → cancel sırası sınanmalı. Geçici `--sf-dock-position` kalıcılaşmamalı. Bu incelemede o olası yarış yeniden üretilmedi.
- Dock move preview’su için rAF toplaması ancak profiler tekrarları gerçek layout baskısı gösterirse ayrı performans işi olmalı. Release son örneği flush etmeli; scroll/hold/cancel yeni frame’i iptal etmeli. Doğrudan Motion’a taşımak aynı garantileri sağlamaz.

## 5. En küçük Aşama 3 patch: hazırlanan kapsam ve sonraki seçenekler

**Dar aday uygulandı, browser kabulü bekliyor.** En az dosya/sorumluluk değişimiyle iki bağımsız düzeltme hazırlandı. İkisi de vendor bağımsızdır ve yeni görünüm, süre veya özellik eklemez. Commit/push entegrasyon sahibine bırakıldı. Aşama 1 kapısı veya bu yüzeylerin kabulü atlanmış sayılmaz.

### P3-A: Dock iptal kimliği ve bekleyen scroll işi

Dosyalar: `assets/scripts/dock-controller.js`, `tests/dock-gesture.cjs`, `tests/dock-sheet-lifecycle-browser.cjs`.

1. `pointercancel/lostpointercapture` handler’ını `press?.pointer && event.pointerId === press.id` ile sınırla. Touch cancel yolunu özgün touch owner’ında bırak; yeni tekleştirilmiş gesture kütüphanesi ekleme.
2. Capture release davranışı bu dar adayda değiştirilmedi. İleride yeni bir negatif kontrol gerektirirse önce `press=null`, sonra eski yakalanmış pointer’ı güvenli bırakma ayrı ele alınır. Normal bitişin ghost-click ve seçim kararı aynıdır.
3. Desktop sınırı geçilirken yalnız bekleyen dock scroll frame’i ve pending collapse timer’ını iptal et; timer callback’ine de `innerWidth <= 700` guard koy. 650ms dinlenme ve 44/28/12px eşiklerini değiştirme. Mobile’a dönüşte scroll başlangıç örneğini güncelle; yeni hareket olmadan saklanan eski delta ile hide çalışmasın.
4. Geçen Node regresyonları: yanlış id hiçbir state’i değiştirmez; doğru id temizler; iptal sonrası yeni gesture çalışır; pen cancel touch yolunu alamaz; queued hide/frame 700→701→700 döngüsünde kendiliğinden çalışmaz; yeni yeterli scroll hâlâ hide yapar; normal hide/reveal ve mevcut current-page close aynen geçer. Browser fixture native mouse capture üzerinde kimlikleri ve üç mobile genişlikte boundary iptalini sınar; henüz çalışmadı.
5. Tarayıcıda native pen/mouse capture, touch cancel, release dışarıda, dikey vazgeçme, klavye/handle, modal relocation ve normal/ürün route cancel kontrol edilir. Gesture çağrı sayısını test et; yalnız sınıf silinmesini yeterli sayma.

### P3-B: Ürün pending-focus sahipliği

Dosyalar: `assets/scripts/product-information.js`, `tests/product-focus.cjs`, `tests/dock-sheet-lifecycle-browser.cjs`.

1. `focusFrame` ve `focusGeneration` sakla; `cancelPendingFocus()` frame’i iptal edip nesli ilerletsin. Her `setOpen` isteği önce önceki işi geçersiz kılsın.
2. Yalnız mounted/open durumda yeni odak işi planla. Callback kendi neslini, `mounted`, `expanded`, hedefin bağlılığını ve mevcut sheet içinde kaldığını tekrar kontrol etsin; sonra mevcut `scrollIntoView`/`focus({preventScroll:true})` davranışını kullansın. Callback sonunda frame referansını sıfırla.
3. `unmount` bekleyen işi iptal eder. Form, closed/open state ve native Back/Forward scroll yönetimi değiştirilmedi. `pagehide/codela:before-route` için ek hook bu dar adayda yoktur; tarayıcıda yeniden üretilen ayrı hata olursa sonraki patch’e alınır.
4. Geçen Node kontrolleri: tek normal istek, açılış → aynı görevde kapat/unmount, kuyruktaki eski callback’in zorunlu teslimi, ikinci hedef isteği, detached/moved alan. Eski callback yeni frame kimliğini silemez. Browser fixture gerçek alan üzerinde invalid → close veya 700→701 unmount sonrası eski callback’i teslim eder; focus/scroll çağrısı ve form kimliğini doğrular, henüz çalışmadı.
5. Aynı form, input değerleri/listener’ları, submit sayısı ve açıklama open state’i çoklu breakpoint döngülerinde kontrol edilmeli. Hatalı form submit edilmemeli; başarılı native submit sayısı tam bir olmalı.

**Kapsamı küçük tut:** drag/settle veya BFCache için yeni başarısız test yoksa P3-B’yi tüm lifecycle’ı yeniden yazmaya büyütme. Her ek düzeltmenin önce eski kaynakta başarısız negatif kontrolü olsun. Yeni form/klavye sahibi kurma.

### Motion için daha sonraki deney ancak hangi durumda açılır?

- Önce bu native taban kabul edilir ve ölçülür. Sonra somut bir sorun seçilir: örneğin CSS settle’ın belirli bir kesinti senaryosunda aynı hedefe güvenilir ulaşamaması. “Kütüphane kullanalım” yeterli sorun tanımı değildir.
- Yalnız **ürün bırakma** olası dar deney sınırıdır; aktif drag, snap hesaplama, native form, focus, DOM taşıma ve disclosure state’i değişmez. Başarılı initialization açıkça tek hareket sahibine devretmeli; CSS ve JS aynı height’ı aynı anda sürmemeli.
- Mevcut helper’ın transform-only kontratı sessizce genelleştirilmez. Height için başlangıç inline değer/priority restore, current rendered height, finish identity, cancel/resize/mount nesli ve vendor/no-WAAPI fallback ayrı kanıtlanmalıdır.
- Classic ürün script’i ilk mount için module/vendor indirilmesini beklememeli. Bare import veya yeni çözülemeyen ESM bağımlılığı eklenmemeli. `functions.php`, build ve module kayıt değişiklikleri entegrasyon sahibinin ayrı işidir.
- Aynı 160ms/easing, aynı kapalı/açık hedef ve aynı 700px sınırı korunur. Spring/inertia/overshoot bu deneyde kapalıdır.
- Kaldırılan özel kod ve eklenen lifecycle/build kodu birlikte sayılır; tarayıcı ölçümünde performans kötüleşmemeli ve kullanıcı etkisi düzelmiş olmalı. Fayda yoksa deney çıkarılır, native yol korunur. Kalıcı iki motor veya kalıcı deney flag’i dağıtılmaz.

## 6. Kabul matrisi ve mevcut kapsam boşlukları

| Alan | Mevcut test dayanağı | Bu aşamada tamamlanacak kanıt |
|---|---|---|
| Dock gesture, dwell, current-page close | `dock-gesture.cjs` gerçek controller harness’i | Native capture, eşleşmeyen id, blur/resize/pagehide, relocation yarışı; Chromium/WebKit/Firefox |
| Sheet rAF drag | `product-drag-frame-browser.cjs`: 320/390/700 × up/cancel/blur/resize, 30 move burst | Zorunlu lost-capture, eşleşmeyen id, cancelled frame sonrası yeniden grab, kesinti sırasında reduced-motion |
| Sheet form/validation | `product-sheet-browser.cjs`: native form, quantity min/max, invalid, variation, hash, responsive/no-script | Pending focus iptali, grouped/native extension alanı, çoklu hata sırası, gerçek Woo listener/submit davranışı |
| Ürün dock gizliliği | `product-no-dock-browser.cjs`: 24 durum, no-JS, menu/search/cart/account, hedef preview/cancel | Aynı final adayda tekrar; normal motion altında da sıfır görünür kare/yanlış tıklanabilir dock |
| Tablet/desktop geri yükleme | `product-desktop-browser.cjs`, first-paint ve sheet fixture’ları | 700↔701 ve 900↔901 tekrarları; gesture/focus/validation beklerken crossing; node kimliği ve values |
| Native/core history | `document-continuity-browser.cjs`, `shell-navigation-browser.cjs`, navigation tests | Gerçek ürün sheet’i açık/kapalı ve validation beklerken Back/Forward/BFCache; tek listener/form/dock; eski focus yok |
| Klavye/viewport | Mevcut height-only toolbar resize ve native focus kontrolleri | Fiziksel iPhone Safari’de quantity, select, review/eklenti alanı, klavye açıkken hata ve close; ayrıca Android/native keyboard |
| Hareket erişilebilirliği | Token/shell CSS ve sheet reduced-motion açılışı | Tercih geçişi drag/settle/relocation ortasında; CSS/JS artığı yok, aynı işlev/odak |
| Görsel/perf | 195 referans geometrisi ve Aşama 1 pilot araçları | Aynı içerik/ağ/cihazda en az 5 tekrar; layout/paint/uzun görevler, paket parse/execute ve screenshot karşılaştırması |

Görsel genişlikler: 320, 390, 700, 701, 900, 901, 1280, 1440px. Mobile güvenli alan, kısa/uzun başlık, admin bar, footer gizli/açık, fiyatlı/varyasyonlu/fiyatsız/stok dışı durumlar korunmalı. İlgili grouped/external native davranışı sahte satın alma paneliyle değiştirilmez.

Ekran testlerinde kapalı/açık sheet’in kenarları, header/price/quantity/CTA konumu, fotoğraf kenarı ve native formun fixed containing block’u karşılaştırılmalı. Beklenmeyen yeni animasyon, opacity, bekleme süresi veya ilk-paint mount sıçraması kabul edilmez. İlk sepet pilotunun +15kB gzip genel bütçesinin altında kalmak, bu yüzeyin yararını tek başına kanıtlamaz.

## 7. Bu turdaki doğrulama ve sonraki adım

Başarılı yerel kontroller:

- `node tests/dock-gesture.cjs` (yeni pointer/breakpoint regresyonları dahil)
- `node tests/product-focus.cjs` (gerçek production fonksiyonları, kontrollü rAF sınırı)
- `node tests/panel-motion.cjs`
- `node tests/panel-motion-runtime.cjs` (gerçek pinned vendor ve cancel-only negatif kontrolü)
- `/tmp/codela-php/bin/php tests/product-composition.php`
- `PHP_BIN=/tmp/codela-php/bin/php node tests/ui-kit.cjs`
- Bölüm 4’teki ilk kaynak/VM probları: iki yanlış pointer-id iptali, queued desktop collapse ve kapanış/unmount sonrası focus callback çağrıları yeniden üretildi. Sonrasında kalıcı regresyonlar ve yukarıdaki dar düzeltmeler eklendi.
- `DOCK_SOURCE=/tmp/codela-dock-stage3-old.js node tests/dock-gesture.cjs`: 195 kaynağı, `pointercancel ignores another pointer id` kontrolünde beklenen biçimde başarısız.
- `PRODUCT_INFORMATION_SOURCE=/tmp/codela-product-stage3-old.js node tests/product-focus.cjs`: 195 kaynağı, `close cancels the queued focus frame` kontrolünde beklenen biçimde başarısız. Geçici dosyalar sabit başlangıç commit’inin ilgili blob’larından alındı; eski kod çalışma ağacına yazılmadı.
- İzole resize negatif kontrolü: 195 dock kaynağına geçici dosyada yalnız pointer-id guard’ı eklenince test, bu kez `Leaving mobile cancels the queued hide timer` kontrolünde beklenen biçimde başarısız oldu. Böylece ilk pointer hatası resize kontrolünü maskelemedi.
- İzole unmount negatif kontrolü: aynı focus testinin geçici kopyasında yalnız unmount dalı seçildi; 195 ürün kaynağı `unmount cancels the queued focus frame` kontrolünde beklenen biçimde başarısız oldu.
- İki runtime dosyası ile yeni Node/browser testlerinin `node --check` kontrolleri ve altı sahipli dosyanın `git diff --check` kontrolü geçti. Son doğrulamada yukarıdaki pozitif Node/PHP testlerinin hepsi yeniden çalıştırıldı.

**Çalıştırılmadı / bekliyor:** bu çalışma için tarayıcı suite’leri, screenshot/piksel karşılaştırması, gerçek dokunma ve sanal klavye, fiziksel cihaz, gerçek WordPress/Woo satış matrisi, yeni performans ölçümü. Geçmiş sürümlerin başarılı CI’ı bu adayın kabulü sayılmaz.

**Sıradaki somut iş:** Aşama 1’in kesin commit browser kabulünü tamamla. Aynı final adayda `dock-sheet-lifecycle-browser.cjs` Chromium/WebKit/Firefox koşularını ve mevcut ürün/form/drag/dock/gezinme matrisini çalıştır, gerçek ekranları incele. Yeni fixture için `TEST_WEBKIT=1` veya `TEST_FIREFOX=1`; PHP yolu `PHP_BIN` ile verilir. Motion’a yayılım şu anda **önerilmiyor**. Değerlendirme ve dar kaynak adayı hazırdır; Aşama 3 browser/gerçek cihaz veya birleşik ürün kabulü tamamlanmış değildir.
