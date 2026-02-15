# Teknik Analiz Dokümanı

## 1. Doküman Bilgisi
- Proje Adı: İlaç Hatırlatma Uygulaması
- Doküman Tipi: Teknik Analiz Dokümanı
- Versiyon: 1.1
- Tarih: 2026-02-15
- Girdi Dokümanlar:
  - `docs/business-requirements-document.md`
  - `docs/business-analysis.md`

## 2. Teknoloji Kararları
- Mobil Uygulama: React Native
- Backend API: .NET 8 (ASP.NET Core Web API)
- Veritabanı: Microsoft SQL Server
- ORM: Entity Framework Core
- Mimari Yaklaşım: Katmanlı + modül bazlı (medication, reminder, inventory, caregiver, sync)
- Veri Senkronizasyonu: Sunucu kaynaklı senkron + istemci offline kuyruk
- Çakışma Çözümü: Son güncelleyen kazanır (LWW - Last Write Wins)
- Şema Yönetimi: Tüm veritabanı değişiklikleri EF Core migration ile yapılır.

## 3. Çözüm Yaklaşımı ve Modül Kırılımı
- `mobile-app` (React Native):
  - Onboarding ve dil seçimi
  - İlaç, plan, bildirim aksiyonları
  - Geçmiş, stok, reçete ve sağlık takvimi ekranları
  - Offline kayıt kuyruğu ve senkron tetikleme
- `api` (.NET 8):
  - Kimlik, yetki ve bakıcı erişim yönetimi
  - İlaç/plan/doz/stok CRUD servisleri
  - Reçete ve etkinlik hatırlatma kuralları
  - Senkronizasyon endpoint'leri ve denetim kayıtları
  - EF Core DbContext ve migration tabanlı şema sürümleme
- `notification-service`:
  - Push/local bildirim tetikleme
  - Ertele ve aksiyon callback işleme
- `audit-observability`:
  - Maskeleme kurallı loglama
  - Performans ve hata metrikleri

## 4. Veri Modeli Etki Analizi
- Ana Varlıklar:
  - `user`
  - `caregiver-invite`
  - `caregiver-permission`
  - `medication`
  - `medication-schedule`
  - `dose-event`
  - `inventory`
  - `prescription-reminder`
  - `health-event` (randevu/tahlil)
  - `sync-event`
  - `audit-log`
- Kritik Alanlar:
  - Tüm yazma işlemlerinde `updated-at` zorunlu (LWW için).
  - `dose-event` hem kullanıcı zamanı hem sistem zamanı tutar.
  - `inventory` negatif değeri engelleyen kural içerir.
  - `caregiver-permission` ekran/modül bazlı yetki seviyesi saklar.
  - Migration geçmişi SQL Server üzerinde izlenebilir olmalıdır (`__EFMigrationsHistory`).

## 4.1 Veritabanı ve Migration Stratejisi
- SQL Server, prod ve test ortamlarında birincil veritabanıdır.
- Şema güncellemesi doğrudan SQL script ile değil, EF Core migration ile yapılır.
- Her migration geri alınabilir (rollback) ve CI hattında doğrulanabilir olmalıdır.
- Migration adlandırması iş kuralı veya modül etkisini yansıtmalıdır (örn. `add-medication-schedule-index`).

## 5. API Etki Analizi (Yüksek Seviye)
- `POST /api/medications`, `PUT /api/medications/{id}`, `DELETE /api/medications/{id}`
- `POST /api/medications/{id}/schedules`
- `POST /api/dose-events/action` (`taken`, `missed`, `snooze`)
- `GET /api/dose-events/history`
- `POST /api/inventory/update`, `GET /api/inventory/alerts`
- `POST /api/prescription-reminders`
- `POST /api/health-events`
- `POST /api/caregivers/invite`, `PUT /api/caregivers/{id}/permissions`
- `POST /api/sync/pull`, `POST /api/sync/push`
- `POST /api/emergency-share/token`

## 6. Bağımlılıklar ve Teknik Riskler
- Bağımlılıklar:
  - iOS/Android bildirim altyapıları
  - Kimlik altyapısı ve token yönetimi
  - Güvenli saklama (anahtar/değer + şifreli depolama)
- Teknik Riskler:
  - Üretici bazlı bildirim farklılıkları
  - Offline/online geçişte çift kayıt riski
  - LWW nedeniyle veri kaybı algısı (kullanıcıya bilgilendirme gerekli)
