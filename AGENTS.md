# Codela — çalışma ve devamlılık kuralları

Bu dosya depo genelinde çalışan asistanlar içindir. Kullanıcının güncel talimatları önceliklidir.

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
- Header: mobilde logo solda, menü sağda; arama/sepet altta. Masaüstünde menü solda, logo merkezde, arama/sepet sağda.
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
