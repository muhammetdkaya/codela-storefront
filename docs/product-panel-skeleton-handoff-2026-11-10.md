# Ürün paneli ve skeleton — uygulama devir notu
Tarih: 10 Kasım 2026. İncelenen sürüm: 0.1.273; HEAD f3ef6967778f5ce42b51d3634dcc6843131e4de9.
Kullanıcı yalnız tespit, çözüm ve devir notu istedi. Bu çalışmada uygulama kodu değiştirilmedi, sürüm artırılmadı, yayın yapılmadı. Sonraki uygulamada güncel HEAD yeniden kontrol edilmeli.

## Kanıt ve kapsam
Kullanıcının IMG_2701.png / IMG_2702.png / IMG_2703.jpeg / IMG_2704.png ekranları incelendi. Kapalı panelde merkezinde ek yeri olan iki siyah parça, açık panelde hafif karartma ve skeleton/gerçek ürün farkı görülebiliyor. Görseller farklı piksel çözünürlükleri ve Safari araç çubuğu durumları içeriyor; ham piksel yüksekliklerini birbirine eşitlemeyin. Aynı CSS viewport ve aynı ürünle ölçün. Bu incelemede fiziksel cihaz veya yeni tarayıcı testi yapılmadı.

## 1. Karartma yetersiz
Kaynak: theme/codela-storefront/assets/styles/product.css, .sf-product-sheet-scrim.
Mevcut gradient rgba(18,22,29,.17) → rgba(18,22,29,.09). JS scrim opacity değerini açılma oranına bağlıyor; tam açıkken opacity:1 olsa bile etkin kararma sadece %9–17.
Çözüm: açılma oranını koruyup tam açık karartmayı belirgin artırın. Başlangıç tasarım adayı: tek nötr rgba(0,0,0,.32), gerekirse .36; bunlar kullanıcı onaylı kesin değerler değildir. Ek blur eklemeyin, panelin mevcut açık cam malzemesini bozmayın. Açılırken ve kapanırken aynı oran kullanılmalı; dururken sıçrama olmamalı. Mevcut scrim z-index:999, header/panel 1000 olduğu için header karartmanın üstünde kalır. Header'ın da odak dışında kalması hedeflenirse katman sırası bilinçli düzenlenmeli; aktif panel ve satın alma kontrolleri aydınlık kalmalı. Native menü/sepet dialog katmanları korunmalı.

## 2. Tutamak tek çizgi gibi görünmüyor
Kaynak: product.css .sf-product-sheet-toggle.sf-ui-button::before / ::after; product-information.js paintDrag/finishDrag.
Mevcut iki parça 14px × 2.5px, ikisinin de border-radius:999px; merkezde bitişik duruyorlar, ortak bir çizgi değiller. Yuvarlatılmış iç uçlar ve alt piksel yumuşatma merkezde ek yeri oluşturuyor. Kullanıcı ekranında bu açıkça görülüyor; 14px genişlik testi bunun görsel doğruluğunu kanıtlamaz.
Önerilen çözüm: tek yerel SVG içinde TEK polyline/path kullanın; fill:none, stroke-linecap:round, stroke-linejoin:round. Kapalı hâlde üç nokta aynı yatay çizgide; açılma ilerledikçe yalnız orta nokta aşağı hareket ederek kesintisiz chevron oluştursun. Aynı stroke, renk, kutu genişliği ve merkez korunmalı. İki pseudo-element tamamen kaldırılmalı; üstlerine üçüncü çizgi eklemeyin. Hareket mevcut rAF açılma oranını kullansın; yeni animasyon kütüphanesi gerekmez. Mevcut 70×44 kontrol, aria-expanded/label, klavye ve reduced-motion korunmalı.
İlk HTML görünümü (product.css pending summary::before) ve skeleton tutamağı da aynı ortak ölçü/renk ile eşlenmeli. İlk görünüm → JS → sürükleme → açık hâl arasında büyüme/çift çizgi olmamalı.

## 3. Skeleton güncel ürün görünümünden ayrılmış
İlgili kaynaklar:
- assets/styles/navigation-feedback.css (yaklaşık 34–66, 188, 207)
- assets/scripts/navigation-feedback.js: destination header üretimi ve purchasePreview kullanımı
- inc/document-continuity.php: codela_sf_navigation_purchase_preview()
- functions.php: codela_sf_transition_icon(), cartIcon
- assets/styles/product.css, navigation.css, components.css, tokens.css
Hepsi theme/codela-storefront/ altındadır.

