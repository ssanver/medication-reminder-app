# Platform Agnostic Contracts

## Amaç
Mobil istemci katmanını ekran bağımlılığından ayırmak ve farklı istemci teknolojilerine (React Native dışı) taşınabilir hale getirmek için ortak sözleşmeleri tanımlar.

## 1. API Client Contract

`mobile-app/src/features/network/api-client.ts` üzerinden tüm HTTP çağrıları aşağıdaki kurala uyar:

- Base URL: `EXPO_PUBLIC_API_BASE_URL` (fallback: `http://127.0.0.1:5047`)
- JSON isteklerinde `Content-Type: application/json`
- Opsiyonel correlation id: `X-Correlation-ID`
- Hata modeli: `ApiRequestError(status, message)`

### Ortak Fonksiyonlar

- `apiRequestJson<TResponse>(path, options)`
- `apiRequestVoid(path, options)`

## 2. Authentication Contract

Sosyal login sonucu UI’dan bağımsız bir DTO ile taşınır:

- `provider`
- `accessToken`
- `refreshToken`
- `expiresAt`
- `displayName`
- `email`

Kullanılan endpoint:

- `POST /api/auth/social-login`

## 3. Feedback Contract

Kullanıcı geri bildirimi platform bağımsız tek payload ile gönderilir:

- `category`
- `message`
- `userId`
- `appVersion`
- `osVersion`
- `deviceModel`
- `notificationPermission`

Kullanılan endpoint:

- `POST /api/feedback`

## 4. System Error Reporting Contract

İstemci tarafı runtime hataları aşağıdaki ortak formatla raporlanır:

- `userReference`
- `appVersion`
- `platform`
- `device`
- `locale`
- `errorType`
- `message`
- `stackTrace`
- `occurredAt`

Kullanılan endpoint:

- `POST /api/system-errors`

## 5. Add Medication Use-Case Contract

İlaç ekleme ekranı business kurallarını `mobile-app/src/features/medications/add-medication-use-case.ts` dosyasından alır.

Ekran katmanı sadece:

- state tutma
- render
- event forwarding

işini yapar; aşağıdaki kararlar use-case katmanında tanımlıdır:

- interval/frequency dönüşümü
- tarih hizalama (haftalık gün bazlı)
- takvim hücresi üretimi
- varsayılan form ikonları
- doz saat normalizasyonu

## Kabul Kriteri İzlenebilirlik

- `screens/` altında ortak API fetch tekrarı kaldırıldı.
- `features/network/api-client.ts` tüm yeni servislerin giriş noktası oldu.
- Kritik akışlardan biri olan ilaç ekleme için business yardımcıları `screens` dışına taşındı.
