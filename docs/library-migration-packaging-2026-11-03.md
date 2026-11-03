# Kütüphane dönüşümü: inceleme paketi, geri dönüş ve Motion kabul kapısı

3 Kasım 2026. Bu belge yayın veya canlı kurulum talimatı değildir. Adayın son kodu ve CI sonucu sabitlendikten sonra kullanılacak inceleme teslimini tarif eder.

## 1. İnceleme paketi stable sürüm değildir

Mevcut `scripts/build-package.py` deterministik ZIP üretir; tema klasöründeki `Version` değerini değiştirmez. Ancak yanında ürettiği `dist/manifest.json` **public stable indirme URL'sini** ve mevcut `config/release.json` değişiklik metnini kullanır. 195 üzerinde yeni kod paketlenirse bu URL hâlâ yayımlanmış 195 ZIP'ini gösterir, yeni adayın baytlarını değil. Bu manifest adayla birlikte gönderilmemeli ve updater/stable kanalına konmamalıdır.

Yeni yardımcı: **`tools/build-review-candidate.py`**.

- Yalnız tam 40 karakterli commit SHA kabul eder; temiz `git archive` snapshot'ı kullanır. Eşzamanlı çalışma ağacı değişiklikleri pakete karışmaz.
- Yerel ve doğrulanmış eski 195 ZIP'ini zorunlu girdi olarak alır. Hiçbir download, push, tag, release, FTP, WordPress kurulumu veya etkinleştirme yapmaz.
- Mevcut paketleyiciyi iki kez çalıştırır; aynı baytları, kaynak/hash bağını ve ZIP'in tema kimliği/path güvenliğini doğrular.
- Çıktı adı `codela-storefront-review-<TAM_SHA>.zip` olur. İçteki tema sürümünü veya tema slug'ını değiştirmez.
- `review-<TAM_SHA>.json` adıyla **updater olmayan** metadata üretir: gerçek kaynak/hash/boyut, internal tema sürümü, ayrı rollback bilgisi, eklenen/değişen managed dosyalar ve açık sınırlamalar.
- Builder'ın stable biçimli manifest'ini ve eski release değişiklik metnini dışarı kopyalamaz. Aynı isimde farklı dosyanın üzerine yazmayı reddeder.
- Önceki ZIP'le byte-identical aday için yeni inceleme paketi çıkarmayı reddeder.

Son aday sabitlenince, yerel örnek kullanım:

```sh
python3 tests/review-package.py
python3 tools/build-review-candidate.py \
  --source-sha <CI_ILE_DOGRULANMIS_TAM_COMMIT_SHA> \
  --rollback-zip <DOGRULANMIS_195_ZIP_YOLU> \
  --output-dir qa/library-migration/review-packages
```

Yardımcı Python 3.12+ `tarfile` güvenli açma desteğini kullanır. Node/npm kurmaz; vendored dosyaların mevcut paket bütünlük denetimine güvenir. Gerçek yeniden derleme eşitliği için aynı final SHA'da `npm ci --ignore-scripts`, `npm run check:vendor` ve CI kaynak testleri ayrıca geçmelidir. Final SHA henüz sabitlenmediği için nihai inceleme ZIP'i oluşturulmadı.

**Aynı sürüm cache uyarısı:** CSS URL sürümü `wp_get_theme()->get('Version')` üzerinden gelir. Yeni kodu yine 195 etiketiyle elle kurmak CSS cache'ini ayırt etmeyebilir. Bu ZIP yalnız inceleme/izole test içindir; canlı kurulum veya otomatik güncelleme paketi diye sunulmaz. Test sitesindeki cache iki yönde de açıkça temizlenmeli ve indirilen gerçek asset içerikleri doğrulanmalıdır. Gerçek yayın, ayrı yeni sürüm ve doğrulanmış release değişiklik kaydı gerektirir.

## 2. Doğrulanan geri dönüş kaynağı

