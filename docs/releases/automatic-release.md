# Olay tabanlı, yetkili yayın zinciri

Her sürüm adayı için normal PR oluşturun ve sürüm numarasını yükseltin. Kullanıcı yayını yetkilendirdiğinde, depo sahibi hesabından PR'a şu tek satırlık komutu gönderin (tam SHA değerleriyle):

    /codela-publish HEAD_SHA BASE_SHA VERSION

HEAD_SHA, PR dalının mevcut tam commit SHA'sı; BASE_SHA, main'in onaylanan tam SHA'sı; VERSION, başlıktaki yeni sürüm. Bu komutun gönderilmesi için CI'nin bitmesi beklenmez. Onay yalnızca o iki değişmez SHA'ya bağlıdır. PR başı veya ana dal değişirse yeniden yetki gerekir. Yayından önce iptal etmek için:

    /codela-cancel

Yalnızca depo sahibinin yorumları ve aynı depodaki main hedefli normal PR'lar kabul edilir. Taslak, yabancı depo, eski açık PR, CI/yayın altyapısı değişikliği ve sürüm düşürme otomatik birleştirilmez. CI workflow'larının dosya filtrelerine göre gereken tüm PR kontrollerinin mevcut head/base için başarıyla tamamlanması gerekir. Başarısız, atlanmış veya eksik kontrol yayını ilerletmez. GitHub token ile yapılan birleştirmelerin normal push iş akışlarını tetiklememesi nedeniyle mevcut deploy ve release workflow'ları açıkça dispatch edilir. FTP adımının gerçekten çalışması ve ilgili canlı kontrolün başarılı olması zorunludur. Kaynak SHA ve sürüm release manifestine yazılır; GitHub ZIP, stable manifest (tema) veya checksum dosyası (eklenti) doğrulanır. WordPress.org yayını yapılmaz.

Codela authorized release chain Actions ekranı aşamaları gösterir; olaylar tamamlandıkça ilerler. Aynı zinciri manuel olarak yeniden tetiklemek gerekiyorsa Actions > Codela authorized release chain > Run workflow; mevcut yetkilendirme olmadan hiçbir PR yayınlanmaz. Bir hata düzeltmesi yeni SHA ve yeni yetki satırı gerektirir. Yeni workflow filtresi eklendiğinde zincirin workflow_run listesini de güncelleyin; offline sözleşme testi eksik olayı yakalar.

Ek güvenlik: aday head, onaylanan main commit'ini içermelidir; squash sonrasında dosya ağacı test edilen head ile birebir eşleşir. Manifest yazımı non-force fast-forward kontrolüyle yapılır ve yayın dispatch'i tam manifest commit'ine bağlıdır. İki depo birlikte değişecekse gerekli eklenti sürümü önce GitHub'da yayınlanmalıdır.
