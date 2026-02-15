# React Native Ekran Spesifikasyonu

## 1. Doküman Bilgisi
- Proje Adı: İlaç Hatırlatma Uygulaması
- Doküman Tipi: React Native Ekran Spesifikasyonu
- Versiyon: 1.0
- Tarih: 2026-02-15
- Referanslar:
  - `docs/design-specification.md`
  - `docs/business-analysis.md`
  - `docs/prototype-flow-specification.md`
  - `docs/icon-specification.md`
  - Paylaşılan UI board görselleri

## 2. Amaç
Bu doküman, paylaşılan UI tasarımlarını React Native ekran yapısına dönüştürür. Her ekran için bileşen kırılımı, durumlar, navigasyon geçişleri ve test edilebilir kabul kriterleri içerir.

## 3. Navigasyon Mimarisi
- Root:
  - `auth-stack`
  - `app-tabs`
- `auth-stack` ekranları:
  - `splash-screen`
  - `onboarding-screen`
  - `sign-up-screen`
  - `login-screen` (UI boardda detay yok, placeholder)
- `app-tabs` sekmeleri:
  - `today-screen`
  - `my-meds-screen`
  - `add-meds-screen`
  - `settings-screen`

## 4. Ortak Bileşen Kütüphanesi
- `app-header`: geri butonu, başlık, opsiyonel sağ aksiyon.
- `primary-button`: tam genişlik ana CTA.
- `secondary-button`: düşük öncelikli CTA.
- `segmented-control`: `all/active/inactive` veya `all/taken/missed` filtreleri.
- `medication-card`: görsel + ilaç adı + özet + aksiyon alanı.
- `list-item`: ayar satırı, sağ ok veya switch.
- `bottom-sheet`: tarih/saat/frekans/doz/form/not ve doğrulama modal’ları.
- `empty-state`: ikon/görsel + başlık + açıklama + CTA.
- `tab-bar`: 4 sekmeli alt navigasyon.

## 5. Ekran Bazlı Spesifikasyon

### 5.1 `splash-screen`
- Amaç: marka açılışı.
- Yerleşim:
  - Tam ekran `primary-blue-500` arkaplan.
  - Ortada logo ve uygulama adı.
- Geçiş:
  - Uygulama açılışında 1.5-2.0 sn sonra `onboarding-screen` veya `today-screen`.
- Kabul Kriterleri:
  1. Açılış ekranı cihaz boyutundan bağımsız ortalanmış görünmelidir.
  2. Logo oranı bozulmadan ölçeklenmelidir.

### 5.2 `onboarding-screen`
- Amaç: değer önerisi ve kayıt akışı başlangıcı.
- İçerik:
  - 3 adım carousel (görsel + başlık + kısa açıklama).
  - İlerleme göstergesi (dot).
  - `Next` butonu.
  - Son adımda `Create an account` + `Login`.
- Durumlar:
  - `step-1`, `step-2`, `step-3`.
- Kabul Kriterleri:
  1. Kullanıcı en fazla 3 onboarding paneli görmelidir.
  2. Son adımda iki aksiyon aynı ekranda bulunmalıdır.

### 5.3 `sign-up-screen`
- Amaç: hesap oluşturma.
- Alanlar:
  - `name`, `email`, `password`.
  - `create-account` CTA.
  - `continue-with-apple`, `continue-with-google`.
- Durumlar:
  - `default`, `filled`, `success-banner`, `validation-error`.
- Kabul Kriterleri:
  1. Form alan doğrulaması hatalıysa giriş alanı ve mesaj görünmelidir.
  2. Başarılı kayıtta yeşil bilgi bandı gösterilmelidir.

### 5.4 `today-screen`
- Amaç: günlük ilaç takibini göstermek.
- Üst alan:
  - Karşılama (`Hello, [name]`) ve tarih satırı.
  - Haftalık mini takvim seçici.
- İçerik:
  - `segmented-control` (`All`, `Taken`, `Missed`).
  - `medication-card` listesi.
  - `Take` veya durum etiketi (`Taken`, `Missed`).