- Önceki kararlı sürüm: [v0.1.195](https://github.com/muhammetdkaya/codela-storefront/releases/tag/v0.1.195).
- Release kaynak commit'i: `25f844d393ff8be55b6fae7c049f1eabc1842ebc`.
- ZIP: **208.367 bayt**, **99 dosya**.
- SHA256: **`bfddc47fccaebe2b56fc141b87756ab560206d3d09ed8b074dd1f15d9bd3c41f`**.
- 3 Kasım'da resmî GitHub release ZIP'i salt okunur indirildi; boyut/hash/tema kimliği/ZIP CRC/path kontrolleri geçti. `687ef83` kaynağından yerel deterministik yeniden üretimle byte-identical. Release kaynağı ve bu ana dalın `theme/` ağacı da aynıdır.
- Yerel kanıt: `qa/library-migration/packages/codela-storefront-0.1.195-official-rollback.json` ve yanındaki ZIP. Bu, kullanıcının mağazasında 195'in kurulu olduğu veya gerçek geri dönüşün denendiği anlamına gelmez.

195 resmi dağıtımının doğrulanması ile mağazanın gerçek kurulum yedeği farklıdır. Canlıdaki önceki sürüm veya özel değişiklikler farklı olabilir. Gerçek uygulamadan önce o ortamın tema klasörü, sürümü ve siteye özel dosyaları ayrıca yedeklenmeli; resmi ZIP bu özel dosyaları içermez.

## 3. Geri dönüş kontrol listesi

Bu liste önce **izole test ortamında** uygulanır; bu işte canlıya işlem yapılmaz.

1. Başlangıçtaki tema sürümünü ve tam klasör yedeğini kaydedin. Eklenti sürümleri, tema ayarları ve varsa siteye özel dosyaları ayrı not edin. Sipariş/müşteri verileri rollback ZIP'ine konmaz.
2. Aday paket kaynak/hash'ini metadata ile eşleştirin. Değişen dosyaları ve `candidate_only_managed_files` listesini saklayın.
3. Test kurulumu sonrası ürün, tek native Woo formu, arama/sepet/hesap, fiyat/stok/miktar ve navigation smoke kontrollerini çalıştırın. Bu aşama ödeme veya gerçek sipariş oluşturmayı kendiliğinden yetkilendirmez.
4. Geri dönüşte gerçek kurulum öncesi yedeğini esas alın. Temiz/disposable fixture ortamında tam eski tema ağacıyla değiştirin. Özel dosyaların bulunduğu ortamda kör klasör temizliği yapmayın; önce tam yedeği koruyun ve sadece kayıtlı aday managed dosyalarını uzlaştırın.
5. Eski ZIP'i mevcut klasörün üzerine yalnız ekleyerek açmak, adayın eklediği vendor/helper dosyalarını kendiliğinden kaldırmaz. Eski loader bu dosyaları kullanmasa bile “tam eski ağaca dönüldü” iddiası için ek dosya listesini kontrol edin.
6. Cache'i temizleyin; `style.css`, stylesheet ve Script Module içerikleri/hash'leri eski sürümle eşleşsin. Native alt alan/menü, değişmeyen toplam, tek form, odak/scroll ve Back/Forward kontrollerini yeniden çalıştırın.
7. Veritabanı/ayar şeması değişmemişse tema dosyası geri dönüşü yeterli olabilir; **her final adayda bu varsayımı yeniden doğrulayın**. Şema veya eklenti değişikliği varsa ayrı geri dönüş planı gerekir.

Mevcut `tests/package.py` deterministik paket, yanlış mapping'de eski temaya dokunmama, eksik secret'ta hiç bağlantı açmama ve health hatasında geri yükleme davranışlarını **mock FTP** ile sınar. Bu testlerin geçmesi gerçek WordPress updater/downgrade veya canlı FTPS geri dönüşünü kanıtlamaz. Bu oturumda bu 24 test izole Stage1 kaynağında tekrar geçti. Yeni `tests/review-package.py` aday kimliğini, ZIP güvenliğini, exact rollback hash'ini ve stable manifest'in dışarı sızmamasını sınar; WordPress kurulumu testi değildir.

## 4. Yayın otomasyonu açısından sınırlar

- Yeni `library-migration.yml` yalnız araştırma dalında no-deploy kabul için kullanılmalıdır.
- Mevcut `deploy.yml`, `main` üzerindeki tema/scripts/tests değişiklikleriyle çalışır. Deploy job'ı PR olaylarında kapanır, fakat `workflow_dispatch` bir yayınsız kontrol yolu değildir: validate geçerse deploy job'ı da aday olabilir. Salt QA için bu workflow elle başlatılmaz.
- Mevcut `release.yml`, `main` üzerindeki `.releases/storefront.json` değişikliğini açık stable yayın isteği olarak yorumlar. Bu dosya aday paket için değiştirilmez.
- Eski `v0.1.195` tag'i, asset'i veya stable manifest'i yeni kodla değiştirilmez. Release workflow aynı sürümün farklı kaynak/baytla yeniden kullanılmasını zaten reddeder; bu koruma bypass edilmez.
- Daha sonraki gerçek yayından önce yeni vendor reproducibility denetiminin release kapısına da bağlandığı doğrulanmalı. Yalnız manifest'teki hash'leri kontrol etmek, build script'i değiştiğinde çıktının gerçekten yeniden derlendiğini tek başına kanıtlamaz.

## 5. Motion ile düzeltilmiş native WAAPI karşılaştırması

### Şu an kanıtlananlar

- Motion helper, vendor 404/abort/geçersiz export/yükleme gecikmesi durumunda global storefront graph'ını bozmamak için catch edilen dinamik import'a geçirildi. İlk eylem vendor beklemeden native WAAPI kullanabilir. Bu kodun bulunması browser kabulünün geçtiği anlamına gelmez.
- Düzgün ters yön için başlangıç konumu controller'da `getComputedStyle(dialog).transform` ile örneklenir. **Aynı düzeltme hem Motion hem native fallback'e verilir.** Dolayısıyla eski 195'in sabit uç konumuyla karşılaştırılan sıçrama farkını yalnız Motion'un faydası saymak yanlış olur.
- Pinned Motion runtime'ın `cancel()` yolunda kuyruktaki finish callback'inin endpoint commit etmesi negatif kontrolde yeniden üretildi. Adaptör `stop()` + kendi state kimliği + inline-style restorasyonuyla bunu sınırlar. Bu faydalı bir sağlamlık düzeltmesidir; kütüphaneye geçmenin bağımsız kazanımı değildir.
- Stage1'de vendor paketinin tek başına gzip maliyeti **3.328 bayt**. Tam yeni import/adapter/controller maliyeti final kaynakta tekrar hesaplanmalıdır. Dinamik import modül yüklenirken hemen başlatıldığı için “yalnız masaüstü sepet açıldığında indirilir” iddiası doğru değildir.

### Adil üçlü kıyas

| Yol | Amaç |
|---|---|
| Sabit 195 controller | Mevcut yayımlanmış deneyimi ve eski hatayı göstermek |
| Düzeltilmiş native WAAPI | Aynı örneklenmiş başlangıç, cancellation/restore ve aynı CSS süreleriyle kütüphanesiz kontrol |
| Motion | Aynı controller/token/içerik üzerinde yalnız animasyon aracını değiştirmek |

`fallback` fixture'ı her animasyonda bilerek exception fırlatan vendor kullanıyorsa **adil native performans kontrolü değildir**; throw/catch maliyeti sadece bu kola yüklenir. Native-only kontrol, Motion yüklemeden aynı native animasyon yolunu kullanmalı. Mevcut `bad-export`/vendor-yok yolu, exception-per-animation olmadan bu davranışı test etmeye temel olabilir; adı ve ölçüm kapsamı açıkça yazılmalıdır.

### Kabul için gerekli kanıt

1. Her üç yolda aynı geometri, focus/scroll, modal sahipliği, 240/180ms token'ları, reversal, reduced-motion ve navigation sonuçları. Aynı içerikli baseline/Motion/native ekranları yan yana incelenir. Commerce stubları gerçek sepet kabulü diye sunulmaz.
2. Aynı engine/cihaz/ağ/CPU/cache koşulu; en az beş tekrar, tercihen sıra etkisini azaltan dönüşümlü çalıştırma. İlk yük ile sıcak etkileşim ayrı kaydedilir.
3. Yalnız Motion'un düzeltilmiş native'e karşı getirdiği somut yetenek veya ölçülen kalite farkı belirtilir. Aynı işi yapıyorsa “daha akıcı” varsayılmaz. Node mock callback testleri gerçek cihaz hissini kanıtlamaz.
4. Yeni asset istekleri, gzip aktarım, parse/execute, frame dağılımı ve uzun görevler kaydedilir. Testteki kasıtlı 300ms bekleme dahil toplam `elapsed` hız avantajı değildir. Desteklenmeyen `longtask` API'sinde sıfır, “uzun görev yok” kanıtı sayılmaz.
5. Ölçülen fark laboratuvar gürültüsü içinde kalırsa sonuç “kanıtlanmış fark yok” olarak yazılır. Donanım/gerçek Safari kabulü açık kalır.
6. Somut artı fayda çıkmazsa Motion bu yüzeyde üretim için kabul edilmez; düzeltilmiş native yol korunabilir. Bu kullanıcıya veya bir kütüphaneye karşı tercih beyanı değil, raporun önceden belirlediği **fayda göstermeyen ek yükü yayımlamama** kapısıdır.

## 6. Nihai teslimde bulunması gerekenler

- Her aşamanın tamamlandı/test edildi/bekliyor/reddedildi durumu; kullanılan ve özellikle alınmayan kütüphanelerin gerekçesi.
- Final kaynak SHA, dal/PR bağlantısı, aynı SHA'nın CI koşuları, test kapsamı ve gerçek cihaz/ödeme gibi kalan kapılar.
- Stage0 ile final aynı içerikli ekranlar, graph düzeyinde bütçe ve ölçüm yöntemi.
- Lisans/sürüm/kaynak listesi; kaldırılan eski davranışlar ve tek sahiplik kanıtı.
- Tek anlamlı isimli review ZIP, updater olmayan metadata, doğrulanmış eski ZIP ve uygulanabilir geri dönüş listesi.
- “GitHub'da kod”, “stable release”, “mağazaya kurulum” durumlarının ayrı belirtilmesi. Bu çalışma için son iki durum yapılmış kabul edilmez.
