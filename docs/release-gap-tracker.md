# Release Gap Tracker

## Amaç
- TestFlight sonrası yayın öncesi eksikleri tek yerde izlemek.
- Her madde için durum, kabul kriteri, kanıt ve sonraki adımı görünür kılmak.
- Yayın kararını `go / no-go` şeklinde netleştirmek.

## Durum Anahtarı
- `Eksik`: Henüz kapanmadı.
- `Devam Ediyor`: Çalışma başladı, kanıt bekleniyor.
- `Tamam`: Kabul kriteri ve kanıt mevcut.
- `Risk Kabul`: Bilinçli olarak açık bırakıldı, gerekçe kaydedildi.

## Öncelik 1: Bloklayıcı Eksikler

| ID | Konu | Durum | Sahibi | Kabul Kriteri | Kanıt | Sonraki Adım |
| --- | --- | --- | --- | --- | --- | --- |
| BG-01 | Production API URL kesinleştirme | `Risk Kabul` | Ürün Sahibi / Geliştirici | `EXPO_PUBLIC_API_BASE_URL` release build'de production adrese gitmeli. | Fiziksel cihazdan production API'ye istek gittiği doğrulanmalı. | Mevcut canlı adres `http://suleymansanver-001-site1.stempurl.com/pillreminder` için TestFlight smoke test kanıtı toplanacak. HTTPS'e geçilemiyor notu korunacak. |
| BG-02 | Temp / insecure domain istisnası | `Risk Kabul` | Ürün Sahibi / Geliştirici | `stempurl.com` için HTTP exception kaldırılmalı veya gerekçeli risk kabulü yazılmalı. | Release config diff veya archive doğrulaması. | HTTPS mümkün olmadığı için bu sürümde ATS exception bilinçli açık bırakılacak; release notuna risk maddesi eklenecek. |
| BG-03 | Premium store ürün doğrulaması | `Eksik` | Ürün Sahibi | Monthly / yearly product id değerleri canlı store ürünleriyle birebir eşleşmeli, preview yerine gerçek fiyat gelmeli, restore purchases çalışmalı. | Sandbox veya production-adjacent test videosu / ekran görüntüsü. | App Store Connect ürünlerini ve uygulamadaki env değerlerini karşılaştır. |
| BG-04 | Feedback operasyon akışı | `Eksik` | Ürün Sahibi / Operasyon | Feedback kaydını kimin, nereden, hangi SLA ile takip ettiği belli olmalı. | Operasyon notu veya yönlendirme akışı. | `feedback` kayıtlarını kim takip edecek ve kaç saatte dönüş yapılacak netleştirilecek. |
| BG-05 | Fiziksel cihaz manuel testleri | `Eksik` | QA / Ürün Sahibi | `Add meds` saat kayması yok, `My Meds` switch yanlış navigasyon yapmıyor, `Today` ekranında `Take -> Geri Al` çalışıyor. | Kısa test videosu veya test raporu. | iPhone cihazda 3 kritik akış manuel doğrulanacak. |

## Öncelik 2: Yüksek Riskli Eksikler

| ID | Konu | Durum | Sahibi | Kabul Kriteri | Kanıt | Sonraki Adım |
| --- | --- | --- | --- | --- | --- | --- |
| HR-01 | Terms ve Privacy Policy linkleri | `Eksik` | Geliştirici | Giriş / kayıt ekranında açılabilir link veya ilgili ekrana yönlendirme olmalı. | UI ekran görüntüsü veya video. | Uygulama içinde tıklanabilir legal linkler eklenecek. |
| HR-02 | Store / share / support gerçek linkleri | `Eksik` | Ürün Sahibi / Geliştirici | `EXPO_PUBLIC_APP_STORE_URL` gerçek sayfaya gitmeli, `EXPO_PUBLIC_SUPPORT_EMAIL` aktif adres olmalı, placeholder CTA kalmamalı. | Fiziksel cihaz tıklama testi. | Gerçek App Store linki, support mail ve sponsor / donate hedefleri netleştirilecek. |
| HR-03 | Google Sign-In production doğrulaması | `Eksik` | Ürün Sahibi / QA | TestFlight veya release build'de Google giriş başarılı olmalı. | Test videosu veya başarılı giriş ekranı. | Production client id ile giriş testi yapılacak. |
| HR-04 | SMTP / email verification canlı test | `Eksik` | Geliştirici / Operasyon | Verification e-postası gerçekten gitmeli ve doğrulama tamamlanmalı. | Gelen e-posta ve başarılı doğrulama kanıtı. | Canlı SMTP secret'ları ile uçtan uca test yapılacak. |
| HR-05 | CORS production gözden geçirme | `Eksik` | Geliştirici | Gerekliyse production origin'ler tanımlı olmalı; sadece localhost ile sınırlı kalmamalı. | Config diff veya canlı doğrulama. | Web / admin / panel origin ihtiyacı var mı netleştirilecek. |

