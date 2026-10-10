# Codela — çalışma ve devamlılık kuralları

Bu dosya depo genelinde çalışan asistanlar içindir. Kullanıcının güncel talimatları önceliklidir.

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
- Header: logo solda; arama, sepet ve menü sağda.
- Menü, arama ve sepet aynı görsel/etkileşim dilinde **tam ekran** açılır. Onaylanan yön Apple örneğindeki tam ekran menüdür; sayfayı yana iten menü önceki alternatifti.
- Açılışta panel aşağı iner, kapanışta yukarı çıkar; ikon hareketi panelle eşzamanlıdır. Hareket azaltma tercihi, klavye, odak ve kaydırma konumu korunur.
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