- Azaltım Planı:
  - Platform test matrisi
  - İdempotent API ve istemci event-id
  - Senkron sonuç ekranı ve olay geçmişi

## 7. Efor ve Faz Önerisi
- Faz 1 (MVP): PBI-001..PBI-008, PBI-011, PBI-012
- Faz 2: PBI-009, PBI-010
- Faz 3: PBI-013, PBI-014

## 8. PBI Backlog (Geliştiriciye Hazır)

### PBI-001 - Proje İskeleti ve CI Temeli
- Kapsam: React Native, .NET 8, SQL Server ve EF Core temel iskelet + build/test pipeline.
- Kabul Kriterleri:
1. `mobile-app` ve `api` klasörleri ayrı çalıştırılabilir olmalıdır.
2. API sağlık endpoint'i (`/health`) 200 dönmelidir.
3. Mobil uygulama debug modunda açılmalıdır.
4. API projesinde SQL Server bağlantısı ve EF Core DbContext yapılandırılmış olmalıdır.
5. İlk migration oluşturulup veritabanına uygulanabilir olmalıdır.

### PBI-002 - Onboarding, Açık Rıza ve Dil Seçimi
- Kapsam: 5 adım onboarding, bildirim izni akışı, TR/EN başlangıç dili.
- Kabul Kriterleri:
1. Onboarding adımı maksimum 5 olmalıdır.
2. Bildirim izni reddedilirse alternatif yönlendirme görünmelidir.
3. Dil değişimi anında UI'a yansımalıdır.

### PBI-003 - İlaç Kartı CRUD
- Kapsam: İlaç ekle/düzenle/sil ve doğrulama kuralları.
- Kabul Kriterleri:
1. En az bir hatırlatma saati olmadan kayıt alınmamalıdır.
2. Bitiş tarihi başlangıç tarihinden önce olamamalıdır.
3. CRUD işlemleri başarı/hata durumunda kullanıcıya geri bildirim vermelidir.

### PBI-004 - Tekrarlayan Planlama Motoru
- Kapsam: Günlük/haftalık kural, çoklu saat, mükerrer saat engeli.
- Kabul Kriterleri:
1. Haftalık modelde en az bir gün seçimi zorunlu olmalıdır.
2. Aynı ilaçta aynı saate ikinci kayıt engellenmelidir.
3. Sonraki 30 gün planı üretilebilmelidir.

### PBI-005 - Bildirim ve Aksiyon İşleme
- Kapsam: Bildirim tetikleme, aldım/almadım/ertele aksiyonları.
- Kabul Kriterleri:
1. Üç aksiyon bildirim üzerinde görünmelidir.
2. Ertele seçenekleri 5/10/15 dakika sunulmalıdır.
3. Aksiyon sonucu 3 saniye içinde geçmişe yansımalıdır.

### PBI-006 - Doz Geçmişi ve Özet
- Kapsam: Günlük/haftalık geçmiş filtreleme ve uyum oranı.
- Kabul Kriterleri:
1. `aldım/almadım/ertelendi` filtreleri çalışmalıdır.
2. Günlük özet planlanan ve alınan doz oranını göstermelidir.
3. Haftalık tarih aralığı seçilebilmelidir.

### PBI-007 - Stok Takibi ve Eşik Uyarısı
- Kapsam: Stok tanımı, otomatik düşüm, eşik altı alarm.
- Kabul Kriterleri:
1. Stok negatif olamamalıdır.
2. `aldım` sonrası stok otomatik azalmalıdır.
3. Eşik altı uyarı 1 dakika içinde üretilmelidir.

### PBI-008 - Reçete Yenileme Hatırlatması
- Kapsam: T-7/T-3/T-1 + özel offset günleri.
- Kabul Kriterleri:
1. Sabit şablonlar seçilebilir olmalıdır.
2. Kullanıcı özel gün tanımlayabilmelidir.
3. Mükerrer bildirim üretilmemelidir.

### PBI-009 - Offline Çalışma ve Senkron Kuyruğu
- Kapsam: Offline hatırlatma tetikleme ve online dönüşte push.
- Kabul Kriterleri:
1. Offline önceden planlanmış hatırlatmalar çalışmalıdır.
2. Offline aksiyonlar kuyrukta tutulmalıdır.
3. Bağlantı sonrası otomatik senkron denenmelidir.

