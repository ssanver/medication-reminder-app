# Prototype Akış Spesifikasyonu

## 1. Doküman Bilgisi
- Proje Adı: İlaç Hatırlatma Uygulaması
- Doküman Tipi: Prototype Akış Spesifikasyonu
- Versiyon: 1.0
- Tarih: 2026-02-15
- Referanslar:
  - `docs/react-native-screen-specification.md`
  - Paylaşılan prototype board görseli

## 2. Amaç
Bu doküman, prototype üzerindeki ekran sıralarını React Native navigasyon akışına dönüştürür.

## 3. Ana Akışlar

### 3.1 İlk Açılış ve Kayıt
1. `splash-screen`
2. `onboarding-screen` (3 adım)
3. `sign-up-screen`
4. Başarılı kayıt -> `today-screen`

### 3.2 Günlük Kullanım (Today)
1. `today-screen` (boş veya dolu durum)
2. Filtre değişimi: `all/taken/missed`
3. `Add Medication` veya alt sekme ile `add-meds-screen`

### 3.3 İlaç Ekleme Wizard
1. `medication-name-step`
2. `dosage-form-step`
3. `frequency-step`
4. (opsiyonel modal) `calendar-bottom-sheet`
5. `dosage-step`
6. `note-step`
7. `done` -> `my-meds-screen` ve `today-screen` listesine yansıma

### 3.4 İlaç Yönetimi
1. `my-meds-screen` -> `all/active/inactive`
2. Kart dokunuşu -> `medication-details-screen`
3. Alan düzenleme -> ilgili bottom-sheet
4. `save` -> `my-meds-screen`
5. `delete` -> onay modal -> `my-meds-screen`

### 3.5 Profil ve Hesap Merkezi
1. `settings-screen`
2. `edit-profile-screen`
3. Tarih/cinsiyet/avatar modal seçimleri
4. `save` -> `settings-screen`
5. `accounts-center-screen` -> hesap listesi / hesap ekleme

### 3.6 Ayarlar Detay Akışları
- `settings-screen` -> `notification-settings-screen`
- `settings-screen` -> `reminder-preferences-screen`
- `settings-screen` -> `appearance-screen`
- `settings-screen` -> `privacy-security-screen` -> `change-password-screen`
- `settings-screen` -> `about-us-screen`

## 4. Tab Navigasyon Davranışı
- Alt tab her ana ekranda görünür: `today`, `my-meds`, `add-meds`, `setting`.
- Wizard ve detay formlarında tab görünürlüğü prototype’a göre korunur.
- Tab geçişinde ekran state’i kaybolmamalıdır (filtre ve scroll pozisyonu korunur).

## 5. Modal ve Bottom Sheet Envanteri
- `calendar-bottom-sheet`
- `time-bottom-sheet`
- `frequency-bottom-sheet`
- `dosage-bottom-sheet`
- `form-bottom-sheet`
- `note-bottom-sheet`
- `notification-sound-bottom-sheet`
- `snooze-duration-bottom-sheet`
- `language-bottom-sheet`
- `display-zoom-bottom-sheet`
- `date-of-birth-bottom-sheet`
- `gender-bottom-sheet`
- `avatar-picker-bottom-sheet`
- `delete-confirm-bottom-sheet`

## 6. Geçiş Kuralları (Navigation Contract)
- Auth tamamlanmadan `app-tabs` ekranlarına erişim yok.
- `add-meds-screen` tamamlanmadan geri çıkışta kullanıcıya iptal onayı gösterilir.
- `medication-details-screen` içinde kirli formdan çıkışta kaydetmeden çıkış uyarısı gösterilir.
- `change-password-screen` başarı sonrası otomatik `privacy-security-screen` dönüşü yapılır.

## 7. Kabul Kriterleri
1. Prototype’taki tüm birincil akışlar RN navigasyonunda birebir karşılanmalıdır.
2. Ana akışlarda kırık rota (dead-end) olmamalıdır.
3. Modal aç/kapa davranışı iOS ve Android’de tutarlı olmalıdır.
4. Geri navigasyonda form state kaybı yalnızca kullanıcı onayıyla olmalıdır.
5. Tab geçişleri arasında `today` ve `my-meds` filtre state’i korunmalıdır.

## 8. Uygulama Durumu (2026-02-15)
- `reports-screen` eklendi ve `settings-screen` icinden erisilebilir.
- `profile-screen` eklendi ve `settings-screen` icinden erisilebilir.
- Alt tab componenti icon altyapisina baglandi (`app-icon` + `bottom-nav`).
- Eksik kalanlar:
- `splash-screen`
- `sign-up-screen`
- `medication-details-screen`
- `accounts-center-screen`
- detayli bottom-sheet varyantlari

## 9. İzlenebilirlik
- PF-01 (ilk açılış akışı) -> US-13
- PF-02 (ilaç ekleme wizard) -> US-01, US-02
- PF-03 (today ve doz aksiyonları) -> US-03, US-04
- PF-04 (ilaç yönetimi) -> US-05, US-06
- PF-05 (ayarlar ve dil/erişilebilirlik) -> US-12, US-15
