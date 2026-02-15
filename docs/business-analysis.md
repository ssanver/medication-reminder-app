# İş Analizi Dokümanı

## 1. Doküman Bilgisi
- Proje Adı: İlaç Hatırlatma Uygulaması
- Doküman Tipi: İş Analizi Dokümanı
- Versiyon: 1.1
- Tarih: 2026-02-15
- Kaynak Dokümanlar:
  - `docs/business-requirements-document.md`
  - `docs/end-user-requirements.md`

## 2. Amaç ve Kapsam
Bu doküman, BRD'deki iş gereksinimlerini geliştirilebilir backlog'a dönüştürür; iş kurallarını, istisnaları, öncelikleri ve kabul kriterlerini netleştirir.

Kapsam, BRD kapsam dahil maddeleriyle birebir hizalıdır. Kapsam dışı maddeler (eczane/sigorta canlı entegrasyonu, doktor reçete sistemi çift yönlü entegrasyon, klinik karar desteği) bu dokümanda backlog dışı bırakılmıştır.

## 3. İzlenebilirlik Özeti (İhtiyaç -> BRD -> Story)

| Son Kullanıcı İhtiyacı | BRD Referansı | Story ID |
|---|---|---|
| İlaç ekleme ve çoklu saat tanımı | FR-01, FR-02, FR-03 | US-01, US-02 |
| Bildirim alma ve aksiyon verme | FR-04, FR-05 | US-03 |
| Geçmiş takibi | FR-06 | US-04 |
| Stok ve düşük stok uyarısı | FR-07 | US-05 |
| Reçete yenileme | FR-08 | US-06 |
| Randevu/tahlil hatırlatmaları | FR-09 | US-07 |
| Offline temel çalışma | FR-10 | US-08 |
| Cihazlar arası senkronizasyon | FR-11 | US-09 |
| Bakıcı erişimi | FR-12 | US-10 |
| Acil paylaşım | FR-13 | US-11 |
| TR/EN dil desteği | FR-14 | US-12 |
| 5 adım onboarding | FR-15 | US-13 |
| Güvenlik ve KVKK | NFR-03, NFR-04, NFR-07 | US-14 |
| Erişilebilirlik | NFR-05 | US-15 |

## 4. İş Kuralları ve İstisnalar (Detaylandırma)

### 4.1 Temel İş Kuralları
- BK-01: İlaç kaydı için en az 1 hatırlatma saati zorunludur.
- BK-02: Bir ilaç için maksimum 12 hatırlatma saati tanımlanabilir.
- BK-03: Geçmişe dönük doz işaretleme yapılabilir; kullanıcı zamanı ve sistem zamanı ayrı tutulur.
- BK-04: Stok miktarı tam sayı olmalı ve 0'ın altına düşmemelidir.
- BK-05: Bakıcı erişimi açık rıza ile açılır; rıza geri alındığında erişim anında kapatılır.
- BK-06: Acil paylaşım varsayılan olarak yalnızca ilaç adı, doz, kullanım sıklığı alanlarını içerir.
- BK-07: TR/EN dil seçimi onboarding'de zorunlu adım değildir; sistem dili varsayılanı önerilir.
- BK-08: Reklamsız deneyim, abonelik paketine bağlı özellik olarak sunulabilir.
- BK-09: Veri saklama politikası Faz 1 ve Faz 2 için süresiz saklama olarak uygulanır; Faz 3'te yeniden değerlendirilir.

### 4.2 İstisnalar
- IST-01: Bildirim izni yoksa, kullanıcıya uygulama içinde kalıcı uyarı bandı gösterilir.
- IST-02: Cihaz saati değişirse bir sonraki hatırlatma planı otomatik yeniden hesaplanır.
- IST-03: Offline durumda yapılan doz işaretlemeleri "senkron bekliyor" statüsüyle tutulur.
- IST-04: Silinen ilaç geçmiş kayıtları raporlama bütünlüğü için anonimleştirilmiş olarak saklanır.