### PBI-010 - Randevu/Tahlil Hatırlatma
- Kapsam: Sağlık etkinliği ekleme, liste/takvim görünümü, ön bildirim.
- Kabul Kriterleri:
1. Randevu/tahlil kaydı tarih-saat-not ile eklenebilmelidir.
2. 1 gün ve 1 saat önce hatırlatma kuralı desteklenmelidir.
3. Liste ve takvim görünümü tutarlı veri göstermelidir.

### PBI-011 - Güvenlik, KVKK ve Log Maskeleme
- Kapsam: Açık rıza kaydı, güvenli veri taşıma/saklama, log maskeleme.
- Kabul Kriterleri:
1. Rıza kaydı denetlenebilir olmalıdır.
2. Hassas alanlar loglarda maskelenmiş olmalıdır.
3. Yetkisiz erişim denemeleri audit-log'a yazılmalıdır.

### PBI-012 - Erişilebilirlik ve Performans Hedefleri
- Kapsam: Yazı ölçekleme, kontrast, kritik ekran performansı.
- Kabul Kriterleri:
1. Yazı boyutu en az 3 kademede artırılabilmelidir.
2. Kritik metinlerde erişilebilirlik kontrastı sağlanmalıdır.
3. Kritik ekran P95 açılış süresi 2 saniye altında ölçülmelidir.

### PBI-013 - Bakıcı Erişimi ve Yetki Kısıtlama
- Kapsam: Bakıcı daveti, varsayılan tam görünüm, sonradan kısıtlama.
- Kabul Kriterleri:
1. Davet akışı ile bakıcı eşleştirme tamamlanmalıdır.
2. Varsayılan durumda bakıcı tüm modülleri görebilmelidir.
3. Kullanıcı modül bazlı yetkiyi sonradan kısıtlayabilmelidir.

### PBI-014 - Acil Durum Paylaşımı
- Kapsam: Tek aksiyonla paylaşım özeti ve paylaşım denetim izi.
- Kabul Kriterleri:
1. Paylaşım ekranı tek aksiyonla açılmalıdır.
2. Sadece izinli alanlar paylaşım içeriğine girmelidir.
3. Paylaşım zamanı/kanalı audit-log'a kaydedilmelidir.

## 9. Handoff (Technical Analyst -> Developer)
- Geliştirici başlangıç sırası: PBI-001 -> PBI-002 -> PBI-003 -> PBI-004 -> PBI-005.
- Her PBI'da iş analizi referansı (`US-xx`) issue açıklamasında belirtilmelidir.
- Geliştirme başlamadan önce API sözleşmesi ve mobil state modeli PBI-001 çıktısında dondurulmalıdır.
- Geliştirme başlamadan önce SQL Server bağlantı politikası ve EF migration akışı PBI-001 çıktısında dondurulmalıdır.

## 10. GitHub Issue Eşlemesi
- PBI-001: [Issue #1](https://github.com/ssanver/medication-reminder-app/issues/1)
- PBI-002: [Issue #2](https://github.com/ssanver/medication-reminder-app/issues/2)
- PBI-003: [Issue #3](https://github.com/ssanver/medication-reminder-app/issues/3)
- PBI-004: [Issue #4](https://github.com/ssanver/medication-reminder-app/issues/4)
- PBI-005: [Issue #5](https://github.com/ssanver/medication-reminder-app/issues/5)
- PBI-006: [Issue #6](https://github.com/ssanver/medication-reminder-app/issues/6)
- PBI-007: [Issue #7](https://github.com/ssanver/medication-reminder-app/issues/7)
- PBI-008: [Issue #8](https://github.com/ssanver/medication-reminder-app/issues/8)
- PBI-009: [Issue #9](https://github.com/ssanver/medication-reminder-app/issues/9)
- PBI-010: [Issue #10](https://github.com/ssanver/medication-reminder-app/issues/10)
- PBI-011: [Issue #11](https://github.com/ssanver/medication-reminder-app/issues/11)
- PBI-012: [Issue #12](https://github.com/ssanver/medication-reminder-app/issues/12)
- PBI-013: [Issue #13](https://github.com/ssanver/medication-reminder-app/issues/13)
- PBI-014: [Issue #14](https://github.com/ssanver/medication-reminder-app/issues/14)