## Öncelik 3: Kalite Kapısı Durumu

| ID | Konu | Durum | Sahibi | Kabul Kriteri | Kanıt | Sonraki Adım |
| --- | --- | --- | --- | --- | --- | --- |
| QG-01 | Backend build | `Tamam` | Geliştirici | `dotnet build` başarılı olmalı. | `dotnet build medication-reminder-app.slnx` başarılı. | Kanıt yeterli. |
| QG-02 | Backend test | `Tamam` | Geliştirici | `dotnet test` başarılı olmalı. | `97/97` test geçti. | Kanıt yeterli. |
| QG-03 | Mobile unit test | `Tamam` | Geliştirici | `npm test` başarılı olmalı. | `54/54` test geçti. | Kanıt yeterli. |
| QG-04 | Mobile lint | `Eksik` | Geliştirici | `npm run lint` başarılı olmalı veya release gate dışına bilinçli çıkarılmalı. | Mevcut durum: `eslint: command not found`. | Lint kurulacak veya release notunda gate dışı bırakıldığı açıkça yazılacak. |

## Yayın Günü Son Kontrol

| ID | Kontrol | Durum | Kanıt |
| --- | --- | --- | --- |
| RC-01 | Production env / secrets güncel | `Eksik` | CI secret veya env doğrulaması |
| RC-02 | DB bağlantısı canlı doğrulandı | `Eksik` | `SELECT 1` çıktısı veya app startup logu |
| RC-03 | TestFlight build ile son smoke test yapıldı | `Eksik` | Kısa test videosu / not |
| RC-04 | Store linkleri gerçek sayfalara gidiyor | `Eksik` | Cihaz tıklama testi |
| RC-05 | Premium fiyatlar gerçek geliyor | `Eksik` | Ekran görüntüsü |
| RC-06 | Support mail açılıyor | `Eksik` | Cihaz tıklama testi |
| RC-07 | Feedback kaydı izlenebilir | `Eksik` | DB kaydı veya operasyon ekranı |
| RC-08 | Crash / error izleme yöntemi net | `Eksik` | Operasyon notu |
| RC-09 | Terms / Privacy metadata ve uygulama içi metin uyumlu | `Eksik` | App Store metadata + uygulama ekranı |
| RC-10 | Final release notes hazır | `Eksik` | Güncel release note dosyası |

## Mevcut Karar
- Şu an durum: `No-Go`
- Yayın öncesi önce kapanması gereken maddeler:
  - `BG-03` Premium store doğrulaması
  - `BG-04` Feedback operasyon sahipliği
  - `BG-05` Fiziksel cihaz manuel testleri
  - `HR-02` Store / support / share gerçek linkleri
  - `HR-01` Terms / Privacy linkleri

## Risk Kabul Notları

### BG-01 / BG-02
- Mevcut production API adresi: `http://suleymansanver-001-site1.stempurl.com/pillreminder`
- HTTPS'e geçiş bu sürüm için mümkün değil.
- Bu nedenle production trafik HTTP üstünden çalışıyor ve iOS tarafında domain exception korunuyor.
- Bu madde teknik olarak ideal değil; bu sürüm için bilinçli risk kabulü gerektiriyor.
- Sonraki hedef: API'yi kalıcı domain + HTTPS'e taşımak.

## Sonraki Çalışma Sırası
1. `BG-03` Premium store ürün doğrulaması
2. `BG-04` Feedback operasyon akışı
3. `BG-05` Fiziksel cihaz manuel testleri
4. `HR-02` Store / support / share gerçek linkleri
5. `HR-01` Terms / Privacy linkleri