Doğrulanan farklar:
- Skeleton tutamak 44×4px ve açık gri; gerçek tutamak 28×2.5px ve koyu.
- Skeleton header katmanı padding:0 20px; gerçek ürün header 16px ortak kenar değişkeni kullanıyor.
- Skeleton SVG kuralı tüm ikonlara stroke:currentColor ekliyor. shopping-bag.svg özgün 56×56 viewBox ile dolgu tabanlı path içeriyor; ek stroke daha kalın/çift kontur görünümünün kodda somut nedeni. Gerçek ikonun paint sözleşmesi kullanılmalı, viewBox değiştirilmemeli.
- Skeleton yeni cart capsule üretiyor, mevcut sepet adet rozeti taşınmıyor. Ekranda gerçek sepet 3 iken skeleton rozetsiz. Aynı native sepet düğümünü korumak tercih edilir; zorunlu kopyada mevcut doğrulanmış adet/rozet taşınmalı, sayı uydurulmamalı.
- purchasePreview yalnız başlık/fiyat placeholder içeriyor; gerçek iki satır başlık ve kargo özetinin satır geometrisini taşımıyor. Panel yüksekliği farkının kaynakları bunlar ve bağımsız header min-height/margin/padding kurallarıdır. Tek sabit yüksekliği her ürüne dayatmayın.
- Skeleton CTA açık tonal, ikonsuz, disabled düğme; gerçek CTA koyu yüzey, beyaz çanta ikonu ve farklı yazı ağırlığında. Disabled görünümü ana tasarımı değiştirmemeli; preview etkisiz kalırken aynı görsel primitive kullanılmalı.
- Miktar alanı skeleton'da ayrı span yapısı ve 122px sabit temel kullanıyor; gerçek quantity kontrolünün ölçüleriyle karşılaştırılmalı.

Çözüm: tek ortak ürün paneli geometri/ikon/malzeme sözleşmesi. Hedef başlık/fiyat bilinmiyorsa nötr placeholder kullanılabilir; önceki ürünün fiyatı veya formu hedef ürünmüş gibi gösterilemez. Mevcut güvenli geometry aktarımı varsa genişletin; güvenilmez metin veya yeni fetch akışı eklemeyin. Kargo özeti görünürlüğü ve 1/2 satır başlık varyantlarını ortak rezervlerle yönetin. Header ikonları skeleton bloklarına dönüşmemeli.

## Uygulama ve doğrulama sırası
1. Ortak tutamak primitive ve merkez/ölçüleri.
2. Scrim opaklığı ve katman sırası.
3. Skeleton header/rozet/ikon paint'i, ardından panel/CTA/miktar geometrisi.
4. python3 scripts/build-assets.py çalıştırın. navigation-feedback.css kaynak; document-navigation.css üretilen dosyadır. Üretilen bundle tek başına düzenlenmez.
5. 320/390/402/430px; aynı ürün, tek/iki satır başlık, kargo özeti var/yok, boş/dolu sepet, Safari açık/kapalı araç çubuğu. Skeleton → gerçek görünümde header kenarı, panel üst-alt sınırı, buton/quantity ve tutamak konumlarını karşılaştırın.
6. İlk HTML, skeleton, kapalı, %25/%50 sürükleme, tam açık ekranlarını görsel olarak inceleyin. Tutamak tek birleşik çizgi olmalı; yalnız DOM genişliği testi yeterli değildir.
7. Mevcut product-sheet-handoff-browser.cjs, product-sheet-browser.cjs, product-flow-browser.cjs, product-skeleton-geometry-browser.cjs ve product-first-paint-browser.cjs ilgili beklentileri güncellenerek çalışmalı. Sayfa/panel kesintisiz hareketi, accordion dokunması, native Woo form sahipliği korunmalı.
8. Fiziksel iPhone görsel kabulünü CI başarısından ayrı kaydedin. Kullanıcı sonraki uygulamayı yetkilendirdiğinde sürüm/yayın ve AGENTS.md + docs/storefront-theme.md kayıtlarını tamamlayın.

---

## 10 Kasım 2026 — 0.1.273 → 0.1.274 ürün paneli / skeleton görsel uyumu

Ürün panelinin iki ayrı pseudo-element parçasından oluşan tutamağı, native ürün şablonu ve destination preview tarafından kullanılan tek 28px SVG path ile değiştirildi; rAF sürükleme orta noktasını kesintisiz hareket ettirir. Dokunmatik sürükleme, klavye, reduced-motion, aria-expanded ve native Woo form sahipliği korunur. Açık panel scrim'i tam ilerlemede tek nötr rgba(0,0,0,.32) renge çıkarıldı; header arka planda kararır, mevcut açık cam panel ve satın alma kontrolü önde kalır. Ek blur yoktur.

Geçiş skeleton'ı gri 44×4 çubuğu kullanmaz; aynı SVG ve ürün sayfasının başlık rezervi, gerçek ürün header'ının 16px kenarı, özgün SVG stroke/fill çizimi ve kaynak sayfadaki doğrulanmış sepet rozetini taşıyan inert görsel düğümü kullanır. Eski açık CTA yerine ikon maskesi assets/styles/tokens.css ile ortak olan koyu birincil buton yerleştirildi. Ürün başlığı/fiyatı hedef içerik yüklenince gerçek yerel düğümlere bırakılır; bir önceki ürünün verileri kopyalanmaz.

Kaynaklar: inc/ui.php, inc/product.php, inc/document-continuity.php, assets/styles/product.css, assets/scripts/product-information.js, assets/styles/navigation-feedback.css, assets/scripts/navigation-feedback.js, assets/styles/tokens.css. Generated assets: storefront-base.css, document-navigation.css, document-navigation.js. product-sheet-browser ve product-skeleton-geometry-browser koşumları tek SVG tutamak, iki nötr başlık rezervi ve 402px genişliğini doğrulayacak şekilde güncellendi.

GitHub Actions ve fiziksel iPhone kabulü ayrı doğrulanmalıdır. Bu kayıt yalnız kod güncellemesinin kapsamını belgeler; otomatik testin tamamlandığı veya canlı FTP kurulumunun yapıldığı iddia edilmez.