- Boş durum:
  - İllüstrasyon + “No medications...” + `Add Medication` butonu.
- Kabul Kriterleri:
  1. `Taken` filtresinde sadece alınan ilaçlar listelenmelidir.
  2. `Missed` filtresinde sadece kaçırılan ilaçlar listelenmelidir.
  3. Boş listede CTA ile `add-meds-screen` açılmalıdır.

### 5.5 `add-meds-screen` (Wizard)
- Amaç: yeni ilaç planı oluşturmak.
- Akış adımları:
  1. `medication-name-step` (arama + öneri listesi)
  2. `dosage-form-step` (ikon kartları)
  3. `frequency-step` (gün/saat)
  4. `dosage-step` (miktar)
  5. `note-step` (opsiyonel)
- Alt sheet’ler:
  - tarih seçici, saat seçici, frekans seçici, doz seçici, form seçici, not düzenleme.
- Son adım:
  - `Done` ile kaydet.
- Kabul Kriterleri:
  1. İlaç adı boşken `Next` pasif olmalıdır.
  2. Her adımda geri dönüşte seçili değer korunmalıdır.
  3. `Done` sonrası kayıt `my-meds-screen` listesine düşmelidir.

### 5.6 `my-meds-screen`
- Amaç: tüm ilaçları aktif/pasif durumuyla yönetmek.
- Üst alan:
  - Başlık: `My medication`.
  - `segmented-control`: `All`, `Active`, `Inactive`.
- İçerik:
  - `medication-card` + sağda toggle switch.
  - Pasif satırlarda opaklık düşürülmüş görünüm.
- Etkileşim:
  - Kart dokunuşu -> `medication-details-screen`.
  - Switch kapatma -> pasif statü.
- Kabul Kriterleri:
  1. `Active` filtresinde sadece açık switch kayıtları görünmelidir.
  2. `Inactive` filtresinde sadece kapalı switch kayıtları görünmelidir.

### 5.7 `medication-details-screen`
- Amaç: ilacın plan detayını güncellemek.
- Bölümler:
  - Üst kart: ilaç adı + aktif/pasif switch.
  - `Schedule`: start date, time, frequency.
  - `Dose`: amount, initial stock.
  - `Note`: opsiyonel açıklama.
  - Alt bilgi: pill taken count vb.
- Modal eylemleri:
  - Tarih/saat/frekans/doz/form/not seçim bottom-sheet.
  - Silme onayı (`Delete Medication?`).
- Kabul Kriterleri:
  1. Silme işlemi iki adımlı onayla tamamlanmalıdır.
  2. Değişiklikler `Save` sonrası listeye yansımalıdır.

### 5.8 `settings-screen`
- Amaç: uygulama ayarlarını merkezi yönetmek.
- Gruplar:
  - `Profile` (accounts center)
  - `Reminder & Alarm` (notification settings, reminder preferences)
  - `General` (appearance, privacy/security)
  - `About us`
- Kabul Kriterleri:
  1. Her satır ilgili detay ekrana veya modal’a yönlendirmelidir.
  2. Aktif tab göstergesi `Setting` sekmesinde olmalıdır.

### 5.9 `notification-settings-screen`
- Bileşenler:
  - `Medication alerts`, `App notifications`, `Vibration`, `Medication sound` switch/selection.
  - Ses seçimi bottom-sheet.
- Kabul Kriterleri:
  1. Switch değişimi anında UI’da yansımalıdır.
  2. Ses seçimi `Done` ile kapanmalı ve seçilen değer satıra yazılmalıdır.

### 5.10 `reminder-preferences-screen`
- Bileşenler:
  - `Snooze duration`, `Max reminders`, `Missed reminder behavior`.
  - Süre seçimi bottom-sheet.
- Kabul Kriterleri:
  1. Snooze seçenekleri en az `5/10/15` dakikayı içermelidir.
  2. Kural değişimi kaydedildiğinde geri ekranda özet görünmelidir.