## 5. User Story Seti (INVEST Uyumlu)

## 5.1 Must-Have (MVP)

### US-01 (P1) - İlaç Kartı Yönetimi
As a kullanıcı, I want ilaç kartı ekleyip düzenleyebilmek, so that tedavi planımı uygulama üzerinden yönetebileyim.

Kabul Kriterleri:
1. Kullanıcı ilaç adı, doz, kullanım tipi, aç/tok, başlangıç tarihi alanlarını girebilir.
2. Bitiş tarihi opsiyoneldir, başlangıç tarihinden küçük olamaz.
3. En az 1 hatırlatma saati olmadan kayıt tamamlanamaz.
4. Kayıt sonrası ilaç kartı liste ekranında 2 saniye altında görünür.

### US-02 (P1) - Tekrarlı Plan ve Çoklu Saat
As a kullanıcı, I want aynı ilaç için birden fazla saat ve tekrar kuralı tanımlamak, so that günlük rutinimi kaçırmayayım.

Kabul Kriterleri:
1. Günlük ve haftalık tekrar tipi seçilebilir.
2. Haftalık seçimde en az 1 gün zorunludur.
3. Aynı saat için mükerrer kayıt engellenir.
4. Sistem seçilen kurala göre sonraki 30 günü planlayabilir.

### US-03 (P1) - Bildirim Aksiyonu
As a kullanıcı, I want bildirime aldım/almadım/ertele aksiyonları verebilmek, so that doz durumumu doğru takip edebileyim.

Kabul Kriterleri:
1. Bildirimde üç aksiyon birlikte görünür.
2. Ertele seçeneği 5, 10, 15 dakika presetleri sunar.
3. Verilen aksiyon, en geç 3 saniye içinde geçmiş ekranına yansır.
4. Her aksiyon için olay kaydı (event log) oluşturulur.

### US-04 (P1) - Geçmiş Görüntüleme
As a kullanıcı, I want günlük/haftalık geçmişimi görebilmek, so that uyumumu değerlendirebileyim.

Kabul Kriterleri:
1. Geçmiş ekranı "aldım/almadım/ertelendi" durumlarını ayrı filtreleyebilir.
2. Günlük özet, kaç doz planlandı-kaçı alındı oranını gösterir.
3. Haftalık görünümde tarih aralığı seçimi yapılabilir.

### US-05 (P1) - Stok Takibi
As a kullanıcı, I want stok miktarını takip edip eşik altı uyarı almak, so that ilacım bitmeden önlem alayım.

Kabul Kriterleri:
1. Kullanıcı başlangıç stok ve eşik değeri tanımlar.
2. Her "aldım" aksiyonunda stok otomatik düşer.
3. Eşik altına düştüğünde 1 dakika içinde uyarı üretilir.
4. Stok değeri negatif olamaz.

### US-06 (P1) - Reçete Yenileme Hatırlatması
As a kullanıcı, I want reçete yenileme tarihi için önceden uyarılmak, so that tedavim kesintiye uğramasın.

Kabul Kriterleri:
1. Kullanıcı yenileme tarihini tanımlar.
2. T-7, T-3, T-1 gün bildirim seçenekleri sunulur.
3. Kullanıcı özel gün offset'i tanımlayabilir (ör. T-5).
4. Özel gün ve sabit şablonlar birlikte seçildiğinde mükerrer bildirim oluşturulmaz.

### US-08 (P1) - Offline Temel Çalışma
As a kullanıcı, I want internet yokken de planlı hatırlatmaların çalışması, so that bağlantıdan bağımsız takip yapabileyim.

Kabul Kriterleri:
1. Daha önce planlanmış hatırlatmalar offline tetiklenir.
2. Offline tetikleme oranı test senaryosunda en az %95 olmalıdır.
3. Offline aksiyonlar bağlantı geldiğinde otomatik senkron kuyruğuna alınır.

