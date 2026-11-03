# Ürün regresyon fixture’ları: CI3 teşhisi

Tarih: 3 Kasım 2026. İncelenen aday `6105d84293aeaa00d95ae9a3bb6f9b3610ba50d5`, CI `41646668363`. Bu düzeltme **yalnız test ve teşhis çıktısıdır**; CSS, galeri, Woo veya migration runtime’ı değiştirilmedi. Tarayıcıda yeni koşu henüz yapılmadı.

## 1. Native purchase malzemesi: kesin eski beklenti

`product-browser.cjs:72`, 900px’te `rgba(247, 247, 249, 0.96)` beklerken şeffaf değer aldı. 390px ekranı artifact’ta mevcut ve mobil native purchase ortak cam yüzeyi korunuyor. Döngüde ilk başarısız farklı malzeme genişliği 900px’tir.

Güncel ve sabit `687ef83e13621f6117264d04f220fa13c8836bb4` kaynaklarında `components.css` **aynı byte’lardan oluşuyor**. İlgili kural `@media(min-width:701px)` altında native `.sf-product-purchase` için `background:transparent`, `box-shadow:none`, `backdrop-filter:none` tanımlar. Bu, 0.1.194 ilk-paint/inline tablet sözleşmesiyle uyumludur. Ürün galeri/summary kolonlarının 901px sınırı ayrı bir yerleşim kararıdır.

Test düzeltmesi:

- Native purchase malzemesi için eski `>900` koşulu doğru `>700` sınırına çekildi; kolon/galeri/thumbnail kuralları değiştirilmedi.
- 701px döngüye eklendi; 700/701 ve 900/901 sınırları ayrı kontrol ediliyor.
- Mobilde gerçek `.96` yüzey, 10px blur ve shadow; tablet/desktop’ta transparent, blur/shadow yokluğu doğrulanıyor.
- Native form/submit, quantity validasyonu, tek gönderim, düğme geometrisi, dialog/dock gizliliği, thumbnail materyali ve kaydırması kontrolleri korundu. Beklenti gevşetilmedi ve CSS test için değiştirilmedi.

## 2. WebKit mobile-media: ara bekleme adapter’ı doğrulamıyordu

CI log’u yalnız `product-mobile-media-browser.cjs:34` son `1 / 2` beklemesinin 30 saniye dolduğunu içeriyor; o andaki DOM, alt, thumbnail veya event sırası kaydedilmemiş. Bu nedenle kesin WebKit event sırası eski log’dan çıkarılamaz.

Bununla birlikte ara bariyerdeki hata kaynak ve deterministik predicate kontrolüyle kanıtlandı:

1. Son mobile state’in sayacı zaten `1 / 3`.
2. Üçüncü node fixture tarafından `mobile` → `desktop` olarak işaretleniyor; bu bir native responsive test, runtime mutation gözlemcisi sözleşmesi değil.
3. 1280px’e geçince `<picture>` kaynağı browser tarafından `/d1.svg` yapılabilir. Bu, adapter’ın `MediaQueryList.change` callback’inin çalıştığını kanıtlamaz.
4. Eski ara bekleme sadece `count === '1 / 3' && currentSrc.endsWith('/d1.svg')` idi. Eski JS state’i hâlâ `Portrait 1`/`m1.svg` thumbnail olsa bile koşul doğrudur; test bir sonraki resize’ı erken başlatabilir.

Deterministik Node negatif kontrolü, sabit baseline testinden çıkarılan **gerçek eski predicate** ile güncel testin **gerçek yeni predicate**’ini çalıştırdı. Width1280/native d1/count1/3 fakat eski Portrait1/m1 thumbs durumu eski kontrolden geçti, yeni kontrolden geçmedi. Alt ve thumbnail desktop değerlerine döndüğünde yeni kontrol geçti. Bu, bariyerin yanlış pozitif verdiğini kanıtlar; gerçek CI timeout’un tek nedeni olduğuna dair browser kanıtı değildir.

Yeni test daha güçlü ve olaydan bağımsız bir bariyer kullanıyor: viewport + matchMedia + tam sayaç + currentSrc + **JS-owned alt, thumbnail kaynağı ve thumbnail sayısı** birlikte hedef state’e ulaşmadan başka resize yapılmıyor. `gallery-defer.js` içinde `syncAlt/buildNav` bu JS değerlerini responsive callback’te değiştirir. Native picture tek başına bu kontrolü geçiremez. Bekleme süresi artırılmadı, hedef sayaç `1 / 2` olarak kaldı.

Mevcut source/variation-reset/catalog kontrolleri korundu; ayrıca:

- Son mobile görünümde desktop-only slide’ın CSS ile gizli olması ve tam iki thumbnail bulunması kontrol ediliyor.
- Üç özgün ürün image node’u hâlâ aynı DOM nesneleri olmalı; responsive rebuild kopya image yaratamaz.
- Yeniden kurulan thumbnail image’ları native `loading="lazy"` özelliğini korumalı. Bu kontrol gerçek deferred ürün görseli ağ bütçesi testi diye sunulmaz; kapsamlı lazy/network kontrolleri mevcut ayrı media testlerinde kalır.
- Her başarılı geçiş width/media/count/alt/source/thumb/list/scroll/event bilgisini `qa/product-mobile-media-{engine}.json` dosyasına kaydeder.
- Başarısızlıkta aynı durum ve önceki geçişler `*-failure.json`, stderr ve screenshot’a yazılır. Yeni bariyer yine başarısızsa artık gerçek observer/state sorunu ile fixture zamanlaması ayrılabilir; hedefi gevşeterek geçirme yapılmaz.

## Kaynak ve doğrulama

İki testin CI3 öncesi sürümleri ve aşağıdaki runtime kaynakları sabit 195 baseline ile aynıydı. Değiştirilmeyen runtime dosyalarının byte eşitliği Node Buffer assertion’ıyla tekrar doğrulandı:

- `theme/codela-storefront/assets/styles/components.css`
- `theme/codela-storefront/assets/styles/product.css`
- `theme/codela-storefront/assets/styles/gallery.css`
- `theme/codela-storefront/assets/scripts/gallery-defer.js`

İzole product/media fixture’ları Motion veya Embla girişini yüklemiyor. Migration’dan kaynaklanan bir CSS/galeri değişikliği bu iki failure’ın kaynağı olarak gösterilemez. Önceden var olan başka bir runtime race olasılığı, tanı olmadan tamamen dışlanmış değildir.

Yerelde geçenler: iki test için `node --check`, `git diff --check`, baseline runtime byte karşılaştırması, eski/yeni media bariyeri negatif kontrolü. Chromium 390px product artifact’ı görsel olarak incelendi. CI3’teki WebKit `media-presentation` log’u kendi suite’inin geçtiğini gösteriyor; bu, mobile-media testinin geçtiği anlamına gelmez.

**Bekleyen:** düzeltilmiş product-browser Chromium koşusu ve product-mobile-media Chromium/WebKit koşuları, kesin yeni commit’in tamamlanmış CI sonucu. Yerel OS/browser engeli nedeniyle yeniden browser çalıştırılmadı; yeni testler başarılı diye raporlanamaz. Runtime düzeltmesi gerekirse önce yeni teşhis kanıtı ve baseline davranışı karşılaştırılmalı.