### 5.11 `appearance-screen`
- Bileşenler:
  - `Display zoom` seçimi.
  - `Language` seçimi (`English`, `Turkish` dahil).
- Kabul Kriterleri:
  1. Dil değişimi uygulama metinlerinde anlık güncellenmelidir.
  2. Zoom değişimi kritik ekranlarda taşma üretmemelidir.

### 5.12 `privacy-security-screen`
- Bileşenler:
  - Biyometrik giriş, uygulama kilidi, şifre değiştir.
- `change-password-screen`:
  - `old-password`, `new-password`, `confirm-password`.
- Kabul Kriterleri:
  1. Şifre alanlarında göster/gizle ikonu çalışmalıdır.
  2. Onay şifresi eşleşmiyorsa hata mesajı görünmelidir.

### 5.13 `edit-profile-screen`
- Bileşenler:
  - avatar, `name`, `email`, `date-of-birth`, `gender`.
  - avatar seçimi modal, tarih modal, cinsiyet modal.
- Kabul Kriterleri:
  1. Tüm modal seçimleri form alanına geri yazılmalıdır.
  2. `Save` sonrası profil kartı güncellenmelidir.

### 5.14 `accounts-center-screen`
- Bileşenler:
  - hesap listesi.
  - `add another account`.
- Kabul Kriterleri:
  1. Mevcut hesaplar avatar + ad ile listelenmelidir.
  2. Yeni hesap ekleme aksiyonu erişilebilir olmalıdır.

### 5.15 `about-us-screen`
- Bileşenler:
  - uygulama logosu, versiyon, iletişim ve yasal satırlar.
- Kabul Kriterleri:
  1. Versiyon bilgisi dinamik build numarasıyla eşleşmelidir.

## 6. Durum Matrisi (Özet)
- Form alanları: `default`, `focused`, `filled`, `error`, `disabled`.
- Butonlar: `enabled`, `pressed`, `disabled`, `loading`.
- İlaç kartı: `default`, `taken`, `missed`, `inactive`.
- Liste: `loading`, `empty`, `error`, `ready`.

## 7. React Native Teknik Uygulama Notları
- Önerilen katmanlar:
  - `src/screens/*`
  - `src/components/*`
  - `src/features/medication/*`
  - `src/navigation/*`
  - `src/theme/*`
- Önerilen kütüphaneler:
  - Navigasyon: `@react-navigation/native`
  - Bottom sheet: `@gorhom/bottom-sheet`
  - Form: `react-hook-form`
  - Validasyon: `zod`
- Tüm ekranlarda `SafeAreaView` kullanılmalıdır.

## 8. QA İçin Test Senaryosu Başlıkları
1. Onboarding akışı adım ve yönlendirme doğrulaması.
2. Kayıt formu validasyon ve başarı bandı.
3. Today filtreleri (`All/Taken/Missed`) doğrulaması.
4. İlaç ekleme wizard adım bütünlüğü.
5. My Meds filtreleri ve toggle davranışı.
6. Medication details modal seçimleri ve silme onayı.
7. Notification/appearance/privacy ayarlarının kalıcılığı.
8. Dil değişiminde tüm ekran metinlerinin güncellenmesi.

## 9. İzlenebilirlik
- RS-01 (`today-screen`) -> US-03, US-04
- RS-02 (`add-meds-screen`) -> US-01, US-02, US-13
- RS-03 (`my-meds-screen`) -> US-01, US-05
- RS-04 (`medication-details-screen`) -> US-05, US-06
- RS-05 (`settings + preference screens`) -> US-12, US-15

## 10. Varsayımlar ve Açık Konular
- UI board görsellerinde bazı metinler düşük çözünürlüklü olduğundan alan adları tasarıma uygun varsayımla adlandırılmıştır.
- Login ekranı board içinde detaylı görünmediğinden auth akışında placeholder bırakılmıştır.
- Koyu tema bu iterasyonda kapsam dışıdır.