### US-12 (P1) - TR/EN Dil Desteği
As a kullanıcı, I want Türkçe ve İngilizce arasında geçiş yapabilmek, so that uygulamayı tercih ettiğim dilde kullanayım.

Kabul Kriterleri:
1. Ayarlardan dil değiştirildiğinde metinler anında güncellenir.
2. Çeviri olmayan anahtar metin bulunmaz.
3. Tarih/saat formatı seçili dile uygun görüntülenir.

### US-13 (P1) - Basit Onboarding
As a yeni kullanıcı, I want 5 adımdan kısa bir kurulum, so that uygulamaya hızlı başlayabileyim.

Kabul Kriterleri:
1. Onboarding adım sayısı maksimum 5'tir.
2. Kullanıcı 2 dakika içinde ilk ilaç ekleme akışına ulaşabilir.
3. Bildirim izni reddedilirse alternatif rehber adımı gösterilir.

## 5.2 Should-Have

### US-07 (P2) - Randevu ve Tahlil Hatırlatma
As a kullanıcı, I want doktor randevusu ve tahlil tarihleri eklemek, so that sağlık takvimimi tek yerde yöneteyim.

Kabul Kriterleri:
1. Randevu/tahlil için tarih-saat ve not alanı girilir.
2. Etkinlikler liste ve takvim görünümünde gösterilir.
3. Etkinlik öncesi hatırlatma (1 gün/1 saat) seçilebilir.

### US-09 (P2) - Cihazlar Arası Senkronizasyon
As a kullanıcı, I want telefon ve tablette aynı veriyi görmek, so that cihaz değiştirsem de takip devam etsin.

Kabul Kriterleri:
1. Aynı hesapla ikinci cihaz girişinde son veri 60 saniye içinde gelir.
2. Çakışan güncellemede "son güncelleyen kazanır" kuralı uygulanır ve kullanıcı bilgilendirilir.
3. Senkron hatası durumunda tekrar deneme mekanizması devreye girer.

### US-10 (P2) - Bakıcı Erişimi
As a kullanıcı, I want bir bakıcıyı davet edip sınırlı görünüm vermek, so that gerektiğinde destek alabileyim.

Kabul Kriterleri:
1. Davet bağlantısı/kimlik doğrulama ile bakıcı eşleştirilir.
2. Varsayılan profilde bakıcı tüm modülleri görüntüleyebilir.
3. Kullanıcı, ayarlar ekranından modül bazlı yetki kısıtı uygulayabilir.
4. Kullanıcı erişimi kapattığında bakıcı oturumu anında yetkisiz olur.

### US-11 (P2) - Acil Durum Paylaşımı
As a kullanıcı, I want acil durumda ilaç listemi hızlı paylaşmak, so that sağlık personeli doğru bilgiye hızla erişsin.

Kabul Kriterleri:
1. Tek aksiyonla paylaşılabilir özet ekranı açılır.
2. Paylaşımda sadece kullanıcının işaretlediği alanlar yer alır.
3. Paylaşım denetim izi (zaman, kanal) tutulur.

## 5.3 Non-Functional Storyler

### US-14 (P1) - Güvenlik ve KVKK Uyumu
As a kurum, I want KVKK uyumlu veri işleme ve güçlü şifreleme, so that yasal ve güvenlik riskleri azaltılsın.

Kabul Kriterleri:
1. Açık rıza metni onboarding'de sunulur ve onay kaydı tutulur.
2. Veri aktarımında TLS, hassas saklamada güçlü şifreleme kullanılır.
3. Log kayıtlarında kişisel sağlık verisi maskeleme kuralı doğrulanır.

### US-15 (P1) - Erişilebilirlik
As a kullanıcı, I want okunabilir ve erişilebilir arayüz, so that yaş ve görsel ihtiyaçlardan bağımsız kullanabileyim.

Kabul Kriterleri:
1. Uygulama yazı boyutu en az 3 kademe büyütülebilir.
2. Kontrast oranları kritik metinlerde erişilebilirlik hedeflerini karşılar.
3. Temel ekranlar ekran okuyucu etiketleri ile testten geçer.

## 6. Önceliklendirilmiş Ürün Backlog'u

| Story ID | Öncelik | Faz | Bağımlılık | Not |
|---|---|---|---|---|
| US-01 | P1 | Faz 1 | - | MVP çekirdek |
| US-02 | P1 | Faz 1 | US-01 | Planlama motoru |
| US-03 | P1 | Faz 1 | US-02 | Bildirim kanalı |
| US-04 | P1 | Faz 1 | US-03 | Geçmiş modeli |
| US-05 | P1 | Faz 1 | US-03 | Stok kuralı |
| US-06 | P1 | Faz 2 | US-01 | Tarih bazlı tetik |
| US-08 | P1 | Faz 2 | US-02 | Yerel scheduler |
| US-12 | P1 | Faz 1 | - | TR/EN |
| US-13 | P1 | Faz 1 | US-01, US-12 | Onboarding |
| US-07 | P2 | Faz 2 | US-01 | Sağlık takvimi |
| US-09 | P2 | Faz 3 | US-01..US-08 | Senkron servis |
| US-10 | P2 | Faz 3 | US-09 | Yetki modeli |
| US-11 | P2 | Faz 3 | US-01, US-10 | Acil paylaşım |
| US-14 | P1 | Faz 1-3 | Tüm modüller | Yatay gereksinim |
| US-15 | P1 | Faz 1-3 | Tüm ekranlar | Yatay gereksinim |

## 7. NFR Analizi ve Doğrulama Yaklaşımı

| NFR | Hedef | Ölçüm Yöntemi | Kabul Eşiği |
|---|---|---|---|
| NFR-01 | Bildirim gecikmesi | Uçtan uca olay zamanı ölçümü | Ortalama < 5 sn |
| NFR-02 | Ekran açılış süresi | Performans izleme SDK metrikleri | P95 < 2 sn |
| NFR-03 | KVKK uyumu | Rıza ve veri işleme denetimi | Zorunlu alanlar %100 |
| NFR-04 | Şifreleme | Güvenlik test checklist | Kritik bulgu 0 |
| NFR-05 | Erişilebilirlik | WCAG tabanlı UI testi | Kritik akışlarda geçer |
| NFR-06 | Erişilebilirlik oranı | Aylık servis raporu | >= %99.5 |
| NFR-07 | Log maskeleme | Log örneklem kontrolü | PHI sızıntısı 0 |

## 8. İş Birimi Kararları ve Açık Konu

Karara Bağlananlar:
1. US-05 stok takibi Faz 1 kapsamına alındı.
2. Bakıcı rolü varsayılan olarak tüm verileri görebilir; kullanıcı sonradan ekran bazlı yetki kısıtı uygulayabilir.
3. Reçete yenilemede sabit şablonlara ek olarak özel gün seçimi desteklenecek.
4. Reklamsız deneyim abonelik paketi kapsamında sunulabilecek.
5. Veri saklama Faz 1 ve Faz 2'de süresiz olacak; ileri fazlarda politika tekrar değerlendirilecek.
6. Senkron çakışma kuralı: son güncelleyen kayıt esas alınır.

## 9. Kabul ve Çıkış Kriterleri

- Yüksek öncelikli tüm storyler için acceptance criteria yazılmış olmalıdır.
- Her story en az bir BRD maddesine izlenebilir olmalıdır.
- Açık karar noktaları iş birimi tarafından onaylanmadan geliştirme sprintine alınmamalıdır.
- QA test senaryoları, bu dokümandaki kriterlerle birebir eşleştirilmelidir.
